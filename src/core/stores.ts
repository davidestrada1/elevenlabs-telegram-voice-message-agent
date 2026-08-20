export interface IdempotencyStore {
  claim(key: string): Promise<boolean>;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly keys = new Set<string>();

  async claim(key: string): Promise<boolean> {
    if (this.keys.has(key)) return false;
    this.keys.add(key);
    return true;
  }
}

export interface ConversationStore {
  getConversationId(chatId: string): Promise<string | undefined>;
  setConversationId(chatId: string, conversationId: string): Promise<void>;
}

export class InMemoryConversationStore implements ConversationStore {
  private readonly ids = new Map<string, string>();

  async getConversationId(chatId: string): Promise<string | undefined> {
    return this.ids.get(chatId);
  }

  async setConversationId(chatId: string, conversationId: string): Promise<void> {
    this.ids.set(chatId, conversationId);
  }
}
