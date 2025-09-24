import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../Layout/Layout";
import api from "../services/api";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Vérifiez vos informations !");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {/* Registration Content */}
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
            {/* Registration Header */}
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
                  Join Wevioo Quiz!
                </motion.h2>
                <motion.p
                  className="text-white opacity-90"
                  variants={itemVariants}
                >
                  Create your account and start quizzing
                </motion.p>
              </div>
            </div>

            {/* Registration Form */}
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
                <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#85a831] focus:ring-2 focus:ring-[#85a831]/50 transition-all"
                  placeholder="Username"
                  required
                />
              </motion.div>

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
                  placeholder="exemple@example.com"
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
                <div className="text-xs text-gray-500 mt-2">
                  Minimum 4 characters
                </div>
              </motion.div>

              <motion.div className="mb-6" variants={itemVariants}>
                <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#85a831] focus:ring-2 focus:ring-[#85a831]/50 transition-all"
                  placeholder="••••••••"
                  required
                />
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
                  {isLoading ? "Processing..." : isHovered ? "Let's Get Started! 🎯" : "Create Account"}
                </motion.button>
              </motion.div>

              <motion.div className="text-center text-gray-600" variants={itemVariants}>
                Already have an account?{" "}
                <Link to="/login" className="text-[#85a831] font-medium hover:underline">
                  Sign in
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
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
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
