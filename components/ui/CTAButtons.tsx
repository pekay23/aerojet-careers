'use client';

import Link from 'next/link';

export function CTAButtons() {
  return (
    <div className="cta-buttons">
      <Link href="/jobs" className="btn btn-white btn-lg">
        View All Vacancies
      </Link>
      <a
        href="https://www.aerojet-aviation.com/contact"
        className="btn btn-secondary btn-lg"
      >
        Contact Us
      </a>
    </div>
  );
}
