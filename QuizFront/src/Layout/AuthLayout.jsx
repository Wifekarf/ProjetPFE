import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FaUserShield } from "react-icons/fa";
import useAssignmentSessionCount from "../hooks/useAssignmentSessionCount";

function AssignmentSessionBadge() {
  const { count, loading } = useAssignmentSessionCount();
  if (loading) return (
    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-[#85a831] bg-[#eaf5d7] rounded-full animate-pulse">...</span>
  );
  if (!count) return null;
  return (
    <motion.span
    className="ml-2 inline-flex items-center justify-center 
      min-w-[20px] h-[20px] px-1 text-xs font-semibold 
      text-white bg-gradient-to-r from-[#85a831] to-[#6f8e28] 
      rounded-full shadow-sm border border-white"
    animate={{ scale: [1, 1.15, 1] }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    {count}
  </motion.span>
  
  );
}

export default function AuthLayout({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const [isQuizMenuOpen, setIsQuizMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex min-w-screen min-h-screen transition-colors duration-300 bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Sidebar */}
      <nav className="fixed top-0 left-0 z-50 flex h-full w-64 flex-col shadow-lg py-6 px-4 overflow-y-auto transition-colors duration-300 bg-white border-r border-gray-200">
        {/* Logo */}
        <motion.div
          className="mb-8 flex cursor-pointer items-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(user?.role === "ROLE_ADMIN" ? "/admin" : "/home")}
        >
          <img src="/logo.png" alt="Wevioo Quiz Logo" className="mr-2 h-10 w-10 object-contain" />
          <span className="text-2xl font-serif font-bold tracking-tight transition-colors duration-300 text-[#85a831]">
            Wevioo Quiz
          </span>
        </motion.div>

        {/* Profile */}
        <NavLink
          to={user?.role === "ROLE_ADMIN" ? "/admin" : "/home"}
          className={({ isActive }) =>
            `mb-6 flex items-center rounded-lg px-3 py-2 transition-all duration-200 ${
              isActive
                ? "bg-[#85a831]/10 text-[#85a831] font-semibold border border-[#85a831]/30"
                : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium border border-transparent hover:border-gray-200"
            }`
          }
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full font-bold bg-[#85a831]/20 text-[#85a831]">
            {user?.username?.charAt(0).toUpperCase()}
          </span>
          <span className="ml-2">{user?.username}</span>
        </NavLink>

        {/* Menu */}
        <div className="flex-1 space-y-2">
          {(user?.role === "ROLE_USER" || user?.role === "ROLE_TEAM_MANAGER") && (
            <NavLink
              to="/play"
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 transition-all duration-200 border ${
                  isActive
                    ? "bg-[#85a831]/10 text-[#85a831] font-semibold border-[#85a831]/30"
                    : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium border-transparent hover:border-gray-200"
                }`
              }
            >
              🎮 Play
            </NavLink>
          )}

          {(user?.role === "ROLE_TEAM_MANAGER" || user?.role === "ROLE_USER") && (
            <NavLink
              to="/team-manager"
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 transition-all duration-200 border ${
                  isActive
                    ? "bg-[#85a831]/10 text-[#85a831] font-semibold border-[#85a831]/30"
                    : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium border-transparent hover:border-gray-200"
                }`
              }
            >
              👥 My Team
            </NavLink>
          )}

          {user?.role === "ROLE_TEAM_MANAGER" && (
            <NavLink
              to="/reclamations-suggestions"
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 transition-all duration-200 border ${
                  isActive
                    ? "bg-[#85a831]/10 text-[#85a831] font-semibold border-[#85a831]/30"
                    : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium border-transparent hover:border-gray-200"
                }`
              }
            >
              💡 Idea Box
            </NavLink>
          )}

          {(user?.role === "ROLE_USER" || user?.role === "ROLE_TEAM_MANAGER") && (
            <>
              <NavLink
                to="/programming-problems"
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 transition-all duration-200 border ${
                    isActive
                      ? "bg-[#85a831]/10 text-[#85a831] font-semibold border-[#85a831]/30"
                      : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium border-transparent hover:border-gray-200"
                  }`
                }
              >
                💻 Code Challenges
              </NavLink>
              {/** Assignments & Team Sessions NavLink with badge */}
<NavLink
  to="/assignments-sessions"
  className={({ isActive }) =>
    `block rounded-lg px-3 py-2 transition-all duration-200 border relative ${
      isActive
        ? "bg-[#85a831]/10 text-[#85a831] font-semibold border-[#85a831]/30"
        : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium border-transparent hover:border-gray-200"
    }`
  }
>
  <span className="flex items-center">
    📋 Assignments & Team Sessions
    {/* Badge */}
    <AssignmentSessionBadge />
  </span>
</NavLink>
            </>
          )}

          {(user?.role === "ROLE_USER" || user?.role === "ROLE_TEAM_MANAGER") && (
            <NavLink
              to="/my-mixed-tests"
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 transition-all duration-200 border ${
                  isActive
                    ? "bg-[#85a831]/10 text-[#85a831] font-semibold border-[#85a831]/30"
                    : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium border-transparent hover:border-gray-200"
                }`
              }
            >
              📄 CV-Based Tests
            </NavLink>
          )}

           {(user?.role === "ROLE_TEAM_MANAGER" || user?.role === "ROLE_USER") && (
            <>
              {user?.role === "ROLE_TEAM_MANAGER" && (
                <NavLink
                  to="/team-scores"
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 transition-all duration-200 border ${
                      isActive
                        ? "bg-[#85a831]/10 text-[#85a831] font-semibold border-[#85a831]/30"
                        : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium border-transparent hover:border-gray-200"
                    }`
                  }
                >
                  🏆 Team Scores
                </NavLink>
              )}
              <NavLink
                to="/team-sessions"
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 transition-all duration-200 border ${
                    isActive
                      ? "bg-[#85a831]/10 text-[#85a831] font-semibold border-[#85a831]/30"
                      : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium border-transparent hover:border-gray-200"
                  }`
                }
              >
                🎯 Team Sessions
              </NavLink>
              <NavLink
                to="/team-chat"
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 transition-all duration-200 border ${
                    isActive
                      ? "bg-[#85a831]/10 text-[#85a831] font-semibold border-[#85a831]/30"
                      : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium border-transparent hover:border-gray-200"
                  }`
                }
              >
                💬 Team Chat
              </NavLink>
            </>
          )}

          {/* Admin Menu */}
          {user?.role === "ROLE_ADMIN" && (
            <div>
              <button
                onClick={() => setIsQuizMenuOpen(!isQuizMenuOpen)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 transition-all duration-200 border text-gray-600 hover:bg-gray-100 hover:text-[#85a831] border-transparent hover:border-gray-200"
              >
                <span className="flex items-center">
                  <span className="mr-2">⚙️</span>
                  Management
                </span>
                <svg
                  className={`h-4 w-4 transform transition-transform duration-200 ${
                    isQuizMenuOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isQuizMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 ml-4 flex flex-col space-y-1"
                >
                  {[
                    { to: "/admin/quiz", text: "📝 Quizzes" },
                    { to: "/admin/quiz/questions", text: "❓ Affectation Questions" },
                    { to: "/admin/quiz/users", text: "👤 Affectation Users" },
                    { to: "/admin/languages", text: "🌐 Languages" },
                    { to: "/admin/questions", text: "❔ Questions" },
                    { divider: true },
                    { to: "/admin/progproblems", text: "🧩 Programming Problems" },
                    { to: "/admin/tasks", text: "✅ Tasks" },
                    { to: "/admin/progproblems/users", text: "📋 Problem Assignments" },
                    { divider: true },
                    { to: "/admin/mixed-tests", text: "📊 CV-Based Tests" },
                    { to: "/admin/mixed-test-results", text: "📈 Test Results" },
                    { to: "/admin/cv-test-generator", text: "🤖 CV Test Generator" },
                    { to: "/admin/chatbot-stats", text: "🤖 Chatbot Stats" },
                    { to: "/admin/ideas", text: "💭 Idea box" },
                    { divider: true },
                    { to: "/admin/teams", text: "👥 Manage Teams" },
                    { to: "/admin/users", text: "👤 Manage Users" },
                    { to: "/admin/guest-history", text: "👻 Guest History" },
                  ].map((item, i) =>
                    item.divider ? (
                      <div key={i} className="border-t my-1 border-gray-200" />
                    ) : (
                      <NavLink
                        key={i}
                        to={item.to}
                        className={({ isActive }) =>
                          `block rounded-lg px-3 py-2 transition-all duration-200 border ${
                            isActive
                              ? "bg-[#85a831]/10 text-[#85a831] font-semibold border-[#85a831]/30"
                              : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium border-transparent hover:border-gray-200"
                          }`
                        }
                        onClick={() => setIsQuizMenuOpen(false)}
                      >
                        {item.text}
                      </NavLink>
                    )
                  )}
                </motion.div>
              )}
            </div>
          )}

          <NavLink
            to={user?.role === "ROLE_ADMIN" ? "/admin/historique" : "/historique"}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 transition-all duration-200 border ${
                isActive
                  ? "bg-[#85a831]/10 text-[#85a831] font-semibold border-[#85a831]/30"
                  : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium border-transparent hover:border-gray-200"
              }`
            }
          >
            📚 Historique
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 transition-all duration-200 border ${
                isActive
                  ? "bg-[#85a831]/10 text-[#85a831] font-semibold border-[#85a831]/30"
                  : "text-gray-600 hover:bg-gray-100 hover:text-[#85a831] font-medium border-transparent hover:border-gray-200"
              }`
            }
          >
            👤 Profile
          </NavLink>
            
          {/* Logout Button */}
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full text-left rounded-lg px-3 py-2 transition-all duration-200 font-medium border text-red-600 hover:bg-red-50 hover:text-red-700 border-transparent hover:border-red-200"
          >
            🚪 Logout
          </motion.button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 w-full max-w-full overflow-x-auto transition-colors duration-300 bg-white text-gray-900">
        <div className="min-h-full transition-colors duration-300 text-gray-900">
          {children}
        </div>
      </main>
    </div>
  );
}