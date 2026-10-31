import { useGame } from '../context/GameContext';

export function TitleScreen() {
  const { setScreen, reset, hasSave, loadSave } = useGame();

  function handleStart() {
    reset();
    setScreen('town');
  }

  function handleContinue() {
    loadSave();
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%), url(./images/ui/title_bg.jpg) center/cover`,
      textAlign: 'center',
      gap: '24px',
      padding: '40px',
    }}>
      {/* Title */}
      <div className="fade-in">
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚖️</div>
        <h1 style={{
          fontSize: '3.2rem',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          letterSpacing: '0.06em',
          textShadow: '0 0 40px rgba(200,150,42,0.6), 0 4px 12px rgba(0,0,0,0.8)',
          marginBottom: '4px',
        }}>
          The Merchant's Ledger
        </h1>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: '1.1rem',
          color: 'var(--parchment-dark)',
          letterSpacing: '0.1em',
        }}>
          A Tale of Trade, Risk, and Fortune
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginTop: '16px' }}>
        {hasSave && (
          <button
            className="btn btn-gold btn-lg glow"
            onClick={handleContinue}
            style={{ fontSize: '20px', padding: '14px 44px' }}
          >
            ▶️ Continue Journey
          </button>
        )}
        <button
          className={`btn ${hasSave ? '' : 'btn-gold glow'} btn-lg`}
          onClick={handleStart}
          style={{ fontSize: hasSave ? '16px' : '20px', padding: hasSave ? '10px 32px' : '14px 44px' }}
        >
          🚀 {hasSave ? 'New Game' : 'Begin Your Journey'}
        </button>
      </div>

      {/* Flavor text */}
      <div style={{
        maxWidth: '500px',
        color: 'var(--parchment-darker)',
        fontStyle: 'italic',
        fontSize: '14px',
        lineHeight: '1.7',
        marginTop: '12px',
      }}>
        <p>
          You begin with nothing but a backpack, 200 gold, and a dream. 
          Buy low, sell high, survive the road, and build a merchant empire. 
          Retire in the Capital City with 100,000 gold to win.
        </p>
      </div>

      {/* Game tips */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        maxWidth: '600px',
        marginTop: '8px',
      }}>
        <TipCard emoji="📈" title="Trade" desc="Buy where supply is high, sell where demand peaks." />
        <TipCard emoji="❄️" title="Seasons" desc="Winter starves towns. Summer burns deserts. Plan ahead." />
        <TipCard emoji="⚔️" title="Danger" desc="Hire guards to protect cargo. The road is merciless." />
      </div>
    </div>
  );
}

function TipCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="panel" style={{ padding: '10px', textAlign: 'center' }}>
      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{emoji}</div>
      <div style={{ fontSize: '13px', color: 'var(--gold-light)', fontWeight: 600, marginBottom: '2px' }}>{title}</div>
      <div style={{ fontSize: '11px', color: 'var(--parchment-darker)' }}>{desc}</div>
    </div>
  );
}

