import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { teamSessionService } from '../services/teamSessionService';
import { FaTimes, FaRegClock, FaHeading, FaAlignLeft, FaCalendarAlt, FaListUl, FaCode, FaQuestionCircle } from 'react-icons/fa';
import { MdQuiz } from 'react-icons/md';

export default function TeamSessionForm({ open, onClose, onCreated, teamId, session }) {
  const [type, setType] = useState('quiz');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [quizId, setQuizId] = useState('');
  const [progProblemId, setProgProblemId] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [progProblems, setProgProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Fetch quizzes and programming problems on type change
  useEffect(() => {
    async function fetchData() {
      try {
        setFetching(true);
        setError(null);
        if (type === 'quiz') {
          // Use new quizApi service
          const { getQuizzes } = await import('../services/quizApi');
          const res = await getQuizzes();
          setQuizzes(res.data);
        } else {
          // Use existing progProblemApi service
          const { getProgProblems } = await import('../services/progProblemApi');
          const res = await getProgProblems();
          setProgProblems(res.data);
        }
      } catch (e) {
        setError('Failed to load quizzes or programming problems');
      } finally {
        setFetching(false);
      }
    }
    if (open) fetchData();
  }, [type, open]);

  // Reset or prefill form on open or session change
  useEffect(() => {
    if (open) {
      if (session) {
        setType(session.type || 'quiz');
        setTitle(session.title || '');
        setDescription(session.description || '');
        setStartDateTime(session.startDateTime ? dayjs(session.startDateTime).format('YYYY-MM-DDTHH:mm') : '');
        setDurationMinutes(session.durationMinutes ? String(session.durationMinutes) : '');
        // quizId and progProblemId will be set after data loads
      } else {
        setType('quiz');
        setTitle('');
        setDescription('');
        setStartDateTime('');
        setDurationMinutes('');
        setQuizId('');
        setProgProblemId('');
      }
      setError(null);
      setSuccess(false);
    }
  }, [open, session]);

  // Set quizId/progProblemId after data loads for edit mode
  useEffect(() => {
    if (session && type === 'quiz' && quizzes.length > 0) {
      setQuizId(session.quiz_ids && session.quiz_ids.length > 0 ? session.quiz_ids[0] : '');
    }
    if (session && type === 'programming' && progProblems.length > 0) {
      setProgProblemId(session.prog_problem_ids && session.prog_problem_ids.length > 0 ? session.prog_problem_ids[0] : '');
    }
  }, [session, type, quizzes, progProblems]);

  // Form validation
  const validate = () => {
    if (!title.trim()) return 'Title is required';
    if (!startDateTime) return 'Start date/time is required';
    // Date must be at least 24 hours in the future
    const now = new Date();
    const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const selectedDate = new Date(startDateTime);
    if (isNaN(selectedDate.getTime()) || selectedDate < minDate) {
      return 'Start date/time must be at least 24 hours from now';
    }
    if (!durationMinutes || isNaN(durationMinutes) || durationMinutes <= 0) return 'Duration must be a positive number';
    if (type === 'quiz' && !quizId) return 'Select a quiz';
    if (type === 'programming' && !progProblemId) return 'Select a programming problem';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const payload = {
        team_id: teamId,
        type,
        title,
        description,
        startDateTime,
        durationMinutes: Number(durationMinutes),
        quiz_ids: type === 'quiz' && quizId ? [quizId] : undefined,
        prog_problem_ids: type === 'programming' && progProblemId ? [progProblemId] : undefined,
        created_by: user?.id,
      };
      if (session && session.id) {
        await teamSessionService.updateTeamSession(session.id, payload);
      } else {
        await teamSessionService.createTeamSession(payload);
      }
      setSuccess(true);
      setTimeout(() => {
        if (onCreated) onCreated();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Modal */}
          <motion.div
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
            initial={{ scale: 0.9, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 50, opacity: 0 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.1 }}
          >
            {/* Header */}
            <motion.div
              className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#85a831] to-[#729222] text-white"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <FaListUl />
                </motion.div>
                {session ? 'Edit Team Session' : 'Add Team Session'}
              </h2>
              <motion.button
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes size={20} />
              </motion.button>
            </motion.div>

            {/* Loading bar */}
            {fetching && (
              <motion.div
                className="h-1 bg-gradient-to-r from-[#85a831] via-[#c4e17f] to-[#85a831]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
              />
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              {/* Error/Success Messages */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaQuestionCircle className="text-red-500 flex-shrink-0" />
                    <span className="font-medium">{error}</span>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      ✓
                    </motion.div>
                    <span className="font-medium">Session created successfully!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-6">
                {/* First Row - Title & Type */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {/* Title */}
                  <div>
                    <label className="block font-semibold mb-2 text-gray-700  items-center gap-2">
                      <FaHeading className="text-[#85a831]" />
                      Title <span className="text-red-500">*</span>
                    </label>
                    <motion.input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#85a831] focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Enter session title..."
                      required
                      autoFocus
                      whileFocus={{ scale: 1.02 }}
                    />
                    <p className="text-xs text-gray-500 mt-1">A short, descriptive name for the session</p>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block font-semibold mb-2 text-gray-700  items-center gap-2">
                      <MdQuiz className="text-[#85a831]" />
                      Type <span className="text-red-500">*</span>
                    </label>
                    <motion.select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#85a831] focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                      value={type}
                      onChange={e => setType(e.target.value)}
                      required
                      whileFocus={{ scale: 1.02 }}
                    >
                      <option value="quiz">Quiz Session</option>
                      <option value="programming">Programming Session</option>
                    </motion.select>
                  </div>
                </motion.div>

                {/* Second Row - DateTime & Duration */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  {/* Start Date/Time */}
                  <div>
                    <label className="block font-semibold mb-2 text-gray-700  items-center gap-2">
                      <FaCalendarAlt className="text-[#85a831]" />
                      Start Date/Time <span className="text-red-500">*</span>
                    </label>
                    <motion.input
                      type="datetime-local"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#85a831] focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                      value={startDateTime}
                      onChange={e => setStartDateTime(e.target.value)}
                      required
                      min={(() => {
                        const now = new Date();
                        now.setHours(now.getHours() + 24);
                        return now.toISOString().slice(0, 16);
                      })()}
                      whileFocus={{ scale: 1.02 }}
                    />
                    <p className="text-xs text-gray-500 mt-1">When the session will start</p>
                    {startDateTime && !isNaN(new Date(startDateTime).getTime()) && (
                      <p className="text-xs text-blue-600 mt-1">
                        Selected: {dayjs(startDateTime).format('DD/MM/YYYY HH:mm')}
                      </p>
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block font-semibold mb-2 text-gray-700  items-center gap-2">
                      <FaRegClock className="text-[#85a831]" />
                      Duration (minutes) <span className="text-red-500">*</span>
                    </label>
                    <motion.input
                      type="number"
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#85a831] focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(e.target.value)}
                      placeholder="60"
                      required
                      whileFocus={{ scale: 1.02 }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Session duration in minutes</p>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <label className="block font-semibold mb-2 text-gray-700  items-center gap-2">
                    <FaAlignLeft className="text-[#85a831]" />
                    Description
                  </label>
                  <motion.textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#85a831] focus:border-transparent transition-all duration-200 bg-white shadow-sm resize-none"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Optional description for the session..."
                    whileFocus={{ scale: 1.02 }}
                  />
                </motion.div>

                {/* Content Selection */}
                <AnimatePresence mode="wait">
                  {type === 'quiz' ? (
                    <motion.div
                      key="quiz-selection"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <label className="block font-semibold mb-2 text-gray-700 items-center gap-2">
                        <MdQuiz className="text-[#85a831]" />
                        Select Quizzes <span className="text-red-500">*</span>
                      </label>
                      <motion.select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#85a831] focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                        value={quizId}
                        onChange={e => setQuizId(e.target.value)}
                        required
                        size={5}
                        whileFocus={{ scale: 1.02 }}
                      >
                        {quizzes.map(q => (
                          <option key={q.id} value={q.id} className="py-2">
                            {q.nom || q.title}
                          </option>
                        ))}
                      </motion.select>

                    </motion.div>
                  ) : (
                    <motion.div
                      key="programming-selection"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <label className="block font-semibold mb-2 text-gray-700 items-center gap-2">
                        <FaCode className="text-[#85a831]" />
                        Select Programming Problems <span className="text-red-500">*</span>
                      </label>
                      <motion.select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#85a831] focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                        value={progProblemId}
                        onChange={e => setProgProblemId(e.target.value)}
                        required
                        size={5}
                        whileFocus={{ scale: 1.02 }}
                      >
                        {progProblems.map(p => (
                          <option key={p.id} value={p.id} className="py-2">
                            {p.title}
                          </option>
                        ))}
                      </motion.select>

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>

            {/* Footer */}
            <motion.div
              className="px-6 py-4 bg-gray-50 border-t border-gray-300 flex justify-end gap-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <motion.button
                type="button"
                className="px-6 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                form="session-form"
                className="px-6 py-2.5 bg-[#85a831] hover:bg-[#729222] text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading || success}
                onClick={handleSubmit}
                whileHover={{ scale: loading || success ? 1 : 1.05 }}
                whileTap={{ scale: loading || success ? 1 : 0.95 }}
              >
                {loading && (
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                )}
                {(() => {
  const isEdit = !!session;
  return isEdit
    ? loading
      ? 'Updating...'
      : success
        ? 'Updated!'
        : 'Update Session'
    : loading
      ? 'Creating...'
      : success
        ? 'Created!'
        : 'Create Session';
})()}

              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}