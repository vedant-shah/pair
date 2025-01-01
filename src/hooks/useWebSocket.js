import { useEffect, useRef, useState, useCallback } from "react";

const useWebSocket = (url) => {
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const onMessage = useRef((data) => {
    console.log("Override onMessage handler");
  });

  const setOnMessage = useCallback((handler) => {
    onMessage.current = handler;
  }, []);

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage.current(data);
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    socket.onerror = (event) => {
      setError("WebSocket error occurred");
      setIsConnected(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    ws.current = socket;

    return () => {
      socket.close();
    };
  }, [url]);

  const sendMessage = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    isConnected,
    error,
    sendMessage,
    setOnMessage,
  };
};

export default useWebSocket;
