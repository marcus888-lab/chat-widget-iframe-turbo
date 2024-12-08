import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatWidgetProps, WebSocketMessage } from './types';
import { ToolMessage, ToolType } from './components/tool-messages';
import { Button } from './components/Button';
import './styles.css';
import './components/tool-messages/styles.css';

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  sessionId,
  wsUrl,
  title = 'Chat Support',
  placeholder = 'Type your message...',
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket connection management
  useEffect(() => {
    if (isOpen && !wsRef.current) {
      // Construct the WebSocket URL with the session ID, ensuring proper slashes
      const baseUrl = wsUrl.replace(/\/+$/, ''); // Remove trailing slashes
      const fullWsUrl = `${baseUrl}/${sessionId}/`; // No need for extra slash since baseUrl is cleaned
      console.log('Connecting to WebSocket:', fullWsUrl);

      const ws = new WebSocket(fullWsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event: MessageEvent) => {
        console.log('Received message:', event.data);
        try {
          const data: Message = JSON.parse(event.data);
          setMessages((prev: Message[]) => [...prev, data]);

          if (data.type === 'error') {
            setError(data.message);
          }
        } catch (err) {
          console.error('Error parsing message:', err);
          setError('Failed to parse message');
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error occurred');
        setIsConnected(false);
      };

      wsRef.current = ws;

      return () => {
        ws.close();
        wsRef.current = null;
      };
    }
  }, [isOpen, wsUrl, sessionId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !isConnected || !wsRef.current) return;

    const wsMessage: WebSocketMessage = {
      message: message.trim()
    };

    try {
      wsRef.current.send(JSON.stringify(wsMessage));
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsOpen(false);
    onClose?.();
  };

  const renderMessage = (msg: Message) => {
    if (msg.type === 'error') {
      return <div className="error-content">{msg.message}</div>;
    }

    return (
      <>
        <div className="message-content">{msg.message}</div>
        {msg.timestamp && (
          <div className="message-timestamp">
            {new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
        {msg.role === 'assistant' && (
          <>
            {msg.confidence !== undefined && (
              <div className="message-metadata">
                Confidence: {Math.round(msg.confidence * 100)}%
                {msg.context_used && ' • Using context'}
              </div>
            )}
            {msg.toolResults?.map((tool, index) => (
              <ToolMessage
                key={index}
                type={tool.tool as ToolType}
                data={tool.result}
              />
            ))}
          </>
        )}
      </>
    );
  };

  return (
    <div className="chat-widget-container">
      {isOpen ? (
        <div className="chat-widget-panel">
          <div className="chat-widget-header">
            <h3>{title}</h3>
            <Button
              onClick={handleClose}
              aria-label="Close chat"
              className="chat-widget-close-btn"
            >
              ×
            </Button>
          </div>
          <div className="chat-widget-messages">
            {messages.map((msg: Message, index: number) => (
              <div
                key={`${msg.timestamp}-${index}`}
                className={`chat-message ${
                  msg.type === 'error' ? 'error-message' :
                  msg.role === 'user' ? 'user-message' : 'bot-message'
                }`}
              >
                {renderMessage(msg)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-widget-input">
            {error && (
              <div className="chat-error-banner">
                {error}
                <button
                  onClick={() => setError(null)}
                  type="button"
                >
                  ×
                </button>
              </div>
            )}
            <textarea
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? placeholder : 'Connecting...'}
              disabled={!isConnected}
              rows={1}
              className="chat-input-textarea"
            />
            <Button
              onClick={handleSend}
              disabled={!isConnected || !message.trim()}
              className="chat-send-button"
              aria-label="Send message"
            >
              Send
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="chat-widget-button"
          aria-label="Open chat"
        >
          Chat with us
        </Button>
      )}
    </div>
  );
};
