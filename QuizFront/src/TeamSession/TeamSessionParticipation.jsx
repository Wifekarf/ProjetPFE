import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthLayout from '../Layout/AuthLayout';
import PlayQuiz from '../User/PlayQuiz/PlayQuiz';
import PlayProgrammingProblem from '../User/PlayProgrammingProblem';
import SolveProblem from '../ProgProblem/SolveProblem';
import { teamSessionService } from '../services/teamSessionService' ;
import { MdClose, MdLeaderboard } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

function RankingDrawer({ open, onClose, rankingData, loading, error, totalItems }) {
  // Trouver le score max pour normaliser les barres
  
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md h-full bg-white rounded-l-3xl shadow-2xl flex flex-col">
            {/* Close btn */}
            <button
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              onClick={onClose}
              aria-label="Close"
            >
              <MdClose className="w-6 h-6" />
            </button>
            <div className="px-8 pt-10 pb-6 flex-1 flex flex-col">
              <h2 className="text-2xl font-bold text-[#85a831] mb-2">Live Leaderboard</h2>
              <p className="text-slate-500 mb-6">Track the participants' ranking in real time during the session.</p>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="py-10 text-center text-[#85a831] font-bold">Chargement du classement...</div>
                ) : error ? (
                  <div className="py-10 text-center text-red-500 font-bold">{error}</div>
                ) : (
                  <ul className="divide-y divide-slate-100 overflow-y-auto max-h-96">
                    {rankingData && rankingData.length > 0
                      ? [...rankingData]
                          .sort((a, b) => {
                            if (b.scorePoints !== a.scorePoints) {
                              return b.scorePoints - a.scorePoints;
                            }
                            // Si même score, trie par answeredCount décroissant
                            return (b.answeredCount ?? 0) - (a.answeredCount ?? 0);
                          })
                          .map((u, i) => {
                      const percent = Math.round((u.answeredCount / totalItems) * 100);
                      // Progression answeredCount/totalItems
                      const progressTotal = totalItems > 0 ? Math.round((u.answeredCount / totalItems) * 100) : 0;
                      const AVATARS = ['🦸‍♂️', '🧑‍💻', '🦸‍♀️', '👩‍🚀', '🧑‍🚀', '🦹‍♂️', '🦹‍♀️', '👨‍🎤', '👩‍🎤'];
                      function getStaticAvatar(userId) {
                        if (!userId) return '👤';
                        return AVATARS[userId % AVATARS.length];
                      }
                      return (
                        <li key={u.id || i} className="flex flex-col py-3">
                          <div className="flex items-center">
                            <span className="text-lg font-bold w-8 text-center text-[#85a831]">{i + 1}</span>
                            <span className="text-2xl mr-3">{u.user.avatar || getStaticAvatar(u.user.id) || '👤'}</span>
                            <span className="flex-1 text-slate-700 font-semibold">{u.user.fullName || u.user.username || 'Utilisateur'}</span>
                            <span className="px-3 py-1 rounded-lg bg-[#e7f6d9] text-[#6e8c26] font-bold shadow text-base">{u.scorePoints}</span>
                          </div>
                          {/* Score progress bar */}
                          <div className="w-full mt-2 flex items-center gap-2">
                <div className="flex-1 h-3 bg-slate-100 rounded-xl overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#85a831] to-[#6e8c26] transition-all duration-300 absolute top-0 left-0"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="ml-2 text-xs font-bold text-[#6e8c26] min-w-fit">{u.answeredCount ?? 0}/{totalItems}</span>
              </div>
            
                        </li>
                      );
                    }) : (
                      <div className="py-10 text-center text-slate-500">Aucun participant pour le moment.</div>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function TeamSessionParticipation({ rankingData, rankingLoading, rankingError }) {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  console.log("rank",rankingData)

  useEffect(() => {
    async function fetchSession() {
      setLoading(true);
      try {
        const resp = await teamSessionService.getTeamSession(sessionId);
        setSession(resp.data);
      } catch (e) {
        setError('Could not load session.');
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [sessionId]);

  const [showRankingDrawer, setShowRankingDrawer] = useState(true);

  if (loading) return <AuthLayout><div className="p-8 text-center">Loading...</div></AuthLayout>;
  if (error) return <AuthLayout><div className="p-8 text-center text-red-600">{error}</div></AuthLayout>;
  if (!session) return null;

  return (
    <div className="relative">
      {/* Floating button to open drawer */}
      {!showRankingDrawer && (
        <button
          className="fixed top-6 right-6 z-40 bg-[#85a831] text-white rounded-full p-3 shadow-lg hover:scale-110 transition-all"
          onClick={() => setShowRankingDrawer(true)}
          aria-label="View leaderboard"
        >
          <MdLeaderboard className="w-7 h-7" />
        </button>
      )}
      {/* Leaderboard drawer */}
      <RankingDrawer
        open={showRankingDrawer}
        onClose={() => setShowRankingDrawer(false)}
        rankingData={rankingData.scores}
        loading={rankingLoading}
        error={rankingError}
        totalItems={rankingData.totalItems}
      />
      {/* UI de participation */}
      <div className={showRankingDrawer ? 'pointer-events-none blur-[2px] select-none' : ''}>
        {session.type === 'quiz' && (
          <PlayQuiz sessionId={sessionId} session={session} quizToPlay={session?.quizzes?.[0]} />
        )}
        {(session.type === "programming") && (
          <SolveProblem sessionId={sessionId} problemId={session?.prog_problems?.[0]?.id} />
        )}
      </div>
    </div>
  );
}
