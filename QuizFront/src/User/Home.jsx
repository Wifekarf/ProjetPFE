import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import AuthLayout from "../Layout/AuthLayout";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("user")) {
      navigate("/login");
    } else {
      fetchStats();
    }
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.post("/actions/stats", {
        role: user.role,
        id: user.id,
      });
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Languages",
      value: stats?.langages_count,
      icon: "🌐",
      color: "bg-gradient-to-br from-blue-50 to-blue-100"
    },
    {
      title: "Assigned Quizzes",
      value: stats?.assigned_quizzes_count,
      icon: "📌",
      color: "bg-gradient-to-br from-purple-50 to-purple-100"
    },
    {
      title: "Completed Quizzes",
      value: stats?.completed_quizzes_count,
      icon: "✅",
      color: "bg-gradient-to-br from-green-50 to-green-100"
    },
    {
      title: "Pending Quizzes",
      value: stats?.pending_quizzes_count,
      icon: "⏳",
      color: "bg-gradient-to-br from-yellow-50 to-yellow-100"
    },
    {
      title: "Total Attempts",
      value: stats?.total_quiz_attempts,
      icon: "🔁",
      color: "bg-gradient-to-br from-red-50 to-red-100"
    },
    {
      title: "Average Score",
      value: stats?.average_score,
      icon: "📊",
      color: "bg-gradient-to-br from-indigo-50 to-indigo-100"
    },
    {
      title: "Best Score",
      value: stats?.best_score,
      icon: "🏆",
      color: "bg-gradient-to-br from-amber-50 to-amber-100"
    },
    {
      title: "Completed This Month",
      value: stats?.quizzes_completed_this_month,
      icon: "📅",
      color: "bg-gradient-to-br from-emerald-50 to-emerald-100"
    },
    // Programming Problem Stats
    {
      title: "Assigned Problems",
      value: stats?.assigned_prog_problems_count || 0,
      icon: "💻",
      color: "bg-gradient-to-br from-indigo-50 to-violet-100"
    },
    {
      title: "Completed Problems",
      value: stats?.completed_prog_problems_count || 0,
      icon: "✅",
      color: "bg-gradient-to-br from-teal-50 to-emerald-100"
    }
  ];

  return (
    <AuthLayout>
      <div className="min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] p-6 pt-28">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Statistics</h1>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
            >
              {statCards.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className={`${stat.color} rounded-xl shadow-lg overflow-hidden text-gray-800 border border-gray-100`}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium opacity-80">{stat.title}</p>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                      </div>
                      <motion.div
                        className="text-4xl"
                        animate={{
                          scale: [1, 1.1, 1],
                          transition: { duration: 2, repeat: Infinity }
                        }}
                      >
                        {stat.icon}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Last Attempt Section */}
            {stats?.last_attempt && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-white rounded-xl shadow-lg p-6 mb-8"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Last Quiz Attempt</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Quiz Details</h3>
                    <p className="text-gray-700"><span className="font-medium">Quiz Name:</span> {stats.last_attempt.quiz.nom}</p>
                    <p className="text-gray-700"><span className="font-medium">Score:</span> {stats.last_attempt.scorePoints} points</p>
                    <p className="text-gray-700"><span className="font-medium">Correct Answers:</span> {stats.last_attempt.correctAnswers}/{stats.last_attempt.questions?.length}</p>
                    <p className="text-gray-700"><span className="font-medium">Date:</span> {new Date(stats.last_attempt.dateCreation).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Question Details</h3>
                    <div className="space-y-4 max-h-70 overflow-y-auto pr-2">                      {stats.last_attempt.questions?.map((question, idx) => {
                        const userAnswer = stats.last_attempt.userAnswer?.find(a =>
                          a.question === question.question
                        );
                        const isCorrect = userAnswer?.reponse === question.correctAnswer;

                        return (
                          <div key={idx} className={`p-4 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                            <p className="font-medium text-sm mb-2">Q{idx + 1}: {question.question}</p>

                            <div className="mb-2">
                              <p className="text-sm font-medium">Your answer:</p>
                              <p className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {userAnswer?.reponse || 'No answer'}
                                {isCorrect ? (
                                  <span className="ml-2 text-green-500">✓ Correct</span>
                                ) : (
                                  <span className="ml-2 text-red-500">✗ Incorrect</span>
                                )}
                              </p>
                            </div>

                            <div className="mb-2">
                              <p className="text-sm font-medium">Correct answer:</p>
                              <p className="text-sm text-gray-700">{question.correctAnswer}</p>
                            </div>

                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Time taken: {userAnswer?.time_user_quest || 0}s</span>
                              <span>Points: {question.points} pts</span>
                            </div>

                            {question.options && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-500 mb-1">Options:</p>
                                <ul className="text-xs space-y-1">
                                  {question.options.map((option, optIdx) => (
                                    <li
                                      key={optIdx}
                                      className={`pl-2 ${option === question.correctAnswer ? 'text-green-600 font-medium' : ''}`}
                                    >
                                      {option}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Programming Problems Card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-white rounded-xl shadow-lg p-6 mb-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Programming Challenges</h2>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {stats?.assigned_prog_problems_count || 0} Assigned
                </span>
              </div>
              
              <p className="text-gray-600 mb-6">
                Solve programming challenges, write code, and improve your coding skills.
              </p>
              
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/programming-problems')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  View My Challenges
                </motion.button>
              </div>
            </motion.div>

            {/* Performance Summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Performance Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Completion Rate</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats && stats.assigned_quizzes_count > 0
                      ? Math.round((stats.completed_quizzes_count / stats.assigned_quizzes_count) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-blue-500">
                    {stats?.completed_quizzes_count} of {stats?.assigned_quizzes_count} quizzes completed
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Average Performance</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {stats?.average_score || 0} pts
                  </p>
                  <p className="text-sm text-green-500">
                    Across {stats?.total_quiz_attempts} attempts
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-amber-800 mb-2">Best Performance</h3>
                  <p className="text-3xl font-bold text-amber-600">
                    {stats?.best_score || 0} pts
                  </p>
                  <p className="text-sm text-amber-500">
                    Your highest score so far
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}