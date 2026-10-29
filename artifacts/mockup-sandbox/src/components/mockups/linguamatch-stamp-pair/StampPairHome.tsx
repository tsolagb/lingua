import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Compass,
  Flame,
  Globe2,
  Home,
  RefreshCw,
  Star,
  UserRound,
} from "lucide-react";
import "./StampPairHome.css";

type Language = "italian" | "french" | "spanish";
type NavItem = "Home" | "Learn" | "Progress" | "You";

const destinations: Record<
  Language,
  {
    label: string;
    nativeLabel: string;
    city: string;
    code: string;
    tone: "it" | "fr" | "es";
  }
> = {
  italian: {
    label: "Italian",
    nativeLabel: "Italiano",
    city: "Rome",
    code: "IT",
    tone: "it",
  },
  french: {
    label: "French",
    nativeLabel: "Français",
    city: "Paris",
    code: "FR",
    tone: "fr",
  },
  spanish: {
    label: "Spanish",
    nativeLabel: "Español",
    city: "Madrid",
    code: "ES",
    tone: "es",
  },
};

const pairs: Record<Language, [string, string][]> = {
  italian: [
    ["hello", "ciao"],
    ["friend", "amico"],
    ["house", "casa"],
    ["sun", "sole"],
  ],
  french: [
    ["hello", "bonjour"],
    ["friend", "ami"],
    ["house", "maison"],
    ["sun", "soleil"],
  ],
  spanish: [
    ["hello", "hola"],
    ["friend", "amigo"],
    ["house", "casa"],
    ["sun", "sol"],
  ],
};

const navItems: { label: NavItem; icon: typeof Home }[] = [
  { label: "Home", icon: Home },
  { label: "Learn", icon: BookOpen },
  { label: "Progress", icon: BarChart3 },
  { label: "You", icon: UserRound },
];

const languages: Language[] = ["italian", "french", "spanish"];

function StampBrand() {
  return (
    <div className="lm-sph-brand" aria-label="LinguaMatch">
      <span className="lm-sph-brand-mark" aria-hidden="true">
        <Globe2 size={15} strokeWidth={2.8} />
      </span>
      <span>LinguaMatch</span>
    </div>
  );
}

