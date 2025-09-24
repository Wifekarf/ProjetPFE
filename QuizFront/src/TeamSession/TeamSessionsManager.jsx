import React, { useEffect, useState } from 'react';
import { teamService } from '../services/teamService';
import { teamSessionService } from '../services/teamSessionService';
import TeamSessionForm from './TeamSessionForm';
import TeamSessionDetails from './TeamSessionDetails';
import { MdEdit, MdCancel, MdPlayArrow } from 'react-icons/md';
import { FaRegClock } from 'react-icons/fa'; // Import ajouté
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const statusColors = {
  scheduled: 'bg-yellow-100 text-yellow-700',
  inprogress: 'bg-green-100 text-green-700',
  finished: 'bg-gray-200 text-gray-800',
  canceled: 'bg-gray-300 text-gray-500 border border-gray-400',
};

const statusLabelMap = {
  scheduled: 'Scheduled',
  inprogress: 'In Progress',
  finished: 'Finished',
  canceled: 'Canceled',
};

export default function TeamSessionsManager() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [detailsSession, setDetailsSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  // États pour les filtres frontend
  const [filterTitle, setFilterTitle] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDuration, setFilterDuration] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const teamResp = await teamService.getMyTeam();
      const tId = teamResp?.data?.team?.id || teamResp?.data?.id || teamResp?.id;
      setTeamId(tId);
      if (!tId) throw new Error('Team not found');
      const sessResp = await teamSessionService.getTeamSessions(tId);
      setSessions(sessResp.data || []);
    } catch (e) {
      setError(e.message || 'Error loading sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line
  }, []);

  // Handle add/edit form submission
  const handleFormSubmit = async (values, isEdit) => {
    try {
      if (isEdit) {
        await teamSessionService.updateTeamSession(editingSession.id, values);
      } else {
        await teamSessionService.createTeamSession({ ...values, team_id: teamId });
      }
      setShowForm(false);
      setEditingSession(null);
      fetchSessions();
    } catch (e) {
      if (e?.response?.data?.error) {
        alert(e.response.data.error);
      } else {
        alert('Failed to save session');
      }
    }
  };

  return (
    <>
      {detailsSession && (
        <TeamSessionDetails session={detailsSession} onClose={() => setDetailsSession(null)} />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Team Sessions</h1>
          {user?.role === 'ROLE_TEAM_MANAGER' && (
            <button
              className="bg-[#85a831] text-white px-4 py-2 rounded shadow hover:bg-[#729222] transition-all font-semibold flex items-center gap-2"
              onClick={() => setShowForm(true)}
            >
              <span>+ Add Session</span>
            </button>
          )}
        </div>
        {/* Filtres frontend - design harmonisé suggestion list */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by title..."
            value={filterTitle}
            onChange={e => setFilterTitle(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-1/4"
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-1/4"
          >
            <option value="">All Types</option>
            <option value="quiz">Quiz</option>
            <option value="programming">Programming</option>
          </select>
          <input
            type="number"
            min="1"
            placeholder="Duration (min)"
            value={filterDuration}
            onChange={e => setFilterDuration(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-1/4"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-1/4"
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="inprogress">In Progress</option>
            <option value="finished">Finished</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
        <div className="bg-white rounded shadow p-4">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#85a831]" />
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-8">{error}</div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <span className="text-5xl mb-3 opacity-60"><FaRegClock /></span>
              <span className="text-lg font-semibold">No sessions available</span>
              <span className="text-sm mt-1">There are currently no sessions for your team. When a manager adds a session, it will appear here.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Start</th>
                    <th className="px-4 py-2 text-left">Duration</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = sessions.filter(session =>
                      (!filterTitle || session.title.toLowerCase().includes(filterTitle.toLowerCase())) &&
                      (!filterType || session.type === filterType) &&
                      (!filterDuration || String(session.durationMinutes) === String(filterDuration)) &&
                      (!filterStatus || session.status === filterStatus)
                    ).sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime));
                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="6">
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                              <span className="text-5xl mb-3 opacity-60"><FaRegClock /></span>
                              <span className="text-lg font-semibold">No sessions match your filters</span>
                              <span className="text-sm mt-1">Try adjusting your search or filter criteria.</span>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    return filtered.map((session) => (
                      <tr
                        key={session.id}
                        className="hover:bg-gray-50 transition-all cursor-pointer"
                        onClick={(e) => {
                          // Prevent opening details when clicking on action buttons
                          if (e.target.closest('button')) return;
                          setDetailsSession(session);
                        }}
                      >
                        <td className="px-4 py-2 font-semibold">{session.title}</td>
                        <td className="px-4 py-2 capitalize">{session.type}</td>
                        <td className="px-4 py-2">{dayjs(session.startDateTime).format('DD/MM/YYYY, HH:mm:ss')}</td>
                        <td className="px-4 py-2">{session.durationMinutes} min</td>
                        <td className="px-4 py-2">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusColors[session.status] || 'bg-gray-100 text-gray-700'}`}>{statusLabelMap[session.status] || session.status}</span>
                        </td>
                        <td className="px-4 py-2 flex gap-2">

                            {(session.status === 'inprogress' || session.status === 'finished') && (
                            <button
                              className="flex items-center justify-center rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 shadow-sm transition p-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                              title="Voir le classement"
                              onClick={e => {
                                e.stopPropagation();
                                navigate(`/team-session/${session.id}/score`);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                                        
                              <span className="font-semibold text-xs">Score</span>
                            </button>
                          )}
                
                          {/* Actions: edit/cancel only if scheduled (manager) */}
                          {session.status === 'scheduled' && user?.role === 'ROLE_TEAM_MANAGER' && (
                            <>
                              <button
                                className="flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm transition p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                aria-label="Edit session"
                                title="Edit"
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditingSession(session);
                                  setShowForm(true);
                                }}
                              >
                                <span className="sr-only md:not-sr-only md:hidden">Edit</span>
                                <MdEdit className="w-5 h-5" />
                              </button>
                              <button
                                className="flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-sm transition p-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                                aria-label="Cancel session"
                                title="Cancel"
                                onClick={async e => {
                                  e.stopPropagation();
                                  if (window.confirm('Are you sure you want to cancel this session?')) {
                                    try {
                                      await teamSessionService.cancelTeamSession(session.id);
                                      fetchSessions();
                                    } catch (e) {
                                      if (e?.response?.data?.error) {
                                        alert(e.response.data.error);
                                      } else {
                                        alert('Failed to cancel session');
                                      }
                                    }
                                  }
                                }}
                              >
                                <span className="sr-only md:not-sr-only md:hidden">Cancel</span>
                                <MdCancel className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {/* Participer pour user normal si session inprogress et user n'a pas terminé */}
                          {user?.role === 'ROLE_USER' && session.status === 'inprogress' && (() => {
                            let canParticipate = false;
                            let participateUrl = `/team-session-participation/${session.id}`;
                            if (session.type === 'quiz' && session.quizzes?.length > 0) {
                              const quiz = session.quizzes[0];
                              canParticipate = !quiz.finished_users?.some(u => u.id === user.id);
                            } else if (session.type === 'programming' && session.prog_problems?.length > 0) {
                              const prog = session.prog_problems[0];
                              canParticipate = !prog.finished_users?.some(u => u.id === user.id);
                            }
                            return canParticipate ? (
                              <button
                                className="flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 shadow-sm transition p-2 focus:outline-none focus:ring-2 focus:ring-green-300"
                                title="Participate"
                                onClick={e => {
                                  e.stopPropagation();
                                  navigate(participateUrl);
                                }}
                              >
                                <span className="sr-only md:not-sr-only md:hidden">Participer</span>
                                <MdPlayArrow className="w-5 h-5" />
                              </button>
                            ) : null;
                          })()}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <TeamSessionForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingSession(null);
          }}
          onCreated={() => {
            setShowForm(false);
            setEditingSession(null);
            fetchSessions();
          }}
          teamId={teamId}
          session={editingSession}
          onSubmit={handleFormSubmit}
        />
      </div>
    </>
  );
}