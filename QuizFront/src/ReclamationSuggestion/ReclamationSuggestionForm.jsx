import React, { useState, useEffect } from 'react';
import { addReclamationSuggestion, editReclamationSuggestion } from '../services/reclamationSuggestionApi';
import { userService } from '../services/userService';
import { motion } from 'framer-motion';



export default function ReclamationSuggestionForm({ onSuccess, onCancel, editItem }) {
  const [title, setTitle] = useState(editItem?.title || '');
  const [description, setDescription] = useState(editItem?.description || '');
  const [targetUsers, setTargetUsers] = useState(editItem?.targetUsers?.map(u => u.id) || []);

  useEffect(() => {
    setTitle(editItem?.title || '');
    setDescription(editItem?.description || '');
    setTargetUsers(editItem?.targetUsers?.map(u => u.id) || []);
  }, [editItem]);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setUsersLoading(true);
    userService.getAllUsers().then(u => setUsers(u)).finally(() => setUsersLoading(false));
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editItem) {
        await editReclamationSuggestion(editItem.id, { title, description, targetUsers });
      } else {
        await addReclamationSuggestion({ title, description, targetUsers });
      }
      onSuccess && onSuccess();
    } catch (err) {
      setError('Error while submitting.');
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-lg shadow p-6 mb-6 max-w-lg mx-auto"
    >
      <h3 className="text-xl font-bold mb-4 text-gray-800">{editItem ? 'Edit Idea' : 'New Idea'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-gray-700 font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="Enter a title..."
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            placeholder="Describe your idea or complaint..."
            className="border rounded px-3 py-2 w-full min-h-[80px]"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Target Users <span className='text-gray-400'>(optionnel, multi-sélection)</span></label>
          <select
            multiple
            value={targetUsers.map(String)}
            onChange={e => {
              const selected = Array.from(e.target.selectedOptions).map(opt => parseInt(opt.value));
              setTargetUsers(selected);
            }}
            className="border rounded px-3 py-2 w-full min-h-[70px]"
            disabled={usersLoading}
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.username || u.email}</option>
            ))}
          </select>
          <div className="text-xs text-gray-400 mt-1">Maintenez Ctrl (Windows) ou Cmd (Mac) pour sélectionner plusieurs utilisateurs.</div>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#85a831] hover:bg-[#6e8b23] text-white px-5 py-2 rounded-lg font-semibold shadow w-full"
          >
            {editItem ? 'Edit' : 'Add'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded font-semibold border border-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}
