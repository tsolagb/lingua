import { useState } from "react";
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
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import "./StampPairRewardHome.css";

type Language = "italian" | "french" | "spanish";
type NavItem = "Home" | "Learn" | "Progress" | "You";

const destinations: Record<Language, {
  label: string;
  nativeLabel: string;
  city: string;
  code: string;
  tone: "it" | "fr" | "es";
}> = {
  italian: { label: "Italian", nativeLabel: "Italiano", city: "Rome", code: "IT", tone: "it" },
  french: { label: "French", nativeLabel: "Français", city: "Paris", code: "FR", tone: "fr" },
  spanish: { label: "Spanish", nativeLabel: "Español", city: "Madrid", code: "ES", tone: "es" },
};

const pairs: Record<Language, [string, string][]> = {
  italian: [["hello", "ciao"], ["friend", "amico"], ["house", "casa"], ["sun", "sole"]],
  french: [["hello", "bonjour"], ["friend", "ami"], ["house", "maison"], ["sun", "soleil"]],
  spanish: [["hello", "hola"], ["friend", "amigo"], ["house", "casa"], ["sun", "sol"]],
};

const navItems: { label: NavItem; icon: typeof Home }[] = [
  { label: "Home", icon: Home },
  { label: "Learn", icon: BookOpen },
  { label: "Progress", icon: BarChart3 },
  { label: "You", icon: UserRound },
];

const languages: Language[] = ["italian", "french", "spanish"];

function RewardBrand() {
  return (
    <div className="lm-sr-brand" aria-label="LinguaMatch">
      <span className="lm-sr-brand-mark" aria-hidden="true">
        <Globe2 size={15} strokeWidth={2.8} />
      </span>
      <span>LinguaMatch</span>
    </div>
  );
}

