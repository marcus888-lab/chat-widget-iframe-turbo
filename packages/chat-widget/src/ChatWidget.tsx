import React, { useState, useCallback, useRef, useEffect } from "react";
import Header from "./components/Header/Header";
import PreviewMessages from "./components/PreviewMessages/PreviewMessages";
import MultimodalInput from "./components/MultimodalInput/MultimodalInput";
import { useWebSocket } from "./hooks/useWebSocket";
import { WebSocketMessage, Message } from "./types";
import { SEARCH_PROMPTS } from "./SystemPrompt";
import { ProductResult } from "./components/ToolMessage/types";
import { v4 as uuidv4 } from "uuid";
import "./styles.css";

type ChatContext =
  | "initial"
  | "product_search"
  | "result_interaction"
  | "no_results"
  | "error"
  | "product_detail";

const DEFAULT_INITIAL_MESSAGES: WebSocketMessage[] = [
  {
    type: "message",
    role: "assistant",
    message:
      "👋 Hi there! I'm your product search assistant. I can help you find exactly what you're looking for in our catalog.",
    timestamp: new Date(),
  },
];

export interface ChatWidgetProps {
  sessionId?: string;
  wsUrl: string;
  title?: string;
  placeholder?: string;
  className?: string;
  initialMessages?: WebSocketMessage[];
  onSessionChange?: (sessionId: string) => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  sessionId: initialSessionId,
  wsUrl,
  title = "Chat Assistant",
  placeholder = "Type a message...",
  className = "",
  initialMessages = DEFAULT_INITIAL_MESSAGES,
  onSessionChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>(initialMessages);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<ChatContext>("initial");
  const [sessionId] = useState(initialSessionId || uuidv4());
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(
    null
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastContextRef = useRef<ChatContext>("initial");
  const isSendingRef = useRef<boolean>(false);
  const handlersRef = useRef({
    onMessage: handleMessage,
    onOpen: handleOpen,
    onClose: handleClose,
    onError: handleError,
  });

  // Update handlers ref when dependencies change
  useEffect(() => {
    handlersRef.current = {
      onMessage: handleMessage,
      onOpen: handleOpen,
      onClose: handleClose,
      onError: handleError,
    };
  });

  const { sendMessage, disconnect, connect } = useWebSocket({
    url: wsUrl,
    sessionId,
    onMessage: (data) => handlersRef.current.onMessage(data),
    onOpen: () => handlersRef.current.onOpen(),
    onClose: () => handlersRef.current.onClose(),
    onError: (error) => handlersRef.current.onError(error),
    enabled: isOpen, // Only connect when widget is open
    reconnectAttempts: 5,
    reconnectInterval: 2000,
  });

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Update scroll position when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send system prompt only when context actually changes
  useEffect(() => {
    if (
      isOnline &&
      context &&
      context !== lastContextRef.current &&
      !isSendingRef.current
    ) {
      lastContextRef.current = context;
      isSendingRef.current = true;
      const systemMessage = `[SYSTEM PROMPT] ${SEARCH_PROMPTS[context]}`;
      sendMessage(systemMessage);
      isSendingRef.current = false;
    }
  }, [context, isOnline, sendMessage]);

  // Notify parent of session changes
  useEffect(() => {
    onSessionChange?.(sessionId);
  }, [sessionId, onSessionChange]);

  const handleProductSelect = useCallback((product: ProductResult) => {
    setSelectedProduct(product);
    setContext("product_detail");
  }, []);

  const handleRefresh = useCallback(() => {
    disconnect();
    setMessages(initialMessages);
    setContext("initial");
    setIsLoading(false);
    setSelectedProduct(null);
    setConnectionError(null);
    lastContextRef.current = "initial";
    isSendingRef.current = false;
    connect();
  }, [disconnect, connect, initialMessages]);

  function handleMessage(data: WebSocketMessage) {
    if (data.type === "message") {
      const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
      const messageWithTimestamp = { ...data, timestamp };

      if (!data.message.startsWith("[SYSTEM PROMPT]")) {
        setMessages((prev) => [...prev, messageWithTimestamp]);
        setIsLoading(false);
      }

      if (data.metadata?.error) {
        setContext("error");
        return;
      }

      if (
        data.metadata?.tool_results &&
        data.metadata.tool_results.length > 0
      ) {
        const toolResult = data.metadata.tool_results[0];
        if (toolResult.tool === "product_search") {
          try {
            const searchResult = JSON.parse(toolResult.result);
            if (searchResult.metadata.error) {
              setContext("error");
            } else if (searchResult.data && searchResult.data.length > 0) {
              if (selectedProduct) {
                setContext("product_detail");
              } else {
                setContext("result_interaction");
              }
            } else {
              setContext("no_results");
            }
          } catch (e) {
            console.error("Error parsing tool result:", e);
            setContext("error");
          }
        }
      } else if (
        data.role === "user" &&
        /\b(find|search|show|look|product|price)\b/i.test(data.message)
      ) {
        setContext("product_search");
      }
    }
  }

  function handleOpen() {
    setIsOnline(true);
    setConnectionError(null);
  }

  function handleClose() {
    setIsOnline(false);
  }

  function handleError(error: Event | Error) {
    console.error("WebSocket error:", error);
    setIsOnline(false);
    setIsLoading(false);
    setConnectionError("Connection lost. Reconnecting...");
  }

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!isOnline) {
        setConnectionError("Unable to send message. Reconnecting...");
        connect();
        return;
      }

