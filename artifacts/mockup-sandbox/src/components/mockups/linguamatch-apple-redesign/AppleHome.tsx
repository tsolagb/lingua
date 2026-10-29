import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Coffee,
  Flame,
  GraduationCap,
  Heart,
  Home,
  RotateCw,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import "./AppleHome.css";

type Language = "italian" | "french" | "spanish";
type NavItem = "Home" | "Learn" | "Progress" | "You";

const languageMeta: Record<
  Language,
  { label: string; nativeLabel: string; symbol: string }
> = {
  italian: { label: "Italian", nativeLabel: "Italiano", symbol: "IT" },
  french: { label: "French", nativeLabel: "Français", symbol: "FR" },
  spanish: { label: "Spanish", nativeLabel: "Español", symbol: "ES" },
};

const pairs: Record<Language, [string, string][]> = {
  italian: [
    ["cat", "gatto"],
    ["dog", "cane"],
    ["house", "casa"],
    ["sun", "sole"],
  ],
  french: [
    ["cat", "chat"],
    ["dog", "chien"],
    ["house", "maison"],
    ["sun", "soleil"],
  ],
  spanish: [
    ["cat", "gato"],
    ["dog", "perro"],
    ["house", "casa"],
    ["sun", "sol"],
  ],
};

const navItems: { label: NavItem; icon: typeof Home }[] = [
  { label: "Home", icon: Home },
  { label: "Learn", icon: GraduationCap },
  { label: "Progress", icon: BarChart3 },
  { label: "You", icon: UserRound },
];

function LinguaMatchAppleLogo() {
  return (
    <div className="lm-apple-brand" aria-label="LinguaMatch">
      <span className="lm-apple-mark" aria-hidden="true" />
      <span>LinguaMatch</span>
    </div>
  );
}

