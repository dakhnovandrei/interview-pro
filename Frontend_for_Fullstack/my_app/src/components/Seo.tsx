import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'Interview Pro';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
const DEFAULT_IMAGE = `${SITE_URL}/og-interview-pro.svg`;

type SeoProps = {
  title: string;
  description: string;
  canonicalPath?: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
  jsonLd?: Record<string, unknown>;
};

const setMeta = (selector: string, attr: 'content' | 'href', value: string) => {
  let element = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;

  if (!element) {
    element = selector.startsWith('link')
      ? document.createElement('link')
      : document.createElement('meta');

    if (selector.includes('property=')) {
      element.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
    } else if (selector.includes('name=')) {
      element.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
    } else if (selector.includes('rel=')) {
      element.setAttribute('rel', selector.match(/rel="([^"]+)"/)?.[1] || '');
    }
    document.head.appendChild(element);
  }

  element.setAttribute(attr, value);
};

export const Seo = ({
  title,
  description,
  canonicalPath,
  noIndex = false,
  type = 'website',
  jsonLd
}: SeoProps) => {
  const location = useLocation();
  const canonicalUrl = `${SITE_URL}${canonicalPath || location.pathname}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  useEffect(() => {
    document.title = fullTitle;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[name="robots"]', 'content', noIndex ? 'noindex, nofollow' : 'index, follow');
    setMeta('link[rel="canonical"]', 'href', canonicalUrl);
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:type"]', 'content', type);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('meta[property="og:image"]', 'content', DEFAULT_IMAGE);
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);

    const scriptId = 'page-json-ld';
    document.getElementById(scriptId)?.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [canonicalUrl, description, fullTitle, jsonLd, noIndex, type]);

  return null;
};
