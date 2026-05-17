import React, { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { User, StartInterviewResponse, InterviewSession, UserRole, PaginatedInterviews } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PhotoUpload } from '../components/PhotoUpload';
import { Seo } from '../components/Seo';

export const ProfilePage = () => {
  const { userId, logout, userRole, username, email, hasRole } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [isLoadingBtn, setIsLoadingBtn] = useState(false);

  const [interviewData, setInterviewData] = useState({
    interview_type: 'technical',
    job_position: '',
    company: ''
  });

  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

  // ---------- Load profile ----------
  useEffect(() => {
    if (!userId) return;

    api
      .get<User>(`/api/v1/profile/${userId}`)
      .then(res => {
        setUser(res.data);
      })
      .catch(err => {
        console.error('Failed to load profile:', err);
        if (err.response?.status === 401) {
          logout();
          navigate('/login');
        }
      });
  }, [userId, navigate, logout]);

  // ---------- Load interviews ----------
  useEffect(() => {
    api
      .get<PaginatedInterviews>('/api/v3/interviews')
      .then(res => setInterviews(res.data.items || []))
      .catch(console.error)
      .finally(() => setLoadingInterviews(false));
  }, []);

  // ---------- Start interview ----------
  const startInterview = async () => {
    if (!interviewData.job_position || !interviewData.company) {
      alert('Please fill in position and company');
      return;
    }

    setIsLoadingBtn(true);
    try {
      const { data } = await api.post<StartInterviewResponse>(
        '/api/v3/start-interview',
        interviewData
      );
      navigate(`/interview/${data.session_id}`);
    } catch (error: any) {
      console.error('Failed to start interview', error);
      alert(error.response?.data?.detail || 'Failed to start interview');
    } finally {
      setIsLoadingBtn(false);
    }
  };

  const getRoleDisplay = (role: UserRole | null) => {
    const roleMap: Record<UserRole, string> = {
      'guest': '👤 Guest',
      'candidate': '🎯 Candidate',
      'interviewer': '👨‍💼 Interviewer',
      'recruiter': '📋 Recruiter',
      'hr': '💼 HR',
      'moderator': '🔧 Moderator',
      'admin': '⚙️ Admin',
      'superadmin': '👑 Super Admin'
    };
    return role ? roleMap[role] : '👤 Guest';
  };

  const isRecruiter = userRole === 'recruiter' || userRole === 'admin' || userRole === 'superadmin';
  const isInterviewer = userRole === 'interviewer' || userRole === 'recruiter' || userRole === 'admin' || userRole === 'superadmin';

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const inputClasses =
    'px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <Seo
        title="Profile"
        description="Private Interview Pro profile and interview history."
        canonicalPath="/profile"
        noIndex
      />
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ---------- Header with User Info ---------- */}
        <div className="bg-white shadow-lg rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              {/* Photo Upload Section */}
              <div className="mb-6 flex justify-center md:justify-start">
                <PhotoUpload
                  photoUrl={user.photo_url}
                  onPhotoUploaded={(photoUrl) => {
                    setUser({ ...user, photo_url: photoUrl });
                  }}
                  onPhotoDeleted={() => {
                    setUser({ ...user, photo_url: null });
                  }}
                />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{user.username}</h1>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  ✓ {user.subscription_type} Plan
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800">
                  {getRoleDisplay(userRole || (user.role as UserRole))}
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                  📅 {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ---------- Left Column: Start Interview / Templates ---------- */}
          <div className="lg:col-span-2 space-y-6">

            {/* Browse Templates Button */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition">
              <h3 className="text-xl font-semibold mb-2">📚 Interview Templates</h3>
              <p className="text-indigo-100 mb-4">Choose from ready-made interview scenarios or create your own</p>
              <button
                onClick={() => navigate('/templates')}
                className="bg-white hover:bg-indigo-50 text-indigo-600 font-semibold py-2 px-6 rounded-lg transition"
              >
                Browse Templates →
              </button>
            </div>

            {/* ---------- Quick Start Interview ---------- */}
            <div className="bg-white shadow-lg rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">⚡ Quick Start Interview</h3>
              <p className="text-gray-600 text-sm mb-4">Start a custom interview session immediately</p>

              <div className="space-y-3 mb-4">
                <input
                  className={inputClasses + ' w-full'}
                  value={interviewData.job_position}
                  onChange={e =>
                    setInterviewData({ ...interviewData, job_position: e.target.value })
                  }
                  placeholder="Target Position (e.g., Senior React Developer)"
                />
                <select
                  className={inputClasses + ' w-full'}
                  value={interviewData.interview_type}
                  onChange={e =>
                    setInterviewData({ ...interviewData, interview_type: e.target.value })
                  }
                >
                  <option value="technical">Technical Interview</option>
                  <option value="behavioral">Behavioral Interview</option>
                  <option value="systems-design">Systems Design</option>
                  <option value="hr">HR Interview</option>
                  <option value="case-study">Case Study</option>
                  <option value="coding">Coding Challenge</option>
                </select>
                <input
                  className={inputClasses + ' w-full'}
                  value={interviewData.company}
                  onChange={e =>
                    setInterviewData({ ...interviewData, company: e.target.value })
                  }
                  placeholder="Target Company (e.g., Google)"
                />
              </div>

              <button
                onClick={startInterview}
                disabled={isLoadingBtn}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105"
              >
                {isLoadingBtn ? '⏳ Starting...' : '🚀 Start Interview Now'}
              </button>
            </div>

            {/* ---------- Interviewer/Recruiter Options ---------- */}
            {isInterviewer && (
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">👨‍💼 Interviewer Tools</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate('/templates')}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-3 px-4 rounded-lg transition"
                  >
                    📋 View Templates
                  </button>
                  <button
                    onClick={() => navigate('/templates/create')}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold py-3 px-4 rounded-lg transition"
                  >
                    ➕ Create Template
                  </button>
                </div>
              </div>
            )}
            {/* Admin Options */}
            {hasRole(['admin', 'superadmin']) && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-red-900 mb-4">⚙️ Admin Tools</h3>
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  🔧 Admin Panel
                </button>
              </div>
            )}          </div>

          {/* ---------- Right Column: Recent Interviews ---------- */}
          <div className="bg-white shadow-lg rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📝 Recent Interviews ({interviews.length})
            </h3>

            {loadingInterviews ? (
              <p className="text-gray-500 text-center py-4">Loading...</p>
            ) : interviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-4">No interviews yet</p>
                <button
                  onClick={startInterview}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
                >
                  Start First Interview
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {interviews.slice(0, 10).map(interview => (
                  <div
                    key={interview.session_id}
                    onClick={() => navigate(`/interview/${interview.session_id}`)}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer transition group"
                  >
                    <p className="font-semibold text-gray-800 text-sm group-hover:text-indigo-600 line-clamp-1">
                      {interview.job_position}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">{interview.company}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                        {interview.interview_type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(interview.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {interview.status && (
                      <span className={`text-xs mt-1 block py-1 px-2 rounded font-semibold ${
                        interview.status === 'completed' ? 'bg-green-100 text-green-700' :
                        interview.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {interview.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
