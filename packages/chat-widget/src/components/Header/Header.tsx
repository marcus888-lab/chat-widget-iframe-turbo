import React from "react";
import "./styles.css";

export interface HeaderProps {
  title?: string;
  onMinimize?: () => void;
  onSettings?: () => void;
  onRefresh?: () => void;
  isOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Chat Assistant",
  onMinimize,
  onSettings,
  onRefresh,
  isOnline = true,
}) => {
  return (
    <header className="chat-widget-header">
      <div className="header-left">
        <span
          className={`status-indicator ${isOnline ? "online" : "offline"}`}
          role="presentation"
          aria-hidden="true"
        />
        <h2 className="header-title">{title}</h2>
      </div>
      <div className="header-actions">
        {onRefresh && (
          <button
            className="header-button"
            onClick={onRefresh}
            aria-label="Refresh session"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 8c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6c1.8 0 3.4.8 4.5 2H10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 1v3h-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {onSettings && (
          <button
            className="header-button"
            onClick={onSettings}
            aria-label="Settings"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.9 9.8C12.8 10.1 12.9 10.4 13.1 10.6L13.2 10.7C13.4 10.9 13.5 11.1 13.5 11.4C13.5 11.7 13.4 11.9 13.2 12.1C12.9 12.4 12.4 12.7 12 12.9C11.6 13.1 11.2 13.1 10.8 13C10.4 12.9 10.1 12.7 9.90001 12.4L9.80001 12.3C9.60001 12.1 9.30001 12 9.00001 12C8.70001 12 8.40001 12.1 8.20001 12.3L8.10001 12.4C7.90001 12.7 7.60001 12.9 7.20001 13C6.80001 13.1 6.40001 13.1 6.00001 12.9C5.60001 12.7 5.10001 12.4 4.80001 12.1C4.60001 11.9 4.50001 11.7 4.50001 11.4C4.50001 11.1 4.60001 10.9 4.80001 10.7L4.90001 10.6C5.10001 10.4 5.20001 10.1 5.10001 9.8C5.00001 9.5 4.90001 9.2 4.80001 9C4.70001 8.7 4.40001 8.5 4.10001 8.5H4.00001C3.40001 8.5 3.00001 8.1 3.00001 7.5C3.00001 7.1 3.30001 6.6 3.60001 6.3C3.80001 6.1 4.00001 6 4.30001 6H4.40001C4.70001 6 5.00001 5.8 5.10001 5.5C5.20001 5.2 5.30001 5 5.40001 4.7C5.50001 4.4 5.40001 4.1 5.20001 3.9L5.10001 3.8C4.90001 3.6 4.80001 3.4 4.80001 3.1C4.80001 2.8 4.90001 2.6 5.10001 2.4C5.40001 2.1 5.90001 1.8 6.30001 1.6C6.70001 1.4 7.10001 1.4 7.50001 1.5C7.90001 1.6 8.20001 1.8 8.40001 2.1L8.50001 2.2C8.70001 2.4 9.00001 2.5 9.30001 2.5C9.60001 2.5 9.90001 2.4 10.1 2.2L10.2 2.1C10.4 1.8 10.7 1.6 11.1 1.5C11.5 1.4 11.9 1.4 12.3 1.6C12.7 1.8 13.2 2.1 13.5 2.4C13.7 2.6 13.8 2.8 13.8 3.1C13.8 3.4 13.7 3.6 13.5 3.8L13.4 3.9C13.2 4.1 13.1 4.4 13.2 4.7C13.3 5 13.4 5.3 13.5 5.5C13.6 5.8 13.9 6 14.2 6H14.3C14.9 6 15.3 6.4 15.3 7C15.3 7.4 15 7.9 14.7 8.2C14.5 8.4 14.3 8.5 14 8.5H13.9C13.6 8.5 13.3 8.7 13.2 9C13.1 9.2 13 9.5 12.9 9.8Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {onMinimize && (
          <button
            className="header-button"
            onClick={onMinimize}
            aria-label="Minimize"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 8H14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
