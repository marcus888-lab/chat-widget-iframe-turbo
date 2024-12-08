import "./styles.css";

export { default as ChatWidget } from "./ChatWidget";
export type { ChatWidgetProps } from "./ChatWidget";

// Export individual components for flexibility
export { default as Header } from "./components/Header/Header";
export type { HeaderProps } from "./components/Header/Header";

export { default as PreviewMessages } from "./components/PreviewMessages/PreviewMessages";
export type { PreviewMessagesProps } from "./components/PreviewMessages/PreviewMessages";

export { default as Message } from "./components/Message/Message";
export type { MessageProps } from "./components/Message/Message";

export { default as MultimodalInput } from "./components/MultimodalInput/MultimodalInput";
export type { MultimodalInputProps } from "./components/MultimodalInput/MultimodalInput";

// Export types from types.ts
export type {
  Message as ChatMessage,
  WebSocketMessage,
  ToolResult,
} from "./types";
