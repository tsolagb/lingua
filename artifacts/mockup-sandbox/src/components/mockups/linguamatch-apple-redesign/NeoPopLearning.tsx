import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Coffee,
  Flame,
  GraduationCap,
  Heart,
  Home,
  RotateCw,
  Star,
  UserRound,
} from "lucide-react";
import "./NeoPopLearning.css";

type Language = "italian" | "french" | "spanish";
type NavItem = "Home" | "Learn" | "Progress" | "You";

const languageMeta: Record<
  Language,
  { label: string; nativeLabel: string; symbol: string; tone: string }
> = {
  italian: { label: "Italian", nativeLabel: "Italiano", symbol: "IT", tone: "lime" },
  french: { label: "French", nativeLabel: "Français", symbol: "FR", tone: "violet" },
  spanish: { label: "Spanish", nativeLabel: "Español", symbol: "ES", tone: "coral" },
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

function NeoPopLogo() {
  return (
    <div className="lm-npl-brand" aria-label="LinguaMatch">
      <span className="lm-npl-brand-mark" aria-hidden="true">
        <BookOpen size={14} strokeWidth={2.8} />
      </span>
      <span>LinguaMatch</span>
    </div>
  );
}

export function NeoPopLearning() {
  const [language, setLanguage] = useState<Language>("italian");
  const [pairIndex, setPairIndex] = useState(0);
  const [activeNav, setActiveNav] = useState<NavItem>("Home");
  const [feedback, setFeedback] = useState("");
  const currentPair = pairs[language][pairIndex];

  useEffect(() => {
    setPairIndex(0);
    const timer = window.setInterval(() => {
      setPairIndex((index) => (index + 1) % pairs[language].length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [language]);

  const chooseLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setActiveNav("Home");
    setFeedback(`${languageMeta[nextLanguage].label} is ready to practise.`);
  };

  const startLearning = () => {
    setFeedback(`Your next ${languageMeta[language].label} lesson is ready.`);
  };

  const chooseNav = (item: NavItem) => {
    setActiveNav(item);
    setFeedback(item === "Home" ? "" : `${item} is part of your learning path.`);
  };

  return (
    <main className="lm-npl" aria-label="LinguaMatch Neo Pop Learning home preview">
      <div className="lm-npl-shell">
        <div className="lm-npl-scroll">
          <header className="lm-npl-topbar">
            <NeoPopLogo />
            <div className="lm-npl-streak" aria-label="Six day streak">
              <Flame size={14} strokeWidth={2.8} aria-hidden="true" />
              <strong>6</strong>
              <span>days</span>
            </div>
          </header>

          <section className="lm-npl-intro" aria-labelledby="npl-title">
            <p className="lm-npl-eyebrow">Tuesday · 4 min today</p>
            <h1 id="npl-title">A little {languageMeta[language].label}. A lot of world.</h1>
            <p>Pick up one more word and keep your streak in motion.</p>
          </section>

          <section className="lm-npl-lesson" aria-labelledby="npl-lesson-title">
            <div className="lm-npl-lesson-top">
              <div>
                <span className="lm-npl-lesson-label">Next lesson</span>
                <h2 id="npl-lesson-title">{languageMeta[language].label} basics</h2>
              </div>
              <span className="lm-npl-lesson-count">4 words</span>
            </div>

            <div className="lm-npl-pair" aria-live="polite">
              <div key={`${language}-${pairIndex}`} className="lm-npl-word lm-npl-word-in">
                <span>English</span>
                <strong>{currentPair[0]}</strong>
              </div>
              <span className="lm-npl-pair-arrow" aria-hidden="true">
                <ArrowRight size={18} strokeWidth={2.8} />
              </span>
              <div
                key={`${language}-${pairIndex}-target`}
                className="lm-npl-word lm-npl-word-target lm-npl-word-in"
              >
                <span>{languageMeta[language].nativeLabel}</span>
                <strong>{currentPair[1]}</strong>
              </div>
            </div>

            <button className="lm-npl-cta" type="button" onClick={startLearning}>
              <span>Continue learning</span>
              <span className="lm-npl-cta-arrow" aria-hidden="true">
                <ArrowRight size={19} strokeWidth={3} />
              </span>
            </button>
          </section>

          <section className="lm-npl-momentum" aria-label="Your progress and streak">
            <div className="lm-npl-momentum-head">
              <span>Your momentum</span>
              <strong>4 of 54 levels</strong>
            </div>
            <div className="lm-npl-rail" aria-hidden="true">
              <span />
            </div>
            <div className="lm-npl-momentum-meta">
              <span><strong>9</strong> stars earned</span>
              <span className="lm-npl-meta-divider" aria-hidden="true" />
              <span><strong>12</strong> best streak</span>
            </div>
          </section>

          <section className="lm-npl-language" aria-labelledby="npl-language-title">
            <div className="lm-npl-section-heading">
              <h2 id="npl-language-title">Choose a language</h2>
              <span>3 ready</span>
            </div>
            <div className="lm-npl-language-grid" role="group" aria-label="Language choices">
              {(Object.keys(languageMeta) as Language[]).map((item) => {
                const meta = languageMeta[item];
                const active = language === item;
                return (
                  <button
                    className={`lm-npl-language-button ${meta.tone}${active ? " is-active" : ""}`}
                    key={item}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${meta.label}, ${meta.nativeLabel}`}
                    onClick={() => chooseLanguage(item)}
                  >
                    <span className="lm-npl-language-symbol">{meta.symbol}</span>
                    <span className="lm-npl-language-copy">
                      <strong>{meta.label}</strong>
                      <small>{meta.nativeLabel}</small>
                    </span>
                    <span className="lm-npl-language-check" aria-hidden="true">
                      {active ? <Check size={12} strokeWidth={3.2} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lm-npl-cues" aria-label="Learning benefits">
            <span><RotateCw size={15} strokeWidth={2.6} aria-hidden="true" /> Smart review</span>
            <span><Star size={15} strokeWidth={2.6} aria-hidden="true" /> Star ratings</span>
            <span><BarChart3 size={15} strokeWidth={2.6} aria-hidden="true" /> See progress</span>
          </section>

          <button
            className="lm-npl-coffee"
            type="button"
            onClick={() => setFeedback("Thanks for supporting LinguaMatch.")}
          >
            <span className="lm-npl-coffee-icon" aria-hidden="true"><Coffee size={14} strokeWidth={2.5} /></span>
            <span>Support the app</span>
            <Heart size={14} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <p className="lm-npl-footer">Made with care for curious language learners.</p>
          <p className="lm-npl-feedback" role="status" aria-live="polite">{feedback}</p>
        </div>

        <nav className="lm-npl-nav" aria-label="Primary navigation">
          {navItems.map(({ label, icon: Icon }) => {
            const active = activeNav === label;
            return (
              <button
                className={`lm-npl-nav-button${active ? " is-active" : ""}`}
                key={label}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => chooseNav(label)}
              >
                <span className="lm-npl-nav-icon">
                  <Icon size={18} strokeWidth={active ? 2.7 : 2} aria-hidden="true" />
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

export default NeoPopLearning;