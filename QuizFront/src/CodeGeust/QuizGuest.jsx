// src/pages/QuizGuest.jsx
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import api from "../services/api";
import { useBeforeUnload } from "../hooks/useBeforeUnload";

export default function QuizGuest() {
  const [searchParams] = useSearchParams();
  const code           = searchParams.get("code");
  const email          = decodeURIComponent(searchParams.get("email") || "");
  const navigate       = useNavigate();

  // ─── quiz data & loading ────────────────────────────────────────────────
  const [quizId, setQuizId]       = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);

  // ─── quiz state ─────────────────────────────────────────────────────────
  const [currentIdx, setCurrentIdx]         = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userAnswers, setUserAnswers]       = useState([]);
  const [score, setScore]                   = useState(0);
  const [timeLeft, setTimeLeft]             = useState(null);
  const [quizCompleted, setQuizCompleted]   = useState(false);
  const [showConfetti, setShowConfetti]     = useState(false);
  const [windowSize, setWindowSize]         = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // ─── voice recognition ───────────────────────────────────────────────────
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceAnswer, setVoiceAnswer] = useState("");

  // ─── lockdown & audit state ──────────────────────────────────────────────
  const [sessionId, setSessionId]     = useState(null);
  const [locked, setLocked]           = useState(false);
  const [switchCount, setSwitchCount] = useState(0);
  const MAX_SWITCHES                  = 1;
  const tabId                         = useRef(Math.random().toString(36).slice(2));

  // block refresh/close if not locked
  useBeforeUnload(!locked);

  // ─── 1) on mount: verify code → start session → fetch questions ─────────
  useEffect(() => {
    (async () => {
      try {
        // verify code & get quiz ID
        const { data: { id } } = await api.post("/api/quizzes/verify-code", { code });
        setQuizId(id);

        // start session
        const { data: { sessionId } } = await api.post("/api/quiz/session/start", {
          quizId: id,
          userId: 0  // guest
        });
        setSessionId(sessionId);

        // fetch questions
        const { data: qs } = await api.get(`/api/quizzes/${id}/questions`);
        setQuestions(qs);
        if (qs.length) setTimeLeft(qs[0].time);
      } catch (err) {
        alert(err.response?.data?.error || "Code invalide");
        navigate("/join", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [code, navigate]);

  // ─── 2) timer tick ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
    if (!loading && timeLeft === 0) handleNext();
  }, [loading, timeLeft]);

  // ─── helper: send audit events ──────────────────────────────────────────
  function logEvent(type, payload = {}) {
    if (!sessionId) return;
    api.post(`/api/quiz/session/${sessionId}/audit`, {
      type,
      payload,
      timestamp: new Date().toISOString()
    }).catch(() => {});
  }

  // ─── helper: lock session & auto-submit ────────────────────────────────
  function lockAndSubmit() {
    if (locked || !sessionId) return;
    setLocked(true);
    Promise.all([
      api.post(`/api/quiz/session/${sessionId}/lock`),
      api.post(`/api/quiz/session/${sessionId}/submit`, { answers: userAnswers })
    ]).finally(() => {
      navigate('/quiz-complete', { state: { locked: true } });
    });
  }

  // ─── 3) FULLSCREEN & VISIBILITY tracking ────────────────────────────────
  useEffect(() => {
    if (!sessionId || quizCompleted) return;
    document.documentElement.requestFullscreen().catch(() => {});

    const onVisibilityChange = () => {
      if (document.hidden) {
        logEvent("visibility_lost", { count: switchCount + 1 });
        setSwitchCount(c => {
          const next = c + 1;
          if (next > MAX_SWITCHES) lockAndSubmit();
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.exitFullscreen().catch(() => {});
    };
  }, [sessionId, switchCount, quizCompleted]);

  // ─── 4) block DevTools + copy/paste/select ──────────────────────────────
  useEffect(() => {
    const onKeyDown = e => {
      const k = e.key.toLowerCase();
      if (
        e.key === "F12" ||
        ((e.ctrlKey||e.metaKey) && e.shiftKey && ["i","j","c","u"].includes(k)) ||
        ((e.ctrlKey||e.metaKey) && ["c","x","v","a"].includes(k))
      ) e.preventDefault();
    };
    const onCtx  = e => e.preventDefault();
    const onCopy = e => e.preventDefault();

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("paste", onCopy);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("paste", onCopy);
    };
  }, []);

  // ─── 5) CROSS-TAB detection ──────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    localStorage.setItem("quiz-active", JSON.stringify({ sessionId, tabId: tabId.current }));

    const onStorage = e => {
      if (e.key === "quiz-active") {
        const msg = JSON.parse(e.newValue||"{}");
        if (msg.sessionId === sessionId && msg.tabId !== tabId.current) {
          logEvent("second_tab_opened");
          lockAndSubmit();
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      localStorage.removeItem("quiz-active");
    };
  }, [sessionId]);

  // ─── voice setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if ("webkitSpeechRecognition" in window && questions.length) {
      const SR = window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "fr-FR";
      recognitionRef.current.onresult = e => {
        const transcript = e.results[0][0].transcript;
        setVoiceAnswer(transcript);
        const match = questions[currentIdx]?.options.find(opt =>
          opt.toLowerCase().includes(transcript.toLowerCase()) ||
          transcript.toLowerCase().includes(opt.toLowerCase())
        );
        if (match) setSelectedOption(match);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, [currentIdx, questions]);

  const toggleVoice = () => {
    if (!isListening) {
      setVoiceAnswer("");
      recognitionRef.current.start();
      setIsListening(true);
    } else {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // ─── handle answer & audit ───────────────────────────────────────────────
  function handleNext() {
    const q       = questions[currentIdx];
    const tTaken  = q.time - timeLeft;
    const correct = selectedOption === q.correctAnswer;

    if (correct) setScore(s => s + q.points);

    setUserAnswers(arr => [
      ...arr,
      {
        questionId: q.id,
        question:   q.question,
        given:      selectedOption,
        isCorrect:  correct,
        timeTaken:  tTaken
      }
    ]);

    logEvent("answer_select", { questionIndex: currentIdx, option: selectedOption });

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setTimeLeft(questions[currentIdx + 1].time);
    } else {
      setQuizCompleted(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }

  // ─── 6) POST guest history once quizCompleted ────────────────────────────
  useEffect(() => {
    if (!quizCompleted) return;

    api.post('/api/quiz/guest/history', {
      email,
      quizId,
      scorePoints: score,
      correctAnswers: userAnswers.filter(a => a.isCorrect).length,
      userAnswer: userAnswers.map(a => ({
        questionId:      a.questionId,
        reponse:         a.given,
        time_user_quest: a.timeTaken
      }))
    }).catch(console.error);

  }, [quizCompleted]);

  // ─── format MM:SS ───────────────────────────────────────────────────────
  const formatTime = secs => {
    const m = Math.floor(secs/60), s = secs%60;
    return `${m}:${s<10?"0":""}${s}`;
  };

  // ─── locked overlay ──────────────────────────────────────────────────────
  if (locked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-900 text-white p-4">
        🚨 Session verrouillée pour activité suspecte. Merci de contacter votre service RH.
      </div>
    );
  }

  // ─── loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement du quiz…</p>
      </div>
    );
  }

  // ─── quiz complete ───────────────────────────────────────────────────────
  if (quizCompleted) {
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    const totalPoints  = questions.reduce((sum,q)=>sum+q.points,0);
    const percent      = Math.round((score/totalPoints)*100);

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <Confetti {...windowSize} recycle={false}/>
        <motion.div
          initial={{opacity:0,scale:0.9}}
          animate={{opacity:1,scale:1}}
          className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-green-600" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Quiz terminé !</h2>
          <p className="mb-6">Merci d’avoir participé.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm text-blue-800">Score</h3>
              <p className="text-2xl font-bold text-blue-600">{score}/{totalPoints}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm text-purple-800">Bonnes réponses</h3>
              <p className="text-2xl font-bold text-purple-600">{correctCount}/{questions.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm text-green-800">Performance</h3>
              <p className="text-2xl font-bold text-green-600">{percent}%</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale:1.02 }}
            whileTap={{ scale:0.98 }}
            onClick={()=>navigate("/")}
            className="w-full bg-gray-100 hover:bg-gray-200 py-3 rounded-lg"
          >
            Retour à l’accueil
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ─── inprogress quiz ────────────────────────────────────────────────────────
  const q = questions[currentIdx];
  const progress = (currentIdx/questions.length)*100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      {showConfetti && <Confetti {...windowSize} recycle={false}/>}

      <motion.div
        key={currentIdx}
        initial={{opacity:0,y:20}}
        animate={{opacity:1,y:0}}
        className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-sm text-gray-500">
              Question {currentIdx+1} / {questions.length}
            </span>
            <h2 className="text-xl font-bold">Quiz invité</h2>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="font-bold text-red-500">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <motion.div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{width:`${progress}%`}}
            transition={{duration:0.3}}
          />
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">{q.question}</h3>
          <div className="space-y-2">
            {q.options.map((opt,i)=>(
              <motion.div
                key={i}
                whileHover={{scale:1.02}}
                whileTap={{scale:0.98}}
                onClick={()=>setSelectedOption(opt)}
                className={`p-3 border rounded-lg cursor-pointer ${
                  selectedOption===opt
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                    selectedOption===opt ? "border-blue-500 bg-blue-500":"border-gray-300"
                  }`}>
                    {selectedOption===opt && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                  </div>
                  <span>{opt}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <motion.button
            whileHover={{scale:1.02}}
            whileTap={{scale:0.98}}
            onClick={toggleVoice}
            className={`px-4 py-2 rounded-lg font-medium ${
              isListening ? "bg-red-500 text-white" : "bg-indigo-500 text-white hover:bg-indigo-600"
            }`}
          >
            {isListening ? "Arrêter" : "Parler"}
          </motion.button>
          {voiceAnswer && (
            <p className="text-sm text-gray-500">
              Vous avez dit : <em>"{voiceAnswer}"</em>
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <motion.button
            whileHover={{scale:1.02}}
            whileTap={{scale:0.98}}
            onClick={handleNext}
            disabled={!selectedOption}
            className={`px-6 py-2 rounded-lg font-medium ${
              selectedOption ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {currentIdx===questions.length-1 ? "Terminer":"Suivant"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