      if (content.trim() && !isSendingRef.current) {
        isSendingRef.current = true;
        sendMessage(content);
        setIsLoading(true);
        setConnectionError(null);
        isSendingRef.current = false;
      }
    },
    [isOnline, sendMessage, connect]
  );

  const handleCopyMessage = useCallback(
    (messageId: string) => {
      const message = messages.find(
        (m, index) => index.toString() === messageId
      );
      if (message?.message) {
        navigator.clipboard.writeText(message.message);
      }
    },
    [messages]
  );

  const toggleWidget = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const formattedMessages: Message[] = messages.map((msg, index): Message => {
    const messageTimestamp =
      msg.timestamp instanceof Date
        ? msg.timestamp
        : new Date(msg.timestamp || Date.now());

    const toolResults = msg.metadata?.tool_results?.map((result) => ({
      tool: result.tool,
      result: result.result,
    }));

    return {
      id: index.toString(),
      type: "message",
      content: msg.message,
      sender: msg.role,
      timestamp: messageTimestamp,
      status: msg.metadata?.error ? "error" : "sent",
      metadata: {
        context_used: msg.metadata?.context_used,
        confidence: msg.metadata?.confidence,
        error: msg.metadata?.error,
        tool_results: toolResults,
        selected_product: msg.metadata?.selected_product,
      },
    };
  });

  const loadingMessage: Message = {
    id: "loading",
    type: "loading",
    content: "Thinking...",
    sender: "assistant",
    timestamp: new Date(),
    status: "sending",
  };

  const errorMessage: Message = {
    id: "connection-error",
    type: "message",
    content: connectionError || "",
    sender: "system",
    timestamp: new Date(),
    status: "error",
  };

  const displayMessages: Message[] = [
    ...formattedMessages,
    ...(isLoading ? [loadingMessage] : []),
    ...(connectionError ? [errorMessage] : []),
  ];

  return (
    <div className={`chat-widget-container ${className}`}>
      {!isOpen ? (
        <button
          type="button"
          className="chat-widget-button"
          onClick={toggleWidget}
          aria-label="Open chat"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <div className="chat-widget-popup">
          <Header
            title={title}
            isOnline={isOnline}
            onMinimize={toggleWidget}
            onRefresh={handleRefresh}
          />

          <PreviewMessages
            messages={displayMessages}
            onCopyMessage={handleCopyMessage}
            onProductSelect={handleProductSelect}
            containerRef={containerRef}
            messagesEndRef={messagesEndRef}
          />

          <MultimodalInput
            onSendMessage={handleSendMessage}
            placeholder={placeholder}
            disabled={!isOnline}
          />
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
