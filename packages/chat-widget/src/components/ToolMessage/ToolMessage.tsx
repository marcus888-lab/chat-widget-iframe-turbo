import React from "react";
import { ToolMessageProps } from "./types";

export const ToolMessage: React.FC<ToolMessageProps> = ({
  content,
  sender,
}) => (
  <div
    className={`my-2 p-4 rounded-lg bg-secondary-50 border border-secondary-200 text-secondary-900 dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-50 ${
      sender === "assistant" ? "ml-8" : "mr-8"
    }`}
  >
    <div className="whitespace-pre-wrap break-words">{content}</div>
  </div>
);

export default ToolMessage;
