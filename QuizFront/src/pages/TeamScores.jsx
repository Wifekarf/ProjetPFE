import { useEffect, useState } from "react";
import api from "../services/api";
import AuthLayout from "../Layout/AuthLayout";

export default function TeamScores() {
  const [data, setData] = useState({ members: [], languages: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' ou 'prog'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/rhm/teams/scores");
        setData(res.data);
        console.log("Score " , res.data);
      } catch (e) {
        setData({ members: [], languages: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  const filteredMembers = data.members.filter((m) =>
    m.username.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredMembers.length / pageSize);
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <AuthLayout>
      <div className="container mx-auto mt-10 flex flex-col w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Team Scores</h1>
        <div className="mb-4 flex items-center gap-4 justify-between w-full">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#85a831]"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#85a831] bg-white"
          >
            {[5, 10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                activeTab === 'quiz'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Quiz
            </button>
            <button
              onClick={() => setActiveTab('prog')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                activeTab === 'prog'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Code Challenge
            </button>
          </div>
        </div>
        
        <div className="rounded-lg shadow max-w-full" style={{height: '60vh', minHeight: 400}}>
          <div className="overflow-x-auto h-full scrollbar-none" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            <div className="h-full overflow-y-auto scrollbar-none" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              <style>{`
                .scrollbar-none::-webkit-scrollbar { display: none; }
              `}</style>
              <table className="min-w-max w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="sticky bg-gray-100 left-0 top-0 z-10 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Quiz Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Prog Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prog Score</th>
                    {activeTab === 'quiz' && data.languages.map(lang => (
                      <th key={lang.id + "quiz"} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {lang.name} Quiz
                      </th>
                    ))}
                    {activeTab === 'prog' && data.languages.map(lang => (
                      <th key={lang.id + "prog"} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {lang.name} Prog
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan={5 + 2 * data.languages.length} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr><td colSpan={5 + 2 * data.languages.length} className="text-center py-8 text-gray-400">No team members found.</td></tr>
                  ) : paginatedMembers.map(member => (
                    <tr key={member.id}>
                      <td className="sticky bg-white border-r-1 border-gray-100 left-0 z-0 px-6 py-4 whitespace-nowrap flex items-center gap-3">
                        {member.image ? (
                          <img src={member.image} alt={member.username} className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <span className="h-10 w-10 rounded-full bg-[#85a831]/20 flex items-center justify-center text-[#85a831] font-bold text-lg">
                            {member.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <div className="font-semibold text-gray-800">{member.username}</div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.lastQuizActivity || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.lastProgActivity || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                          {member.overallQuizScore}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
                          {member.overallProgScore}%
                        </span>
                      </td>
                      {activeTab === 'quiz' && data.languages.map(lang => (
                        <td key={lang.id + "quizcell"} className="px-6 py-4 text-center">
                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                            {member.quizScoresByLang[lang.name] || 0}%
                          </span>
                        </td>
                      ))}
                      {activeTab === 'prog' && data.languages.map(lang => (
                        <td key={lang.id + "progcell"} className="px-6 py-4 text-center">
                          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                            {member.progScoresByLang[lang.name] || 0}%
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination controls */}
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            &lt;
          </button>
          {Array.from({length: totalPages > 5 ? 5 : totalPages}, (_, i) => {
            let page = i + 1;
            if (totalPages > 5) {
              if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
            }
            if (page < 1 || page > totalPages) return null;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md border ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-3 py-1 rounded-md border ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            &gt;
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}