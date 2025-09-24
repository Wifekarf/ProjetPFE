import { StrictMode } from 'react'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TeamSessionScore from './TeamSession/TeamSessionScore';
import Home from './User/Home.jsx';
import AdminHome from './Admin/Home.jsx';
import Welcome from './Welcome.jsx';
import LoginPage from './Auth/Login.jsx';
import RegisterPage from './Auth/Register.jsx';
import Profile from './Profile/Profile.jsx';
import Language from './Language/Index.jsx';
import Quiz from './Quiz/Quiz.jsx';
import Questions from './Question/Questions.jsx';
import Affectation from './Quiz/Affectation.jsx';
import AffUser from './Quiz/AffUser.jsx';
import Index from './Historique/Index.jsx';
import PlayQuiz from './User/PlayQuiz/PlayQuiz.jsx';
import JoinPage from './CodeGeust/JoinPage.jsx';
import QuizGuest from './CodeGeust/QuizGuest.jsx';
import TeamChatContainer from './TeamChatContainer';
import PlayProgrammingProblem from './User/PlayProgrammingProblem.jsx';

// Import ProgProblem components
import ProgProblem from './ProgProblem/ProgProblem.jsx';
import TaskManagement from './ProgProblem/Task.jsx'; // New Task management component
import TaskToProblem from './ProgProblem/TaskToProblem.jsx'; // New Task-to-Problem assignment component
import ProblemToUser from './ProgProblem/ProblemToUser.jsx'; // New Problem-to-User assignment component
import JoinProblem from './ProgProblem/JoinProblem.jsx';
import SolveProblem from './ProgProblem/SolveProblem.jsx';
import TeamsManagement from './TeamManagement/TeamManagement.jsx';
import TeamManagerDashboard from './TeamManagement/TeamManagementDashboard.jsx';
import ReclamationSuggestionPage from './pages/ReclamationSuggestionPage.jsx';
import ReclamationSuggestionAdminPage from './pages/ReclamationSuggestionAdminPage.jsx';
import RHManagerManagement from './Admin/RHManagerManagement.jsx';
import ManageUsers from './Admin/ManageUsers.jsx';
import TeamScores from './pages/TeamScores.jsx';
import TeamSessionsPage from './pages/TeamSessionsPage.jsx';
import AuthLayout from './Layout/AuthLayout';
import ForgotPassword from './Auth/ForgotPassword.jsx';
import ResetPassword from './Auth/ResetPassword.jsx';
import QuizComplete from './User/QuizComplete.jsx';
import GuestHistory from './pages/GuestHistory.jsx';
import ErrorBoundary from './ErrorBoundary';
// Import MixedTest components
import MixedTest from './Admin/MixedTest.jsx';
import CVTestGenerator from './Admin/CVTestGenerator.jsx';
import PlayMixedTest from './User/PlayMixedTest.jsx';
import MixedTestResults from './Admin/MixedTestResults.jsx';
import ChatbotStats from './Admin/ChatbotStats.jsx';

// Team session participation
import TeamSessionParticipation from './TeamSession/TeamSessionParticipation.jsx';
import AssignmentsAndSessions from './User/AssignmentsAndSessions.jsx';
import { useParams, useLocation } from 'react-router-dom';
import { teamSessionService } from './services/teamSessionService';

import useTeamChatWebSocket from './hooks/useTeamChatWebSocket';
import { messangerService } from './services/messangerService';
import ToastNotification from './ToastNotification';
import { WebSocketProvider } from './context/WebSocketContext';

