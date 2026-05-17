import React from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';

export const LandingPage = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Interview Pro',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    description: 'AI interview practice platform with structured templates and feedback.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Seo
        title="AI Interview Practice"
        description="Practice technical, behavioral, HR and coding interviews with ready templates, AI questions and structured preparation workflows."
        canonicalPath="/"
        jsonLd={jsonLd}
      />

      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <Link to="/" className="text-xl font-bold text-indigo-700">Interview Pro</Link>
          <div className="flex items-center gap-3">
            <Link to="/interview-templates" className="text-sm font-semibold text-gray-700 hover:text-indigo-700">
              Templates
            </Link>
            <Link to="/login" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-indigo-700">AI interview training</p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-gray-950 sm:text-5xl">
              Practice interviews with role-specific templates and feedback
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-700">
              Interview Pro helps candidates prepare for technical, behavioral, systems design and HR conversations using structured scenarios and live AI practice sessions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/interview-templates" className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">
                Browse templates
              </Link>
              <Link to="/login" className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:border-indigo-400 hover:text-indigo-700">
                Open workspace
              </Link>
            </div>
          </div>

          <aside className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm" aria-labelledby="platform-highlights">
            <h2 id="platform-highlights" className="text-2xl font-bold text-gray-950">Preparation workflow</h2>
            <div className="mt-6 space-y-5">
              <article>
                <h3 className="font-semibold text-gray-900">Choose a scenario</h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">Start from curated interview templates for common roles and formats.</p>
              </article>
              <article>
                <h3 className="font-semibold text-gray-900">Practice in real time</h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">Answer questions in an interactive AI interview session.</p>
              </article>
              <article>
                <h3 className="font-semibold text-gray-900">Review progress</h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">Track completed sessions and keep improving your responses.</p>
              </article>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
};
