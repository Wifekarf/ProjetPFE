import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../Layout/Layout";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
    setIsLoading(true);
    try {
      await api.post('/api/reset-password/request', { email });
      setSent(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
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
                    ✉️
                  </motion.div>
                  <motion.h2
                    className="text-3xl font-bold text-white mb-2"
                    variants={itemVariants}
                  >
                    Check Your Email
                  </motion.h2>
                  <motion.p
                    className="text-white opacity-90"
                    variants={itemVariants}
                  >
                    We've sent you a reset link
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
                    We sent a password reset link to <strong className="text-[#85a831]">{email}</strong>. 
                    Please check your inbox and follow the instructions to reset your password.
                  </p>
                </motion.div>

                <motion.div
                  className="space-y-4"
                  variants={itemVariants}
                >
                  <p className="text-sm text-gray-600">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                  
                  <motion.button
                    className="w-full px-6 py-4 rounded-full text-white font-bold text-lg shadow-lg"
                    variants={buttonVariants}
                    initial="rest"
                    whileHover="hover"
                    animate="rest"
                    onClick={() => setSent(false)}
                  >
                    Send Another Email
                  </motion.button>

                  <div className="text-center text-gray-600 mt-6">
                    Remember your password?{" "}
                    <Link to="/login" className="text-[#85a831] font-medium hover:underline">
                      Sign in
                    </Link>
                  </div>
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
                  🔐
                </motion.div>
                <motion.h2
                  className="text-3xl font-bold text-white mb-2"
                  variants={itemVariants}
                >
                  Forgot Password?
                </motion.h2>
                <motion.p
                  className="text-white opacity-90"
                  variants={itemVariants}
                >
                  No worries, we'll help you reset it
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
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#85a831] focus:ring-2 focus:ring-[#85a831]/50 transition-all"
                  placeholder="Enter your email address"
                  required
                />
                <p className="mt-2 text-sm text-gray-600">
                  We'll send a password reset link to this email address.
                </p>
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
                  disabled={isLoading}
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
                    isHovered ? "Send Reset Link 📧" : "Send Reset Link"
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