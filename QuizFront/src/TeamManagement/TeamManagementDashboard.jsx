import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers } from 'react-icons/fa';
import AuthLayout from '../Layout/AuthLayout';
import { teamService } from '../services/teamService';
import TeamMemberModal from './TeamMemberModal';
import { rhManagerService } from '../services/rhManagerService';

export default function TeamManagerDashboard() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);

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

  const handleManageMembers = () => {
    setShowMemberModal(true);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchTeamData();
      fetchUsers();
    }
  }, []);

  const handleAddMembers = async (memberIds) => {
    setIsAddingMembers(true);
    try {
      await teamService.addTeamMembers(team.id, memberIds);
      await Promise.all([fetchTeamData(), fetchUsers()]);
    } catch (error) {
      console.error('Error adding members:', error);
    } finally {
      setIsAddingMembers(false);
      setShowMemberModal(false);
    }
  };

  const fetchTeamData = async () => {
    try {
      const response = await teamService.getMyTeam();
      if (response?.data?.team) {
        setTeam(response.data.team);
      } else {
        setTeam(null);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="container mx-auto mt-16 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          ) : team ? (
            <>
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  {team.team_manager_id && user?.id == team.team_manager_id && (
                    <button
                      onClick={handleManageMembers}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
                    >
                      <FaUsers className="text-lg" />
                      Manage Members
                    </button>
                  )}
                </div>
              </div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                  {user?.role === 'ROLE_TEAM_MANAGER' ? 'The Team You Manage' : 'My Team'}
                </h1>
                <h2 className="text-xl font-semibold text-gray-700 mt-4">{team.name}</h2>
                <p className="text-gray-600">{team.description}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FaUsers className="text-blue-500" />
                  Team Members
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {team.members?.map((member) => (
                    <motion.div
                      key={member.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white p-4 rounded-lg shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {member.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {member.username}
                            {member.id == team.team_manager_id && (
                              <span className="ml-2 font-bold text-blue-600">
                                (Manager)
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500">
              No team data available
            </div>
          )}
        </motion.div>
      </div>
      {showMemberModal && (
        <TeamMemberModal
          team={team}
          users={users}
          onClose={() => setShowMemberModal(false)}
          onAddMembers={handleAddMembers}
          isAddingMembers={isAddingMembers}
          loadingTeams={false}
          showManagerControls={true}
        />
      )}
    </AuthLayout>
  );
}
