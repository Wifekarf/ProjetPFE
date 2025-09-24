import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to format message date
function formatMessageDate(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const msgDate = new Date(dateString.replace(' ', 'T'));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
  const diffTime = today - msgDay;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return msgDate.toLocaleString('en-GB', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false
  }).replace(',', '');
}

function TeamChat({
  user,
  teams = [],
  selectedTeam,
  setSelectedTeam,
  messages = [],
  setMessages,
  message,
  setMessage,
  loadingTeams,
  loadingMessages,
  sending,
  onSendMessage
}) {
  const messagesEndRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const [cursorPos, setCursorPos] = useState(null);

  // Gestion insertion emoji
  const handleSelectEmoji = (emoji) => {
    if (!inputRef.current) return;
    const { selectionStart, selectionEnd } = inputRef.current;
    const newText =
      message.substring(0, selectionStart) + emoji.native + message.substring(selectionEnd);
    setMessage(newText);
    setShowEmojiPicker(false);
    setTimeout(() => {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(
        selectionStart + emoji.native.length,
        selectionStart + emoji.native.length
      );
    }, 0);
  };

  // Fermer le picker si clic extérieur
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClick = (e) => {
      if (
        !e.target.closest('.emoji-mart') &&
        !e.target.closest('.emoji-picker-btn')
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showEmojiPicker]);
  const scrollToBottom = (retryCount = 0) => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest('.overflow-y-auto');
      if (container) {
        // Scroll direct vers le bas du container
        container.scrollTop = container.scrollHeight;
        
        // Si le scroll n'a pas fonctionné et qu'on a encore des tentatives, retry
        if (retryCount < 3 && container.scrollTop < container.scrollHeight - container.clientHeight - 10) {
          setTimeout(() => scrollToBottom(retryCount + 1), 50);
        }
      } else {
        // Fallback vers la méthode originale
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Scroll vers le bas quand les messages changent
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  // Scroll vers le bas quand on arrête de charger les messages ET qu'il y a des messages
  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      // Délais multiples pour s'adapter aux différentes tailles d'écran
      setTimeout(() => scrollToBottom(), 100);
      setTimeout(() => scrollToBottom(), 300);
    }
  }, [loadingMessages, messages.length]);

  // Scroll vers le bas quand on change d'équipe (après un court délai)
  useEffect(() => {
    if (selectedTeam && !loadingMessages && messages.length > 0) {
      setTimeout(() => scrollToBottom(), 200);
      setTimeout(() => scrollToBottom(), 500);
    }
  }, [selectedTeam]);

  // Scroll vers le bas lors du resize de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      if (messages.length > 0) {
        setTimeout(scrollToBottom, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [messages.length]);

  const handleSend = async () => {
    console.log("handleSend");
    if (!message.trim() || !selectedTeam) return;

    if (onSendMessage) {
      console.log("onSendMessage",message);
      await onSendMessage(message);
    }
  };

  return (
    <div className="h-full ">
      <div className="w-full max-w-7xl h-[90vh] bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl shadow-slate-900/10 border border-white/20 overflow-hidden flex">
        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="p-6 border-b border-slate-200/50 bg-white/40 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#85a831] to-[#6e8c26] rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800">
                    {selectedTeam ? selectedTeam.name : 'Select a team'}
                  </h1>
                </div>
              </div>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-[#f6ffe6]/70 via-white/60 to-slate-100/60">
            <AnimatePresence mode="wait">
              {!selectedTeam ? (
                <motion.div
                  key="not-selected"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex items-center justify-center"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 180, damping: 12 }}
                      className="w-20 h-20 bg-gradient-to-br from-[#85a831]/40 to-[#6e8c26]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#85a831]/10"
                    >
                      <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </motion.div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">Welcome to Team Chat</h3>
                    <p className="text-slate-500">Select a team from the sidebar to start messaging</p>
                  </div>
                </motion.div>
              ) : loadingMessages ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {[1,2,3].map(i => (
                    <motion.div
                      key={i}
                      className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, x: i % 2 === 0 ? 40 : -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="bg-gradient-to-br from-[#85a831]/10 to-[#6e8c26]/10 rounded-2xl h-16 w-64 animate-pulse shadow-md" />
                    </motion.div>
                  ))}
                </motion.div>
              ) : messages.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex items-center justify-center"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 180, damping: 12 }}
                      className="w-16 h-16 bg-gradient-to-br from-[#85a831]/10 to-[#6e8c26]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-[#85a831]/10"
                    >
                      <svg className="w-8 h-8 text-[#85a831]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2m2-4h4a2 2 0 012 2v6a2 2 0 01-2 2h-4v4l-4-4H7a2 2 0 01-2-2V7a2 2 0 012-2h4z" />
                      </svg>
                    </motion.div>
                    <p className="text-slate-500">No messages yet. Be the first to say hello!</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="messages"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
                  }}
                  className="space-y-4"
                >
                  <AnimatePresence>
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={msg.id ? msg.id : `${msg.user || msg.userId}_${msg.createdAt || ''}_${idx}`}
                        className={`flex ${(msg.user === user.id || msg.userId === user.id) ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
                      >
                        <motion.div
                          className={`max-w-[70%] ${(msg.user === user.id || msg.userId === user.id) ? 'order-2' : 'order-1'}`}
                          whileHover={{ scale: 1.04, boxShadow: (msg.user === user.id || msg.userId === user.id) ? '0 8px 32px 0 rgba(133,168,49,0.18)' : '0 8px 32px 0 rgba(51,65,85,0.10)' }}
                          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                        >
                          <div className={`group relative px-6 py-4 rounded-[2rem] shadow-xl transition-all border-2 flex flex-col gap-1 ${
                            (msg.user === user.id || msg.userId === user.id)
                              ? 'bg-gradient-to-br from-[#a6e35a] via-[#85a831] to-[#6e8c26] text-white border-[#d2f7a5]/60 backdrop-blur-[2px]'
                              : 'bg-gradient-to-br from-white/90 via-slate-50/80 to-[#e7f6d9]/70 border-[#85a831]/20 backdrop-blur-[2px]'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold tracking-wide ${
                                (msg.user === user.id || msg.userId === user.id) ? 'text-white/90' : 'text-[#6e8c26]'
                              }`}>
                                {(msg.user === user.id || msg.userId === user.id) ? 'Moi' : (msg.username || `User #${msg.user || msg.userId}`)}
                              </span>
                              <span className={`rounded-full w-2 h-2 ${(msg.user === user.id || msg.userId === user.id) ? 'bg-white/70' : 'bg-[#85a831]/60'}`}></span>
                            </div>
                            <div className="relative">
                              <p className={`text-base leading-relaxed break-words break-all whitespace-pre-line font-medium ${
                                (msg.user === user.id || msg.userId === user.id) ? 'text-white drop-shadow-[0_1px_1px_rgba(110,140,38,0.16)]' : 'text-[#374151]'
                              }`}>
                                {msg.content}
                              </p>
                              <span className={` text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-sm ${(msg.user === user.id || msg.userId === user.id) ? 'bg-[#b7e07d]/80 text-[#466a0f]' : 'bg-[#e7f6d9]/90 text-[#85a831]'}`}>{formatMessageDate(msg.createdAt)}</span>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}

                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {selectedTeam && (
            <div className="p-6 border-t border-slate-200/50 bg-white/60 backdrop-blur-md">
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      className="w-full px-4 py-3 pr-12 bg-white/80 border border-slate-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#85a831]/30 focus:border-[#85a831]/50 transition-all placeholder-slate-400 text-slate-700"
                      placeholder="Type your message..."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                      disabled={sending}
                    />
                  </div>
                </div>
                <motion.button
                  type="button"
                  className={`group px-6 py-3 rounded-2xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-[#85a831]/5 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-[#85a831]/30 focus:border-[#85a831]/50 ${
                    sending || !message.trim()
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#85a831] to-[#6e8c26] text-white hover:shadow-xl hover:shadow-[#85a831]/15 hover:scale-105 active:scale-95'
                  }`}
                  onClick={handleSend}
                  disabled={sending || !message.trim()}
                  whileTap={sending || !message.trim() ? undefined : { scale: 0.95 }}
                  whileHover={sending || !message.trim() ? undefined : { y: -3, boxShadow: '0 8px 32px 0 rgba(133,168,49,0.18)' }}
                  transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                >
                  {sending ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        style={{ borderTopColor: '#fff', borderRadius: '50%' }}
                      />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send</span>
                      <motion.svg
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        initial={{ x: 0 }}
                        whileHover={{ x: 4 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </motion.svg>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamChat;