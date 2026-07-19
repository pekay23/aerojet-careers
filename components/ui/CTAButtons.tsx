'use client';

import Link from 'next/link';

export function CTAButtons() {
  return (
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      <Link
        href="/jobs"
        className="btn-white btn-lg"
      >
        View All Vacancies
      </Link>
      <a
        href="https://www.aerojet-aviation.com/contact"
        className="btn-secondary btn-lg"
      >
        Contact Us
      </a>


    </div>
  );
}