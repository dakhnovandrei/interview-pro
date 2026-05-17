import React from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';

export const NotFoundPage = () => (
  <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <Seo
      title="Page not found"
      description="The requested Interview Pro page was not found."
      noIndex
    />
    <section className="max-w-md text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">404</p>
      <h1 className="mt-3 text-3xl font-bold text-gray-950">Page not found</h1>
      <p className="mt-4 text-gray-600">This page does not exist or the address has changed.</p>
      <Link to="/" className="mt-6 inline-flex rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">
        Go to homepage
      </Link>
    </section>
  </main>
);
