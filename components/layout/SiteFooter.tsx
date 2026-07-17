export default function SiteFooter() {
  return (
    <footer style={{ background: 'var(--aero-blue)', color: 'white' }}>
      <div className="max-w-content mx-auto px-8 py-10 text-center">
        <img
          src="/images/aalogowhite-BCKBvd3h.png"
          alt="Aerojet Aviation"
          style={{ height: 36, width: 'auto', margin: '0 auto 1rem', display: 'block' }}
        />
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
          &copy; {new Date().getFullYear()} Aerojet Aviation. All rights reserved.
          {' · '}
          <a href="https://aerojet-aviation.com" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
            aerojet-aviation.com
          </a>
        </p>
      </div>
    </footer>
  )
}
