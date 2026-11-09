import {parseDuckDuckGoHtml} from '../duckduckgo';

const fixture = `
<html><body>
<div class="result results_links results_links_deep web-result">
  <div class="links_main links_deep result__body">
    <h2 class="result__title">
      <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.fifa.com%2Fworldcup&amp;rut=abc">
        FIFA World Cup 2026&#x27;s <b>host</b> nations
      </a>
    </h2>
    <a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.fifa.com%2Fworldcup">
      Canada, Mexico and the United States host the 2026 tournament.
    </a>
  </div>
</div>
<div class="result results_links">
  <div class="links_main result__body">
    <h2 class="result__title">
      <a rel="nofollow" class="result__a" href="https://en.wikipedia.org/wiki/2026_FIFA_World_Cup">2026 FIFA World Cup - Wikipedia</a>
    </h2>
    <a class="result__snippet" href="https://en.wikipedia.org/wiki/2026_FIFA_World_Cup">The 2026 FIFA World Cup is scheduled from 11 June to 19 July 2026.</a>
  </div>
</div>
</body></html>
`;

describe('parseDuckDuckGoHtml', () => {
  it('extracts titles, unwrapped urls and snippets in order', () => {
    const hits = parseDuckDuckGoHtml(fixture);

    expect(hits).toHaveLength(2);
    expect(hits[0]).toEqual({
      title: "FIFA World Cup 2026's host nations",
      url: 'https://www.fifa.com/worldcup',
      snippet: 'Canada, Mexico and the United States host the 2026 tournament.',
    });
    expect(hits[1].title).toBe('2026 FIFA World Cup - Wikipedia');
    expect(hits[1].url).toBe(
      'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup',
    );
    expect(hits[1].snippet).toContain('11 June to 19 July 2026');
  });

  it('returns an empty list for a bot-check page with no results', () => {
    expect(
      parseDuckDuckGoHtml('<html><body>Anomaly detected</body></html>'),
    ).toEqual([]);
  });
});
