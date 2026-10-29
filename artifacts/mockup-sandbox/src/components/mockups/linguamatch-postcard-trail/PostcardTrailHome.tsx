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
  MapPin,
  RefreshCw,
  Star,
  UserRound,
} from "lucide-react";
import "./PostcardTrailHome.css";

type Language = "italian" | "french" | "spanish" | "japanese";
type NavItem = "Home" | "Learn" | "Progress" | "You";

const destinations: Record<Language, { label: string; nativeLabel: string; city: string; code: string }> = {
  italian: { label: "Italian", nativeLabel: "Italiano", city: "Rome", code: "IT" },
  french: { label: "French", nativeLabel: "Français", city: "Paris", code: "FR" },
  spanish: { label: "Spanish", nativeLabel: "Español", city: "Madrid", code: "ES" },
  japanese: { label: "Japanese", nativeLabel: "日本語", city: "Tokyo", code: "JP" },
};

const pairs: Record<Language, [string, string][]> = {
  italian: [["hello", "ciao"], ["friend", "amico"], ["house", "casa"], ["sun", "sole"]],
  french: [["hello", "bonjour"], ["friend", "ami"], ["house", "maison"], ["sun", "soleil"]],
  spanish: [["hello", "hola"], ["friend", "amigo"], ["house", "casa"], ["sun", "sol"]],
  japanese: [["hello", "こんにちは"], ["friend", "友だち"], ["house", "いえ"], ["sun", "太陽"]],
};

const navItems: { label: NavItem; icon: typeof Home }[] = [
  { label: "Home", icon: Home },
  { label: "Learn", icon: BookOpen },
  { label: "Progress", icon: BarChart3 },
  { label: "You", icon: UserRound },
];

