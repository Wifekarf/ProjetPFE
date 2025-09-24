import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import AuthLayout from "../Layout/AuthLayout";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaUserCheck, FaCode, FaLaptopCode, FaCodeBranch } from "react-icons/fa";
import AdminNavbar from "./AdminNavbar";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingAffectations, setPendingAffectations] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  // Calculate how many slides we need (4 cards per slide)
  const cardsPerSlide = 4;
  const totalSlides = Math.ceil(pendingAffectations.length / cardsPerSlide);

  useEffect(() => {
    if (!localStorage.getItem("user")) {
      navigate("/login");
    } else {
      fetchStats();
      fetchPendingAffectations();
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
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchPendingAffectations = async () => {
    try {
      const response = await api.get("/actions/get-all-affected-users");
      const pending = response.data.affectations;
      setPendingAffectations(pending);
    } catch (error) {
      console.error("Error fetching pending affectations:", error);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => 
      prev === totalSlides - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => 
      prev === 0 ? totalSlides - 1 : prev - 1
    );
  };

  // Get the current cards to display
  const getCurrentCards = () => {
    const startIndex = currentSlide * cardsPerSlide;
    const endIndex = startIndex + cardsPerSlide;
    return pendingAffectations.slice(startIndex, endIndex);
  };

  // Add programming problems to the stat cards
  const statCards = [
    {
      title: "Languages",
      value: stats?.langages_count,
      icon: "🌐",
      color: "bg-gradient-to-br from-purple-100 to-blue-100",
      textColor: "text-purple-600"
    },
    {
      title: "Users",
      value: stats?.users_count,
      icon: "👥",
      color: "bg-gradient-to-br from-green-100 to-teal-100",
      textColor: "text-green-600"
    },
    {
      title: "Questions",
      value: stats?.questions_count,
      icon: "❓",
      color: "bg-gradient-to-br from-amber-100 to-orange-100",
      textColor: "text-amber-600"
    },
    {
      title: "Quizzes",
      value: stats?.quizzes_count,
      icon: "📝",
      color: "bg-gradient-to-br from-blue-100 to-indigo-100",
      textColor: "text-blue-600"
    },
    {
      title: "Quiz Attempts",
      value: stats?.user_quiz_attempts_count,
      icon: "📊",
      color: "bg-gradient-to-br from-red-100 to-pink-100",
      textColor: "text-red-600"
    },
    {
      title: "Assigned Quizzes",
      value: stats?.assigned_quizzes_count,
      icon: "📌",
      color: "bg-gradient-to-br from-emerald-100 to-cyan-100",
      textColor: "text-emerald-600"
    },
  ];

  return (
    <AuthLayout>
      <div className="min-h-screen bg-gradient-to-r from-[#f7f7f7] via-[#ffffff] to-[#f5f5f5] p-6 pt-28">
        {/* Stats Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
            {statCards.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${stat.color} rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium opacity-80">{stat.title}</p>
                      <p className={`text-3xl font-bold mt-2 ${stat.textColor}`}>
                        {stat.value}
                      </p>
                    </div>
                    <motion.div
                      className="text-4xl opacity-80"
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                        transition: { duration: 3, repeat: Infinity }
                      }}
                    >
                      {stat.icon}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Navigation sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <AdminNavbar />
        </motion.div>

        {/* Pending Affectations Slider */}
        {pendingAffectations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl shadow-xl overflow-hidden mb-8 relative"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Pending Quiz Assignments ({pendingAffectations.length})
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={prevSlide}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    disabled={totalSlides <= 1}
                  >
                    <FiChevronLeft className="text-gray-600" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    disabled={totalSlides <= 1}
                  >
                    <FiChevronRight className="text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="relative overflow-hidden">
                <div className="overflow-x-auto pb-4">
                  <div className="flex space-x-4" style={{ 
                    transform: `translateX(-${currentSlide * 100}%)`,
                    transition: 'transform 0.5s ease'
                  }}>
                    {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                      <div 
                        key={slideIndex} 
                        className="flex-none w-full"
                        style={{ minWidth: '100%' }}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {pendingAffectations
                            .slice(slideIndex * cardsPerSlide, (slideIndex + 1) * cardsPerSlide)
                            .map((affectation) => (
                              <motion.div
                                key={affectation.affectationId}
                                whileHover={{ y: -5 }}
                                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 h-full border border-indigo-100"
                              >
                                {/* Card content remains the same */}
                                <div className="flex flex-col h-full">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <h3 className="text-lg font-bold text-indigo-800 mb-1">
                                        {affectation.user.username}
                                      </h3>
                                      <p className="text-sm text-indigo-600">
                                        {affectation.quiz.name}
                                      </p>
                                    </div>
                                    <div className="bg-indigo-100 p-2 rounded-full">
                                      <FaUserCheck className="text-indigo-600" />
                                    </div>
                                  </div>

                                  <div className="mt-2">
                                    <div className="flex justify-between text-sm text-indigo-700 mb-2">
                                      <span>Questions:</span>
                                      <span className="font-medium">{affectation.quiz.totalQuestions}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-indigo-700 mb-2">
                                      <span>Points:</span>
                                      <span className="font-medium">{affectation.quiz.totalPoints}</span>
                                    </div>
                                  </div>

                                  <div className="mt-auto pt-3">
                                    <div className="flex justify-between items-center">
                                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        affectation.status === "pending" 
                                          ? "bg-yellow-100 text-yellow-800" 
                                          : "bg-green-100 text-green-800"
                                      }`}>
                                        {affectation.status}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(affectation.dateAffectation).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {totalSlides > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {Array.from({ length: totalSlides }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentSlide ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Recent Activity Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-xl shadow-xl overflow-hidden"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { action: "New user registered", time: "2 minutes ago", icon: "👤", color: "bg-blue-100 text-blue-600" },
                { action: "Quiz completed by user", time: "15 minutes ago", icon: "✅", color: "bg-green-100 text-green-600" },
                { action: "New question added", time: "1 hour ago", icon: "➕", color: "bg-purple-100 text-purple-600" },
                { action: "System updated", time: "3 hours ago", icon: "🔄", color: "bg-amber-100 text-amber-600" }
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                  whileHover={{ x: 5 }}
                  className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  <motion.div 
                    className={`flex-shrink-0 ${activity.color} rounded-full w-12 h-12 flex items-center justify-center mr-4 text-2xl`}
                    animate={{
                      rotate: [0, 10, -10, 0],
                      transition: { duration: 2, repeat: Infinity }
                    }}
                  >
                    {activity.icon}
                  </motion.div>
                  <div className="flex-grow">
                    <p className="font-medium text-gray-800">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AuthLayout>
  );
}