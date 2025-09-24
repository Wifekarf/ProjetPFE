import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../Layout/Layout";
import api from "../services/api";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await api.post("/api/login", {
        email: formData.email,
        password: formData.password
      });
      const { token, id, username, role } = response.data;
     localStorage.removeItem('quizAppUser');
localStorage.removeItem('token');
localStorage.removeItem('user');

// Store one object under "user":
localStorage.setItem('user', JSON.stringify({
  id,
  username,
  role,
  token
}));
      if (role === "ROLE_ADMIN") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (err) {
      // Handle different error cases
      if (err.response?.status === 403) {
        // Account is inactive
        setError(
          err.response?.data?.error || 
          "Your account has been deactivated. Please contact support."
        );
      } else if (err.response?.status === 401) {
        // Invalid credentials
        setError("Invalid email or password");
      } else {
        // Other errors
        setError(
          err.response?.data?.error || 
          err.response?.data?.message ||
          "An error occurred. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {/* Main Login Content */}
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
            {/* Login Header */}
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
                <motion.h2
                  className="text-3xl font-bold text-white mb-2"
                  variants={itemVariants}
                >
                  Welcome Back!
                </motion.h2>
                <motion.p
                  className="text-white opacity-90"
                  variants={itemVariants}
                >
                  Sign in to continue your quiz journey
                </motion.p>
              </div>
            </div>

            {/* Login Form */}
            <motion.form
              className="p-8"
              onSubmit={handleSubmit}
              variants={containerVariants}
            >
              {error && (
                <motion.div
                  className={`mb-4 p-3 rounded-lg text-sm ${
                    error.includes('deactivated') 
                      ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                      : 'bg-red-100 text-red-700'
                  }`}
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
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#85a831] focus:ring-2 focus:ring-[#85a831]/50 transition-all"
                  placeholder="your@email.com"
                  required
                />
              </motion.div>

              <motion.div className="mb-6" variants={itemVariants}>
                <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#85a831] focus:ring-2 focus:ring-[#85a831]/50 transition-all"
                  placeholder="••••••••"
                  required
                />
                <div className="flex justify-end mt-2">
                  <Link to="/forgot-password" className="text-sm text-[#85a831] hover:underline">
                    Forgot password?
                  </Link>
                </div>
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
                    isHovered ? "Let's Go! 🚀" : "Sign In"
                  )}
                </motion.button>
              </motion.div>

              <motion.div className="text-center text-gray-600" variants={itemVariants}>
                Don't have an account?{" "}
                <Link to="/register" className="text-[#85a831] font-medium hover:underline">
                  Sign up
                </Link>
              </motion.div>

              <motion.div className="flex items-center my-6" variants={itemVariants}>
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 text-gray-500">or</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </motion.div>

              <motion.div className="grid grid-cols-2 gap-4" variants={itemVariants}>
                <button
                  type="button"
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {/* Google SVG */}
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {/* Facebook SVG */}
                  </svg>
                  Facebook
                </button>
              </motion.div>
            </motion.form>
          </motion.div>
        </motion.div>
      </main>
    </Layout>
  );
}