export function StampPairRewardHome() {
  const [language, setLanguage] = useState<Language>("italian");
  const [pairIndex, setPairIndex] = useState(0);
  const [activeNav, setActiveNav] = useState<NavItem>("Home");
  const [earned, setEarned] = useState(false);
  const [feedback, setFeedback] = useState("Ready when you are.");
  const destination = destinations[language];
  const currentPair = pairs[language][pairIndex];

  const chooseDestination = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setPairIndex(0);
    setEarned(false);
    setActiveNav("Home");
    setFeedback(`${destinations[nextLanguage].label} is lined up.`);
  };

  const nextWord = () => {
    setPairIndex((index) => (index + 1) % pairs[language].length);
    setEarned(false);
    setFeedback("A fresh pair to pocket.");
  };

  const handleAction = () => {
    if (earned) {
      nextWord();
      return;
    }
    setEarned(true);
    setFeedback(`Stamp earned. You found ${currentPair[1]}!`);
  };

  const chooseNav = (item: NavItem) => {
    setActiveNav(item);
    setFeedback(item === "Home" ? "Ready when you are." : `${item} is part of your journey.`);
  };

  return (
    <main className="lm-sr" aria-label="LinguaMatch passport reward preview">
      <div className="lm-sr-shell">
        <div className="lm-sr-scroll">
          <header className="lm-sr-topbar">
            <RewardBrand />
            <div className="lm-sr-trip-meta">
              <span className="lm-sr-trip">TRIP 01</span>
              <span className="lm-sr-streak" aria-label="Six day streak">
                <Flame size={13} strokeWidth={2.8} aria-hidden="true" />
                <strong>6</strong>
              </span>
            </div>
          </header>

          <section className="lm-sr-intro" aria-labelledby="sr-title">
            <p className="lm-sr-kicker">
              <Compass size={13} strokeWidth={2.8} aria-hidden="true" />
              Today&apos;s tiny trip
            </p>
            <h1 id="sr-title">Pack one word.<br /><em>Go somewhere.</em></h1>
            <p>Say the pair, earn the stamp, and keep your little route moving.</p>
          </section>

          <section className="lm-sr-lesson" aria-labelledby="sr-lesson-title">
            <div className="lm-sr-lesson-top">
              <div>
                <span className="lm-sr-card-label">Passport lesson</span>
                <h2 id="sr-lesson-title">{destination.label} basics</h2>
              </div>
              <span className="lm-sr-count">PAIR {pairIndex + 1} / 4</span>
            </div>

            <div className={`lm-sr-reward${earned ? " is-earned" : ""}`} aria-label={earned ? "Stamp earned" : "Stamp waiting"}>
              {earned ? <Check size={18} strokeWidth={3.4} aria-hidden="true" /> : <strong>{destination.code}</strong>}
              <small>{earned ? "EARNED" : "WAITING"}</small>
            </div>

            <div className="lm-sr-pair" aria-live="polite">
              <div className="lm-sr-word source" key={`${language}-${pairIndex}-source`}>
                <span>English</span>
                <strong>{currentPair[0]}</strong>
              </div>
              <ArrowRight className="lm-sr-pair-arrow" size={18} strokeWidth={2.8} aria-hidden="true" />
              <div className="lm-sr-word target" key={`${language}-${pairIndex}-target`}>
                <span>{destination.nativeLabel}</span>
                <strong>{currentPair[1]}</strong>
              </div>
            </div>

            <button className="lm-sr-next-word" type="button" onClick={nextWord}>
              <RefreshCw size={13} strokeWidth={2.8} aria-hidden="true" />
              Show another pair
            </button>

            <button className="lm-sr-action" type="button" onClick={handleAction}>
              <span>{earned ? "Next pair" : "I know this pair"}</span>
              <span className="lm-sr-action-icon" aria-hidden="true">
                {earned ? <ArrowRight size={19} strokeWidth={3} /> : <Sparkles size={18} strokeWidth={2.8} />}
              </span>
            </button>
            <p className={`lm-sr-feedback${earned ? " is-earned" : ""}`} role="status" aria-live="polite">
              {feedback}
            </p>
          </section>

          <section className="lm-sr-route" aria-labelledby="sr-route-title">
            <div className="lm-sr-route-head">
              <h3 id="sr-route-title">Your route</h3>
              <span>12 / 30 stamps</span>
            </div>
            <div className="lm-sr-route-stops" role="group" aria-label="Language destinations">
              <span className="lm-sr-route-line" aria-hidden="true" />
              {languages.map((item) => {
                const stop = destinations[item];
                const active = language === item;
                return (
                  <button
                    className={`lm-sr-stop ${stop.tone}${active ? " is-active" : ""}`}
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() => chooseDestination(item)}
                  >
                    <span className="lm-sr-stop-dot">
                      {active ? <Check size={13} strokeWidth={3} /> : <Globe2 size={13} strokeWidth={2.5} />}
                    </span>
                    <strong>{stop.city}</strong>
                    <small>{stop.label}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lm-sr-stats" aria-label="Passport progress">
            <div className="lm-sr-stats-head">
              <span>Passport progress</span>
              <strong>{earned ? "5 levels visited" : "4 levels visited"}</strong>
            </div>
            <div className="lm-sr-progress" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                <span className={index < (earned ? 5 : 4) ? "filled" : ""} key={index} />
              ))}
            </div>
            <div className="lm-sr-stat-line">
              <span><strong>{earned ? 10 : 9}</strong> stars</span>
              <span className="lm-sr-divider" aria-hidden="true" />
              <span><strong>12</strong> best streak</span>
              <span className="lm-sr-divider" aria-hidden="true" />
              <span><Star size={11} strokeWidth={2.8} aria-hidden="true" /> keep going</span>
            </div>
          </section>

          <p className="lm-sr-footer">Made for curious little travellers.</p>
        </div>

        <nav className="lm-sr-nav" aria-label="Primary navigation">
          {navItems.map(({ label, icon: Icon }) => {
            const active = activeNav === label;
            return (
              <button
                className={`lm-sr-nav-button${active ? " is-active" : ""}`}
                key={label}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => chooseNav(label)}
              >
                <span className="lm-sr-nav-icon">
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

export default StampPairRewardHome;