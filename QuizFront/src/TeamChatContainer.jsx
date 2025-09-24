import React, { useState, useCallback, useEffect } from 'react';
import { messangerService } from './services/messangerService';
import TeamChat from './TeamChat';

// TeamChatContainer now receives all data/logic from main.jsx
export default function TeamChatContainer({ user, teams, connectedTeam, sendMessage, loadingTeams, messages, setMessages, selectedTeam, setSelectedTeam }) {


  const [loadingMessages, setLoadingMessages] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Load messages when selectedTeam changes
  useEffect(() => {
    if (!selectedTeam) return;
    setLoadingMessages(true);
    messangerService.getTeamMessages(selectedTeam.id)
      .then(res => setMessages(res.data))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [selectedTeam]);

  // Utilise connectedTeam pour la connexion WebSocket, indépendamment de selectedTeam
  //const {sendMessage} = useTeamChatWebSocket({ user, selectedTeam: connectedTeam, onMessage: handleWsMessage });

  // Callback d'envoi de message
  const handleSendMessage = useCallback(async (msgText) => {
    if (!msgText.trim() || !selectedTeam) return;
    setSending(true);
    const msgObj = {
      type: 'chat_message',
      data: {
        userId: user.id,
        username: user.username,
        content: msgText.trim(),
        createdAt: new Date().toISOString(),
        teamId: selectedTeam.id
      }
    };
    sendMessage(msgObj);
    // Ajoute le message localement
    setMessages(prev => [...prev, msgObj.data]);
    setMessage('');
    // Persiste côté backend
    try {
      await messangerService.sendMessage({
        userId: user.id,
        teamId: selectedTeam.id,
        content: msgObj.data.content,
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
    setSending(false);
  }, [user, selectedTeam]);

  // message/setMessage sont utilisés pour la saisie utilisateur


  return (
    <TeamChat
      user={user}
      teams={teams}
      selectedTeam={selectedTeam}
      setSelectedTeam={setSelectedTeam}
      messages={messages}
      setMessages={setMessages}
      message={message}
      setMessage={setMessage}
      loadingMessages={loadingMessages}
      sending={sending}
      onSendMessage={handleSendMessage}
      loadingTeams={loadingTeams}
    />
  );
}

