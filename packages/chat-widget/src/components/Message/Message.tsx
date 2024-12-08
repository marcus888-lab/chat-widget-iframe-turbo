import React from "react";
import { ProductResult } from "../ToolMessage/types";

export interface MessageProps {
  id: string;
  content: string;
  timestamp: Date;
  sender: "user" | "assistant" | "system";
  status?: "sending" | "sent" | "error";
  metadata?: {
    context_used?: boolean;
    confidence?: number;
    error?: "timeout" | "cancelled" | "system_error";
    tool_results?: Array<{
      tool: string;
      result: string | Record<string, any>;
    }>;
    selected_product?: ProductResult;
  };
  onCopy?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const Message: React.FC<MessageProps> = ({
  content,
  timestamp,
  sender,
  status = "sent",
  metadata,
  onCopy,
  onEdit,
  onDelete,
}) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("default", {
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  // Handle multiline content
  const formattedContent = content.split("\n").map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < content.split("\n").length - 1 && <br />}
    </React.Fragment>
  ));

  const messageClasses = {
    user: "ml-auto mr-4 bg-primary-600 text-primary-50 dark:bg-primary-500",
    assistant:
      "mr-auto ml-4 bg-secondary-100 text-secondary-900 border border-secondary-200 dark:bg-secondary-800 dark:text-secondary-50 dark:border-secondary-700",
    system:
      "mx-auto bg-secondary-50 text-secondary-600 border border-secondary-200 italic dark:bg-secondary-900 dark:text-secondary-400 dark:border-secondary-700",
  }[sender];

  const actionButtonClasses = {
    user: "text-primary-50/70 hover:bg-primary-50/10 hover:text-primary-50",
    assistant:
      "text-secondary-500 hover:bg-secondary-200 hover:text-secondary-700 dark:text-secondary-400 dark:hover:bg-secondary-700 dark:hover:text-secondary-300",
    system:
      "text-secondary-500 hover:bg-secondary-200 hover:text-secondary-700 dark:text-secondary-400 dark:hover:bg-secondary-700 dark:hover:text-secondary-300",
  }[sender];

  const metaTextClasses = {
    user: "text-primary-50/70",
    assistant: "text-secondary-500 dark:text-secondary-400",
    system: "text-secondary-500 dark:text-secondary-400",
  }[sender];

  return (
    <div
      className={`max-w-[80%] mb-4 p-3 rounded-2xl transition-opacity duration-200 ${messageClasses} ${
        status === "sending" ? "opacity-70" : ""
      } ${status === "error" ? "border-red-500" : ""} ${
        sender === "user"
          ? "rounded-br-sm"
          : sender === "assistant"
            ? "rounded-bl-sm"
            : ""
      }`}
      data-sender={sender}
      data-status={status}
      data-context={metadata?.selected_product ? "product_detail" : undefined}
    >
      <div className="whitespace-pre-wrap break-words leading-relaxed">
        {formattedContent}
      </div>
      <div className="flex justify-between items-center mt-2 min-h-6">
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onCopy && (
            <button
              className={`flex items-center justify-center w-6 h-6 p-0 rounded transition-all duration-200 ${actionButtonClasses}`}
              onClick={onCopy}
              aria-label="Copy message"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6V2h8v4M4 6v8h8V6M4 6H2m10 0h2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {sender === "user" && onEdit && (
            <button
              className={`flex items-center justify-center w-6 h-6 p-0 rounded transition-all duration-200 ${actionButtonClasses}`}
              onClick={onEdit}
              aria-label="Edit message"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 1l3 3L5 14H2v-3L12 1z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              className={`flex items-center justify-center w-6 h-6 p-0 rounded transition-all duration-200 ${actionButtonClasses}`}
              onClick={onDelete}
              aria-label="Delete message"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 4h12M6 4V2h4v2M4 4v10h8V4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
        <div className={`flex items-center gap-2 text-xs ${metaTextClasses}`}>
          <span className="whitespace-nowrap">{formatTime(timestamp)}</span>
          {status === "sending" && <span className="italic">Sending...</span>}
          {status === "error" && (
            <span className="italic text-red-500 dark:text-red-400">
              Failed to send
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
