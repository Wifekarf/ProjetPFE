import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCode, FaCodeBranch, FaLaptopCode, FaQuestionCircle, FaUsers, FaHistory, FaLanguage, FaChalkboardTeacher, FaTasks, FaUserShield, FaBrain, FaFileAlt, FaBolt, FaChartBar, FaLightbulb } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/react.svg'; // Change to your logo path if needed

// Custom component for navigation links
const navLinks = [
  {
    to: '/admin/quiz',
    icon: <FaChalkboardTeacher className="text-blue-500" />,
    label: 'Manage Quizzes',
  },
  {
    to: '/admin/questions',
    icon: <FaQuestionCircle className="text-green-500" />,
    label: 'Questions',
  },
  {
    to: '/admin/quiz/users',
    icon: <FaUsers className="text-yellow-600" />,
    label: 'Quiz Assignments',
  },
  {
    to: '/admin/historique',
    icon: <FaHistory className="text-purple-500" />,
    label: 'Quiz History',
  },
  {
    to: '/admin/mixed-tests',
    icon: <FaFileAlt className="text-indigo-500" />,
    label: 'Mixed Tests',
  },
  {
    to: '/admin/cv-test-generator',
    icon: <FaBolt className="text-orange-500" />,
    label: 'CV Test Generator',
  },
  {
    to: '/admin/mixed-test-results',
    icon: <FaChartBar className="text-green-500" />,
    label: 'Test Results',
  },
  {
    to: '/admin/manage-users',
    icon: <FaBrain className="text-indigo-500" />,
    label: 'User Analysis',
  },
  {
    to: '/admin/ideas',
    icon: <FaLightbulb className="text-yellow-500" />,
    label: 'Ideas',
  },
  {
    to: '/admin/chatbot-stats',
    icon: <FaChartBar className="text-teal-500" />,
    label: 'Chatbot Stats',
  },
];


const NavLink = ({ to, icon, children, active, collapsed, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.05 * index }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Link
      to={to}
      className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
        active ? 'bg-[#006674] text-white' : 'text-gray-700 hover:bg-gray-100'
      } ${collapsed ? 'justify-center px-2' : ''}`}
    >
      {icon}
      {!collapsed && <span className="ml-3">{children}</span>}
    </Link>
  </motion.div>
);

const AdminNavbar = () => {
  const location = useLocation();
  const path = location.pathname;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Responsive: collapse on small screens
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setCollapsed(true);
      else setCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white rounded-full shadow p-2 focus:outline-none"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        <span className="block w-6 h-0.5 bg-gray-700 mb-1"></span>
        <span className="block w-6 h-0.5 bg-gray-700 mb-1"></span>
        <span className="block w-6 h-0.5 bg-gray-700"></span>
      </button>
      {/* Sidebar */}
      <AnimatePresence>
        {(mobileOpen || !collapsed) && (
          <motion.aside
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -200, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`clip-diagonal fixed top-0 left-0 h-full z-40 bg-white shadow-lg flex flex-col items-center md:items-stretch py-6 px-2 md:px-4 w-20 md:w-64 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
          >
            {/* Logo container with diagonal clip */}
            <div className="mb-8 flex justify-center md:justify-start w-full">
              <div className="clip-diagonal w-16 h-16 overflow-hidden bg-[#006674] flex items-center justify-center mx-auto md:mx-0" style={{marginLeft: collapsed ? 0 : '0.5rem'}}>
                <img src={logo} alt="Logo" className="w-full h-full object-cover object-center" />
              </div>
            </div>
            {/* Nav links */}
            <nav className="flex-1 flex flex-col gap-2 w-full">
              {navLinks.map((link, i) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  icon={link.icon}
                  active={path === link.to}
                  collapsed={collapsed}
                  index={i}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            {/* Collapse/Expand button for desktop */}
            <button
              className="hidden md:block mt-8 mx-auto text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
              ) : (
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>
              )}
            </button>
          </motion.aside>
        )}
      </AnimatePresence>
      {/* Overlay for mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
    </>
  );
};

export default AdminNavbar; 