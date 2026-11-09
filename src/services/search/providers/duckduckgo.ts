import type {SearchProvider, SearchHit, SearchOptions} from '../types';
import {hfUserAgent} from '../../../utils/hfUserAgent';
import {fetchJson, fetchText} from './http';

/**
 * DuckDuckGo — free, no key.
 *
 * The Instant Answer API only covers a small curated slice of the web (definitions,
 * disambiguations, a few topics), so real questions like "who won the match"
 * came back empty and the model answered from memory. The `/html/` endpoint is
 * the same server-rendered result page the web UI uses, which does return
 * ordinary web results; it's parsed here with a deliberately narrow regex pair
 * and falls back to the Instant Answer API when the page yields nothing (the
 * occasional bot-check page, or a query DDG answers inline).
 */
const DDG_HTML_URL = 'https://html.duckduckgo.com/html/';
const DDG_INSTANT_URL =
  'https://api.duckduckgo.com/?format=json&no_html=1&skip_disambig=1';
const DDG_TIMEOUT_MS = 12000;

/** Keeps the parsed page well under the 2 MB fetchText cap. */
const MAX_HTML_CHARS = 900_000;

function normaliseText(raw?: string): string {
  return (raw ?? '').trim().replace(/\s+/g, ' ');
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntity(name: string): string | null {
  const key = name.toLowerCase();
  const named = ENTITIES[key];
  if (named !== undefined) {
    return named;
  }
  if (key.startsWith('#x')) {
    const code = Number.parseInt(key.slice(2), 16);
    return Number.isFinite(code) ? String.fromCodePoint(code) : null;
  }
  if (key.startsWith('#')) {
    const code = Number.parseInt(key.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : null;
  }
  return null;
}

/** Strip tags + decode the entities DDG emits in titles/snippets. */
function cleanHtml(raw: string): string {
  return normaliseText(
    raw
      .replace(/<[^>]*>/g, ' ')
      .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (match, name: string) => {
        return decodeEntity(name) ?? match;
      }),
  );
}

/**
 * Result links are proxied as `//duckduckgo.com/l/?uddg=<url>&rut=...`.
 * Unwrap to the destination; leave already-direct URLs alone.
 */
function unwrapUrl(href: string): string {
  if (!href) {
    return '';
  }
  const withScheme = href.startsWith('//') ? `https:${href}` : href;
  const marker = withScheme.indexOf('uddg=');
  if (marker === -1) {
    return withScheme;
  }
  const encoded = withScheme.slice(marker + 'uddg='.length).split('&')[0];
  try {
    return decodeURIComponent(encoded);
  } catch {
    return withScheme;
  }
}

/** Parse the server-rendered results page. Returns [] when nothing matches. */
export function parseDuckDuckGoHtml(html: string): SearchHit[] {
  const hits: SearchHit[] = [];
  const linkRe =
    /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRe =
    /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

  const snippets: string[] = [];
  let snippetMatch: RegExpExecArray | null;
  while ((snippetMatch = snippetRe.exec(html)) !== null) {
    snippets.push(cleanHtml(snippetMatch[1]));
  }

  let linkMatch: RegExpExecArray | null;
  let index = 0;
  while ((linkMatch = linkRe.exec(html)) !== null) {
    const url = unwrapUrl(linkMatch[1]);
    const title = cleanHtml(linkMatch[2]);
    if (!url || !title) {
      index += 1;
      continue;
    }
    const snippet = snippets[index] ?? '';
    hits.push({title, url, snippet: snippet || title});
    index += 1;
  }

  return hits;
}

export class DuckDuckGoProvider implements SearchProvider {
  readonly id = 'duckduckgo' as const;

  constructor(private getKey: () => string) {}

  async search(
    query: string,
    opts: SearchOptions,
    signal?: AbortSignal,
  ): Promise<SearchHit[]> {
    const webHits = await this.searchWeb(query, opts.maxResults, signal);
    if (webHits.length > 0) {
      return webHits;
    }
    return this.searchInstantAnswer(query, opts.maxResults, signal);
  }

  private async searchWeb(
    query: string,
    maxResults: number,
    signal?: AbortSignal,
  ): Promise<SearchHit[]> {
    const body = `q=${encodeURIComponent(query)}&kl=wt-wt`;
    let html: string;
    try {
      html = await fetchText(
        DDG_HTML_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': hfUserAgent(),
          },
          body,
          signal,
        },
        DDG_TIMEOUT_MS,
        {retryOn429: true},
      );
    } catch (e) {
      if (e instanceof Error && e.message === 'request failed (429)') {
        throw new Error('DuckDuckGo rate limit reached. Try again shortly.');
      }
      // Network/blocked page: let the Instant Answer fallback try instead of
      // failing the whole search.
      return [];
    }

    return parseDuckDuckGoHtml(html.slice(0, MAX_HTML_CHARS)).slice(
      0,
      maxResults,
    );
  }

  private async searchInstantAnswer(
    query: string,
    maxResults: number,
    signal?: AbortSignal,
  ): Promise<SearchHit[]> {
    const url = `${DDG_INSTANT_URL}&q=${encodeURIComponent(query)}`;
    let data: Record<string, unknown> | null;
    try {
      data = await fetchJson<Record<string, unknown>>(
        url,
        {method: 'GET', signal},
        {timeoutMs: DDG_TIMEOUT_MS},
      );
    } catch (e) {
      if (e instanceof Error && e.message === 'request failed (429)') {
        throw new Error('DuckDuckGo rate limit reached. Try again shortly.');
      }
      throw e;
    }

    return this.hitsFromResponse(data, maxResults);
  }

  private hitsFromResponse(
    data: Record<string, unknown> | null,
    maxResults: number,
  ): SearchHit[] {
    if (!data || typeof data !== 'object') {
      return [];
    }

    const abstractText = normaliseText(
      (data.AbstractText as string) ?? (data.Abstract as string) ?? '',
    );
    const heading =
      normaliseText((data.Heading as string) ?? '') ||
      normaliseText((data.Definition as string) ?? '');
    const headingUrl =
      (data.HeadingURL as string) ?? (data.AbstractURL as string) ?? '';

    const hits: SearchHit[] = [];

    // Instant Answer body when present.
    if (abstractText) {
      hits.push({
        title:
          heading ||
          abstractText.slice(0, Math.min(120, abstractText.length)) ||
          'DuckDuckGo result',
        url: headingUrl || '',
        snippet: abstractText,
        ...(data.PublishedDate
          ? {publishedAt: String(data.PublishedDate)}
          : {}),
      });
    }

    // RelatedTopics is the secondary results list. "string" entries are
    // shortened inline topic links DDG returns as debug fallback; skip them.
    const related = data.RelatedTopics;
    if (Array.isArray(related)) {
      for (const item of related) {
        if (typeof item === 'string') {
          continue;
        }
        const rec = item as Record<string, unknown>;
        const text = normaliseText((rec.Text as string) ?? '');
        const url = (rec.FirstURL as string) ?? '';
        if (!text && !url) {
          continue;
        }
        if (hits.length >= maxResults) {
          break;
        }
        hits.push({
          title: text.slice(0, 120) || url,
          url,
          snippet: text.slice(0, 280),
          ...(rec.PublishedDate
            ? {publishedAt: String(rec.PublishedDate)}
            : {}),
        });
      }
    }

    return hits;
  }
}
