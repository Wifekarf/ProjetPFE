import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthLayout from '../Layout/AuthLayout';
import { teamSessionService } from '../services/teamSessionService';

export default function TeamSessionScore() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState([]);
  const [session, setSession] = useState(null);
  const [totalItems , setTotalItems]=useState(0);

  useEffect(() => {
    async function fetchScores() {
      setLoading(true);
      setError(null);
      try {
        // Suppose endpoint: /api/team-session/:id/scoreboard
        const resp = await teamSessionService.getSessionScoreboard(id);
        console.log("test",resp.data)
        setScores(resp.data.scores || []);
        setTotalItems(resp.data.totalItems);
        setSession(resp.data.session || null);
      } catch (e) {
        setError('Could not load scores.');
      } finally {
        setLoading(false);
      }
    }
    fetchScores();
  }, [id]);

  if (loading) return (
    <AuthLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-primary-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <div className="text-gray-500 font-medium text-lg">Loading leaderboard...</div>
        </div>
      </div>
    </AuthLayout>
  );
  if (error) return (
    <AuthLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-100 text-red-700 px-6 py-4 rounded shadow flex items-center gap-2">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>
          <span>{error}</span>
        </div>
      </div>
    </AuthLayout>
  );

  return (
    <AuthLayout>
      <div className="max-w-2xl mx-auto mt-8 px-2 sm:px-0">
       
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10">
           {/* Back button at the top left */}
           <div className='flex gap-6  '>
        <div className="">
          <button
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm font-medium"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
          <h1 className="text-3xl font-extrabold text-primary-700 mb-4 text-center tracking-tight">Session Leaderboard {session && (
            <label>{session.title}</label>
          )}</h1></div>
          
          <div className="overflow-x-auto">
            {scores.length === 0 ? (
              <div className="text-center py-4 text-gray-400">No scores for this session.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {[...scores]
  .sort((a, b) => {
    if (b.scorePoints !== a.scorePoints) {
      return b.scorePoints - a.scorePoints;
    }
    return (b.answeredCount ?? 0) - (a.answeredCount ?? 0);
  })
  .map((u, i) => {// fallback if needed
    const percent = totalItems > 0 ? Math.round((u.answeredCount / totalItems) * 100) : 0;
                  const AVATARS = ['🦸‍♂️', '🧑‍💻', '🦸‍♀️', '👩‍🚀', '🧑‍🚀', '🦹‍♂️', '🦹‍♀️', '👨‍🎤', '👩‍🎤'];
                  function getStaticAvatar(userId) {
                    if (!userId) return '👤';
                    return AVATARS[userId % AVATARS.length];
                  }
                  return (
                    <li key={u.user.id || i} className="flex flex-col py-3">
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
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
