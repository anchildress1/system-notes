let chatSessionId: string | null = null;

export function getChatSessionId(): string {
  if (!chatSessionId) {
    if (!globalThis.crypto?.randomUUID) {
      throw new Error('Secure UUID generation is not available.');
    }
    chatSessionId = globalThis.crypto.randomUUID();
  }
  return chatSessionId;
}
