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
import "./SimplePop.css";

type Language = "italian" | "french" | "spanish";
type NavItem = "Home" | "Learn" | "Progress" | "You";

const languageMeta: Record<
  Language,
  { label: string; nativeLabel: string; symbol: string; color: string }
> = {
  italian: { label: "Italian", nativeLabel: "Italiano", symbol: "IT", color: "teal" },
  french: { label: "French", nativeLabel: "Français", symbol: "FR", color: "violet" },
  spanish: { label: "Spanish", nativeLabel: "Español", symbol: "ES", color: "butter" },
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

function SimplePopLogo() {
  return (
    <div className="lm-pop-logo" aria-label="LinguaMatch">
      <span className="lm-pop-logo-mark" aria-hidden="true">
        <span />
      </span>
      <span>LinguaMatch</span>
    </div>
  );
}

export function SimplePop() {
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
    <main className="lm-pop" aria-label="LinguaMatch Simple Pop home preview">
      <div className="lm-pop-shell">
        <div className="lm-pop-scroll">
          <header className="lm-pop-header">
            <SimplePopLogo />
            <span className="lm-pop-day">DAY 06</span>
          </header>

          <section className="lm-pop-welcome" aria-labelledby="pop-title">
            <p className="lm-pop-eyebrow">A little practice, every day</p>
            <h1 id="pop-title">Ready for one more word?</h1>
            <p>Keep your streak bright with a quick lesson.</p>
          </section>

          <section className="lm-pop-lesson" aria-labelledby="pop-lesson-title">
            <div className="lm-pop-lesson-topline">
              <span id="pop-lesson-title">Today&apos;s word</span>
              <span className="lm-pop-word-count">01 / 04</span>
            </div>
            <div className="lm-pop-word-pair" aria-live="polite">
              <div key={`${language}-${pairIndex}`} className="lm-pop-word-side is-animated">
                <span>English</span>
                <strong>{currentPair[0]}</strong>
              </div>
              <ArrowRight className="lm-pop-arrow" size={22} strokeWidth={2.8} aria-hidden="true" />
              <div
                key={`${language}-${pairIndex}-translated`}
                className="lm-pop-word-side lm-pop-word-side-target is-animated"
              >
                <span>{languageMeta[language].label}</span>
                <strong>{currentPair[1]}</strong>
              </div>
            </div>
            <button className="lm-pop-primary" type="button" onClick={startLearning}>
              <span>Continue learning</span>
              <span className="lm-pop-primary-icon" aria-hidden="true">
                <ArrowRight size={19} strokeWidth={2.8} />
              </span>
            </button>
          </section>

          <section className="lm-pop-summary" aria-label="Your progress">
            <div className="lm-pop-summary-heading">
              <span>Your progress</span>
              <span className="lm-pop-summary-rule" aria-hidden="true" />
            </div>
            <div className="lm-pop-progress-row">
              <div className="lm-pop-progress-item">
                <span className="lm-pop-progress-icon lm-pop-progress-icon-teal">
                  <Check size={15} strokeWidth={3} aria-hidden="true" />
                </span>
                <span>
                  <strong>4</strong>
                  <small>Levels done</small>
                </span>
              </div>
              <div className="lm-pop-progress-item">
                <span className="lm-pop-progress-icon lm-pop-progress-icon-violet">
                  <Star size={15} strokeWidth={2.7} aria-hidden="true" />
                </span>
                <span>
                  <strong>9</strong>
                  <small>Stars earned</small>
                </span>
              </div>
              <div className="lm-pop-progress-item">
                <span className="lm-pop-progress-icon lm-pop-progress-icon-butter">
                  <BookOpen size={15} strokeWidth={2.7} aria-hidden="true" />
                </span>
                <span>
                  <strong>50</strong>
                  <small>Remaining</small>
                </span>
              </div>
            </div>
          </section>

          <section className="lm-pop-streak" aria-label="Learning streak">
            <span className="lm-pop-streak-icon">
              <Flame size={20} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="lm-pop-streak-copy">
              <strong>6 days</strong>
              <small>Keep your bright streak going</small>
            </span>
            <span className="lm-pop-best">
              <strong>12</strong>
              <small>best</small>
            </span>
          </section>

          <section className="lm-pop-languages" aria-labelledby="pop-language-title">
            <div className="lm-pop-section-heading">
              <h2 id="pop-language-title">Pick a language</h2>
              <span>3 to choose from</span>
            </div>
            <div className="lm-pop-language-list" role="group" aria-label="Language choices">
              {(Object.keys(languageMeta) as Language[]).map((item) => {
                const meta = languageMeta[item];
                const active = language === item;
                return (
                  <button
                    className={`lm-pop-language lm-pop-language-${meta.color}${active ? " is-active" : ""}`}
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() => chooseLanguage(item)}
                  >
                    <span className="lm-pop-language-symbol">{meta.symbol}</span>
                    <span>
                      <strong>{meta.label}</strong>
                      <small>{meta.nativeLabel}</small>
                    </span>
                    <span className="lm-pop-language-state" aria-hidden="true">
                      {active ? <Check size={14} strokeWidth={3} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lm-pop-values" aria-label="Why LinguaMatch works">
            <div>
              <RotateCw size={17} strokeWidth={2.3} aria-hidden="true" />
              <span>Smart review</span>
            </div>
            <div>
              <Star size={17} strokeWidth={2.3} aria-hidden="true" />
              <span>3-star ratings</span>
            </div>
            <div>
              <BarChart3 size={17} strokeWidth={2.3} aria-hidden="true" />
              <span>Track progress</span>
            </div>
          </section>

          <button
            className="lm-pop-coffee"
            type="button"
            onClick={() => setFeedback("Thanks for supporting LinguaMatch.")}
          >
            <Coffee size={14} strokeWidth={2.4} aria-hidden="true" />
            <span>Buy me a coffee</span>
            <Heart size={13} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <p className="lm-pop-footer">Made with care to make language learning fun.</p>
          <p className="lm-pop-feedback" role="status" aria-live="polite">
            {feedback}
          </p>
        </div>

        <nav className="lm-pop-nav" aria-label="Primary navigation">
          {navItems.map(({ label, icon: Icon }) => {
            const active = activeNav === label;
            return (
              <button
                className={`lm-pop-nav-button${active ? " is-active" : ""}`}
                key={label}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => chooseNav(label)}
              >
                <span className="lm-pop-nav-icon">
                  <Icon size={18} strokeWidth={active ? 2.7 : 2.1} aria-hidden="true" />
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

export default SimplePop;