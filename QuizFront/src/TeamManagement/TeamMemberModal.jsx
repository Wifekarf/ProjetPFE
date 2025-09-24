import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaUserShield, FaUserMinus, FaTrash } from 'react-icons/fa';
import { teamService } from '../services/teamService';

export default function TeamMemberModal({ team, users, onClose, onAddMembers, onToggleManagerRole, isAddingMembers, loadingTeams, fetchUsers, fetchTeams, showManagerControls }) {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingMembers, setRemovingMembers] = useState({});
  
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    setRemovingMembers(prev => ({ ...prev, [memberId]: true }));
    try {
      await teamService.removeMember(team.id, memberId);
      await Promise.all([fetchTeams(), fetchUsers()]);
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setRemovingMembers(prev => ({ ...prev, [memberId]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAddMembers(selectedMembers);
      setSelectedMembers([]); // Reset selection after successful addition
    } catch (error) {
      console.error('Error adding members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-25 backdrop-blur-sm flex justify-center items-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Manage Team - {team.name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        {/* Current Members Table */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Current Members</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {team.members?.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{member.username}</td>
                    <td className="px-6 py-4">{member.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        team.manager && member.id == team.manager.id
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {team.manager && member.id == team.manager.id ? 'Team Manager' : 'Member'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!showManagerControls && (
                          <button
                            onClick={() => {onToggleManagerRole(team.id, member); onClose();}}
                            disabled={loadingTeams[team.id] || removingMembers[member.id]}
                            className={`p-2 rounded-full transition-all duration-200 ${
                              loadingTeams[team.id] 
                                ? 'opacity-50 cursor-not-allowed' 
                                : team.manager && member.id == team.manager.id 
                                ? 'text-red-500 hover:text-red-700 hover:bg-red-50'
                                : 'text-green-500 hover:text-green-700 hover:bg-green-50'
                            }`}
                            title={team.manager && member.id == team.manager.id ? "Revoke Manager Role" : "Make Team Manager"}
                          >
                            {loadingTeams[team.id] ? (
                              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : team.manager && member.id == team.manager.id ? (
                              <FaUserMinus className="w-5 h-5" />
                            ) : (
                              <FaUserShield className="w-5 h-5" />
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={loadingTeams[team.id] || removingMembers[member.id]}
                          className={`p-2 rounded-full transition-all duration-200 ${
                            removingMembers[member.id]
                              ? 'opacity-50 cursor-not-allowed'
                              : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                          }`}
                          title="Remove Member"
                        >
                          {removingMembers[member.id] ? (
                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FaTrash className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Members Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-medium mb-4">Add Members</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users
              .filter(user => !team.members?.some(member => member.id === user.id))
              .map(user => (
                <label key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(user.id)}
                    onChange={(e) => {
                      setSelectedMembers(prev => 
                        e.target.checked
                          ? [...prev, user.id]
                          : prev.filter(id => id !== user.id)
                      );
                    }}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-700">{user.username}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </label>
              ))}
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading || selectedMembers.length === 0}
              className={`px-4 py-2 text-white rounded-md flex items-center justify-center gap-2 ${
                loading || selectedMembers.length === 0
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding Members...
                </>
              ) : (
                'Add Selected Members'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
