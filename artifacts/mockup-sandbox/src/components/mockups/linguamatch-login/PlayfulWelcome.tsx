import "./_group.css";
import "./PlayfulWelcome.css";

function PhrasebookMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 112 112" fill="none">
      <circle cx="56" cy="56" r="49" fill="#FFFFFF" />
      <circle cx="56" cy="56" r="43" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="2 5" />
      <path d="M25.5 41.5c9.9-3.4 19.1-1.7 27.5 5v34c-8.4-6.7-17.6-8.4-27.5-5v-34Z" fill="#2563EB" />
      <path d="M86.5 41.5c-9.9-3.4-19.1-1.7-27.5 5v34c8.4-6.7 17.6-8.4 27.5-5v-34Z" fill="#1D4ED8" />
      <path d="M53 46.5v34" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <path d="M33 51.5c5.2-1 10.2-.1 14.7 2.4M33 59c5.2-.9 10.2 0 14.7 2.4M79 51.5c-5.2-1-10.2-.1-14.7 2.4M79 59c-5.2-.9-10.2 0-14.7 2.4" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="56" cy="32" r="18" fill="#DCFCE7" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M39 32h34M56 14c4.6 4.4 6.9 10.4 6.9 18S60.6 45.6 56 50M56 14c-4.6 4.4-6.9 10.4-6.9 18S51.4 45.6 56 50" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m81.5 24 2-4 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="#7C3AED" />
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
    <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
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

export function PlayfulWelcome() {
  return (
    <main className="lm-login-playful">
      <section className="lm-playful-shell" aria-label="LinguaMatch sign in">
        <div className="lm-playful-hero" aria-hidden="true">
          <span className="lm-hero-spark lm-hero-spark-left">✦</span>
          <span className="lm-hero-spark lm-hero-spark-right">✦</span>
          <span className="lm-language-chip lm-language-chip-hola">hola</span>
          <span className="lm-language-chip lm-language-chip-bonjour">bonjour</span>
          <span className="lm-language-chip lm-language-chip-ciao">ciao</span>
          <div className="lm-phrasebook-mark"><PhrasebookMark /></div>
          <span className="lm-hero-dash lm-hero-dash-one" />
          <span className="lm-hero-dash lm-hero-dash-two" />
        </div>

        <div className="lm-playful-brand">
          <span className="lm-brand-dot" />
          <span>LinguaMatch</span>
        </div>

        <div className="lm-playful-intro">
          <h1>Start learning your way.</h1>
          <p>
            Sign in to carry lessons and achievements across devices, or practice as a guest on this device.
          </p>
        </div>

        <div className="lm-playful-actions" aria-label="Choose how to continue">
          <button className="lm-playful-button lm-playful-google" type="button">
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>
          <button className="lm-playful-button lm-playful-apple" type="button">
            <AppleIcon />
            <span>Continue with Apple</span>
          </button>
          <button className="lm-playful-button lm-playful-guest" type="button">
            <span>Continue as a guest</span>
            <span className="lm-guest-arrow" aria-hidden="true">→</span>
          </button>
        </div>

        <div className="lm-playful-privacy">
          <span className="lm-privacy-lock"><LockIcon /></span>
          <p>Guest progress stays on this device. Signing in syncs progress to your learner account.</p>
        </div>
      </section>
    </main>
  );
}
