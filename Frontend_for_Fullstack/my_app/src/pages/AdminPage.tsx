import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { User, InterviewTemplate } from '../types';
import { Seo } from '../components/Seo';

export const AdminPage = () => {
  const navigate = useNavigate();
  const { hasRole, logout, userRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'moderators' | 'users' | 'templates'>('moderators');
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [assigningRole, setAssigningRole] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const ROLES = ['guest', 'candidate', 'interviewer', 'recruiter', 'hr', 'moderator', 'admin', 'superadmin'];
  
  // Filter users for moderators tab - show only non-moderators
  const nonModeratorUsers = users.filter(u => u.role !== 'moderator' && u.role !== 'admin' && u.role !== 'superadmin');
  const moderatorUsers = users.filter(u => u.role === 'moderator');
  
  // Search filter
  const filteredUsers = searchQuery.trim() 
    ? nonModeratorUsers.filter(u => 
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : nonModeratorUsers;

  // Check authorization
  const isAdmin = hasRole(['admin', 'superadmin']);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [activeTab, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Seo
          title="Access denied"
          description="Private Interview Pro admin page."
          canonicalPath="/admin"
          noIndex
        />
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need admin privileges to access this page.</p>
          <button
            onClick={() => navigate('/profile')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data } = await api.get<any[]>('/api/v1/admin/users');
        setUsers(data || []);
      } else {
        const { data } = await api.get<{ items: InterviewTemplate[] }>('/api/v3/interviews?is_template=true');
        setTemplates(data?.items || []);
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !newRole) {
      alert('Please select a user and role');
      return;
    }

    setAssigningRole(true);
    try {
      await api.post('/api/v1/admin/assign-role', {
        user_id: selectedUser.user_id,
        role: newRole
      });
      
      // Update local user data
      setUsers(users.map(u => 
        u.user_id === selectedUser.user_id 
          ? { ...u, role: newRole as any }
          : u
      ));
      
      setSelectedUser(null);
      setNewRole('');
      alert('Role assigned successfully!');
    } catch (error: any) {
      console.error('Failed to assign role:', error);
      alert(error.response?.data?.detail || 'Failed to assign role');
    } finally {
      setAssigningRole(false);
    }
  };

  const handlePromoteToModerator = async (user: User) => {
    if (!confirm(`Are you sure you want to promote ${user.username} to Moderator?`)) {
      return;
    }

    setAssigningRole(true);
    try {
      await api.post('/api/v1/admin/assign-role', {
        user_id: user.user_id,
        role: 'moderator'
      });
      
      // Update local user data
      setUsers(users.map(u => 
        u.user_id === user.user_id 
          ? { ...u, role: 'moderator' }
          : u
      ));
      
      alert(`${user.username} has been promoted to Moderator!`);
    } catch (error: any) {
      console.error('Failed to promote user:', error);
      alert(error.response?.data?.detail || 'Failed to promote user');
    } finally {
      setAssigningRole(false);
    }
  };

  const handleRemoveModerator = async (user: User) => {
    if (!confirm(`Are you sure you want to remove ${user.username} from Moderator role?`)) {
      return;
    }

    setAssigningRole(true);
    try {
      await api.post('/api/v1/admin/assign-role', {
        user_id: user.user_id,
        role: 'candidate'
      });
      
      // Update local user data
      setUsers(users.map(u => 
        u.user_id === user.user_id 
          ? { ...u, role: 'candidate' }
          : u
      ));
      
      alert(`${user.username} has been removed from Moderator role!`);
    } catch (error: any) {
      console.error('Failed to remove moderator:', error);
      alert(error.response?.data?.detail || 'Failed to remove moderator');
    } finally {
      setAssigningRole(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Seo
        title="Admin Panel"
        description="Private Interview Pro admin panel."
        canonicalPath="/admin"
        noIndex
      />
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">⚙️ Admin Panel</h1>
            <p className="text-gray-600 text-sm">Role: {userRole}</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            ← Back to Profile
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 mb-6 bg-white rounded-lg shadow p-1 flex-wrap">
          <button
            onClick={() => {
              setActiveTab('moderators');
              setSelectedUser(null);
              setNewRole('');
            }}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'moderators'
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🔧 Moderators
          </button>
          <button
            onClick={() => {
              setActiveTab('users');
              setSelectedUser(null);
              setNewRole('');
            }}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => {
              setActiveTab('templates');
              setSelectedUser(null);
              setNewRole('');
            }}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📋 Templates
          </button>
        </div>

        {/* Moderators Tab */}
        {activeTab === 'moderators' && (
          <div className="space-y-6">
            {/* Current Moderators */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">🔧 Current Moderators ({moderatorUsers.length})</h2>
              {loading ? (
                <p className="text-gray-600">Loading moderators...</p>
              ) : moderatorUsers.length === 0 ? (
                <p className="text-gray-600 text-center py-8 bg-gray-50 rounded">
                  No moderators assigned yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moderatorUsers.map(moderator => (
                    <div
                      key={moderator.user_id}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 shadow-md hover:shadow-lg transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{moderator.username}</h3>
                          <p className="text-sm text-gray-600">{moderator.email}</p>
                        </div>
                        <span className="text-2xl">🔧</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        <p><strong>Status:</strong> {moderator.is_active ? '✓ Active' : 'Inactive'}</p>
                        <p><strong>Joined:</strong> {new Date(moderator.created_at).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveModerator(moderator)}
                        disabled={assigningRole}
                        className="w-full bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 font-semibold text-sm"
                      >
                        {assigningRole ? 'Processing...' : 'Remove from Moderators'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Promote Users to Moderators */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">👥 Promote Users to Moderators</h2>
              
              {/* Search Input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {loading ? (
                <p className="text-gray-600">Loading users...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-gray-600 text-center py-8 bg-gray-50 rounded">
                  {searchQuery ? 'No users found matching your search.' : 'All users are already moderators or admins.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Username</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Current Role</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.user_id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 font-semibold">{user.username}</td>
                          <td className="px-4 py-2">{user.email}</td>
                          <td className="px-4 py-2">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
                              {(user.role || 'guest')}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              user.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handlePromoteToModerator(user)}
                              disabled={assigningRole}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold text-sm px-4 py-2 rounded-lg transition"
                            >
                              {assigningRole ? 'Processing...' : 'Promote'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Role Assignment Form */}
            {selectedUser && (
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-indigo-600">
                <h3 className="text-xl font-bold mb-4">Assign Role to {selectedUser.username}</h3>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Role:
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">-- Select a role --</option>
                      {ROLES.map(role => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAssignRole}
                    disabled={assigningRole || !newRole}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                  >
                    {assigningRole ? 'Assigning...' : 'Assign'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setNewRole('');
                    }}
                    className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">User Management</h2>
              {loading ? (
                <p className="text-gray-600">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No users found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Username</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Role</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Joined</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.user_id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 font-semibold">{user.username}</td>
                          <td className="px-4 py-2">{user.email}</td>
                          <td className="px-4 py-2">
                            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                              {(user.role || 'guest').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              user.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.role || '');
                              }}
                              className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm bg-indigo-50 px-3 py-1 rounded hover:bg-indigo-100 transition"
                            >
                              Change Role
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Interview Templates</h2>
            {loading ? (
              <p className="text-gray-600">Loading templates...</p>
            ) : templates.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No templates found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition"
                  >
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {template.name || 'Unnamed'}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <p><strong>Position:</strong> {template.job_position}</p>
                      <p><strong>Company:</strong> {template.company || 'N/A'}</p>
                      <p><strong>Type:</strong> {template.interview_type}</p>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <button className="flex-1 bg-blue-600 text-white py-1 rounded hover:bg-blue-700">
                        View
                      </button>
                      <button className="flex-1 bg-yellow-600 text-white py-1 rounded hover:bg-yellow-700">
                        Edit
                      </button>
                      <button className="flex-1 bg-red-600 text-white py-1 rounded hover:bg-red-700">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            <strong>✓ Role Management System Active:</strong> You can now assign roles to users. Only moderators and admins can be assigned by admin.
          </p>
        </div>
      </div>
    </div>
  );
};
