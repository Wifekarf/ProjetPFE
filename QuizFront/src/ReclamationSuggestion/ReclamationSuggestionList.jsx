import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getMyReclamationsSuggestions,
  cancelReclamationSuggestion
} from '../services/reclamationSuggestionApi';
import ReclamationSuggestionForm from './ReclamationSuggestionForm';
import AuthLayout from '../Layout/AuthLayout';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export default function ReclamationSuggestionList() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [teamManager, setTeamManager] = useState('');
  const [teamManagers, setTeamManagers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const handleNewIdea = () => {
    setEditItem(null);
    setShowForm(true);
  };

  useEffect(() => {
    setLoading(true);
    getMyReclamationsSuggestions().then(data => {
      setItems(Array.isArray(data) ? data : []);
      // Extraction des managers uniques présents dans les items
      const managers = (Array.isArray(data) ? data : [])
        .map(item => item.teamManager)
        .filter((tm, i, arr) => tm && arr.findIndex(x => x && x.id === tm.id) === i)
        .sort((a, b) => a.username.localeCompare(b.username));
      setTeamManagers(managers);
      setLoading(false);
    });
  }, [refresh]);

  const filtered = items.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase());
    const matchesTeamManager = teamManager ? (item.teamManager && String(item.teamManager.id) === String(teamManager)) : true;
    const matchesStatus = status ? item.status === status : true;
    // Filtre : uniquement sur la date de création
    const matchesCreatedFrom = createdFrom ? item.createdAt >= createdFrom : true;
    const matchesCreatedTo = createdTo ? item.createdAt <= createdTo + ' 23:59:59' : true;
    return matchesSearch && matchesTeamManager && matchesStatus && matchesCreatedFrom && matchesCreatedTo;
  });

  const handleCancel = async id => {
    if (window.confirm('Confirmer l\'annulation ?')) {
      await cancelReclamationSuggestion(id);
      setRefresh(r => !r);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Idea Box</h2>
          <button
            onClick={handleNewIdea}
            className="bg-[#85a831] hover:bg-[#6e8b23] text-white px-5 py-2 rounded-lg font-semibold shadow"
          >
            + New Idea
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by title or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-1/4"
          />
          
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-1/4"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <div className="flex gap-2 items-center">
              <label className="text-xs font-medium text-gray-600 w-36">Created from :</label>
              <input
                type="date"
                value={createdFrom}
                onChange={e => setCreatedFrom(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={createdTo}
                onChange={e => setCreatedTo(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
          </div>
        </div>
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Backdrop flou */}
              <motion.div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={() => { setShowForm(false); setEditItem(null); }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              {/* Modal */}
              <motion.div
                className="relative z-10 w-full max-w-lg mx-auto"
                initial={{ scale: 0.95, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 30 }}
                transition={{ duration: 0.3 }}
              >
                <ReclamationSuggestionForm
                  editItem={editItem}
                  onSuccess={() => {
                    setShowForm(false);
                    setEditItem(null);
                    setRefresh(r => !r);
                  }}
                  onCancel={() => { setShowForm(false); setEditItem(null); }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="overflow-x-auto rounded-lg shadow bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>

                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Updated</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
              ) : (
                filtered.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-gray-400">No data found</td></tr>
                ) : (
                  <AnimatePresence>
                    {filtered.map((item, idx) => (
                      <motion.tr
                        key={item.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedItem(item)}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        transition={{ duration: 0.35, delay: idx * 0.07 }}
                        layout
                      >
                        <td className="px-4 py-2">{item.title}</td>
                        <td className="px-4 py-2">
                          <span className={
                            item.status === 'Approved' ? 'text-green-600 font-semibold' :
                            item.status === 'Rejected' ? 'text-red-600 font-semibold' :
                            item.status === 'Cancelled' ? 'text-gray-400 font-semibold' :
                            'text-yellow-600 font-semibold'
                          }>
                            {STATUS_OPTIONS.find(opt => opt.value === item.status)?.label || item.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">{item.createdAt}</td>
                        <td className="px-4 py-2">{item.updatedAt}</td>
                        <td className="px-4 py-2 flex gap-2">
                          {item.status === 'Pending' && (
                            <>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditItem(item);
                                  setShowForm(true);
                                }}
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); handleCancel(item.id); }}
                                className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )
              )}
            </tbody>
          </table>
        </div>
        {/* Details Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
            <div className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-200">
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
      <span className={`px-2 py-1 rounded text-xs font-bold ${selectedItem.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : selectedItem.status === 'Cancelled' ? 'bg-red-100 text-red-700' : selectedItem.status === 'Approved' ? 'bg-green-100 text-green-700' : selectedItem.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{STATUS_OPTIONS.find(opt => opt.value === selectedItem.status)?.label || selectedItem.status}</span>
    </div>
    <div className="flex items-center gap-2 py-2">
      <span className="font-semibold w-32 text-gray-600">Created:</span>
      <span className="text-gray-700">{selectedItem.createdAt}</span>
    </div>
    <div className="flex items-center gap-2 py-2">
      <span className="font-semibold w-32 text-gray-600">Updated:</span>
      <span className="text-gray-700">{selectedItem.updatedAt}</span>
    </div>
    <div className="flex items-start gap-2 py-2">
      <span className="font-semibold w-32 text-gray-600">Description:</span>
      <span className="text-gray-700 whitespace-pre-line">{selectedItem.description}</span>
    </div>
    {selectedItem.adminComment && selectedItem.adminComment.trim() !== '' && (
      <div className="flex items-start gap-2 py-2">
        <span className="font-semibold w-32 text-gray-600">Admin Comment:</span>
        <span className="text-gray-700 whitespace-pre-line">{selectedItem.adminComment}</span>
      </div>
    )}
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
    <button onClick={() => setSelectedItem(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded font-semibold shadow">Close</button>
  </div>
</div>

          </div>
        )}
      </div>
    </AuthLayout>
  );
}
