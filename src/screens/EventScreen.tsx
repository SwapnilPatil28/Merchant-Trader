import { useGame } from '../context/GameContext';
import { useState } from 'react';
import type { EventResolution } from '../types/game';

// Map event IDs to image files
const EVENT_IMAGES: Record<string, string> = {
  bandit_ambush: '/images/events/bandit.jpg',
  wolf_pack: '/images/events/wolves.jpg',
  corrupt_guard: '/images/events/corrupt_guard.jpg',
  blizzard: '/images/events/blizzard.jpg',
  stranded_traveler: '/images/events/traveler.jpg',
  hidden_treasure: '/images/events/treasure.jpg',
  wandering_merchant: '/images/events/merchant.jpg',
  broken_wheel: '/images/events/broken_wheel.jpg',
};

type Phase = 'choosing' | 'outcome';

export function EventScreen() {
  const { state, resolveEvent } = useGame();
  const event = state.pendingEvent;
  const [phase, setPhase] = useState<Phase>('choosing');
  const [resolution, setResolution] = useState<EventResolution | null>(null);
  const [shaking, setShaking] = useState(false);

  if (!event) return null;

  const imageSrc = EVENT_IMAGES[event.id] || '';
  // Gradient fallback colors based on event type
  const eventGradients: Record<string, string> = {
    bandit_ambush: 'linear-gradient(180deg, #3a1a0a 0%, #5a2a1a 50%, #2a1a0a 100%)',
    wolf_pack: 'linear-gradient(180deg, #1a2a1a 0%, #2a3a2a 50%, #1a2a1a 100%)',
    corrupt_guard: 'linear-gradient(180deg, #2a2a3a 0%, #3a3a4a 50%, #2a2a3a 100%)',
    blizzard: 'linear-gradient(180deg, #2a3a5a 0%, #4a5a7a 50%, #2a3a5a 100%)',
    stranded_traveler: 'linear-gradient(180deg, #2a3a1a 0%, #3a4a2a 50%, #2a3a1a 100%)',
    hidden_treasure: 'linear-gradient(180deg, #3a3a1a 0%, #5a4a2a 50%, #3a2a0a 100%)',
    wandering_merchant: 'linear-gradient(180deg, #2a2a1a 0%, #4a3a2a 50%, #2a1a0a 100%)',
    broken_wheel: 'linear-gradient(180deg, #2a1a0a 0%, #3a2a1a 50%, #2a1a0a 100%)',
  };
  const fallbackGradient = eventGradients[event.id] || 'linear-gradient(180deg, #2a1a0a, #1a0e06)';

  function handleChoice(choiceIdx: number) {
    const choice = event!.choices[choiceIdx];
    const result = choice.resolve(state);
    setResolution(result);
    setPhase('outcome');

    // Trigger screen shake on bad outcomes
    if (!result.success || result.cargoLossPct > 0 || result.guardsLost > 0) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  }

  function handleContinue() {
    if (resolution) {
      resolveEvent(resolution);
    }
    setPhase('choosing');
    setResolution(null);
  }

  return (
    <div
      className={shaking ? 'screen-shake' : ''}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div className="fade-in" style={{
        background: 'linear-gradient(180deg, #2a1a0a 0%, #1a0e06 100%)',
        border: '2px solid var(--gold-dark)',
        borderRadius: '10px',
        maxWidth: '620px',
        width: '100%',
        boxShadow: '0 0 40px rgba(200,150,42,0.2), 0 10px 40px rgba(0,0,0,0.8)',
        overflow: 'hidden',
      }}>
        {/* Event header image */}
        <div style={{
          height: '180px',
          background: imageSrc
            ? `linear-gradient(180deg, transparent 60%, #2a1a0a), url(${imageSrc}) center/cover`
            : fallbackGradient,
          display: 'flex',
          alignItems: 'flex-end',
          padding: '16px',
        }}>
          <div>
            <span style={{ fontSize: '32px' }}>{event.emoji}</span>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--gold-light)', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
              {event.title}
            </h2>
          </div>
        </div>

        {phase === 'choosing' ? (
          <>
            {/* Description */}
            <div style={{ padding: '16px 20px 12px' }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: '15px',
                color: 'var(--parchment)',
                lineHeight: '1.6',
              }}>
                {event.description}
              </p>
            </div>

            <div className="divider" style={{ margin: '0 20px' }} />

            {/* Choices */}
            <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {event.choices.map((choice, i) => (
                <button
                  key={choice.id}
                  className="btn event-choice-btn"
                  onClick={() => handleChoice(i)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    width: '100%',
                    padding: '10px 14px',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>{choice.label}</span>
                  <span style={{ fontSize: '12px', color: 'var(--parchment-darker)', fontStyle: 'italic' }}>
                    {choice.description}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* ─── OUTCOME PHASE ─── */
          <OutcomePanel resolution={resolution!} onContinue={handleContinue} />
        )}
      </div>
    </div>
  );
}

function OutcomePanel({ resolution, onContinue }: { resolution: EventResolution; onContinue: () => void }) {
  const isGood = resolution.success && resolution.cargoLossPct === 0 && resolution.guardsLost === 0;
  const isLoot = resolution.loot > 0;

  // Collect all changes for the breakdown
  const changes: { icon: string; text: string; color: string }[] = [];

  if (resolution.goldDelta !== 0) {
    const gained = resolution.goldDelta > 0;
    changes.push({
      icon: '🪙',
      text: `${gained ? '+' : ''}${resolution.goldDelta} Gold`,
      color: gained ? '#80d880' : '#ff8070',
    });
  }
  if (resolution.loot > 0) {
    changes.push({ icon: '💰', text: `+${resolution.loot} Gold (Loot)`, color: '#f0c850' });
  }
  if (resolution.foodDelta !== 0) {
    const gained = resolution.foodDelta > 0;
    changes.push({
      icon: '🍞',
      text: `${gained ? '+' : ''}${resolution.foodDelta} Food`,
      color: gained ? '#80d880' : '#ff8070',
    });
  }
  if (resolution.cargoLossPct > 0) {
    changes.push({
      icon: '📦',
      text: `${Math.round(resolution.cargoLossPct * 100)}% Cargo Lost`,
      color: '#ff6050',
    });
  }
  if (resolution.guardsLost > 0) {
    changes.push({
      icon: '💀',
      text: `${resolution.guardsLost} Guard(s) Lost`,
      color: '#ff6050',
    });
  }
  if (changes.length === 0) {
    changes.push({ icon: '✨', text: 'No losses', color: '#80d880' });
  }

  return (
    <div className="fade-in" style={{ padding: '20px' }}>
      {/* Outcome title */}
      <div style={{
        textAlign: 'center',
        marginBottom: '16px',
      }}>
        <div className={isGood || isLoot ? 'gold-burst' : ''} style={{
          fontSize: '40px',
          marginBottom: '6px',
        }}>
          {isGood ? '✅' : isLoot ? '💰' : '❌'}
        </div>
        <h2 style={{
          fontSize: '1.5rem',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          color: isGood || isLoot ? 'var(--gold-light)' : '#ff7060',
          textShadow: isGood || isLoot
            ? '0 0 20px rgba(200,150,42,0.5)'
            : '0 0 20px rgba(200,40,30,0.4)',
        }}>
          {isGood ? 'Success!' : isLoot ? 'Fortune Smiles!' : 'Misfortune!'}
        </h2>
      </div>

      {/* Narrative message */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid var(--panel-border)',
        borderRadius: '6px',
        padding: '14px',
        marginBottom: '16px',
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: '14px',
          color: 'var(--parchment)',
          lineHeight: '1.6',
          textAlign: 'center',
        }}>
          "{resolution.message}"
        </p>
      </div>

      {/* Change breakdown */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginBottom: '20px',
      }}>
        <div style={{
          fontSize: '11px',
          color: 'var(--gold)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}>
          Consequences
        </div>
        {changes.map((change, i) => (
          <div
            key={i}
            className="fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 10px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
              borderLeft: `3px solid ${change.color}`,
              animationDelay: `${i * 0.15}s`,
              animationFillMode: 'both',
            }}
          >
            <span style={{ fontSize: '18px' }}>{change.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: change.color }}>
              {change.text}
            </span>
          </div>
        ))}
      </div>

      {/* Continue button */}
      <button
        className="btn btn-gold w-full"
        onClick={onContinue}
        style={{ justifyContent: 'center', padding: '12px', fontSize: '16px' }}
      >
        🛤️ Continue Journey
      </button>
    </div>
  );
}
