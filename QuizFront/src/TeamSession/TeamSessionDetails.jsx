import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { FaTimes, FaRegClock, FaHeading, FaAlignLeft, FaCalendarAlt, FaListUl, FaCode } from 'react-icons/fa';
import { MdQuiz } from 'react-icons/md';

const statusColors = {
  scheduled: 'bg-yellow-100 text-yellow-700',
  inprogress: 'bg-blue-100 text-blue-700',
  finished: 'bg-green-100 text-green-700',
  canceled: 'bg-red-100 text-red-700',
};

export default function TeamSessionDetails({ session, onClose }) {
  console.log(session);
  if (!session) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-xl md:max-w-2xl relative overflow-hidden animate-fadeIn flex flex-col"
          initial={{ scale: 0.95, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 230, damping: 18, duration: 0.25 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#85a831] to-[#c4e17f]">
            <div className="flex items-center gap-2">
              <FaListUl className="text-white text-xl" />
              <h2 className="text-lg md:text-2xl font-bold text-white">Team Session Details</h2>
            </div>
            <motion.button
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
              onClick={onClose}
              aria-label="Close"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaTimes size={20} />
            </motion.button>
          </div>

          {/* Body */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <label className="block font-semibold mb-2 text-gray-700  items-center gap-2">
                  <FaHeading className="text-[#85a831]" />
                  Title
                </label>
                <div className="text-gray-900 font-medium text-base">{session.title}</div>
              </div>
              {/* Type */}
              <div>
                <label className="block font-semibold mb-2 text-gray-700  items-center gap-2">
                  {session.type === 'quiz' ? <MdQuiz className="text-[#85a831]" /> : <FaCode className="text-[#85a831]" />}
                  Type
                </label>
                <div className="capitalize text-gray-900 font-medium text-base">{session.type}</div>
              </div>
              {/* Status */}
              <div>
                <label className="block font-semibold mb-2 text-gray-700  items-center gap-2">
                  <FaRegClock className="text-[#85a831]" />
                  Status
                </label>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[session.status] || 'bg-gray-100 text-gray-700'}`}>{session.status}</span>
              </div>
              {/* Start Date */}
              <div>
                <label className="block font-semibold mb-2 text-gray-700  items-center gap-2">
                  <FaCalendarAlt className="text-[#85a831]" />
                  Start Date
                </label>
                <div className="text-gray-900 font-medium text-base">{dayjs(session.startDateTime).format('DD/MM/YYYY HH:mm')}</div>
              </div>
              {/* Duration */}
              <div>
                <label className="block font-semibold mb-2 text-gray-700  items-center gap-2">
                  <FaRegClock className="text-[#85a831]" />
                  Duration
                </label>
                <div className="text-gray-900 font-medium text-base">{session.durationMinutes} min</div>
              </div>
              {/* Description */}
              <div className="md:col-span-2">
                <label className="block font-semibold mb-2 text-gray-700  items-center gap-2">
                  <FaAlignLeft className="text-[#85a831]" />
                  Description
                </label>
                <div className="text-gray-900 font-medium text-base">
                  {session.description || <span className="italic text-gray-400">No description</span>}
                </div>
              </div>
              {/* Quiz/Programming Problem */}
              {session.type === 'quiz' ? (
                session.quizzes && session.quizzes.length > 0 ? (
                  <div>
                    <label className="block font-semibold mb-2 text-gray-700 items-center gap-2">
                      <MdQuiz className="text-[#85a831]" />
                      Quiz
                    </label>
                    <div className="text-gray-900 font-medium text-base">
                      {session.quizzes.map(q => q.title).join(', ')}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold mb-2 text-gray-700 items-center gap-2">
                      <MdQuiz className="text-[#85a831]" />
                      Quiz
                    </label>
                    <div className="italic text-gray-400">No quiz</div>
                  </div>
                )
              ) : session.type === 'programming' ? (
                session.prog_problems && session.prog_problems.length > 0 ? (
                  <div>
                    <label className="block font-semibold mb-2 text-gray-700 items-center gap-2">
                      <FaCode className="text-[#85a831]" />
                      Programming Problem
                    </label>
                    <div className="text-gray-900 font-medium text-base">
                      {session.prog_problems.map(p => p.title).join(', ')}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold mb-2 text-gray-700 items-center gap-2">
                      <FaCode className="text-[#85a831]" />
                      Programming Problem
                    </label>
                    <div className="italic text-gray-400">No programming problem</div>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
