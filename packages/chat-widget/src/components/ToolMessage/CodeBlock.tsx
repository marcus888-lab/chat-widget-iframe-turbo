import React from "react";
import { CodeBlockProps } from "./types";

export const CodeBlock: React.FC<CodeBlockProps> = ({
  language,
  code,
  sender,
}) => (
  <div
    className={`my-2 p-4 rounded-lg bg-secondary-50 border border-secondary-200 text-secondary-900 dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-50 font-mono text-sm ${
      sender === "assistant" ? "ml-8" : "mr-8"
    }`}
  >
    {language && (
      <div className="mb-2">
        <span className="bg-secondary-600 text-secondary-50 px-2 py-1 rounded text-xs uppercase">
          {language}
        </span>
      </div>
    )}
    <pre className="m-0 p-4 bg-secondary-900 rounded overflow-x-auto">
      <code className="block text-secondary-50 leading-relaxed">{code}</code>
    </pre>
  </div>
);

export default CodeBlock;
