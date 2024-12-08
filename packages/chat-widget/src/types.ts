import type { ToolType } from './components/tool-messages';

export interface Message {
  type: 'message' | 'error';
  role?: 'user' | 'assistant' | 'system';
  message: string;
  timestamp?: string;
  context_used?: boolean;
  confidence?: number;
  toolResults?: {
    tool: ToolType;
    result: any;
  }[];
}

export interface ChatWidgetProps {
  sessionId: string;
  wsUrl: string;
  title?: string;
  placeholder?: string;
  onClose?: () => void;
}

export interface WebSocketMessage {
  message: string;
}

declare global {
  interface Window {
    ChatWidget: {
      init: (config: ChatWidgetProps) => void;
    };
  }
}