export function PostcardTrailHome() {
  const [language, setLanguage] = useState<Language>("italian");
  const [pairIndex, setPairIndex] = useState(0);
  const [activeNav, setActiveNav] = useState<NavItem>("Home");
  const [earned, setEarned] = useState(false);
  const [feedback, setFeedback] = useState("");
  const destination = destinations[language];
  const currentPair = pairs[language][pairIndex];

  const chooseDestination = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setPairIndex(0);
    setEarned(false);
    setActiveNav("Home");
    setFeedback(`${destinations[nextLanguage].city} is your next postcard.`);
  };

  const nextWord = () => {
    setPairIndex((index) => (index + 1) % pairs[language].length);
    setEarned(false);
    setFeedback("Fresh words, same little trip.");
  };

  const stampLesson = () => {
    setEarned(true);
    setFeedback(`Postcard collected. “${currentPair[1]}” is yours to use.`);
  };

  const chooseNav = (item: NavItem) => {
    setActiveNav(item);
    setFeedback(item === "Home" ? "" : `${item} is part of your postcard trail.`);
  };

  return (
    <main className="lm-pct" aria-label="LinguaMatch postcard trail home preview">
      <div className="lm-pct-shell">
        <div className="lm-pct-scroll">
          <header className="lm-pct-topbar">
            <div className="lm-pct-brand" aria-label="LinguaMatch">
              <span className="lm-pct-brand-mark"><Globe2 size={15} strokeWidth={2.8} /></span>
              <span>LinguaMatch</span>
            </div>
            <div className="lm-pct-streak" aria-label="Six day streak">
              <span className="lm-pct-trip">TRIP 01</span>
              <Flame size={14} strokeWidth={2.8} aria-hidden="true" />
              <strong>6</strong>
            </div>
          </header>

          <section className="lm-pct-welcome" aria-labelledby="pct-title">
            <p className="lm-pct-kicker"><Compass size={13} strokeWidth={2.8} aria-hidden="true" /> Today&apos;s tiny trip</p>
            <h1 id="pct-title">Collect a word.<br /><em>Keep the postcard.</em></h1>
            <p>One quick pair becomes one bright little stop on your language trail.</p>
          </section>

          <section className="lm-pct-postcards" aria-label="Collected postcards">
            <button className={`lm-pct-postcard is-current${earned ? " is-earned" : ""}`} type="button" onClick={() => setFeedback("You are at today’s stop.")} aria-label="Today’s postcard">
              <small>Today</small>
              <strong>{destination.city}</strong>
              <span>{earned ? "collected" : "open"}</span>
              <span className="lm-pct-postcard-stamp" aria-hidden="true">{earned ? <Check size={13} strokeWidth={3} /> : <MapPin size={13} />}</span>
            </button>
            <button className="lm-pct-postcard" type="button" onClick={() => setFeedback("Lisbon is waiting further down the trail.")}>
              <small>Next up</small><strong>Lisbon</strong><span>locked</span>
            </button>
            <button className="lm-pct-postcard" type="button" onClick={() => setFeedback("Seoul is a future postcard.")}>
              <small>Stop 03</small><strong>Seoul</strong><span>locked</span>
            </button>
            <button className="lm-pct-postcard" type="button" onClick={() => setFeedback("One word at a time.")}>
              <small>Stop 04</small><strong>More</strong><span>soon</span>
            </button>
          </section>

          <section className="lm-pct-lesson" aria-labelledby="pct-lesson-title">
            <div className="lm-pct-card-top">
              <div><span className="lm-pct-card-label">Passport postcard</span><h2 id="pct-lesson-title">{destination.label} basics</h2></div>
              <span className="lm-pct-count">PAIR {pairIndex + 1} / 4</span>
            </div>
            <div className={`lm-pct-passport${earned ? " is-earned" : ""}`} aria-label={earned ? "Postcard collected" : "Postcard ready to collect"}>
              <div className={`lm-pct-stamp${earned ? " is-earned" : ""}`} aria-hidden="true">
                <span>{destination.code}</span><small>{earned ? "COLLECTED" : "READY"}</small>
              </div>
              <div className="lm-pct-word-pair" aria-live="polite">
                <div className="lm-pct-word"><span>English</span><strong>{currentPair[0]}</strong></div>
                <ArrowRight className="lm-pct-arrow" size={18} strokeWidth={2.8} aria-hidden="true" />
                <div className="lm-pct-word target"><span>{destination.nativeLabel}</span><strong>{currentPair[1]}</strong></div>
              </div>
            </div>
            <button className="lm-pct-show-more" type="button" onClick={nextWord}><RefreshCw size={12} strokeWidth={2.8} aria-hidden="true" /> Show another pair</button>
            <button className="lm-pct-cta" type="button" onClick={stampLesson}>
              <span>{earned ? "Practise this pair again" : "Practise & collect postcard"}</span>
              <span className="lm-pct-cta-arrow" aria-hidden="true"><ArrowRight size={17} strokeWidth={3} /></span>
            </button>
            <p className="lm-pct-feedback" role="status" aria-live="polite">{feedback}</p>
          </section>

          <section className="lm-pct-trail" aria-labelledby="pct-trail-title">
            <div className="lm-pct-section-head"><h3 id="pct-trail-title">Your postcard trail</h3><span>12 / 30 collected</span></div>
            <div className="lm-pct-route" role="group" aria-label="Language destinations">
              <span className="lm-pct-route-line" aria-hidden="true" />
              {(["italian", "french", "spanish", "japanese"] as Language[]).map((item, index) => {
                const stop = destinations[item];
                const current = language === item;
                return (
                  <button className={`lm-pct-stop${current ? " is-current" : ""}${index === 0 && !current ? " is-done" : ""}`} key={item} type="button" aria-pressed={current} onClick={() => chooseDestination(item)}>
                    <span className="lm-pct-stop-dot">{index === 0 && !current ? <Check size={13} strokeWidth={3} /> : <Globe2 size={12} strokeWidth={2.5} />}</span>
                    <strong>{stop.city}</strong><small>{stop.label}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lm-pct-progress" aria-label="Passport progress">
            <div className="lm-pct-progress-head"><span>Passport progress</span><strong>4 stops visited</strong></div>
            <div className="lm-pct-bars" aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6, 7].map((index) => <span className={index < 4 ? "is-filled" : ""} key={index} />)}</div>
          </section>
          <p className="lm-pct-footer">Made for curious little travellers.</p>
        </div>

        <nav className="lm-pct-nav" aria-label="Primary navigation">
          {navItems.map(({ label, icon: Icon }) => {
            const active = activeNav === label;
            return <button className={`lm-pct-nav-button${active ? " is-active" : ""}`} key={label} type="button" aria-current={active ? "page" : undefined} onClick={() => chooseNav(label)}><span className="lm-pct-nav-icon"><Icon size={17} strokeWidth={active ? 2.7 : 2} aria-hidden="true" /></span><span>{label}</span></button>;
          })}
        </nav>
      </div>
    </main>
  );
}

export default PostcardTrailHome;