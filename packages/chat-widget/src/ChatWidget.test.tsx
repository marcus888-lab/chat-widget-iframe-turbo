import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatWidget } from "./ChatWidget";
import type { WebSocketMessage } from "./types";

describe("ChatWidget", () => {
  const defaultProps = {
    sessionId: "test-session",
    wsUrl: "ws://localhost:8000/ws/chat/",
    title: "Test Chat",
    placeholder: "Type a message...",
  };

  let mockWebSocket: {
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Mock WebSocket
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.WebSocket = vi.fn(() => mockWebSocket) as any;
  });

  it("renders chat button when closed", () => {
    render(<ChatWidget {...defaultProps} />);
    expect(screen.getByLabelText("Open chat")).toBeInTheDocument();
  });

  it("opens chat widget when button is clicked", () => {
    render(<ChatWidget {...defaultProps} />);

    const openButton = screen.getByLabelText("Open chat");
    fireEvent.click(openButton);

    expect(screen.getByText("Test Chat")).toBeInTheDocument();
  });

  it("closes chat widget when minimize button is clicked", () => {
    render(<ChatWidget {...defaultProps} />);

    // Open the widget
    fireEvent.click(screen.getByLabelText("Open chat"));
    expect(screen.getByText("Test Chat")).toBeInTheDocument();

    // Close the widget
    fireEvent.click(screen.getByLabelText("Minimize"));
    expect(screen.queryByText("Test Chat")).not.toBeInTheDocument();
  });

  it("sends message through WebSocket", () => {
    render(<ChatWidget {...defaultProps} />);

    // Open the widget
    fireEvent.click(screen.getByLabelText("Open chat"));

    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const expectedMessage: WebSocketMessage = {
      type: "message",
      role: "user",
      message: "Hello",
    };

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify(expectedMessage)
    );
  });

  it("connects to WebSocket with session ID", () => {
    render(<ChatWidget {...defaultProps} />);

    expect(WebSocket).toHaveBeenCalledWith(
      `ws://localhost:8000/ws/chat/?session_id=test-session`
    );
  });

  it("handles WebSocket messages", () => {
    render(<ChatWidget {...defaultProps} />);

    // Simulate WebSocket connection
    const onMessageHandler = mockWebSocket.addEventListener.mock.calls.find(
      (call) => call[0] === "message"
    )?.[1];

    // Open the widget
    fireEvent.click(screen.getByLabelText("Open chat"));

    // Simulate receiving a message
    const mockMessage: WebSocketMessage = {
      type: "message",
      role: "assistant",
      message: "Hello, how can I help you?",
    };

    onMessageHandler?.({ data: JSON.stringify(mockMessage) });

    expect(screen.getByText("Hello, how can I help you?")).toBeInTheDocument();
  });

  it("handles tool messages", () => {
    render(<ChatWidget {...defaultProps} />);

    // Simulate WebSocket connection
    const onMessageHandler = mockWebSocket.addEventListener.mock.calls.find(
      (call) => call[0] === "message"
    )?.[1];

    // Open the widget
    fireEvent.click(screen.getByLabelText("Open chat"));

    // Simulate receiving a tool message
    const mockMessage: WebSocketMessage = {
      type: "message",
      role: "assistant",
      message: "Here is some code:",
      toolResults: [
        {
          tool: "code",
          result: {
            language: "javascript",
            code: 'console.log("Hello");',
          },
        },
      ],
    };

    onMessageHandler?.({ data: JSON.stringify(mockMessage) });

    expect(screen.getByText("Here is some code:")).toBeInTheDocument();
    expect(screen.getByText('console.log("Hello");')).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ChatWidget {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass(
      "chat-widget-container",
      "custom-class"
    );
  });

  it("shows custom placeholder text", () => {
    render(<ChatWidget {...defaultProps} placeholder="Custom placeholder" />);

    // Open the widget
    fireEvent.click(screen.getByLabelText("Open chat"));

    expect(
      screen.getByPlaceholderText("Custom placeholder")
    ).toBeInTheDocument();
  });
});
