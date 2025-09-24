import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

export default function JoinPage() {
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [quizId, setQuizId] = useState(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/api/quizzes/verify-code", { code });
      setQuizId(data.id);
      setError("");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Code invalide");
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email.includes("@") && email.includes(".")) {
      navigate(`/quizguest?code=${code}&email=${encodeURIComponent(email)}`);
    } else {
      setError("Veuillez entrer une adresse email valide.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#85a831] to-[#c2d654] p-4 relative overflow-hidden">
      {/* Fond animé */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#c2d654] opacity-10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#85a831] opacity-10 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white opacity-5 rounded-full filter blur-xl"></div>
      </div>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: 0, x: Math.random() * 100 }}
          animate={{ y: [0, -300], opacity: [0.3, 0] }}
          transition={{ duration: 10 + Math.random() * 5, repeat: Infinity, ease: "linear" }}
          className="absolute w-2 h-2 bg-white rounded-full opacity-30"
          style={{ left: `${Math.random() * 100}%`, bottom: "-50px" }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-[#85a831] to-[#c2d654] p-6 text-center">
            <h1 className="text-3xl font-bold text-white">
              {step === 1 ? "Rejoindre le Quiz Wevioo" : "Presque là !"}
            </h1>
            <p className="text-white opacity-90 mt-2">
              {step === 1
                ? "Entrez votre code d'accès unique"
                : "Un dernier détail pour commencer"}
            </p>
          </div>

          <div className="p-8">
            {step === 1 ? (
              <form onSubmit={handleCodeSubmit} className="space-y-6">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Entrez votre code ici"
                  required
                  className="w-full px-6 py-5 text-xl border-2 border-gray-200 rounded-xl text-center focus:outline-none focus:border-[#85a831] focus:ring-2 focus:ring-[#85a831]/30"
                />
                {error && <div className="text-red-700">{error}</div>}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#85a831] to-[#c2d654] text-white py-4 rounded-xl font-medium shadow-md hover:opacity-90 transition-opacity"
                >
                  Vérifier le code
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full px-6 py-5 text-xl border-2 border-gray-200 rounded-xl text-center focus:outline-none focus:border-[#85a831] focus:ring-2 focus:ring-[#85a831]/30"
                />
                {error && <div className="text-red-700">{error}</div>}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(""); }}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#85a831] to-[#c2d654] text-white py-4 rounded-xl font-medium shadow-md hover:opacity-90 transition-opacity"
                  >
                    Commencer le quiz
                  </button>
                </div>
              </form>
            )}

            <p className="mt-8 text-gray-600 text-center text-sm">
              Vous n'avez pas de compte ?{' '}
              <a href="/register" className="text-[#85a831] font-medium hover:underline">
                S'inscrire maintenant
              </a>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-white opacity-80 text-sm">
          © Wevioo Quiz {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
