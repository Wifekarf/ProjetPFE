import React from 'react';

export default function ToastNotification({ visible, onClose, teamName, username, content }) {
  return (
    <div
      className="fixed top-8 right-8 z-50 flex flex-col items-end"
      style={{ display: visible ? 'flex' : 'none' }}
    >
      <div className="flex items-center animate-slide-in shadow-2xl rounded-2xl bg-white/95 border border-slate-200/80 min-w-[320px] max-w-xs px-4 py-3">
        {/* Badge équipe + icône */}
        <div className="flex flex-col items-center mr-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#85a831] to-[#6e8c26] flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span className="text-xs mt-1 font-semibold text-[#85a831] text-center max-w-[60px] truncate">{teamName}</span>
        </div>
        {/* Message */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800 text-sm truncate">{username}</span>
            <span className="text-xs text-slate-400">sent:</span>
          </div>
          <div className="text-slate-700 text-[15px] mt-1 break-words whitespace-pre-line leading-snug">
            {content}
          </div>
        </div>
        <button onClick={onClose} className="ml-3 text-slate-400 hover:text-[#85a831] text-xl p-1 rounded transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <style>{`
        @keyframes slide-in { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-in { animation: slide-in 0.35s cubic-bezier(.4,2,.6,1) both; }
      `}</style>
    </div>
  );
}
