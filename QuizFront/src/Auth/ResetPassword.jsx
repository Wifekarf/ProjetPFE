import { motion } from "framer-motion";
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "../Layout/Layout";
import api from "../services/api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [success, setSuccess] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    rest: {
      scale: 1,
      background: "linear-gradient(135deg, #85a831 0%, #c2d654 100%)"
    },
    hover: {
      scale: 1.05,
      background: "linear-gradient(135deg, #c2d654 0%, #85a831 100%)",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/reset-password/reset', { token, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <main className="flex-grow flex items-center justify-center p-6 md:p-12 lg:p-24">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-xl overflow-hidden"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Success Header */}
              <div className="relative h-40 bg-gradient-to-r from-[#85a831] to-[#c2d654] overflow-hidden">
                <motion.div
                  className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white opacity-10"
                  animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                <motion.div
                  className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#c2d654] opacity-10"
                  animate={{
                    x: [0, -100, 0],
                    y: [0, -50, 0],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-6">
                  <motion.div
                    className="text-4xl mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  >
                    ✅
                  </motion.div>
                  <motion.h2
                    className="text-3xl font-bold text-white mb-2"
                    variants={itemVariants}
                  >
                    Password Reset!
                  </motion.h2>
                  <motion.p
                    className="text-white opacity-90"
                    variants={itemVariants}
                  >
                    Your password has been updated successfully
                  </motion.p>
                </div>
              </div>

              {/* Success Content */}
              <motion.div
                className="p-8 text-center"
                variants={containerVariants}
              >
                <motion.div
                  className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200"
                  variants={itemVariants}
                >
                  <p className="text-gray-700 leading-relaxed">
                    Your password has been successfully reset. You will be redirected to the login page in a few seconds.
                  </p>
                </motion.div>

                <motion.div
                  className="text-center text-gray-600"
                  variants={itemVariants}
                >
                  <Link to="/login" className="text-[#85a831] font-medium hover:underline">
                    Go to Login Page
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="flex-grow flex items-center justify-center p-6 md:p-12 lg:p-24">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-xl overflow-hidden"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <div className="relative h-40 bg-gradient-to-r from-[#85a831] to-[#c2d654] overflow-hidden">
              <motion.div
                className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white opacity-10"
                animate={{
                  x: [0, 100, 0],
                  y: [0, 50, 0],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <motion.div
                className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#c2d654] opacity-10"
                animate={{
                  x: [0, -100, 0],
                  y: [0, -50, 0],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-6">
                <motion.div
                  className="text-4xl mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  🔑
                </motion.div>
                <motion.h2
                  className="text-3xl font-bold text-white mb-2"
                  variants={itemVariants}
                >
                  Reset Password
                </motion.h2>
                <motion.p
                  className="text-white opacity-90"
                  variants={itemVariants}
                >
                  Enter your new password below
                </motion.p>
              </div>
            </div>

            {/* Form */}
            <motion.form
              className="p-8"
              onSubmit={handleSubmit}
              variants={containerVariants}
            >
              {error && (
                <motion.div
                  className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm"
                  variants={itemVariants}
                >
                  {error}
                </motion.div>
              )}

              <motion.div className="mb-6" variants={itemVariants}>
                <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#85a831] focus:ring-2 focus:ring-[#85a831]/50 transition-all"
                  placeholder="Enter your new password"
                  required
                />
                <p className="mt-1 text-sm text-gray-600">
                  Must be at least 6 characters long
                </p>
              </motion.div>

              <motion.div className="mb-6" variants={itemVariants}>
                <label htmlFor="confirm" className="block text-gray-700 font-medium mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirm"
                  name="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#85a831] focus:ring-2 focus:ring-[#85a831]/50 transition-all"
                  placeholder="Confirm your new password"
                  required
                />
                {password && confirm && password !== confirm && (
                  <p className="mt-1 text-sm text-red-600">
                    Passwords do not match
                  </p>
                )}
                {password && confirm && password === confirm && (
                  <p className="mt-1 text-sm text-green-600">
                    ✓ Passwords match
                  </p>
                )}
              </motion.div>

              <motion.div className="mb-6" variants={itemVariants}>
                <motion.button
                  type="submit"
                  className="w-full px-6 py-4 rounded-full text-white font-bold text-lg shadow-lg flex items-center justify-center"
                  variants={buttonVariants}
                  initial="rest"
                  whileHover="hover"
                  animate="rest"
                  onHoverStart={() => setIsHovered(true)}
                  onHoverEnd={() => setIsHovered(false)}
                  disabled={isLoading || password !== confirm}
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    isHovered ? "Update Password 🔐" : "Update Password"
                  )}
                </motion.button>
              </motion.div>

              <motion.div className="text-center text-gray-600" variants={itemVariants}>
                Remember your password?{" "}
                <Link to="/login" className="text-[#85a831] font-medium hover:underline">
                  Sign in
                </Link>
              </motion.div>
            </motion.form>
          </motion.div>
        </motion.div>
      </main>
    </Layout>
  );
}