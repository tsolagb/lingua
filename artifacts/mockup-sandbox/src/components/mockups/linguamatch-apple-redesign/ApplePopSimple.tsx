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
import "./ApplePopSimple.css";

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

function ApplePopSimpleLogo() {
  return (
    <div className="lm-aps-brand" aria-label="LinguaMatch">
      <span className="lm-aps-brand-mark" aria-hidden="true">
        <span />
      </span>
      <span>LinguaMatch</span>
    </div>
  );
}

export function ApplePopSimple() {
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
    setActiveNav("Home");
    setFeedback(`${languageMeta[nextLanguage].label} is ready to practise.`);
  };

  const startLearning = () => {
    setFeedback(`Nice choice. Your next ${languageMeta[language].label} lesson is ready.`);
  };

  const chooseNav = (item: NavItem) => {
    setActiveNav(item);
    setFeedback(item === "Home" ? "" : `${item} is part of your learning path.`);
  };

  return (
    <main className="lm-aps" aria-label="LinguaMatch Apple Pop Simple home preview">
      <div className="lm-aps-shell">
        <div className="lm-aps-scroll">
          <header className="lm-aps-header">
            <ApplePopSimpleLogo />
            <span className="lm-aps-day">TUESDAY · 4 MIN</span>
          </header>

          <section className="lm-aps-intro" aria-labelledby="aps-title">
            <p className="lm-aps-kicker">Your daily practice</p>
            <h1 id="aps-title">One small word can take you far.</h1>
            <p className="lm-aps-subtitle">Keep your six-day streak moving with a quick lesson.</p>
          </section>

          <section className="lm-aps-focus" aria-labelledby="aps-lesson-title">
            <div className="lm-aps-focus-top">
              <div>
                <span className="lm-aps-focus-label">Next lesson</span>
                <h2 id="aps-lesson-title">{languageMeta[language].label} basics</h2>
              </div>
              <span className="lm-aps-count">4 WORDS</span>
            </div>

            <div className="lm-aps-word-pair" aria-live="polite">
              <div key={`${language}-${pairIndex}`} className="lm-aps-word is-animated">
                <span>English</span>
                <strong>{currentPair[0]}</strong>
              </div>
              <ArrowRight className="lm-aps-arrow" size={20} strokeWidth={2.6} aria-hidden="true" />
              <div
                key={`${language}-${pairIndex}-translated`}
                className="lm-aps-word lm-aps-word-target is-animated"
              >
                <span>{languageMeta[language].nativeLabel}</span>
                <strong>{currentPair[1]}</strong>
              </div>
            </div>

            <button className="lm-aps-cta" type="button" onClick={startLearning}>
              <span>Continue learning</span>
              <span className="lm-aps-cta-icon" aria-hidden="true">
                <ArrowRight size={18} strokeWidth={2.9} />
              </span>
            </button>
          </section>

          <section className="lm-aps-progress" aria-label="Your progress and streak">
            <div className="lm-aps-progress-line">
              <span className="lm-aps-progress-title">Your progress</span>
              <span className="lm-aps-progress-detail">
                <strong>4</strong> levels <b aria-hidden="true">·</b>
                <strong>9</strong> stars <b aria-hidden="true">·</b>
                <strong>50</strong> left
              </span>
            </div>
            <div className="lm-aps-streak-line">
              <span className="lm-aps-flame">
                <Flame size={15} strokeWidth={2.6} aria-hidden="true" />
              </span>
              <strong>6 day streak</strong>
              <span>Best: 12 days</span>
            </div>
          </section>

          <section className="lm-aps-language" aria-labelledby="aps-language-title">
            <div className="lm-aps-section-heading">
              <h2 id="aps-language-title">Choose a language</h2>
              <span>3 options</span>
            </div>
            <div className="lm-aps-language-switcher" role="group" aria-label="Language choices">
              {(Object.keys(languageMeta) as Language[]).map((item) => {
                const meta = languageMeta[item];
                const active = language === item;
                return (
                  <button
                    className={`lm-aps-language-button${active ? " is-active" : ""}`}
                    key={item}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${meta.label}, ${meta.nativeLabel}`}
                    onClick={() => chooseLanguage(item)}
                  >
                    <span className="lm-aps-language-symbol">{meta.symbol}</span>
                    <span className="lm-aps-language-copy">
                      <strong>{meta.label}</strong>
                      <small>{meta.nativeLabel}</small>
                    </span>
                    <span className="lm-aps-language-check" aria-hidden="true">
                      {active ? <Check size={13} strokeWidth={3.1} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lm-aps-values" aria-label="Why LinguaMatch works">
            <span><RotateCw size={15} strokeWidth={2.4} aria-hidden="true" /> Smart review</span>
            <span><Star size={15} strokeWidth={2.4} aria-hidden="true" /> 3-star ratings</span>
            <span><BarChart3 size={15} strokeWidth={2.4} aria-hidden="true" /> Track progress</span>
          </section>

          <button
            className="lm-aps-coffee"
            type="button"
            onClick={() => setFeedback("Thanks for supporting LinguaMatch.")}
          >
            <Coffee size={14} strokeWidth={2.3} aria-hidden="true" />
            <span>Buy me a coffee</span>
            <Heart size={12} strokeWidth={2.3} aria-hidden="true" />
          </button>
          <p className="lm-aps-footer">Made with care to make language learning fun.</p>
          <p className="lm-aps-feedback" role="status" aria-live="polite">{feedback}</p>
        </div>

        <nav className="lm-aps-nav" aria-label="Primary navigation">
          {navItems.map(({ label, icon: Icon }) => {
            const active = activeNav === label;
            return (
              <button
                className={`lm-aps-nav-button${active ? " is-active" : ""}`}
                key={label}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => chooseNav(label)}
              >
                <span className="lm-aps-nav-icon">
                  <Icon size={18} strokeWidth={active ? 2.6 : 2} aria-hidden="true" />
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

export default ApplePopSimple;