export function StampPairHome() {
  const [language, setLanguage] = useState<Language>("italian");
  const [pairIndex, setPairIndex] = useState(0);
  const [activeNav, setActiveNav] = useState<NavItem>("Home");
  const [feedback, setFeedback] = useState("");
  const [stamped, setStamped] = useState(false);
  const destination = destinations[language];
  const currentPair = pairs[language][pairIndex];

  useEffect(() => {
    setPairIndex(0);
    setStamped(false);
    const timer = window.setInterval(() => {
      setPairIndex((index) => (index + 1) % pairs[language].length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [language]);

  const chooseDestination = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setActiveNav("Home");
    setFeedback(`${destinations[nextLanguage].label} is lined up.`);
  };

  const nextWord = () => {
    setPairIndex((index) => (index + 1) % pairs[language].length);
    setFeedback("New pair, same little adventure.");
  };

  const startLearning = () => {
    setStamped(true);
    setFeedback(`Stamped for ${destination.city}. Let’s practise ${currentPair[1]}.`);
  };

  const chooseNav = (item: NavItem) => {
    setActiveNav(item);
    setFeedback(item === "Home" ? "" : `${item} is part of your journey.`);
  };

  return (
    <main className="lm-sph" aria-label="LinguaMatch passport word pair home preview">
      <div className="lm-sph-shell">
        <div className="lm-sph-scroll">
          <header className="lm-sph-topbar">
            <StampBrand />
            <div className="lm-sph-top-meta">
              <span className="lm-sph-trip">TRIP 01</span>
              <span className="lm-sph-streak" aria-label="Six day streak">
                <Flame size={13} strokeWidth={2.8} aria-hidden="true" />
                <strong>6</strong>
              </span>
            </div>
          </header>

          <section className="lm-sph-welcome" aria-labelledby="sph-title">
            <p className="lm-sph-kicker">
              <Compass size={13} strokeWidth={2.8} aria-hidden="true" />
              Today&apos;s tiny trip
            </p>
            <h1 id="sph-title">Pack one word.<br /><em>Go somewhere.</em></h1>
            <p>Your passport is open to one quick pair. Say it, spot it, use it.</p>
          </section>

          <section className="lm-sph-lesson" aria-labelledby="sph-lesson-title">
            <div className="lm-sph-card-top">
              <div>
                <span className="lm-sph-card-label">Passport lesson</span>
                <h2 id="sph-lesson-title">{destination.label} basics</h2>
              </div>
              <span className="lm-sph-count">PAIR {pairIndex + 1} / 4</span>
            </div>

            <div className={`lm-sph-stamp${stamped ? " is-stamped" : ""}`} aria-label={stamped ? "Lesson stamped" : "Ready to stamp"}>
              <span>{destination.code}</span>
              <small>{stamped ? "STAMPED" : "READY"}</small>
            </div>

            <div className="lm-sph-pair" aria-live="polite">
              <div className="lm-sph-word source" key={`${language}-${pairIndex}-source`}>
                <span>English</span>
                <strong>{currentPair[0]}</strong>
              </div>
              <ArrowRight className="lm-sph-arrow" size={19} strokeWidth={2.8} aria-hidden="true" />
              <div className="lm-sph-word target" key={`${language}-${pairIndex}-target`}>
                <span>{destination.nativeLabel}</span>
                <strong>{currentPair[1]}</strong>
              </div>
            </div>

            <button className="lm-sph-next-word" type="button" onClick={nextWord}>
              <RefreshCw size={13} strokeWidth={2.8} aria-hidden="true" />
              Show another pair
            </button>

            <button className="lm-sph-cta" type="button" onClick={startLearning}>
              <span>{stamped ? "Practise this pair again" : "Practise this pair"}</span>
              <span className="lm-sph-cta-arrow" aria-hidden="true">
                <ArrowRight size={19} strokeWidth={3} />
              </span>
            </button>
            <p className="lm-sph-feedback" role="status" aria-live="polite">{feedback}</p>
          </section>

          <section className="lm-sph-route" aria-labelledby="sph-route-title">
            <div className="lm-sph-route-head">
              <h3 id="sph-route-title">Your route</h3>
              <span>12 / 30 stamps</span>
            </div>
            <div className="lm-sph-route-stops" role="group" aria-label="Language destinations">
              <span className="lm-sph-route-line" aria-hidden="true" />
              {languages.map((item) => {
                const stop = destinations[item];
                const active = language === item;
                return (
                  <button
                    className={`lm-sph-stop ${stop.tone}${active ? " is-active" : ""}`}
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() => chooseDestination(item)}
                  >
                    <span className="lm-sph-stop-dot">
                      {active ? <Check size={13} strokeWidth={3} /> : <Globe2 size={13} strokeWidth={2.5} />}
                    </span>
                    <strong>{stop.city}</strong>
                    <small>{stop.label}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lm-sph-stats" aria-label="Passport progress">
            <div className="lm-sph-stats-head">
              <span>Passport progress</span>
              <strong>4 levels visited</strong>
            </div>
            <div className="lm-sph-progress" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                <span className={index < 4 ? "filled" : ""} key={index} />
              ))}
            </div>
            <div className="lm-sph-stat-line">
              <span><strong>9</strong> stars</span>
              <span className="lm-sph-divider" aria-hidden="true" />
              <span><strong>12</strong> best streak</span>
              <span className="lm-sph-divider" aria-hidden="true" />
              <span><Star size={11} strokeWidth={2.8} aria-hidden="true" /> keep going</span>
            </div>
          </section>

          <p className="lm-sph-footer">Made for curious little travellers.</p>
        </div>

        <nav className="lm-sph-nav" aria-label="Primary navigation">
          {navItems.map(({ label, icon: Icon }) => {
            const active = activeNav === label;
            return (
              <button
                className={`lm-sph-nav-button${active ? " is-active" : ""}`}
                key={label}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => chooseNav(label)}
              >
                <span className="lm-sph-nav-icon">
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

export default StampPairHome;