import { useEffect, useState } from "react";
import api from "../services/api";

// Custom hook to fetch total count of quiz, prog, and team session assignments
export default function useAssignmentSessionCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchCounts() {
      setLoading(true);
      try {
        const [quizRes, progRes, sessionRes] = await Promise.all([
          api.get("/api/user/quiz-assignments"),
          api.get("/api/user/prog-assignments"),
          api.get("/api/user/team-session"),
        ]);
        const quizCount = Array.isArray(quizRes.data) ? quizRes.data.length : 0;
        const progCount = Array.isArray(progRes.data) ? progRes.data.length : 0;
        let teamCount = 0;
        if (Array.isArray(sessionRes.data)) teamCount = sessionRes.data.length;
        else if (sessionRes.data) teamCount = 1;
        if (isMounted) setCount(quizCount + progCount + teamCount);
      } catch (e) {
        if (isMounted) setCount(0);
      }
      if (isMounted) setLoading(false);
    }
    fetchCounts();
    return () => { isMounted = false; };
  }, []);

  return { count, loading };
}
