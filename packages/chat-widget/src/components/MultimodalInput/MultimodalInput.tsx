import React, { useState, useRef, useEffect } from "react";
import "./styles.css";

export interface MultimodalInputProps {
  onSendMessage: (message: string) => void;
  onSendFile?: (file: File) => void;
  onStartVoice?: () => void;
  onStopVoice?: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

export const MultimodalInput: React.FC<MultimodalInputProps> = ({
  onSendMessage,
  onSendFile,
  onStartVoice,
  onStopVoice,
  placeholder = "Type a message...",
  disabled = false,
  maxLength,
}) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendFile) {
      onSendFile(file);
      e.target.value = ""; // Reset input
    }
  };

  const handleVoiceClick = () => {
    if (isRecording) {
      setIsRecording(false);
      onStopVoice?.();
    } else {
      setIsRecording(true);
      onStartVoice?.();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf("image") !== -1 && onSendFile) {
        const file = item.getAsFile();
        if (file) {
          onSendFile(file);
        }
      }
    }
  };

  return (
    <form className="multimodal-input" onSubmit={handleSubmit}>
      <div className="input-container">
        {onSendFile && (
          <>
            <button
              type="button"
              className="input-button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach file"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.5 10V15C17.5 16.3807 16.3807 17.5 15 17.5H5C3.61929 17.5 2.5 16.3807 2.5 15V5C2.5 3.61929 3.61929 2.5 5 2.5H12.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M12.5 10L7.5 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M10 7.5L10 12.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="file-input"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx"
              aria-label="File input"
            />
          </>
        )}

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={1}
          className="text-input"
          aria-label="Message input"
        />

        {onStartVoice && onStopVoice && (
          <button
            type="button"
            className={`input-button ${isRecording ? "recording" : ""}`}
            onClick={handleVoiceClick}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 1.25C8.48122 1.25 7.25 2.48122 7.25 4V10C7.25 11.5188 8.48122 12.75 10 12.75C11.5188 12.75 12.75 11.5188 12.75 10V4C12.75 2.48122 11.5188 1.25 10 1.25Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.75 8.25V10C4.75 13.0376 7.21243 15.5 10.25 15.5C13.2876 15.5 15.75 13.0376 15.75 10V8.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 15.5V18.75"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <button
          type="submit"
          className="send-button"
          disabled={!message.trim() || disabled}
          aria-label="Send message"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18.3333 1.66667L9.16667 10.8333"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18.3333 1.66667L12.5 18.3333L9.16667 10.8333L1.66667 7.5L18.3333 1.66667Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default MultimodalInput;
