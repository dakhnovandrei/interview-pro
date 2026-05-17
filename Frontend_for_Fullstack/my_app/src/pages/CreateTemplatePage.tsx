import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Seo } from '../components/Seo';

export const CreateTemplatePage = () => {
  const navigate = useNavigate();
  const { hasRole, logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    job_position: '',
    company: '',
    interview_type: 'technical',
    description: ''
  });

  // Check if user has permission to create templates
  const canCreate = hasRole(['admin', 'superadmin', 'moderator', 'recruiter', 'interviewer']);

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to create interview templates.</p>
          <button
            onClick={() => navigate('/templates')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  const interviewTypes = [
    'technical',
    'behavioral',
    'systems-design',
    'hr',
    'case-study',
    'coding',
    'phone-screening'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.job_position || !formData.interview_type) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/v3/interviews/templates', {
        ...formData
      });
      alert('Template created successfully!');
      navigate('/templates');
    } catch (err: any) {
      console.error('Failed to create template:', err);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
      setError(err.response?.data?.detail || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Seo
        title="Create Template"
        description="Private Interview Pro template creation page."
        canonicalPath="/templates/create"
        noIndex
      />
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Create Interview Template</h1>
          <button
            onClick={() => navigate('/templates')}
            className="text-gray-600 hover:text-gray-900 text-2xl"
          >
            ←
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Template Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Senior React Developer Interview"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
              <p className="text-gray-500 text-sm mt-1">A memorable name for this interview template</p>
            </div>

            {/* Job Position */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Position <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="job_position"
                value={formData.job_position}
                onChange={handleChange}
                placeholder="e.g., Senior Full Stack Developer"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company (Optional)
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g., Tech Company Inc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Interview Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Interview Type <span className="text-red-500">*</span>
              </label>
              <select
                name="interview_type"
                value={formData.interview_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              >
                {interviewTypes.map(type => (
                  <option key={type} value={type}>
                    {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the key topics, skills to be evaluated, or any special notes about this interview..."
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                {loading ? 'Creating...' : 'Create Template'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/templates')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Creating Templates</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Use clear, descriptive names so candidates understand the interview format</li>
            <li>• Include the specific position and required skills in the description</li>
            <li>• Choose the interview type that matches your evaluation needs</li>
            <li>• You can edit or delete templates from the templates page</li>
          </ul>
        </div>
      </main>
    </div>
  );
};
