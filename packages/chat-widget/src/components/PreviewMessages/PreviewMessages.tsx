import React, { forwardRef } from "react";
import Message from "../Message/Message";
import {
  CodeBlock,
  SearchResult,
  TableView,
  ToolMessage as ToolMessageComponent,
} from "../ToolMessage";
import { Message as MessageType } from "../../types";
import { ProductResult } from "../ToolMessage/types";

interface TableColumn {
  key: string;
  title: string;
}

interface TableData {
  columns: TableColumn[];
  rows: Record<string, string | number>[];
}

export interface PreviewMessagesProps {
  messages: MessageType[];
  onLoadMore?: () => void;
  loading?: boolean;
  onCopyMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onProductSelect?: (product: ProductResult) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
}

export const PreviewMessages = forwardRef<HTMLDivElement, PreviewMessagesProps>(
  (
    {
      messages = [],
      onLoadMore,
      loading = false,
      onCopyMessage,
      onEditMessage,
      onDeleteMessage,
      onProductSelect,
      containerRef,
      messagesEndRef,
    },
    ref
  ) => {
    const handleScroll = () => {
      if (!containerRef?.current || !onLoadMore || loading) return;

      const { scrollTop } = containerRef.current;
      if (scrollTop === 0) {
        onLoadMore();
      }
    };

    const formatDate = (date: Date) => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        return new Intl.DateTimeFormat("default", {
          month: "short",
          day: "numeric",
        }).format(date);
      }
    };

    const renderLoadingMessage = (message: MessageType) => (
      <div
        key={message.id}
        className="flex items-start space-x-2 animate-pulse"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="space-y-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          </div>
        </div>
      </div>
    );

    const renderMessage = (message: MessageType) => {
      // Handle loading message type
      if (message.type === "loading") {
        return renderLoadingMessage(message);
      }

      const messageProps = {
        id: message.id,
        content: message.content,
        timestamp: message.timestamp,
        sender: message.sender as "user" | "assistant" | "system",
        status: message.status,
        metadata: {
          ...message.metadata,
          context_used:
            typeof message.metadata?.context_used === "string"
              ? message.metadata.context_used === "true"
              : Boolean(message.metadata?.context_used),
        },
        onCopy: onCopyMessage ? () => onCopyMessage(message.id) : undefined,
        onEdit:
          message.sender === "user" && onEditMessage
            ? () => onEditMessage(message.id)
            : undefined,
        onDelete: onDeleteMessage
          ? () => onDeleteMessage(message.id)
          : undefined,
      };

      // If message has tool results, render tool component after the message
      const toolResult = message.metadata?.tool_results?.[0];
      return (
        <React.Fragment key={message.id}>
          <Message {...messageProps} />
          {toolResult &&
            (() => {
              const baseProps = {
                sender: message.sender as "user" | "assistant" | "system",
                timestamp: message.timestamp,
              };

              switch (toolResult.tool) {
                case "code":
                  try {
                    const codeProps =
                      typeof toolResult.result === "string"
                        ? JSON.parse(toolResult.result)
                        : toolResult.result;
                    return (
                      <CodeBlock
                        key={`${message.id}-tool`}
                        {...baseProps}
                        language={codeProps.language}
                        code={codeProps.code}
                      />
                    );
                  } catch (error) {
                    console.error("Error parsing code result:", error);
                    return null;
                  }
                case "product_search":
                  try {
                    const searchData =
                      typeof toolResult.result === "string"
                        ? JSON.parse(toolResult.result)
                        : toolResult.result;

                    // If there's a selected product in metadata, don't show search results
                    if (message.metadata?.selected_product) {
                      return null;
                    }

                    return (
                      <SearchResult
                        key={`${message.id}-tool`}
                        {...baseProps}
                        query={message.content}
                        results={searchData.data}
                        onProductSelect={onProductSelect}
                      />
                    );
                  } catch (error) {
                    console.error(
                      "Error parsing product search result:",
                      error
                    );
                    return (
                      <ToolMessageComponent
                        key={`${message.id}-tool`}
                        {...baseProps}
                        content="Error displaying search results"
                      />
                    );
                  }
                case "table":
                  try {
                    const tableData =
                      typeof toolResult.result === "string"
                        ? JSON.parse(toolResult.result)
                        : (toolResult.result as TableData);
                    const headers = tableData.columns.map(
                      (col: TableColumn) => col.title
                    );
                    const rows = tableData.rows.map(
                      (row: Record<string, string | number>) =>
                        tableData.columns.map((col: TableColumn) =>
                          String(row[col.key])
                        )
                    );

                    return (
                      <TableView
                        key={`${message.id}-tool`}
                        {...baseProps}
                        headers={headers}
                        rows={rows}
                      />
                    );
                  } catch (error) {
                    console.error("Error parsing table result:", error);
                    return null;
                  }
                default:
                  return (
                    <ToolMessageComponent
                      key={`${message.id}-tool`}
                      {...baseProps}
                      content={
                        typeof toolResult.result === "string"
                          ? toolResult.result
                          : JSON.stringify(toolResult.result, null, 2)
                      }
                    />
                  );
              }
            })()}
        </React.Fragment>
      );
    };

    const groupMessagesByDate = (messages: MessageType[]) => {
      const groups: { [key: string]: MessageType[] } = {};

      if (!Array.isArray(messages)) return groups;

      messages.forEach((message) => {
        const date = formatDate(message.timestamp);
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(message);
      });

      return groups;
    };

    const messageGroups = groupMessagesByDate(messages);
    return (
      <div
        className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900 flex flex-col gap-4"
        ref={containerRef || ref}
        onScroll={handleScroll}
      >
        {loading && (
          <div className="text-center p-2 text-sm text-gray-500 dark:text-gray-400">
            Loading previous messages...
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center p-8 text-gray-500 dark:text-gray-400 italic">
            No messages yet
          </div>
        )}

        {Object.entries(messageGroups).map(([date, messages]) => (
          <div key={date} className="flex flex-col gap-2">
            <div className="flex items-center justify-center relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative px-4 bg-white dark:bg-gray-900">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {date}
                </span>
              </div>
            </div>

            {messages.map(renderMessage)}
          </div>
        ))}

        <div ref={messagesEndRef || null} className="h-6 w-6 shrink-0" />
      </div>
    );
  }
);

PreviewMessages.displayName = "PreviewMessages";

export default PreviewMessages;
