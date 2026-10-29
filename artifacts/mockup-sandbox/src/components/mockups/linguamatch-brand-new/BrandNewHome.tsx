import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Coffee,
  Compass,
  Flame,
  GraduationCap,
  Globe2,
  Heart,
  Home,
  MapPin,
  RotateCw,
  Star,
  Ticket,
  UserRound,
} from "lucide-react";
import "./BrandNewHome.css";

type Language = "italian" | "french" | "spanish";
type NavItem = "Home" | "Learn" | "Progress" | "You";

const destinations: Record<
  Language,
  {
    label: string;
    nativeLabel: string;
    city: string;
    region: string;
    symbol: string;
    tone: string;
  }
> = {
  italian: {
    label: "Italian",
    nativeLabel: "Italiano",
    city: "Rome",
    region: "Italy",
    symbol: "IT",
    tone: "coral",
  },
  french: {
    label: "French",
    nativeLabel: "Français",
    city: "Paris",
    region: "France",
    symbol: "FR",
    tone: "violet",
  },
  spanish: {
    label: "Spanish",
    nativeLabel: "Español",
    city: "Madrid",
    region: "Spain",
    symbol: "ES",
    tone: "lime",
  },
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

const languageOrder: Language[] = ["italian", "french", "spanish"];

function PassportMark() {
  return (
    <div className="lm-bnh-brand" aria-label="LinguaMatch">
      <span className="lm-bnh-brand-mark" aria-hidden="true">
        <Globe2 size={15} strokeWidth={2.8} />
      </span>
      <span>LinguaMatch</span>
    </div>
  );
}

export function BrandNewHome() {
  const [language, setLanguage] = useState<Language>("italian");
  const [pairIndex, setPairIndex] = useState(0);
  const [selectedStop, setSelectedStop] = useState<Language>("italian");
  const [activeNav, setActiveNav] = useState<NavItem>("Home");
  const [feedback, setFeedback] = useState("");
  const destination = destinations[language];
  const currentPair = pairs[language][pairIndex];

  useEffect(() => {
    setPairIndex(0);
    const timer = window.setInterval(() => {
      setPairIndex((index) => (index + 1) % pairs[language].length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [language]);

  const chooseDestination = (nextLanguage: Language) => {
    setSelectedStop(nextLanguage);
    setLanguage(nextLanguage);
    setActiveNav("Home");
    setFeedback(`${destinations[nextLanguage].label} is your next stop.`);
  };

  const startLearning = () => {
    setFeedback(`Boarding for ${destination.city}. Your lesson is ready.`);
  };

  const chooseNav = (item: NavItem) => {
    setActiveNav(item);
    setFeedback(item === "Home" ? "" : `${item} is part of your journey.`);
  };

  return (
    <main className="lm-bnh" aria-label="LinguaMatch language journey home preview">
      <div className="lm-bnh-shell">
        <div className="lm-bnh-scroll">
          <header className="lm-bnh-topbar">
            <PassportMark />
            <div className="lm-bnh-trip-meta">
              <span className="lm-bnh-trip-number">TRIP 01</span>
              <span className="lm-bnh-streak" aria-label="Six day streak">
                <Flame size={13} strokeWidth={2.8} aria-hidden="true" />
                <strong>6</strong>
              </span>
            </div>
          </header>

          <section className="lm-bnh-intro" aria-labelledby="bnh-title">
            <p className="lm-bnh-eyebrow"><Compass size={13} strokeWidth={2.8} aria-hidden="true" /> Your language journey</p>
            <h1 id="bnh-title">Next stop:<br /><em>{destination.city}</em>.</h1>
            <p>Every new word opens another little corner of the world.</p>
          </section>

          <section className="lm-bnh-route" aria-labelledby="bnh-route-title">
            <div className="lm-bnh-route-head">
              <div>
                <p>Passport route</p>
                <h2 id="bnh-route-title">Choose your next stop</h2>
              </div>
              <span><Ticket size={13} strokeWidth={2.5} aria-hidden="true" /> 12 / 30</span>
            </div>
            <div className="lm-bnh-route-map" role="group" aria-label="Language destinations">
              <span className="lm-bnh-route-line" aria-hidden="true" />
              {languageOrder.map((item, index) => {
                const stop = destinations[item];
                const active = selectedStop === item;
                return (
                  <button
                    className={`lm-bnh-stop ${stop.tone}${active ? " is-active" : ""}`}
                    key={item}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${stop.label}, ${stop.city}, ${stop.region}`}
                    onClick={() => chooseDestination(item)}
                  >
                    <span className="lm-bnh-stop-pin">
                      {active ? <Check size={14} strokeWidth={3} /> : <MapPin size={15} strokeWidth={2.6} />}
                    </span>
                    <span className="lm-bnh-stop-index">0{index + 1}</span>
                    <strong>{stop.city}</strong>
                    <small>{stop.label}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lm-bnh-passport" aria-labelledby="bnh-lesson-title">
            <div className="lm-bnh-passport-head">
              <div className="lm-bnh-stamp" aria-hidden="true">
                <span>LM</span>
                <small>READY</small>
              </div>
              <div>
                <span className="lm-bnh-lesson-label">Your next lesson</span>
                <h2 id="bnh-lesson-title">{destination.label} basics</h2>
              </div>
              <span className="lm-bnh-word-count">4 WORDS</span>
            </div>

            <div className="lm-bnh-word-pair" aria-live="polite">
              <div key={`${language}-${pairIndex}`} className="lm-bnh-word lm-bnh-word-in">
                <span>English</span>
                <strong>{currentPair[0]}</strong>
              </div>
              <ArrowRight className="lm-bnh-word-arrow" size={19} strokeWidth={2.8} aria-hidden="true" />
              <div
                key={`${language}-${pairIndex}-target`}
                className="lm-bnh-word lm-bnh-word-target lm-bnh-word-in"
              >
                <span>{destination.nativeLabel}</span>
                <strong>{currentPair[1]}</strong>
              </div>
            </div>

            <button className="lm-bnh-cta" type="button" onClick={startLearning}>
              <span>Start this stop</span>
              <span className="lm-bnh-cta-arrow" aria-hidden="true">
                <ArrowRight size={19} strokeWidth={3} />
              </span>
            </button>
          </section>

          <section className="lm-bnh-passport-stats" aria-label="Journey progress and streak">
            <div className="lm-bnh-stats-title">
              <span>Your passport</span>
              <strong>4 levels visited</strong>
            </div>
            <div className="lm-bnh-stamps" aria-hidden="true">
              <span className="is-filled" />
              <span className="is-filled" />
              <span className="is-filled" />
              <span className="is-filled" />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="lm-bnh-stats-meta">
              <span><strong>9</strong> stars</span>
              <span className="lm-bnh-meta-divider" aria-hidden="true" />
              <span><strong>12</strong> best streak</span>
            </div>
          </section>

          <section className="lm-bnh-cues" aria-label="Learning benefits">
            <span><RotateCw size={14} strokeWidth={2.6} aria-hidden="true" /> Smart review</span>
            <span><Star size={14} strokeWidth={2.6} aria-hidden="true" /> Star ratings</span>
            <span><BarChart3 size={14} strokeWidth={2.6} aria-hidden="true" /> See progress</span>
          </section>

          <button
            className="lm-bnh-coffee"
            type="button"
            onClick={() => setFeedback("Thanks for supporting LinguaMatch.")}
          >
            <Coffee size={14} strokeWidth={2.5} aria-hidden="true" />
            <span>Support the journey</span>
            <Heart size={13} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <p className="lm-bnh-footer">Made with care for curious language learners.</p>
          <p className="lm-bnh-feedback" role="status" aria-live="polite">{feedback}</p>
        </div>

        <nav className="lm-bnh-nav" aria-label="Primary navigation">
          {navItems.map(({ label, icon: Icon }) => {
            const active = activeNav === label;
            return (
              <button
                className={`lm-bnh-nav-button${active ? " is-active" : ""}`}
                key={label}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => chooseNav(label)}
              >
                <span className="lm-bnh-nav-icon">
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

export default BrandNewHome;