function MainApp() {
  // --- RANKING STATE ---
  const [rankingData, setRankingData] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState(null);
  // Pour détecter sessionId dans l'URL
  const location = useLocation();

  // --- Fetch ranking quand sessionId change ---
  useEffect(() => {
    // Extraire sessionId de l'URL si présent
    const match = location.pathname.match(/team-session-participation\/(\w+)/);
    const sessionId = match ? match[1] : null;
    if (!sessionId) return;
    setRankingLoading(true);
    setRankingError(null);
    teamSessionService.getSessionScoreboard(sessionId)
      .then(resp => setRankingData(Array.isArray(resp.data) ? resp.data : resp.data || []))
      .catch(() => setRankingError('Could not load ranking.'))
      .finally(() => setRankingLoading(false));
  }, [location.pathname]);
  const [toast, setToast] = useState({ visible: false, teamName: '', username: '', content: '' });
  const toastTimeout = useRef(null);
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [connectedTeam, setConnectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Récupérer user au mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
  }, []);

  // Récupérer teams quand user est dispo
  useEffect(() => {
    if (!user?.id){setLoading(false); return;}
    messangerService.getUserTeams(user.id)
      .then(res => {
        setTeams(res.data);
        if (res.data && res.data.length > 0) {
          const firstTeamId =  res.data[0].id;
          setConnectedTeam(firstTeamId);
          setSelectedTeam(res.data[0]);
        }
      })
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, [user]);
  // Callback de réception WebSocket
  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'chat_message') {
      // Récupérer teamName depuis le message ou via teams[]
      let teamName = msg.data.teamName;
      if (!teamName && msg.data.teamId && teams && teams.length) {
        const team = teams.find(t => t.id === msg.data.teamId);
        if (team) teamName = team.name;
      }
      setToast({
        visible: true,
        teamName: teamName || 'Team',
        username: msg.data.username || 'User',
        content: msg.data.content || ''
      });
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
      // N'ajoute que si ce message appartient à une team suivie
      // Ajoute le message seulement si il n'y a pas de team sélectionnée, ou si le message appartient à la team sélectionnée
      console.log("selectedTeam", selectedTeam);
      console.log("msg.data.teamId", msg.data.teamId);
      setMessages(prev => [...prev, msg.data]);
    } else if (msg.type === 'update_score') {
      // Refetch scoreboard and update rankingData
      console.log("update score send")
      const sessionId = msg.data && msg.data.teamSessionId;
      if (sessionId) {
        setRankingLoading(true);
        setRankingError(null);
        teamSessionService.getSessionScoreboard(sessionId)
          .then(resp => setRankingData(Array.isArray(resp.data) ? resp.data : resp.data || []))
          .catch(() => setRankingError('Could not load ranking.'))
          .finally(() => setRankingLoading(false));
      }
    }
  }, []);

  // Always pass connectedTeam as an array if you want multi-team support
  // Example: connectedTeam = [{id: 1, ...}, {id: 2, ...}] or a single object
  // The hook will handle both cases and generate the correct teamId param
  const { sendMessage } = useTeamChatWebSocket({ user, selectedTeam: connectedTeam, onMessage: handleWsMessage });

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
      <div className="chat-loader-spinner" style={{ marginBottom: 16 }}></div>
      <div style={{ fontSize: '1.1rem', color: '#555' }}>Loading chat...</div>
      <style>{`
        .chat-loader-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin-chat-loader 1s linear infinite;
        }
        @keyframes spin-chat-loader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return (
    <WebSocketProvider sendMessage={sendMessage}>
      {/* Error boundary pour sécuriser le toast */}
      <ErrorBoundary>
        <ToastNotification
          visible={toast.visible}
          teamName={toast.teamName}
          username={toast.username}
          content={toast.content}
          onClose={() => setToast(t => ({ ...t, visible: false }))}
        />
      </ErrorBoundary>
      <Routes>
        <Route path="/" element={<Welcome />}/>
        <Route path="Home" element={<Home />}/>
        <Route path="play" element={<PlayQuiz />}/>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="profile" element={<Profile />}/>
        <Route path="join" element={<JoinPage />}/>
        <Route path="quizguest/:code" element={<QuizGuest />} />
        <Route path="/quizguest" element={<QuizGuest />} />
        <Route path="/quizzes/:id/questions" element={<Questions />} />
        <Route path="/admin/quizzes/:quizId/questions" element={<Questions />} />
        <Route path="/team-sessions" element={<TeamSessionsPage />} />
        <Route path="/assignments-sessions" element={<AuthLayout><AssignmentsAndSessions /></AuthLayout>} />
        <Route path="historique" element={<Index />} />
        <Route path="/admin/ideas" element={<ReclamationSuggestionAdminPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/quiz-complete"  element={<QuizComplete />} />
        

        {/* Team Manager routes */}
        <Route path="team-manager" element={<TeamManagerDashboard />} />
        <Route path="reclamations-suggestions" element={<ReclamationSuggestionPage />} />

        {/* Admin Group Routes */}
        <Route path="admin">
          <Route index element={<AdminHome />} />
          <Route path="languages" element={<Language />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="quiz/questions" element={<Affectation />} />
          <Route path="quiz/users" element={<AffUser />} />
          <Route path="questions" element={<Questions />} />
          <Route path="historique" element={<Index />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="teams" element={<TeamsManagement />} />
          <Route path="guest-history" element={<GuestHistory />}/>
     
          
          
          {/* Programming Problem Routes */}
          <Route path="progproblems" element={<ProgProblem />} />
          <Route path="tasks" element={<TaskManagement />} />
          <Route path="progproblems/tasks" element={<TaskToProblem />} />
          <Route path="progproblems/users" element={<ProblemToUser />} />
          <Route path="progproblems/assign" element={<ProblemToUser />} />
          <Route path="progproblems/history" element={<Index />} />
          
          {/* Mixed Test Routes */}
          <Route path="mixed-tests" element={<MixedTest />} />
          <Route path="cv-test-generator" element={<CVTestGenerator />} />
          <Route path="mixed-test-results" element={<MixedTestResults />} />
          <Route path="chatbot-stats" element={<ChatbotStats />} />
          
          {/* RH Management Routes */}
          <Route path="rh-managers" element={<RHManagerManagement />} />
        </Route>
        
        {/* Programming Problem User Routes */}
        <Route path="programming-problems" element={<PlayProgrammingProblem />} />
        <Route path="solve-problem/:code" element={<SolveProblem />} />
        <Route path="join-coding" element={<JoinProblem />} />
        <Route path="team-session-participation/:sessionId" element={
  <TeamSessionParticipation
    rankingData={rankingData}
    rankingLoading={rankingLoading}
    rankingError={rankingError}
  />
} />
        
        {/* Mixed Test User Routes */}
        <Route path="my-mixed-tests" element={<PlayMixedTest />} />
        
        {/* RH Manager routes */}
        <Route path="rh">
          <Route path="teams" element={<TeamsManagement />} />
        </Route>
        <Route path="team-scores" element={<TeamScores />} />
        <Route path="team-session/:id/score" element={<TeamSessionScore />} />
        <Route path="team-chat" element={<AuthLayout><TeamChatContainer selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} user={user} teams={teams} connectedTeam={connectedTeam} sendMessage={sendMessage} loadingTeams={loading} messages={messages} setMessages={setMessages} /></AuthLayout>} />

        

      </Routes>
    </WebSocketProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  </StrictMode>,
)
