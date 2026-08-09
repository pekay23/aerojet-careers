'use client';

import Link from 'next/link';

export function CTAButtons() {
  return (
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', boxSizing: 'border-box' }}>
      <Link
        href="/jobs"
        className="btn-white btn-lg"
        style={{ boxSizing: 'border-box' }}
      >
        View All Vacancies
      </Link>
      <a
        href="https://www.aerojet-aviation.com/contact"
        className="btn-secondary btn-lg"
        style={{ boxSizing: 'border-box' }}
      >
        Contact Us
      </a>
    </div>
  );
}