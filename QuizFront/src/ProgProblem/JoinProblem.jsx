import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { verifyProgProblemCode } from '../services/progProblemApi';
import { FaCode, FaArrowRight } from 'react-icons/fa';

export default function JoinProblem() {
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1);
  const [problemId, setProblemId] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter a valid access code');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      const response = await verifyProgProblemCode(code);
      
      if (response.data && response.data.id) {
        // Success - navigate to solve page with the code
        setProblemId(response.data.id);
        setStep(2);
      } else {
        setError('Unable to verify problem code. Please try again.');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setError('Invalid code. Please check and try again.');
      } else if (error.response?.status === 400 && error.response?.data?.error.includes('expired')) {
        setError('This problem has expired and is no longer available.');
      } else {
        setError('An error occurred. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email.includes('@') && email.includes('.')) {
      navigate(`/solve-problem/${code}?email=${encodeURIComponent(email)}`);
    } else {
      setError('Please enter a valid email address.');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#006674] p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#46D3E5] opacity-10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#3ab8c9] opacity-10 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white opacity-5 rounded-full filter blur-xl"></div>
      </div>

      {/* Floating bubbles animation */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: 0, x: Math.random() * 100 }}
          animate={{
            y: [0, -100, -200, -300],
            x: [Math.random() * 100, Math.random() * 100 + 50, Math.random() * 100],
            opacity: [0.3, 0.6, 0.3, 0]
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute w-2 h-2 bg-white rounded-full opacity-30"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: '-50px'
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#006674] to-[#3ab8c9] p-6 text-center">
            <h1 className="text-3xl font-bold text-white">
              {step === 1 ? "Join Programming Challenge" : "Almost there!"}
            </h1>
            <p className="text-white opacity-90 mt-2">
              {step === 1
                ? "Enter your unique access code"
                : "One last detail to get started"}
            </p>
          </div>

          <div className="p-8">
            {step === 1 ? (
              <form onSubmit={handleCodeSubmit} className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-6 py-5 text-xl border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#46D3E5] focus:ring-2 focus:ring-[#46D3E5]/30 text-center font-medium placeholder-gray-400"
                    placeholder="Enter your access code"
                    required
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FaCode className="text-gray-400" />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-gradient-to-r from-[#006674] to-[#3ab8c9] text-white py-4 px-6 rounded-xl hover:opacity-90 transition-opacity text-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify Code'}
                  {!isSubmitting && <FaArrowRight className="ml-2 inline" />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-6 py-5 text-xl border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#46D3E5] focus:ring-2 focus:ring-[#46D3E5]/30 text-center font-medium placeholder-gray-400"
                    placeholder="your@email.com"
                    required
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#006674] to-[#3ab8c9] text-white py-4 px-6 rounded-xl hover:opacity-90 transition-opacity font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Start Challenge
                    <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <a href="/register" className="text-[#006674] font-medium hover:underline">
                  Sign up now
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center text-white opacity-80 text-sm">
          <p>Programming Challenges Platform © {new Date().getFullYear()}</p>
        </div>
      </motion.div>
    </div>
  );
} 