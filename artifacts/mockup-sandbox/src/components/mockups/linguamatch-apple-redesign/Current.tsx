import { useEffect, useState } from "react";
import "./_group.css";

type Language = "italian" | "french" | "spanish";

const languageMeta: Record<Language, { label: string; flag: string; nativeLabel: string }> = {
  italian: { label: "Italian", flag: "🇮🇹", nativeLabel: "Italiano" },
  french: { label: "French", flag: "🇫🇷", nativeLabel: "Français" },
  spanish: { label: "Spanish", flag: "🇪🇸", nativeLabel: "Español" },
};

const pairs: Record<Language, [string, string][]> = {
  italian: [["cat", "gatto"], ["dog", "cane"], ["house", "casa"], ["sun", "sole"]],
  french: [["cat", "chat"], ["dog", "chien"], ["house", "maison"], ["sun", "soleil"]],
  spanish: [["cat", "gato"], ["dog", "perro"], ["house", "casa"], ["sun", "sol"]],
};

function LinguaMatchLogo() {
  return (
    <div className="lm-current-logo" aria-label="LinguaMatch">
      <span className="lm-current-mark" aria-hidden="true">
        <span className="lm-current-bubble">◎</span>
        <i />
      </span>
      <span>LinguaMatch</span>
    </div>
  );
}

export function Current() {
  const [language, setLanguage] = useState<Language>("italian");
  const [pairIndex, setPairIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const totalCompleted = 4;
  const totalLevels = 54;
  const totalStars = 9;
  const streak = { current: 6, longest: 12 };
  const currentPair = pairs[language][pairIndex];

  useEffect(() => {
    setPairIndex(0);
    const timer = window.setInterval(() => {
      setPairIndex((index) => (index + 1) % pairs[language].length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [language]);

  const message = streak.current >= 7
    ? "One week streak! Keep going!"
    : streak.current >= 3
      ? "Great consistency! 💪"
      : "You're on a roll! Keep it up!";

  return (
    <main className="lm-current" aria-label="LinguaMatch home screen preview">
      <section className="lm-current-phone">
        <div className="lm-current-scroll">
          <header className="lm-current-hero">
            <LinguaMatchLogo />
            <div className="lm-current-demo" aria-label="Word matching example">
              <span className="lm-current-word lm-current-word-left">{currentPair[0]}</span>
              <span className="lm-current-arrow">↔️</span>
              <span className="lm-current-word lm-current-word-right">{currentPair[1]}</span>
            </div>
          </header>

          <div className="lm-current-panel">
            {totalCompleted > 0 && (
              <section className="lm-current-progress" aria-label="Learning progress">
                <div><b>🎯</b><span><strong>{totalCompleted}</strong><small>Levels done</small></span></div>
                <i />
                <div><b>⭐</b><span><strong>{totalStars}</strong><small>Stars earned</small></span></div>
                <i />
                <div><b>📚</b><span><strong>{totalLevels - totalCompleted}</strong><small>Remaining</small></span></div>
              </section>
            )}

            {streak.current > 0 && (
              <section className="lm-current-streak" aria-label="Learning streak">
                <div className="lm-current-streak-main">
                  <b className="lm-current-flame">🔥</b>
                  <div>
                    <div className="lm-current-streak-count"><strong>{streak.current}</strong><span>day<br />streak</span></div>
                    <p>{message}</p>
                  </div>
                </div>
                <i />
                <div className="lm-current-best"><strong>{streak.longest}</strong><span>Best<br />streak</span></div>
              </section>
            )}

            <button className="lm-current-cta" type="button" onClick={() => setNotice("Categories are ready when you are.")}>
              <span>{totalCompleted > 0 ? "Continue Learning!" : "Start Learning!"}</span>
              <b aria-hidden="true">➜</b>
            </button>

            <section className="lm-current-language-section">
              <h2>🌍&nbsp; Choose your language</h2>
              <div className="lm-current-language-row">
                {(Object.keys(languageMeta) as Language[]).map((item) => {
                  const meta = languageMeta[item];
                  const active = item === language;
                  return (
                    <button className={`lm-current-language${active ? " is-active" : ""}`} key={item} type="button" aria-pressed={active} onClick={() => setLanguage(item)}>
                      <span className="lm-current-flag">{meta.flag}</span>
                      <strong>{meta.label}</strong>
                      <small>{meta.nativeLabel}</small>
                      {active && <em>✓</em>}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="lm-current-features">
              <div><span>🔄</span><b>Smart review</b></div>
              <div><span>⭐</span><b>3-star ratings</b></div>
              <div><span>📈</span><b>Track progress</b></div>
            </div>

            <button className="lm-current-coffee" type="button" onClick={() => setNotice("Thanks for supporting LinguaMatch!")}>☕&nbsp; Buy Me a Coffee</button>
            <p className="lm-current-footer">Made with ❤️ to make language learning fun</p>
            <p className="lm-current-notice" role="status">{notice}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Current;