import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { InterviewTemplate, StartInterviewResponse, PaginatedInterviews } from '../types';
import { useAuth } from '../context/AuthContext';
import { Seo } from '../components/Seo';

export const TemplatesPage = () => {
  const navigate = useNavigate();
  const { hasRole, logout } = useAuth();
  
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<InterviewTemplate | null>(null);
  const [startingInterview, setStartingInterview] = useState(false);

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [totalPages, setTotalPages] = useState(0);
  const [totalTemplates, setTotalTemplates] = useState(0);

  // Filters
  const [filterPosition, setFilterPosition] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  const canManageTemplates = hasRole(['admin', 'superadmin', 'moderator', 'recruiter', 'interviewer']);

  const loadTemplates = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        is_template: 'true',
        page: page.toString(),
        page_size: pageSize.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (filterPosition) params.append('position', filterPosition);
      if (filterCompany) params.append('company', filterCompany);
      if (filterType) params.append('interview_type', filterType);
      if (searchTerm) params.append('search', searchTerm);

      const { data } = await api.get<PaginatedInterviews>(`/api/v3/interviews?${params}`);
      setTemplates((data.items || []) as unknown as InterviewTemplate[]);
      setTotalTemplates(data.total);
      setTotalPages(data.total_pages);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [pageSize, sortBy, sortOrder, filterPosition, filterCompany, filterType, searchTerm, logout, navigate]);

  useEffect(() => {
    loadTemplates(1);
  }, [filterPosition, filterCompany, filterType, searchTerm, pageSize, sortBy, sortOrder, loadTemplates]);

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

  const handleClearFilters = () => {
    setFilterPosition('');
    setFilterCompany('');
    setFilterType('');
    setSearchTerm('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = filterPosition || filterCompany || filterType || searchTerm;

  const inputClasses =
    'px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm';

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Templates</h1>
            <p className="text-gray-600 text-sm">Choose from ready-made templates ({totalTemplates})</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {canManageTemplates && (
              <button
                onClick={() => navigate('/templates/create')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex-1 sm:flex-none"
              >
                + Create Template
              </button>
            )}
            <button
              onClick={() => navigate('/profile')}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex-1 sm:flex-none"
            >
              Profile
            </button>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-white border-b sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg transition text-sm font-semibold ${
                showFilters
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              🔍 {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition text-sm font-semibold"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={inputClasses}
              />
              
              <input
                type="text"
                placeholder="Filter by position"
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className={inputClasses}
              />

              <input
                type="text"
                placeholder="Filter by company"
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className={inputClasses}
              />

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={inputClasses}
              >
                <option value="">All Types</option>
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="systems-design">Systems Design</option>
                <option value="hr">HR</option>
                <option value="case-study">Case Study</option>
                <option value="coding">Coding</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={inputClasses}
              >
                <option value="created_at">Sort: Created</option>
                <option value="updated_at">Sort: Updated</option>
                <option value="job_position">Sort: Position</option>
                <option value="company">Sort: Company</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={inputClasses}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={inputClasses}
              >
                <option value="9">9 per page</option>
                <option value="12">12 per page</option>
                <option value="18">18 per page</option>
                <option value="24">24 per page</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading templates...</p>
            </div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No templates available.</p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="mt-4 text-indigo-600 hover:underline font-semibold"
              >
                Clear filters to see all templates
              </button>
            )}
            {canManageTemplates && !hasActiveFilters && (
              <button
                onClick={() => navigate('/templates/create')}
                className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Create First Template
              </button>
            )}
          </div>
        ) : (
          <>
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
                      {startingInterview ? 'Starting...' : 'Start'}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t">
                <div className="text-gray-600">
                  Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span> 
                  ({totalTemplates} templates)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadTemplates(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition font-semibold"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => loadTemplates(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition font-semibold"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
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
