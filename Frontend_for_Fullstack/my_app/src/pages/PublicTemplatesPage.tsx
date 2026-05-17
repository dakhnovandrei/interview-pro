import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios';
import { Seo } from '../components/Seo';
import { InterviewTemplate } from '../types';

export const PublicTemplatesPage = () => {
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    api
      .get<{ items: InterviewTemplate[] }>('/api/v3/interviews?is_template=true&page_size=9')
      .then((response) => {
        if (active) {
          setTemplates(response.data.items || []);
        }
      })
      .catch(() => {
        if (active) {
          setError('Templates are temporarily unavailable.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Interview templates',
    description: 'A catalog of role-based interview practice templates.',
    mainEntity: templates.slice(0, 6).map((template) => ({
      '@type': 'Course',
      name: template.name || `${template.job_position} interview`,
      description: template.description || `${template.interview_type} interview practice for ${template.job_position}`,
      educationalLevel: 'Professional'
    }))
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Seo
        title="Interview Templates"
        description="Browse ready-made interview templates for technical, behavioral, HR, coding and systems design preparation."
        canonicalPath="/interview-templates"
        jsonLd={jsonLd}
      />

      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <Link to="/" className="text-xl font-bold text-indigo-700">Interview Pro</Link>
          <Link to="/login" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Sign in to practice
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section aria-labelledby="templates-title">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Template catalog</p>
          <h1 id="templates-title" className="mt-3 text-4xl font-bold text-gray-950">Interview templates for focused preparation</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-700">
            Select a role and interview format, then continue in the private workspace to launch an AI practice session.
          </p>
        </section>

        {loading && (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading templates">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-56 animate-pulse rounded-lg bg-white shadow-sm" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mt-10 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && templates.length === 0 && (
          <div className="mt-10 rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-950">No templates published yet</h2>
            <p className="mt-2 text-gray-600">The public catalog will appear here when templates are created.</p>
          </div>
        )}

        {!loading && templates.length > 0 && (
          <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Published interview templates">
            {templates.map((template) => (
              <article key={template.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">{template.interview_type}</p>
                <h2 className="mt-3 text-xl font-bold text-gray-950">{template.name || `${template.job_position} interview`}</h2>
                <p className="mt-2 text-sm text-gray-600">{template.company || 'General company preparation'}</p>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-700">
                  {template.description || `Practice questions and answers for a ${template.job_position} interview.`}
                </p>
                <Link to="/login" className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                  Start practice
                </Link>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};
