import { useEffect, useRef } from "react";

export function useScrollToBottom<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);
  const messagesEndRef = useRef<T>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  return {
    containerRef,
    messagesEndRef,
    scrollToBottom,
  };
}
