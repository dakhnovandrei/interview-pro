import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Seo } from '../components/Seo';

interface RecentInterview {
  session_id: number;
  job_position: string;
  company: string;
  interview_type: string;
  finished_at: string;
  feedback?: string;
  status: string;
}

interface ReadyTemplate {
  id: number;
  name?: string;
  job_position: string;
  company?: string;
  interview_type: string;
  description?: string;
  created_at: string;
}

export const HomePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [recentInterviews, setRecentInterviews] = useState<RecentInterview[]>([]);
  const [readyTemplates, setReadyTemplates] = useState<ReadyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recentRes, templatesRes] = await Promise.all([
        api.get('/api/v3/recent-interviews?limit=3'),
        api.get('/api/v3/ready-templates?limit=3')
      ]);
      
      setRecentInterviews(recentRes.data || []);
      setReadyTemplates(templatesRes.data || []);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async (template: ReadyTemplate) => {
    try {
      const { data } = await api.post('/api/v3/start-interview', {
        interview_type: template.interview_type,
        job_position: template.job_position,
        company: template.company || 'N/A',
        template_id: template.id
      });
      navigate(`/interview/${data.session_id}`);
    } catch (err) {
      console.error('Failed to start interview:', err);
      alert('Failed to start interview');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInterviewTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'technical': 'bg-blue-100 text-blue-800',
      'behavioral': 'bg-green-100 text-green-800',
      'systems-design': 'bg-purple-100 text-purple-800',
      'hr': 'bg-yellow-100 text-yellow-800',
      'case-study': 'bg-pink-100 text-pink-800',
      'coding': 'bg-indigo-100 text-indigo-800',
      'phone-screening': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Seo
        title="Dashboard"
        description="Private Interview Pro dashboard with recent interviews and recommended templates."
        canonicalPath="/home"
        noIndex
      />
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview Pro</h1>
              <p className="text-gray-600 text-sm mt-1">Master your interview skills</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/templates')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                Browse All
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Recent Interviews Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📊 Recent Interviews</h2>
              <p className="text-gray-600 text-sm mt-1">Your last completed interviews</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
            >
              View All →
            </button>
          </div>

          {recentInterviews.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border-2 border-dashed border-gray-300">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No interviews yet</h3>
              <p className="text-gray-600 mb-6">Start practicing with ready-made templates below!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentInterviews.map((interview, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 border-l-4 border-indigo-500"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{interview.job_position}</h3>
                      <p className="text-sm text-gray-600">{interview.company}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getInterviewTypeColor(interview.interview_type)}`}>
                      {interview.interview_type}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    Completed: {formatDate(interview.finished_at)}
                  </div>

                  {interview.feedback && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                      <p className="text-xs text-blue-900 line-clamp-2">{interview.feedback}</p>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/interview/${interview.session_id}`)}
                    className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-2 rounded transition text-sm"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Divider */}
        <hr className="border-gray-300 my-12" />

        {/* Ready Templates Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🚀 Ready Interview Templates</h2>
              <p className="text-gray-600 text-sm mt-1">Start practicing now</p>
            </div>
            <button
              onClick={() => navigate('/templates')}
              className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
            >
              View All →
            </button>
          </div>

          {readyTemplates.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border-2 border-dashed border-gray-300">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates available</h3>
              <p className="text-gray-600">Check back soon for new interview templates!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {readyTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden transform hover:scale-105 cursor-pointer group"
                >
                  {/* Header with gradient */}
                  <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-pattern"></div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold mb-1">{template.name || 'Interview'}</h3>
                      <p className="text-sm opacity-90">{template.job_position}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600 flex-1">Company:</span>
                        <span className="font-semibold text-gray-900">{template.company || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600 flex-1">Type:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getInterviewTypeColor(template.interview_type)}`}>
                          {template.interview_type}
                        </span>
                      </div>
                    </div>

                    {template.description && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4 pb-4 border-b border-gray-200">
                        {template.description}
                      </p>
                    )}

                    <div className="text-xs text-gray-500 mb-4">
                      Added: {formatDate(template.created_at)}
                    </div>

                    <button
                      onClick={() => handleStartInterview(template)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition transform hover:scale-105"
                    >
                      ▶️ Start Interview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer CTA */}
        <section className="mt-16 text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to level up? 🎯</h3>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Practice with our curated interview templates and get detailed feedback on your performance.
            </p>
            <button
              onClick={() => navigate('/templates')}
              className="bg-white text-indigo-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition transform hover:scale-105"
            >
              Explore All Templates
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
