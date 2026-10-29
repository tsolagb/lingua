import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Flame,
  Gem,
  Heart,
  House,
  Languages,
  Library,
  MessageCircleHeart,
  Star,
  Target,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import "./_group.css";

type Language = "Italian" | "French" | "Spanish";

const languages: Array<{
  name: Language;
  native: string;
  code: string;
  progress: string;
  tone: string;
}> = [
  { name: "Italian", native: "Italiano", code: "IT", progress: "12 words", tone: "italian" },
  { name: "French", native: "Français", code: "FR", progress: "8 words", tone: "french" },
  { name: "Spanish", native: "Español", code: "ES", progress: "5 words", tone: "spanish" },
];

const categories = [
  { name: "At home", count: "12 lessons", icon: House, tone: "teal" },
  { name: "Animals", count: "9 lessons", icon: Heart, tone: "pink" },
  { name: "Food", count: "8 lessons", icon: Library, tone: "butter" },
  { name: "My world", count: "6 lessons", icon: Gem, tone: "orange" },
];

const navItems = [
  { label: "Home", icon: House },
  { label: "Wallet", icon: WalletCards },
  { label: "Progress", icon: BarChart3 },
  { label: "Support", icon: MessageCircleHeart },
];

function SectionHeading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="lm-section-heading">
      <h2>{title}</h2>
      {action && (
        <button className="lm-see-all" type="button" onClick={onAction}>
          {action}
          <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

export function PolishedHome() {
  const [activeLanguage, setActiveLanguage] = useState<Language>("Italian");
  const [activeCategory, setActiveCategory] = useState("At home");
  const [activeNav, setActiveNav] = useState("Home");
  const [feedback, setFeedback] = useState("");

  const handleFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2400);
  };

  return (
    <main className="lm-preview">
      <section className="lm-phone" aria-label="LinguaMatch home screen preview">
        <div className="lm-scroll">
          <header className="lm-top">
            <div className="lm-topbar">
              <div className="lm-brand">
                <span className="lm-brand-mark" aria-hidden="true">
                  <Languages />
                </span>
                <span className="lm-brand-name">LinguaMatch</span>
              </div>
              <button
                className="lm-parent-button"
                type="button"
                onClick={() => handleFeedback("Parent space is tucked away safely.")}
              >
                <CircleUserRound />
                Parent space
              </button>
            </div>

            <div className="lm-greeting">
              <p className="lm-eyebrow">Tuesday, 14 May · 4 min today</p>
              <h1 className="lm-title">
                Ciao, Mia.
                <br />
                Ready to learn <em>one more?</em>
              </h1>
            </div>

            <div className="lm-wordplay" aria-label="Italian and English word pair">
              <span className="lm-word">hello</span>
              <ArrowRight aria-hidden="true" />
              <span className="lm-word">ciao</span>
            </div>
          </header>

          <div className="lm-main">
            <section className="lm-card lm-streak-card" aria-label="Learning streak">
              <div className="lm-streak-copy">
                <span className="lm-streak-icon" aria-hidden="true">
                  <Flame />
                </span>
                <div>
                  <p className="lm-card-kicker">Your little streak</p>
                  <div className="lm-streak-line">
                    <span className="lm-streak-number">6</span>
                    <span className="lm-streak-label">days in a row</span>
                  </div>
                </div>
              </div>
              <div className="lm-streak-best">
                <strong>12</strong>
                best
              </div>
            </section>

            <section className="lm-section">
              <SectionHeading title="Today&apos;s practice" />
              <div className="lm-card lm-learn-card">
                <div className="lm-learn-content">
                  <p className="lm-learn-label">Italian · At home</p>
                  <h2 className="lm-learn-title">Match 8 new words</h2>
                  <div className="lm-learn-meta">
                    <span>
                      <Clock3 /> 4 min
                    </span>
                    <span>
                      <Star /> 3 stars
                    </span>
                  </div>
                </div>
                <button
                  className="lm-learn-button"
                  type="button"
                  aria-label="Start today&apos;s practice"
                  onClick={() => handleFeedback("Your next round is ready.")}
                >
                  <ArrowRight />
                </button>
              </div>
            </section>

            <section className="lm-section">
              <SectionHeading
                title="Choose a language"
                action="See all"
                onAction={() => handleFeedback("Three lovely languages, one happy notebook.")}
              />
              <div className="lm-language-grid">
                {languages.map((language) => {
                  const selected = language.name === activeLanguage;
                  return (
                    <button
                      className={`lm-language${selected ? " is-selected" : ""}`}
                      key={language.name}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setActiveLanguage(language.name);
                        handleFeedback(`${language.name} is ready to explore.`);
                      }}
                    >
                      {selected && (
                        <span className="lm-language-check" aria-hidden="true">
                          <Check />
                        </span>
                      )}
                      <span className={`lm-language-flag ${language.tone}`}>{language.code}</span>
                      <span className="lm-language-name">{language.name}</span>
                      <span className="lm-language-progress">{language.progress}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="lm-section">
              <SectionHeading
                title="Pick a little world"
                action="View map"
                onAction={() => handleFeedback("Your learning map has 35 lessons.")}
              />
              <div className="lm-category-list">
                {categories.map((category) => {
                  const CategoryIcon = category.icon;
                  const selected = category.name === activeCategory;
                  return (
                    <button
                      className={`lm-category${selected ? " is-active" : ""}`}
                      key={category.name}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setActiveCategory(category.name);
                        handleFeedback(`${category.name} is your next tiny adventure.`);
                      }}
                    >
                      <span className={`lm-category-icon ${category.tone}`}>
                        <CategoryIcon />
                      </span>
                      <span>
                        <span className="lm-category-name">{category.name}</span>
                        <span className="lm-category-count">{category.count}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="lm-section lm-card lm-goal" aria-label="Daily goal progress">
              <span className="lm-goal-icon" aria-hidden="true">
                <Target />
              </span>
              <div className="lm-goal-copy">
                <p className="lm-goal-title">Daily goal: almost there</p>
                <p className="lm-goal-subtitle">6 of 8 words matched today</p>
              </div>
              <span className="lm-goal-meter">75%</span>
            </section>

            <p className="lm-feedback" role="status" aria-live="polite">
              {feedback}
            </p>
          </div>
        </div>

        <nav className="lm-bottom-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const NavIcon = item.icon;
            const current = item.label === activeNav;
            return (
              <button
                className={`lm-nav-item${current ? " is-current" : ""}`}
                key={item.label}
                type="button"
                aria-current={current ? "page" : undefined}
                onClick={() => {
                  setActiveNav(item.label);
                  if (item.label !== "Home") handleFeedback(`${item.label} is coming along nicely.`);
                }}
              >
                <NavIcon />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </section>
    </main>
  );
}