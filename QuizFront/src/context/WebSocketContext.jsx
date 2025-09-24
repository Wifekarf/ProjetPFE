import React, { createContext, useContext } from 'react';

const WebSocketContext = createContext({ sendMessage: () => {} });

export const WebSocketProvider = ({ sendMessage, children }) => (
  <WebSocketContext.Provider value={{ sendMessage }}>
    {children}
  </WebSocketContext.Provider>
);

export const useWebSocket = () => useContext(WebSocketContext);
