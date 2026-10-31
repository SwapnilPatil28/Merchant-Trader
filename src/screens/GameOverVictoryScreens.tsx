import { useGame } from '../context/GameContext';

export function GameOverScreen() {
  const { state, reset, setScreen } = useGame();

  function handleRestart() {
    reset();
    setScreen('town');
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(60,10,10,0.6) 50%, rgba(0,0,0,0.9) 100%), url(/images/ui/game_over.jpg) center/cover`,
      textAlign: 'center',
      gap: '20px',
      padding: '40px',
    }}>
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '64px' }}>💀</span>
        <h1 style={{
          fontSize: '3rem',
          color: '#ff6050',
          textShadow: '0 0 30px rgba(200,40,30,0.5)',
        }}>
          Bankruptcy
        </h1>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          color: 'var(--parchment-dark)',
          fontSize: '1.1rem',
          maxWidth: '400px',
        }}>
          Your coffers are empty, your cargo lost, and your provisions gone. 
          The road has claimed another merchant.
        </p>
      </div>

      {/* Stats */}
      <div className="panel" style={{ minWidth: '280px', padding: '16px' }}>
        <h3 style={{ marginBottom: '10px', color: 'var(--gold)' }}>Final Ledger</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
          <StatRow label="Days Survived" value={`${state.currentDay}`} />
          <StatRow label="Total Profit Earned" value={`${Math.round(state.player.totalProfit).toLocaleString()} Gold`} />
          <StatRow label="Final Vehicle" value={`Tier ${state.player.vehicleTier}`} />
          <StatRow label="Season" value={state.season} />
        </div>
      </div>

      <button className="btn btn-gold btn-lg" onClick={handleRestart}>
        🔄 Try Again
      </button>

      <button className="btn" onClick={() => { reset(); setScreen('title'); }}>
        🏠 Main Menu
      </button>
    </div>
  );
}

export function VictoryScreen() {
  const { state, reset, setScreen } = useGame();

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `radial-gradient(ellipse at center, rgba(100,80,20,0.4) 0%, rgba(10,6,2,0.95) 100%), url(/images/towns/capital_city.jpg) center/cover`,
      textAlign: 'center',
      gap: '20px',
      padding: '40px',
    }}>
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '64px' }}>🏰</span>
        <h1 style={{
          fontSize: '2.8rem',
          color: 'var(--gold-light)',
          textShadow: '0 0 40px rgba(200,150,42,0.7)',
        }}>
          Victory!
        </h1>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          color: 'var(--parchment)',
          fontSize: '1.2rem',
          maxWidth: '450px',
          lineHeight: '1.6',
        }}>
          You have purchased a grand Merchant Estate in the Capital City. 
          From penniless wanderer to Trade Baron — your legend will be told for generations.
        </p>
      </div>

      {/* Stats */}
      <div className="panel panel-gold" style={{ minWidth: '300px', padding: '16px' }}>
        <h3 style={{ marginBottom: '10px', color: 'var(--gold-light)' }}>🏆 Your Legacy</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
          <StatRow label="Days on the Road" value={`${state.currentDay}`} />
          <StatRow label="Total Profit" value={`${Math.round(state.player.totalProfit).toLocaleString()} Gold`} />
          <StatRow label="Final Vehicle" value={`Tier ${state.player.vehicleTier}`} />
          <StatRow label="Season" value={state.season} />
          <StatRow label="Gold Remaining" value={`${state.player.gold.toLocaleString()}`} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn btn-gold btn-lg" onClick={() => { setScreen('town'); }}>
          ⏭️ Keep Playing
        </button>
        <button className="btn btn-lg" onClick={() => { reset(); setScreen('title'); }}>
          🏠 Main Menu
        </button>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--parchment-darker)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

