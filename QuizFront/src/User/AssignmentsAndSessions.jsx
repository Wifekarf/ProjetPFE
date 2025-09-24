import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { FaClipboardList, FaCode, FaUsers, FaPlay, FaClock, FaTasks } from "react-icons/fa";

export default function AssignmentsAndSessions() {
  const [loading, setLoading] = useState(true);
  const [quizAssignments, setQuizAssignments] = useState([]);
  const [progAssignments, setProgAssignments] = useState([]);
  const [teamSession, setTeamSession] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quizRes, progRes, sessionRes] = await Promise.all([
        api.get("/api/user/quiz-assignments"),
        api.get("/api/user/prog-assignments"),
        api.get("/api/user/team-session"),
      ]);
      console.log("quizRes",quizRes.data);
      console.log("progRes",progRes.data);
      console.log("sessionRes",sessionRes.data);
      setQuizAssignments(Array.isArray(quizRes.data) ? quizRes.data : []);
      setProgAssignments(Array.isArray(progRes.data) ? progRes.data : []);
      setTeamSession(Array.isArray(sessionRes.data) ? sessionRes.data : (sessionRes.data ? [sessionRes.data] : []));
    } catch (err) {
      console.error("Error fetching data:", err);
    }
    setLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    },
    hover: {
      scale: 1.02,
      y: -2,
      transition: { duration: 0.2 }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-[#85a831] border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p
            className="text-lg font-semibold text-[#85a831]"
            variants={pulseVariants}
            animate="pulse"
          >
            Loading your assignments...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8 px-4">
      <motion.div
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
       
        {/* Header avec animation */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="text-4xl font-bold bg-gradient-to-r from-[#85a831] to-[#6d8f25] bg-clip-text text-transparent mb-2"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <FaTasks className="inline mr-3 text-[#85a831]" />
            Assignments & Sessions
          </motion.h1>
          <motion.p
            className="text-gray-600 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Manage your quizzes, projects, and team sessions
          </motion.p>
        </motion.div>
        <div className="space-y-8">
          {/* Quiz Assignments Section */}
          
          <motion.div variants={itemVariants }     initial="hidden"
        animate="visible">
            <motion.div
              className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
                <motion.h3
                  className="text-2xl font-bold flex items-center gap-3"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <FaClipboardList className="text-2xl" />
                  </motion.div>
                  Quiz Assignments
                  <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    {quizAssignments.length}
                  </span>
                </motion.h3>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {quizAssignments.length === 0 ? (
                    <motion.div
                      className="text-center py-12 text-gray-500"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FaClipboardList className="text-6xl text-gray-300 mx-auto mb-4" />
                      <p className="text-lg">No quiz assignments at the moment</p>
                    </motion.div>
                  ) : (
                    <motion.div className="space-y-3">
                      {quizAssignments.map((quiz, index) => (
                        <motion.div
                          key={quiz.id}
                          className="bg-gradient-to-r from-purple-50 to-white p-4 rounded-xl border border-purple-100 hover:border-purple-200 transition-all duration-300 cursor-pointer group"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.4 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg flex items-center justify-center">
                                <FaClipboardList className="text-white text-sm" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                                  {quiz.title}
                                </h4>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <FaClock className="text-xs" />
                                  Available now
                                </p>
                              </div>
                            </div>
                  
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>

          {/* Programming Assignments Section */}
          <motion.div variants={itemVariants}     initial="hidden"
        animate="visible">
            <motion.div
              className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                <motion.h3
                  className="text-2xl font-bold flex items-center gap-3"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <FaCode className="text-2xl" />
                  </motion.div>
                  Programming Assignments
                  <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    {progAssignments.length}
                  </span>
                </motion.h3>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {progAssignments.length === 0 ? (
                    <motion.div
                      className="text-center py-12 text-gray-500"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FaCode className="text-6xl text-gray-300 mx-auto mb-4" />
                      <p className="text-lg">No programming assignments at the moment</p>
                    </motion.div>
                  ) : (
                    <motion.div className="space-y-3">
                      {progAssignments.map((prog, index) => (
                        <motion.div
                          key={`prog-${index}`}
                          className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-xl border border-blue-100 hover:border-blue-200 transition-all duration-300 cursor-pointer group"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.4 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                                <FaCode className="text-white text-sm" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                  {prog.title}
                                </h4>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <FaClock className="text-xs" />
                                  Available now
                                </p>
                              </div>
                            </div>
           
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

        
              </div>
            </motion.div>
          </motion.div>


            {/* Team Session Section */}
            <AnimatePresence>
            {teamSession && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                layout
              >
                <motion.div
                  className="bg-white/70 rounded-2xl shadow-xl border border-white/20 overflow-hidden"
                  variants={cardVariants}
                  whileHover="hover"
                >
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                    <motion.h3
                      className="text-2xl font-bold flex items-center gap-3"
                      initial={{ x: -20 }}
                      animate={{ x: 0 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <FaUsers className="text-2xl" />
                      </motion.div>
                     Team Sessions
                      <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    {teamSession?.length}
                  </span>
                    </motion.h3>
                  </div>

                  <div className="p-6">
                    <motion.div
                      className=" "
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                    <div className="flex flex-col gap-6">
                      {/* Affichage de toutes les sessions d'équipe */}
                      {teamSession.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                          <p className="text-lg">No team sessions in progress</p>
                        </div>
                      ) : (
                        teamSession.map((session, idx) => (
                          <motion.div
                            key={session.id}
                            className="bg-gradient-to-r from-green-50 to-white p-4 rounded-xl border border-green-100 hover:border-green-200 transition-all duration-300 cursor-pointer group flex items-center justify-between"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1, duration: 0.4 }}
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center">
                                <FaUsers className="text-white text-lg" />
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-gray-800 mb-1">{session.title}</h4>
                                <p className="text-gray-600">{session.description}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>


        </div>
      </motion.div>
    </div>
  );
}