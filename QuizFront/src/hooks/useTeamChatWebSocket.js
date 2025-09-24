import { useEffect, useRef } from "react";

/**
 * Hook to manage team chat WebSocket connection.
 * @param {Object} params
 * @param {Object} params.user - Current user object (must have id)
 * @param {Object} params.selectedTeam - Current team object (must have id)
 * @param {Function} params.onMessage - Callback for each incoming message
 * @returns {Object} wsRef - Ref to the WebSocket instance
 */
export default function useTeamChatWebSocket({ user, selectedTeam, onMessage }) {
  const wsRef = useRef(null);

  useEffect(() => {
    if (!selectedTeam || !user?.id) return;
    if (wsRef.current) wsRef.current.close();

    // Support multi-team connection: selectedTeam can be an array or single object
    let teamIdParam = '';
    if (Array.isArray(selectedTeam)) {
      teamIdParam = selectedTeam.join(',');
    } else if (selectedTeam) {
      teamIdParam = selectedTeam;
    }
    const ws = new WebSocket(
      `ws://localhost:8080/ws/chat?userId=${user.id}&teamId=${teamIdParam}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({ action: "subscribe", teamId: teamIdParam, userId: user.id })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (onMessage) onMessage(msg);
      } catch (e) {
        console.error("Invalid WS message", e);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error", err);
    return () => ws.close();
  }, [selectedTeam, user?.id, onMessage]);

  // Fonction pour envoyer un message via WebSocket
  const sendMessage = (msgObj) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(msgObj));
    }
  };

  return { sendMessage };
}