export function AppleHome() {
  const [language, setLanguage] = useState<Language>("italian");
  const [pairIndex, setPairIndex] = useState(0);
  const [activeNav, setActiveNav] = useState<NavItem>("Home");
  const [feedback, setFeedback] = useState("");
  const currentPair = pairs[language][pairIndex];

  useEffect(() => {
    setPairIndex(0);
    const timer = window.setInterval(() => {
      setPairIndex((index) => (index + 1) % pairs[language].length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, [language]);

  const chooseLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setFeedback(
      nextLanguage === "italian"
        ? "Your Italian practice is ready."
        : `${languageMeta[nextLanguage].label} practice is ready.`,
    );
  };

  const continueLearning = () => {
    setFeedback(`Your next ${languageMeta[language].label} lesson is ready.`);
  };

  const chooseNav = (item: NavItem) => {
    setActiveNav(item);
    if (item !== "Home") {
      setFeedback(`${item} is part of your learning path.`);
    } else {
      setFeedback("");
    }
  };

  return (
    <main className="lm-apple" aria-label="LinguaMatch Apple-inspired home preview">
      <div className="lm-apple-shell">
        <div className="lm-apple-scroll">
          <header className="lm-apple-header">
            <LinguaMatchAppleLogo />
            <div className="lm-apple-header-note">
              <Sparkles size={13} strokeWidth={2.3} aria-hidden="true" />
              <span>Daily practice</span>
            </div>
          </header>

          <section className="lm-apple-intro" aria-labelledby="apple-home-title">
            <p className="lm-apple-kicker">A few minutes goes far</p>
            <h1 className="lm-apple-title" id="apple-home-title">
              Keep your language close.
            </h1>
            <p className="lm-apple-subtitle">
              A gentle place to return to, with one new word waiting for you.
            </p>
          </section>

          <section className="lm-apple-word-card" aria-label="Rotating word matching example">
            <div key={`${language}-${pairIndex}`} className="lm-apple-word is-animated">
              <span className="lm-apple-word-label">In English</span>
              <span>{currentPair[0]}</span>
            </div>
            <div className="lm-apple-word-arrow" aria-hidden="true">
              <ArrowLeftRight size={16} strokeWidth={2.2} />
            </div>
            <div key={`${language}-${pairIndex}-translated`} className="lm-apple-word lm-apple-word-right is-animated">
              <span className="lm-apple-word-label">In {languageMeta[language].label}</span>
              <span>{currentPair[1]}</span>
            </div>
          </section>

          <section aria-labelledby="apple-progress-label">
            <h2 className="lm-apple-section-label" id="apple-progress-label">
              Your progress
            </h2>
            <div className="lm-apple-progress">
              <div className="lm-apple-stat">
                <span className="lm-apple-stat-icon">
                  <Check size={14} strokeWidth={2.5} />
                </span>
                <span className="lm-apple-stat-copy">
                  <strong>4</strong>
                  <small>Levels done</small>
                </span>
              </div>
              <i className="lm-apple-divider" aria-hidden="true" />
              <div className="lm-apple-stat">
                <span className="lm-apple-stat-icon">
                  <Star size={14} strokeWidth={2.5} />
                </span>
                <span className="lm-apple-stat-copy">
                  <strong>9</strong>
                  <small>Stars earned</small>
                </span>
              </div>
              <i className="lm-apple-divider" aria-hidden="true" />
              <div className="lm-apple-stat">
                <span className="lm-apple-stat-icon">
                  <BookOpen size={14} strokeWidth={2.5} />
                </span>
                <span className="lm-apple-stat-copy">
                  <strong>50</strong>
                  <small>Remaining</small>
                </span>
              </div>
            </div>
          </section>

          <section className="lm-apple-streak" aria-label="Learning streak">
            <div className="lm-apple-streak-main">
              <span className="lm-apple-flame">
                <Flame size={21} strokeWidth={2.2} aria-hidden="true" />
              </span>
              <div>
                <div className="lm-apple-streak-count">
                  <strong>6</strong>
                  <span>day<br />streak</span>
                </div>
                <p className="lm-apple-streak-note">Great consistency. Keep it going.</p>
              </div>
            </div>
            <div className="lm-apple-best">
              <strong>12</strong>
              <span>Best<br />streak</span>
            </div>
          </section>

          <button className="lm-apple-cta" type="button" onClick={continueLearning}>
            <span>Continue learning</span>
            <span className="lm-apple-cta-arrow" aria-hidden="true">
              <ChevronRight size={20} strokeWidth={2.5} />
            </span>
          </button>

          <section className="lm-apple-language" aria-labelledby="apple-language-label">
            <h2 className="lm-apple-section-label" id="apple-language-label">
              Choose your language
            </h2>
            <div className="lm-apple-language-grid" role="group" aria-label="Language choices">
              {(Object.keys(languageMeta) as Language[]).map((item) => {
                const meta = languageMeta[item];
                const active = item === language;
                return (
                  <button
                    className={`lm-apple-language-button${active ? " is-active" : ""}`}
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() => chooseLanguage(item)}
                  >
                    <span className="lm-apple-language-symbol">{meta.symbol}</span>
                    {active && (
                      <span className="lm-apple-language-check" aria-hidden="true">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <strong>{meta.label}</strong>
                    <small>{meta.nativeLabel}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lm-apple-value" aria-label="LinguaMatch features">
            <div className="lm-apple-value-item">
              <RotateCw size={17} strokeWidth={2.1} aria-hidden="true" />
              <b>Smart review</b>
            </div>
            <div className="lm-apple-value-item">
              <Star size={17} strokeWidth={2.1} aria-hidden="true" />
              <b>3-star ratings</b>
            </div>
            <div className="lm-apple-value-item">
              <BarChart3 size={17} strokeWidth={2.1} aria-hidden="true" />
              <b>Track progress</b>
            </div>
          </section>

          <button
            className="lm-apple-coffee"
            type="button"
            onClick={() => setFeedback("Thanks for supporting LinguaMatch.")}
          >
            <Coffee size={14} strokeWidth={2.2} aria-hidden="true" />
            <span>Buy me a coffee</span>
            <Heart size={12} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <p className="lm-apple-footer-note">Made with care to make language learning fun.</p>
          <p className="lm-apple-feedback" role="status" aria-live="polite">
            {feedback}
          </p>
        </div>

        <nav className="lm-apple-nav" aria-label="Primary navigation">
          {navItems.map(({ label, icon: Icon }) => {
            const active = activeNav === label;
            return (
              <button
                className={`lm-apple-nav-button${active ? " is-active" : ""}`}
                key={label}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => chooseNav(label)}
              >
                <span className="lm-apple-nav-icon">
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </main>
  );
}

export default AppleHome;