import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PreviewMessages } from "./PreviewMessages";
import { Message } from "../../types";

const mockMessages: Message[] = [
  {
    id: "1",
    type: "message",
    content: "Hello",
    sender: "user",
    timestamp: new Date("2024-03-19T10:00:00"),
    status: "sent",
  },
  {
    id: "2",
    type: "message",
    content: "Hi there!",
    sender: "assistant",
    timestamp: new Date("2024-03-19T10:01:00"),
    status: "sent",
  },
  {
    id: "3",
    type: "message",
    content: "Here's some code:",
    sender: "assistant",
    timestamp: new Date("2024-03-19T10:02:00"),
    status: "sent",
    metadata: {
      toolResults: [
        {
          tool: "code",
          result: {
            language: "javascript",
            code: 'console.log("Hello World");',
          },
        },
      ],
    },
  },
];

describe("PreviewMessages", () => {
  it("renders messages correctly", () => {
    render(<PreviewMessages messages={mockMessages} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
    expect(screen.getByText("Here's some code:")).toBeInTheDocument();
    expect(screen.getByText('console.log("Hello World");')).toBeInTheDocument();
  });

  it("shows loading indicator when loading", () => {
    render(<PreviewMessages messages={mockMessages} loading={true} />);
    expect(
      screen.getByText("Loading previous messages...")
    ).toBeInTheDocument();
  });

  it("shows empty state when no messages", () => {
    render(<PreviewMessages messages={[]} />);
    expect(screen.getByText("No messages yet")).toBeInTheDocument();
  });

  it("calls onLoadMore when scrolling to top", () => {
    const onLoadMore = vi.fn();
    const { container } = render(
      <PreviewMessages messages={mockMessages} onLoadMore={onLoadMore} />
    );

    fireEvent.scroll(container.firstChild as Element, {
      target: { scrollTop: 0 },
    });

    expect(onLoadMore).toHaveBeenCalled();
  });

  it("groups messages by date", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messages: Message[] = [
      {
        id: "1",
        type: "message",
        content: "Today message",
        sender: "user",
        timestamp: today,
        status: "sent",
      },
      {
        id: "2",
        type: "message",
        content: "Yesterday message",
        sender: "user",
        timestamp: yesterday,
        status: "sent",
      },
    ];

    render(<PreviewMessages messages={messages} />);

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("handles message actions correctly", () => {
    const onCopyMessage = vi.fn();
    const onEditMessage = vi.fn();
    const onDeleteMessage = vi.fn();

    render(
      <PreviewMessages
        messages={mockMessages}
        onCopyMessage={onCopyMessage}
        onEditMessage={onEditMessage}
        onDeleteMessage={onDeleteMessage}
      />
    );

    // Find and click action buttons for the first message (user message)
    const copyButton = screen.getAllByLabelText("Copy message")[0];
    const editButton = screen.getByLabelText("Edit message");
    const deleteButton = screen.getAllByLabelText("Delete message")[0];

    fireEvent.click(copyButton);
    expect(onCopyMessage).toHaveBeenCalledWith("1");

    fireEvent.click(editButton);
    expect(onEditMessage).toHaveBeenCalledWith("1");

    fireEvent.click(deleteButton);
    expect(onDeleteMessage).toHaveBeenCalledWith("1");
  });

  it("renders different types of tool results", () => {
    const toolMessages: Message[] = [
      {
        id: "1",
        type: "message",
        content: "Here's some code:",
        sender: "assistant",
        timestamp: new Date(),
        status: "sent",
        metadata: {
          toolResults: [
            {
              tool: "code",
              result: {
                language: "javascript",
                code: "const x = 1;",
              },
            },
          ],
        },
      },
      {
        id: "2",
        type: "message",
        content: "Here are some search results:",
        sender: "assistant",
        timestamp: new Date(),
        status: "sent",
        metadata: {
          toolResults: [
            {
              tool: "search",
              result: {
                query: "test",
                results: ["result1", "result2"],
              },
            },
          ],
        },
      },
      {
        id: "3",
        type: "message",
        content: "Here's a table:",
        sender: "assistant",
        timestamp: new Date(),
        status: "sent",
        metadata: {
          toolResults: [
            {
              tool: "table",
              result: {
                headers: ["col1", "col2"],
                rows: [["data1", "data2"]],
              },
            },
          ],
        },
      },
    ];

    render(<PreviewMessages messages={toolMessages} />);

    expect(screen.getByText("Here's some code:")).toBeInTheDocument();
    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
    expect(
      screen.getByText("Here are some search results:")
    ).toBeInTheDocument();
    expect(screen.getByText("result1")).toBeInTheDocument();
    expect(screen.getByText("Here's a table:")).toBeInTheDocument();
    expect(screen.getByText("data1")).toBeInTheDocument();
  });
});
