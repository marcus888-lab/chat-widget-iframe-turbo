import { ProductResult } from "./components/ToolMessage/types";

export interface WebSocketMessage {
  type: string;
  role: string;
  message: string;
  timestamp: Date | string;
  metadata?: {
    context_used?: boolean;
    confidence?: number;
    error?: "timeout" | "cancelled" | "system_error";
    tool_results?: ToolResult[];
    selected_product?: ProductResult;
  };
}

export interface Message {
  id: string;
  type: "message" | "loading";
  content: string;
  sender: string;
  timestamp: Date;
  status: "sent" | "sending" | "error";
  metadata?: {
    context_used?: boolean;
    confidence?: number;
    error?: "timeout" | "cancelled" | "system_error";
    tool_results?: ToolResult[];
    selected_product?: ProductResult;
  };
}

export interface ToolResult {
  tool: string;
  result: string;
}

export interface ProductSearchResult {
  data: ProductResult[];
  metadata: {
    search_type: string;
    total_results: number;
    weights?: {
      text: number;
      vector: number;
    };
    error?: "timeout" | "cancelled" | "system_error";
  };
}

export interface WebSocketHookOptions {
  url: string;
  sessionId: string;
  onMessage: (data: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event | Error) => void;
  enabled?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export interface WebSocketHookResult {
  sendMessage: (message: string) => void;
  connect: () => void;
  disconnect: () => void;
}
