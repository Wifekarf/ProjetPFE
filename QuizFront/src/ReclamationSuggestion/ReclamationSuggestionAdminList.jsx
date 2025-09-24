import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getAllAdminReclamationSuggestions, approveReclamationSuggestion, rejectReclamationSuggestion } from '../services/reclamationSuggestionApi';
import { userService } from '../services/userService';
import AuthLayout from '../Layout/AuthLayout';

export default function ReclamationSuggestionAdminList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [filters, setFilters] = useState({
    teamManager: '',
    status: '',
    createdFrom: '',
    createdTo: '',
    title: '',
  });
  const [teamManagers, setTeamManagers] = useState([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllAdminReclamationSuggestions();
      setItems(res);
      // Extraire les managers uniques présents dans les items
      const managers = res
        .map(item => item.teamManager)
        .filter((tm, i, arr) => tm && arr.findIndex(x => x && x.id === tm.id) === i)
        .sort((a, b) => a.username.localeCompare(b.username));
      setTeamManagers(managers);
    } catch (err) {
      setError('Erreur lors du chargement.');
      setTeamManagers([]);
    }
    setLoading(false);
  };

  const filteredItems = items.filter(item => {
    const matchesTitle = filters.title ? item.title.toLowerCase().includes(filters.title.toLowerCase()) : true;
    // Correction du filtre Team Manager :
    // - Évite les bugs si item.teamManager est null/undefined
    // - Compare toujours en string pour éviter les soucis de type
    // - Si le filtre est vide, on laisse passer tout
    const matchesTeamManager = filters.teamManager
      ? (item.teamManager && String(item.teamManager.id) === String(filters.teamManager))
      : true;
    const matchesStatus = filters.status ? item.status === filters.status : true;
    // createdAt is 'YYYY-MM-DD HH:mm:ss', compare only date part
    const itemDate = item.createdAt?.slice(0,10);
    const matchesCreatedFrom = filters.createdFrom ? (itemDate >= filters.createdFrom) : true;
    const matchesCreatedTo = filters.createdTo ? (itemDate <= filters.createdTo) : true;
    return matchesTitle && matchesTeamManager && matchesStatus && matchesCreatedFrom && matchesCreatedTo;
  });

  const handleAction = (item, type) => {
    setSelectedItem(item);
    setActionType(type);
    setAdminComment('');
    setShowCommentModal(true);
  };

  const handleConfirmAction = async () => {
    setLoading(true);
    try {
      if (actionType === 'approve') {
        await approveReclamationSuggestion(selectedItem.id, { adminComment });
      } else {
        await rejectReclamationSuggestion(selectedItem.id, { adminComment });
      }
      setShowCommentModal(false);
      setSelectedItem(null);
      fetchData();
    } catch {
      setError('Erreur lors de l\'action.');
    }
    setLoading(false);
  };

  return (
    <>
      <AuthLayout>
        <div className="container mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Idea Management</h2>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Title..."
              value={filters.title}
              onChange={e => setFilters(f => ({ ...f, title: e.target.value }))}
              className="border rounded px-3 py-2 w-full md:w-1/3"
            />
            <select
              value={filters.teamManager}
              onChange={e => setFilters(f => ({ ...f, teamManager: e.target.value }))}
              className="border rounded px-3 py-2 w-full md:w-1/4"
            >
              <option value="">Team Manager</option>
              {teamManagers.map(tm => (
                <option key={tm.id} value={tm.id}>{tm.username}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="border rounded px-3 py-2 w-full md:w-1/4"
            >
              <option value="">Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <div className="flex flex-col gap-2 w-full md:w-1/2">
              <div className="flex gap-2 items-center">
                <label className="text-xs font-medium text-gray-600 w-36">Created from :</label>
                <input
                  type="date"
                  value={filters.createdFrom}
                  onChange={e => setFilters(f => ({ ...f, createdFrom: e.target.value }))}
                  className="border rounded px-3 py-2 w-full"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={filters.createdTo}
                  onChange={e => setFilters(f => ({ ...f, createdTo: e.target.value }))}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg shadow bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Team Manager</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Updated</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {loading ? (
                    <motion.tr
                      key="loading"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td colSpan={6} className="text-center py-8">Loading...</td>
                    </motion.tr>
                  ) : filteredItems.length === 0 ? (
                    <motion.tr
                      key="no-items"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td colSpan={6} className="text-center py-8 text-gray-400">No ideas found</td>
                    </motion.tr>
                  ) : (
                    filteredItems.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        transition={{ 
                          duration: 0.35,
                          delay: index * 0.07
                        }}
                        layout
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedItem(item)}
                        whileHover={{ 
                          backgroundColor: 'rgb(249 250 251)',
                          transition: { duration: 0.2 }
                        }}
                      >
                        <td className="px-4 py-2">{item.title}</td>
                        <td className="px-4 py-2">
                          <span className={
                            item.status === 'Approved' ? 'text-green-600 font-semibold' :
                            item.status === 'Rejected' ? 'text-red-600 font-semibold' :
                            item.status === 'Cancelled' ? 'text-gray-400 font-semibold' :
                            'text-yellow-600 font-semibold'
                          }>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">{item.teamManager?.username}</td>
                        <td className="px-4 py-2">{item.createdAt?.slice(0,10)}</td>
                        <td className="px-4 py-2">{item.updatedAt?.slice(0,10)}</td>
                        <td className="px-4 py-2 flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition"
                            onClick={e => {e.stopPropagation(); setSelectedItem(item);}}
                          >
                            Details
                          </motion.button>
                          {item.status === 'Pending' && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition"
                                onClick={e => {e.stopPropagation(); handleAction(item, 'approve');}}
                              >
                                Approve
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition"
                                onClick={e => {e.stopPropagation(); handleAction(item, 'reject');}}
                              >
                                Reject
                              </motion.button>
                            </>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </AuthLayout>

      {/* Modals hors AuthLayout */}
      <AnimatePresence>
        {selectedItem && !showCommentModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-200"
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold mb-6 text-[#85a831] flex items-center gap-2">
                <svg className="w-6 h-6 text-[#85a831]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Idea Details
              </h3>
              <div className="grid grid-cols-1 gap-4 divide-y divide-gray-100">
                <div className="flex items-center gap-2 py-2">
                  <span className="font-semibold w-32 text-gray-600">Title:</span>
                  <span className="text-gray-900">{selectedItem.title}</span>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <span className="font-semibold w-32 text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${selectedItem.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : selectedItem.status === 'Cancelled' ? 'bg-red-100 text-red-700' : selectedItem.status === 'Approved' ? 'bg-green-100 text-green-700' : selectedItem.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{selectedItem.status}</span>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <span className="font-semibold w-32 text-gray-600">Team Manager:</span>
                  <span className="text-gray-800">{selectedItem.teamManager?.username}</span>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <span className="font-semibold w-32 text-gray-600">Created:</span>
                  <span className="text-gray-700">{selectedItem.createdAt?.slice(0,10)}</span>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <span className="font-semibold w-32 text-gray-600">Updated:</span>
                  <span className="text-gray-700">{selectedItem.updatedAt?.slice(0,10)}</span>
                </div>
                <div className="flex items-start gap-2 py-2">
                  <span className="font-semibold w-32 text-gray-600">Description:</span>
                  <span className="text-gray-700 whitespace-pre-line">{selectedItem.description}</span>
                </div>
                {selectedItem.targetUsers && selectedItem.targetUsers.length > 0 && (
                  <div className="flex items-center gap-2 py-2">
                    <span className="font-semibold w-32 text-gray-600">Target Users:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.targetUsers.map(user => (
                        <span key={user.id} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {user.username}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-8">
                <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => setSelectedItem(null)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showCommentModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowCommentModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative z-10 w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-200"
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-bold mb-4 text-[#85a831]">{actionType === 'approve' ? 'Approve' : 'Reject'} Idea</h3>
              <textarea
                className="border rounded w-full p-2 mb-4"
                rows={4}
                placeholder="Comment (optional)"
                value={adminComment}
                onChange={e => setAdminComment(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => setShowCommentModal(false)}>Cancel</button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading} onClick={handleConfirmAction}>{actionType === 'approve' ? 'Approve' : 'Reject'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}