import "./_group.css";

function GlobeIcon() {
  return (
    <svg aria-hidden="true" width="31" height="31" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" />
      <path d="M4.5 16h23M16 4c3.2 3.4 4.7 7.4 4.7 12S19.2 24.6 16 28M16 4c-3.2 3.4-4.7 7.4-4.7 12S12.8 24.6 16 28M6.8 9.5h18.4M6.8 22.5h18.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.6 12.23c0-.72-.06-1.42-.18-2.1H12v3.97h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.34 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.52c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.58-4.13H3.08v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.42 13.9A6.02 6.02 0 0 1 6.1 12c0-.66.11-1.3.32-1.9V7.5H3.08A10 10 0 0 0 2 12c0 1.62.39 3.15 1.08 4.5l3.34-2.6Z" />
      <path fill="#EA4335" d="M12 5.97c1.47 0 2.8.5 3.84 1.5l2.88-2.88C16.96 2.95 14.7 2 12 2a10 10 0 0 0-8.92 5.5l3.34 2.6C7.2 7.73 9.4 5.97 12 5.97Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.37 12.55c.02 2.2 1.93 2.93 1.95 2.94-.02.05-.3 1.03-.99 2.04-.6.88-1.23 1.75-2.22 1.77-.97.02-1.28-.57-2.4-.57-1.12 0-1.47.55-2.38.59-.95.04-1.67-.95-2.27-1.83-1.24-1.8-2.2-5.08-.92-7.3.63-1.1 1.76-1.8 2.98-1.82.93-.02 1.8.63 2.37.63.58 0 1.66-.78 2.8-.66.48.02 1.83.19 2.7 1.46-.07.04-1.62.95-1.62 2.75ZM14.53 6.53c.5-.6.84-1.43.75-2.26-.73.03-1.61.49-2.13 1.09-.46.53-.87 1.37-.76 2.18.81.06 1.64-.41 2.14-1.01Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

export function Current() {
  return (
    <main className="lm-login-current">
      <section className="lm-login-current-shell" aria-label="LinguaMatch sign in">
        <div className="lm-login-current-mark"><GlobeIcon /></div>
        <p className="lm-login-current-eyebrow">LINGUAMATCH</p>
        <h1>Start learning your way.</h1>
        <p className="lm-login-current-subtitle">
          Sign in to carry lessons and achievements across devices, or practice as a guest on this device.
        </p>

        <div className="lm-login-current-actions">
          <div className="lm-login-current-action lm-login-current-google"><GoogleIcon />Continue with Google</div>
          <div className="lm-login-current-action lm-login-current-apple"><AppleIcon />Continue with Apple</div>
          <div className="lm-login-current-action lm-login-current-guest">Continue as a guest</div>
        </div>

        <div className="lm-login-current-privacy">
          <LockIcon />
          <span>Guest progress stays on this device. Signing in syncs progress to your learner account.</span>
        </div>
      </section>
    </main>
  );
}
