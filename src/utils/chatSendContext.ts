import {createContext} from 'react';

/**
 * Lets a nested message surface (suggestion chips) submit a prompt through
 * the same path as the composer, without threading a callback through the
 * message renderer stack.
 *
 * Provided by `ChatView`, which owns `onSendPress` and the draft/undo
 * bookkeeping that must run for any send. `null` means "not inside a chat
 * that can send" — consumers hide their send affordance.
 */
export type ChatSendContextValue = {
  sendPrompt: (text: string) => void;
};

export const ChatSendContext = createContext<ChatSendContextValue | null>(null);
