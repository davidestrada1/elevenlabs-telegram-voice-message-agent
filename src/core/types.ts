export type InputKind = "text" | "voice";

export interface TelegramMediaReference {
  fileId: string;
  fileSizeBytes?: number;
  mimeType?: string;
  durationSeconds?: number;
}

export interface TelegramInboundEvent {
  updateId: string;
  messageId: string;
  chatId: string;
  senderId: string;
  receivedAt: Date;
  kind: InputKind;
  text?: string;
  media?: TelegramMediaReference;
}

export interface AudioAsset {
  bytes: Buffer;
  fileName: string;
  mimeType: string;
  durationSeconds?: number;
}

export interface Transcript {
  text: string;
  languageCode?: string;
  languageProbability?: number;
  providerRequestId?: string;
}

export interface AgentReply {
  text: string;
  languageCode?: string;
  conversationId?: string;
  shouldGenerateVoice: boolean;
}

export interface DeliveryReceipt {
  messageId: string;
  acceptedAt: Date;
}
