import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { InterviewTemplate, StartInterviewResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { Seo } from '../components/Seo';

export const TemplatesPage = () => {
  const navigate = useNavigate();
  const { hasRole, logout } = useAuth();
  
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<InterviewTemplate | null>(null);
  const [startingInterview, setStartingInterview] = useState(false);

  const canManageTemplates = hasRole(['admin', 'superadmin', 'moderator', 'recruiter', 'interviewer']);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<{items: InterviewTemplate[]; total: number; page: number; page_size: number; total_pages: number}>('/api/v3/interviews?is_template=true');
      setTemplates(data?.items || []);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async (template: InterviewTemplate) => {
    setStartingInterview(true);
    try {
      const { data } = await api.post<StartInterviewResponse>('/api/v3/start-interview', {
        interview_type: template.interview_type,
        job_position: template.job_position,
        company: template.company || 'N/A',
        template_id: template.id
      });
      navigate(`/interview/${data.session_id}`);
    } catch (error) {
      console.error('Failed to start interview:', error);
      alert('Failed to start interview');
    } finally {
      setStartingInterview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Seo
        title="Workspace Templates"
        description="Private catalog of Interview Pro templates available for authenticated users."
        canonicalPath="/templates"
        noIndex
      />
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Scenarios</h1>
            <p className="text-gray-600 text-sm">Choose from ready-made templates or create your own</p>
          </div>
          <div className="flex gap-3">
            {canManageTemplates && (
              <button
                onClick={() => navigate('/templates/create')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                + Create Template
              </button>
            )}
            <button
              onClick={() => navigate('/profile')}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Profile
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No templates available yet.</p>
            {canManageTemplates && (
              <button
                onClick={() => navigate('/templates/create')}
                className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Create First Template
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition transform hover:scale-105 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                  <h3 className="text-xl font-bold">{template.name || 'Unnamed Template'}</h3>
                  <p className="text-sm opacity-90">{template.job_position}</p>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-semibold text-gray-900">{template.company || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-semibold">
                      {template.interview_type}
                    </span>
                  </div>
                  {template.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{template.description}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    Created: {new Date(template.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 border-t flex gap-2">
                  <button
                    onClick={() => handleStartInterview(template)}
                    disabled={startingInterview}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded transition"
                  >
                    {startingInterview ? 'Starting...' : 'Start Interview'}
                  </button>
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded transition"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal for viewing template details */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedTemplate.name || 'Template Details'}</h2>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-2xl font-bold hover:opacity-80"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-gray-600 text-sm">Position</p>
                <p className="font-semibold text-lg">{selectedTemplate.job_position}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Company</p>
                <p className="font-semibold text-lg">{selectedTemplate.company || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Interview Type</p>
                <p className="font-semibold text-lg">{selectedTemplate.interview_type}</p>
              </div>
              {selectedTemplate.description && (
                <div>
                  <p className="text-gray-600 text-sm">Description</p>
                  <p className="text-gray-800">{selectedTemplate.description}</p>
                </div>
              )}
              <button
                onClick={() => {
                  handleStartInterview(selectedTemplate);
                  setSelectedTemplate(null);
                }}
                disabled={startingInterview}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded transition mt-4"
              >
                {startingInterview ? 'Starting...' : 'Start Interview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
