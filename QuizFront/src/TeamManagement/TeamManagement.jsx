import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaUserPlus, FaUserMinus, FaUserShield, FaBackward } from 'react-icons/fa';
import AuthLayout from '../Layout/AuthLayout';
import { teamService } from '../services/teamService';
import { rhManagerService } from '../services/rhManagerService'; 
import CreateTeamModal from './CreateTeamModal';
import TeamMemberModal from './TeamMemberModal';
import { useNavigate } from 'react-router-dom'

export default function TeamsManagement() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [isUpdatingManager, setIsUpdatingManager] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState({});
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); 

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: '',
    memberIds: []
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await rhManagerService.getUsersWithoutTeam();
      setUsers(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await teamService.getAllTeams();
      if (response?.data?.teams) {
        setTeams(response.data.teams);
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManageMembers = (team) => {
    setSelectedTeam(team);
    setShowMemberModal(true);
  };

  const handleCreateTeam = async (formData) => {
    setIsCreating(true);
    try {
      await teamService.createTeam(formData);
      await fetchTeams(); // Refresh teams after creation
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddMembers = async (memberIds) => {
    setIsAddingMembers(true);
    try {
      await teamService.addTeamMembers(selectedTeam.id, memberIds);
      await Promise.all([fetchTeams(), fetchUsers()]); // Refresh data
    } catch (error) {
      console.error('Error adding members:', error);
    } finally {
      setIsAddingMembers(false);
      setShowMemberModal(false);
    }
  };

  const handleToggleManagerRole = async (teamId, user) => {
    setLoadingTeams(prev => ({ ...prev, [teamId]: true }));
    try {
      if (user.roles && user.roles.includes('ROLE_TEAM_MANAGER')) {
        await teamService.revokeTeamManagerRole(teamId, user.id);
      } else {
        const team = teams.find(t => t.id === teamId);
        if (!team.members?.some(m => m.id === user.id)) {
          throw new Error('User must be a member of the team to become manager');
        }
        await teamService.grantTeamManagerRole(teamId, user.id);
      }
      await Promise.all([fetchTeams(), fetchUsers()]); // Refresh data
    } catch (error) {
      console.error('Error toggling manager role:', error.message);
    } finally {
      setLoadingTeams(prev => ({ ...prev, [teamId]: false }));
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
      setLoading(true);
      try {
        await Promise.all([fetchTeams(), fetchUsers()]);
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, []);

  return (
    <AuthLayout>
      <div className="container mx-auto mt-16 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-6">
            {/* {user?.role === "ROLE_ADMIN" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin/rh-managers')}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600"
              >
                <FaBackward />
                Go back
              </motion.button>
            )} */}
            <h1 className="text-2xl font-bold text-gray-800">Teams Management</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors duration-200"
            >
              <FaUserPlus className="text-lg" />
              Create Team
            </motion.button>
          </div>

          {/* Teams Grid */}
          {loading ? (
            <div className="text-center py-4">Loading teams...</div>
          ) : teams.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="text-gray-500 text-lg mb-2">No teams found</div>
              <div className="text-gray-400 text-sm">
                Click "Create Team" to add your first team
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <motion.div
                  key={team.id}
                  whileHover={{ 
                    scale: 1.02,
                    backgroundColor: "#f8fafc" // Light hover effect
                  }}
                  className="bg-gray-50 rounded-lg p-4 shadow cursor-pointer transition-colors duration-200"
                >
                  <h3 className="text-xl font-semibold mb-2">{team.name}</h3>
                  <p className="text-gray-600 mb-4">{team.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {team.members?.length || 0} members
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click event
                          handleManageMembers(team);
                        }}
                        className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 cursor-pointer transition-all duration-200"
                        title="Manage Team Members"
                      >
                        <FaUsers />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <CreateTeamModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTeam}
          formData={formData}
          setFormData={setFormData}
          users={users}
          isCreating={isCreating}
          fetchTeams={fetchTeams}
        />
      )}

      {/* Team Member Modal */}
      {showMemberModal && selectedTeam && (
        <TeamMemberModal
          team={selectedTeam}
          users={users}
          onClose={() => setShowMemberModal(false)}
          onAddMembers={handleAddMembers}
          onToggleManagerRole={handleToggleManagerRole}
          isAddingMembers={isAddingMembers}
          loadingTeams={loadingTeams}
          fetchUsers={fetchUsers}
          fetchTeams={fetchTeams}
        />
      )}
    </AuthLayout>
  );
}