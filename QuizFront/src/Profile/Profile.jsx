import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "../Layout/AuthLayout";
import axios from "axios";
import CountUp from "react-countup";
import { format, parseISO, subDays } from "date-fns";
import { saveAs } from "file-saver";
import { debounce } from "lodash";
import { FaUser, FaLock, FaChartLine, FaDownload, FaFileUpload} from "react-icons/fa";
import api from "../services/api";

// Lazy-load recharts…







import Chart3D from "./Chart3D";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function Profile() {
  const [sessionBadges, setSessionBadges] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [stats, setStats] = useState({
    history: [], quizzesTaken: 0, correctAnswers: 0,
    highestScore: 0, currentStreak: 0, successRate: 0,
  });
  const [quizStats, setQuizStats] = useState([]);
  const [quizStatsLoading, setQuizStatsLoading] = useState(false);
  const [quizStatsError, setQuizStatsError] = useState(null);

  // Préparation des données pour le chart 3D
  const chart3dData = quizStats.map(q => ({
    label: q.quiz_title || q.category || "Quiz",
    value: Number(q.score) || 0,
  }));
  
  const [animatedRate, setAnimatedRate] = useState(0);
  const [tab, setTab] = useState("profile");
  const [darkMode, setDarkMode] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [dateFilter, setDateFilter] = useState("all");
  const [image, setImage] = useState(null);
  const [generatedAttributes, setGeneratedAttributes] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (storedUser) {
      api.get(`/api/users/getbyid/${storedUser.id}`)
        .then(res => {
          setProfile(res.data);
          setGeneratedAttributes(res.data.profileAttributes);
          setForm({ username: res.data.username || "", email: res.data.email || "", password: "" });
          setStats({
            history: res.data.history || [],
            quizzesTaken: res.data.quizzesTaken || 0,
            correctAnswers: res.data.correctAnswers || 0,
            highestScore: res.data.highestScore || 0,
            currentStreak: res.data.currentStreak || 0,
            successRate: 0,
          });
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));

      // Fetch quiz stats for the user
      setQuizStatsLoading(true);
      api.get(`/api/users/getQuizHistoriqueByid/${storedUser.id}`)
        .then(res => {
          setQuizStats(Array.isArray(res.data) ? res.data : []);
          console.log("Quiz stats:", res.data);
        })
        .catch(err => setQuizStatsError(err.message))
        .finally(() => setQuizStatsLoading(false));
      // Fetch session badges (top 3 quiz/prog)
      api.get(`/api/users/${storedUser.id}/session-badges`)
        .then(res => {setSessionBadges(Array.isArray(res.data) ? res.data : []);console.log("res",res.data)})
        .catch(err => console.error("Session badges error", err));
    }
  }, []);

  

 const uploadAvatar = async e => {
   const file = e.target.files[0];
   if (!file) return;
   console.log("🖼  uploading avatar:", file);
   const fd = new FormData();
   fd.append("image", file, file.name);
   try {
     const { data } = await api.post("/api/users/upload", fd);
      setProfile(u => ({ ...u, image: data.image }));
     setMsg({ type: "success", text: "Avatar updated!" });
   } catch (err) {
     console.error(err);
     setMsg({ type: "error", text: err.response?.data?.message || "Avatar error" });
   }
 };

 const uploadCV = async () => {
  if (!cvFile) return;
  const fd = new FormData();
  fd.append("cv", cvFile, cvFile.name);

    try {
      const { data } = await api.post("/api/users/upload", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setProfile(u => ({ ...u, cv: data.cv }));
    setMsg({ type: "success", text: "CV uploaded!" });
  } catch (err) {
    setMsg({ type: "error", text: err.response?.data?.message || "CV error" });
  }
};

  // Memoized stats…
  const computedStats = useMemo(() => {
    const taken   = stats.quizzesTaken;
    const correct = stats.correctAnswers;
    const rate    = taken ? Math.round((correct / taken) * 100) : 0;
    const formattedHistory = stats.history
      .filter(i => i.date && !isNaN(i.score))
      .map(i => ({
        ...i,
        date: format(parseISO(i.date), "dd/MM/yyyy"),
        formattedScore: i.score,
      }))
      .sort((a,b)=> new Date(b.date)-new Date(a.date));
    const filtered = formattedHistory.filter(i => {
      if (dateFilter==="all") return true;
      const d = parseISO(i.date);
      if (dateFilter==="7days") return d >= subDays(new Date(),7);
      if (dateFilter==="30days") return d >= subDays(new Date(),30);
      return true;
    });
    return { ...stats, successRate: rate, history: filtered };
  }, [stats, dateFilter]);

  // Debounced form update…
  const updateForm = debounce((name,value)=>{
    setForm(prev=>({...prev,[name]:value}));
    if(name==="email" && value && !/\S+@\S+\.\S+/.test(value)){
      setFormErrors(prev=>({...prev,email:"Invalid email"}));
    } else {
      setFormErrors(prev=>({...prev,[name]:""}));
    }
  },300);

  // 2) Animate circular…
  useEffect(()=>{
    if(tab!=="stats") return;
    setAnimatedRate(0);
    const t = setTimeout(()=>setAnimatedRate(computedStats.successRate),300);
    return ()=>clearTimeout(t);
  },[tab,computedStats.successRate]);

  // File input handlers
  const handleImageChange = e=> e.target.files[0] && setImage(e.target.files[0]);
  const handleCvChange    = e=> e.target.files[0] && setCvFile(e.target.files[0]);

  // 3) Main form submit (username/email/password)
  const handleSubmit = async e=>{
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("username", form.username);
      fd.append("email", form.email);
      fd.append("password", form.password);
      // include image+cv in same PUT if desired
      if(image) fd.append("image", image, image.name);
      if(cvFile)    fd.append("cv", cvFile, cvFile.name);

      const res = await api.put(`/api/users/${profile.id}`, fd);
      if(res.status !== 200) throw new Error("Échec de la mise à jour");
      setProfile(res.data);
      setMsg({ type:"success", text:"Profile updated successfully" });
      setImage(null);
      setCvFile(null);
    } catch(err){
      setMsg({ type:"error", text:err.response?.data?.message||err.message });
    }
  };

  // **4) Separate files-only upload**
  const handleUpload = async ()=>{
    if(!image && !cvFile){
      setMsg({ type:"error", text:"No file selected." });
      return;
    }
   const fd = new FormData();
   if(image)   fd.append("image", image, image.name);
   if(cvFile)  fd.append("cv", cvFile, cvFile.name);

    try {
 const { data } = await api.post("/api/users/upload", fd);
      if(data.error) throw new Error(data.error);
      // Merge returned URLs into state
      setProfile(u=>({ ...u, image:data.image, cv:data.cv }));
      setMsg({ type:"success", text:"Files uploaded!" });
      setImage(null);
      setCvFile(null);
    } catch(err){
      setMsg({ type:"error", text:err.response?.data?.message||"Upload failed" });
    }
  };

  // 5) Export stats…
  const exportStats = () => {
    const hdr = ["Date","Score","Quiz Title","Category"];
    const rows = quizStats.map(q => [
      q.completed_at ? q.completed_at.split(' ')[0] : 'N/A',
      q.score ?? 'N/A',
      q.quiz_title || 'N/A',
      q.category || 'N/A'
    ]);
    const csv = [hdr.join(","),...rows.map(r=>r.join(","))].join("\n");
    const blob = new Blob([csv],{ type:"text/csv;charset=utf-8;" });
    saveAs(blob,`stats_${profile?.id||'user'}.csv`);
  };


  const generateProfile = async () => {
    if (!profile.cv) {
      setMsg({ type: "error", text: "Please upload a CV first to generate profile attributes." });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.post("/api/users/generate-profile");
      setGeneratedAttributes(response.data.attributes);
      setMsg({ type: "success", text: "Profile attributes generated successfully!" });
    } catch (error) {
      setMsg({ 
        type: "error", 
        text: error.response?.data?.error || "Failed to generate profile attributes" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if(!profile) return null;

  // Badge selon le rang du user (profile.rank)
  const rankBadges = {
    JUNIOR:    { label: "Junior", icon: "🥉", description: "New member. Keep learning and practicing!" },
    SENIOR:    { label: "Senior", icon: "🏆", description: "Confirmed member. Excellent performance and regularity!" },
    ALTERNATE: { label: "Alternate", icon: "🎓", description: "Alternate member. Ready to join the main team when needed." },
  };
  const badges = generatedAttributes || [
    profile?.rank && rankBadges[profile.rank]
      ? rankBadges[profile.rank]
      : { label: "Member", icon: "👤", description: "Welcome to the platform!" }
  ];

  const containerVariants = {
    hidden:{ opacity:0, y:20 },
    visible:{ opacity:1, y:0, transition:{ staggerChildren:0.1, delayChildren:0.2 } }
  };
  const itemVariants = { hidden:{ opacity:0, y:10 }, visible:{ opacity:1, y:0 } };
  return (
    <AuthLayout>
      <div className={`min-h-screen pt-28 pb-10 px-4 sm:px-6 lg:px-8 ${darkMode ? "dark bg-gray-800" : "bg-gradient-to-br from-cyan-50 to-purple-100"} transition-colors duration-500`}> 
        <div className="mx-auto max-w-5xl">
          {/* Dark mode toggle */}
         


          {/* Tabs */}
          <motion.div
            className="flex space-x-4 border-b border-gray-200 dark:border-gray-600 mb-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              { id: "profile", label: "My Profile", icon: <FaUser /> },
              { id: "security", label: "Security", icon: <FaLock /> },
              { id: "stats", label: "Statistics", icon: <FaChartLine /> },
              { id: "files",    label: "Files",  icon: <FaFileUpload /> },
            ].map((t) => (
              <motion.button
                key={t.id}
                onClick={() => setTab(t.id)}
                variants={itemVariants}
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 font-medium text-lg ${
                  tab === t.id
                    ? "border-b-4 border-cyan-500 dark:text-cyan-400"
                    : "text-gray-600 dark:text-gray-300 hover:text-cyan-500"
                }`}
                aria-current={tab === t.id ? "page" : undefined}
              >
                {t.icon}
                {t.label}
              </motion.button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab + darkMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="mt-8"
            >
              {/* Profile Tab */}
              {tab === "profile" && (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
                  {/* Message Display */}
                  {msg && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`p-4 rounded-lg ${
                        msg.type === "error" ? "bg-red-100 text-red-700 border border-red-200" : "bg-green-100 text-green-700 border border-green-200"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{msg.text}</span>
                        <button 
                          onClick={() => setMsg(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  )}
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                    <motion.div
                      className="relative group"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                     <div className="relative h-28 w-28 rounded-full overflow-hidden group">
                      <div className="h-full w-full bg-gradient-to-br from-cyan-400 to-purple-500 p-1">
                        <div className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-4xl font-semibold text-gray-700 dark:text-gray-200">
                          {profile.image
                          ? <img src={`http://localhost:8000${profile.image}`} alt="avatar" className="object-cover w-full h-full"/>
                            : profile.username.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      {/* the invisible picker now truly covers the avatar: */}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={uploadAvatar}
                      />
                    </div>
                      <span className="absolute bottom-0 right-0 rounded-full bg-yellow-300 px-2 py-1 text-xs font-semibold text-gray-800">
                        {(Array.isArray(profile.role) ? profile.role[0] : profile.role || "").replace("ROLE_", "")}
                      </span>
                    </motion.div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{profile.username}</h2>
                      <p className="text-gray-600 dark:text-gray-300 text-lg">{profile.email}</p>
                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            {generatedAttributes ? "AI-Generated Profile Attributes" : "Default Profile Attributes"}
                          </h3>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={generateProfile}
                            disabled={isGenerating || !profile.cv}
                            className={`px-4 py-2 rounded-lg text-white font-medium ${
                              isGenerating || !profile.cv
                                ? "bg-gray-400 cursor-not-allowed" 
                                : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                            }`}
                            title={!profile.cv ? "Please upload a CV first" : "Generate AI profile attributes from your CV"}
                          >
                            {isGenerating ? "🔄 Generating..." : !profile.cv ? "📄 Upload CV First" : "🤖 Generate Profile"}
                          </motion.button>
                        </div>
                        <motion.div
                          className="flex flex-wrap gap-4"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {badges.map((b, i) => (
                            <motion.div
                              key={i}
                              variants={itemVariants}
                              whileHover={{ y: -5, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
                              className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-600 p-4 shadow-sm"
                            >
                              <span className="text-2xl">{b.icon}</span>
                              <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{b.label}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{b.description}</p>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>

                        {/* Session Badges */}
                        {sessionBadges.length > 0 && (
                          <div className="w-full mt-4">
                            <h4 className="font-bold mb-2 text-cyan-700 dark:text-cyan-300">Session Achievement Badges (Top 3 Quiz/Programming)</h4>
                            <div className="flex flex-wrap gap-4">
                              {sessionBadges.map((b, i) => {
                                const placeIcons = { 1: "🥇", 2: "🥈", 3: "🥉" };
                                return (
                                  <motion.div
                                    key={`session-badge-${i}`}
                                    variants={itemVariants}
                                    whileHover={{ y: -5, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
                                    className="flex items-center gap-3 rounded-lg bg-yellow-50 dark:bg-yellow-900 p-4 shadow-sm"
                                  >
                                    <span className="text-2xl">{placeIcons[b.position] || "🏅"}</span>
                                    <div>
                                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                                        {b.session_name} ({b.session_type === "quiz" ? "Quiz" : "Prog"})
                                      </p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {b.position === 1
  ? "First place"
  : b.position === 2
  ? "Second place"
  : "Third place"
} — {b.date}
                                      </p>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.05, boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTab("security")}
                        className="mt-6 px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full shadow-lg"
                        aria-label="Edit Profile"
                      >
                        Edit Profile
                      </motion.button>

                    </div>
                  </div>
{/*                   <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg"
                  >
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Recent Activity</h3>
                    <div className="space-y-4">
                      {computedStats.history.slice(0, 3).map((item, i) => (
                        <motion.div
                          key={i}
                          variants={itemVariants}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-600 rounded-lg"
                        >
                          <span className="text-gray-700 dark:text-gray-300">
                            {item.quizTitle || "Quiz"} ({item.date})
                          </span>
                          <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                            {item.formattedScore}/100
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div> */}
                </motion.div>
              )}

              {/* Security Tab */}
              {tab === "security" && (
                <motion.form
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  onSubmit={handleSubmit}
                  className="space-y-6 max-w-md mx-auto bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg"
                >
                  {msg && (
                    <motion.div
                      initial={{ x: -20 }}
                      animate={{ x: 0 }}
                      className={`p-4 rounded-lg ${
                        msg.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {msg.text}
                    </motion.div>
                  )}
                  {[
                    { label: "Username", name: "username", value: form.username, type: "text", icon: <FaUser className="text-gray-400" /> },
                    { label: "Email", name: "email", value: form.email, type: "email", icon: <FaLock className="text-gray-400" /> },
                  ].map((f, i) => (
                    <motion.div key={i} variants={itemVariants} className="relative mb-6">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          {f.icon}
                        </span>
                        <input
                          name={f.name}
                          type={f.type}
                          value={f.value}
                          onChange={(e) => updateForm(f.name, e.target.value)}
                          required
                          placeholder=" "
                          className={`peer pl-10 pt-4 pb-2 w-full bg-gray-50 dark:bg-gray-800 rounded-xl border ${
                            formErrors[f.name] ? "border-red-500" : "border-gray-200 dark:border-gray-600"
                          } focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-700 transition-all shadow-sm text-gray-900 dark:text-gray-100 placeholder-transparent`}
                          aria-invalid={formErrors[f.name] ? "true" : "false"}
                          aria-describedby={formErrors[f.name] ? `${f.name}-error` : undefined}
                          id={`input-${f.name}`}
                        />
                        <label htmlFor={`input-${f.name}`}
                          className="absolute left-10 top-0.5 text-gray-500 dark:text-gray-400 text-sm pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0.5 peer-focus:text-sm peer-focus:text-cyan-600 dark:peer-focus:text-cyan-400">
                          {f.label}
                        </label>
                      </div>
                      {formErrors[f.name] && (
                        <p id={`${f.name}-error`} className="text-red-500 text-xs mt-1 ml-2">
                          {formErrors[f.name]}
                        </p>
                      )}
                    </motion.div>
                  ))}
                  <motion.div variants={itemVariants} className="relative mb-6">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <FaLock className="text-gray-400" />
                      </span>
                      <input
                        name="password"
                        type={showPwd ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => updateForm("password", e.target.value)}
                        placeholder=" "
                        className="peer pl-10 pt-4 pb-2 w-full bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-700 transition-all shadow-sm text-gray-900 dark:text-gray-100 placeholder-transparent pr-12"
                        aria-label="New password"
                        id="input-password"
                      />
                      <label htmlFor="input-password"
                        className="absolute left-10 top-0.5 text-gray-500 dark:text-gray-400 text-sm pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0.5 peer-focus:text-sm peer-focus:text-cyan-600 dark:peer-focus:text-cyan-400">
                        New password <span className="text-xs text-gray-400">(leave blank)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400"
                        aria-label={showPwd ? "Hide password" : "Show password"}
                        tabIndex={-1}
                      >
                        {showPwd ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </motion.div>
                  <motion.div variants={itemVariants} className="flex space-x-4">
                    <motion.button
                      type="submit"
                      disabled={loading || Object.values(formErrors).some((err) => err)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`rounded-full px-8 py-3 text-white shadow-lg ${
                        loading || Object.values(formErrors).some((err) => err)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-cyan-500 to-purple-500"
                      }`}
                      aria-label="Save changes"
                    >
                      {loading ? "..." : "Save"}
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setTab("profile")}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-3 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 shadow-sm"
                      aria-label="Cancel changes"
                    >
                      Cancel
                    </motion.button>
                  </motion.div>
                </motion.form>
              )}

              {/* Stats Tab */}
              {tab === "stats" && (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
                  {/* Date Filter */}
                  <motion.div variants={itemVariants} className="flex items-center gap-4 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by period:</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="rounded-lg border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                      aria-label="Filter statistics by period"
                    >
                      <option value="all">All time</option>
                      <option value="7days">Last 7 days</option>
                      <option value="30days">Last 30 days</option>
                    </select>
                  </motion.div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Quizzes taken", val: quizStats.length, icon: "\uD83D\uDCCA" },
                      { label: "Correct answers", val: quizStats.reduce((acc, q) => acc + (Number(q.correctAnswers) || 0), 0), icon: "\u2705" },
                      { label: "Highest score", val: quizStats.length > 0 ? Math.max(...quizStats.map(q => Number(q.score) || 0)) : 0, icon: "\uD83C\uDFC6" },
                      { label: "Success rate", val: quizStats.length > 0 ? Math.round((quizStats.reduce((acc, q) => acc + (Number(q.score) || 0), 0) / (quizStats.length * 100)) * 100) : 0, icon: "\uD83C\uDFAF" },
                    ].map((s, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ y: -5, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
                        className="flex flex-col items-center rounded-lg bg-white dark:bg-gray-700 p-6 shadow-sm"
                      >
                        <span className="text-3xl">{s.icon}</span>
                        <CountUp
                          end={s.val}
                          duration={2}
                          suffix={s.label === "Success rate" ? "%" : ""}
                          className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100"
                        />
                        <p className="text-gray-500 dark:text-gray-400">{s.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
  variants={itemVariants}
  className="h-80 bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm"
>
  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Score History</h3>
  {chart3dData.length > 0 ? (
    <Chart3D data={chart3dData} darkMode={darkMode} />
  ) : (
    <div className="text-center text-gray-500 dark:text-gray-400">
      No data available for this period.
    </div>
  )}
</motion.div>


                  {/* Detailed Stats Table */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm"
                  >
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Quiz Details</h3>
                    {quizStats.length > 0 ? (
                      <div className="overflow-x-auto" style={{ maxHeight: '420px', overflowY: quizStats.length > 10 ? 'auto' : 'visible' }}>
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b dark:border-gray-500">
                              <th className="py-2 px-4 text-gray-700 dark:text-gray-300">Date</th>
                              <th className="py-2 px-4 text-gray-700 dark:text-gray-300">Quiz</th>
                              <th className="py-2 px-4 text-gray-700 dark:text-gray-300">Score</th>
                              <th className="py-2 px-4 text-gray-700 dark:text-gray-300">Correct Answers</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quizStats.slice(0, 10).map((item, i) => (
                              <motion.tr
                                key={i}
                                variants={itemVariants}
                                className="border-b dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600"
                              >
                                <td className="py-2 px-4 text-gray-600 dark:text-gray-300">{item.completed_at}</td>
                                <td className="py-2 px-4 text-gray-600 dark:text-gray-300">{item.quiz_title || "N/A"}</td>
                                <td className="py-2 px-4 font-semibold text-cyan-600 dark:text-cyan-400">{item.score}</td>
                                <td className="py-2 px-4 text-gray-600 dark:text-gray-300">{item.correctAnswers}</td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        No data available.
                      </div>
                    )}
                  </motion.div>

                  {/* Circular Progress and Export */}
                  <motion.div
                    variants={itemVariants}
                    className="flex flex-col items-center justify-center mt-6"
                  >
                    <div style={{ width: 300, height: 300 }}>
                      <CircularProgressbar
                        value={quizStats.length > 0 ? Math.round((quizStats.reduce((acc, q) => acc + (Number(q.score) || 0), 0) / (quizStats.length * 100)) * 100) : 0}
                        maxValue={100}
                        text={`${quizStats.length > 0 ? Math.round((quizStats.reduce((acc, q) => acc + (Number(q.score) || 0), 0) / (quizStats.length * 100)) * 100) : 0}%`}
                        strokeWidth={10}
                        styles={buildStyles({
                          pathColor: "#46c7d8",
                          textColor: darkMode ? "#E5E7EB" : "#046b7b",
                          trailColor: darkMode ? "#374151" : "#E5E7EB",
                          pathTransitionDuration: 1,
                          textSize: "16px",
                        })}
                      />
                    </div>
                    <div className="mt-4 text-center text-gray-600 dark:text-gray-300 text-sm max-w-xs">
                      Your <span className="font-bold text-cyan-700 dark:text-cyan-300">overall success rate</span> across all quizzes.
                    </div>
                  </motion.div>
                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={exportStats}
                    className="mt-6 px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full shadow-lg flex items-center gap-2"
                    aria-label="Export statistics as CSV"
                  >
                    <FaDownload />
                    Export as CSV
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
            {/* ------------ Files Tab ------------ */}
              {tab === "files" && (
                <motion.div
                  key="files"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-6 max-w-sm mx-auto"
                >
                {profile.cv && (
                    <a
                    href={`http://localhost:8000${profile.cv}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 underline"
                    >
                      <FaDownload /> Download current CV
                    </a>
                  )}

                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => setCvFile(e.target.files[0])}
                    className="border rounded w-full px-3 py-2"
                  />

                  <button
                    disabled={!cvFile}
                    onClick={uploadCV}
                    className={`w-full py-2 rounded text-white ${
                      cvFile
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Upload CV
                  </button>

                {msg && (
                    <p
                      className={`p-2 rounded ${
                        msg.type === "error"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {msg.text}
                    </p>
                  )}
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </div>
    </AuthLayout>
  );
}