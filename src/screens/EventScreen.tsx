import { useGame } from '../context/GameContext';
import { useState } from 'react';

// Map event IDs to image files
const EVENT_IMAGES: Record<string, string> = {
  bandit_ambush: '/images/events/bandit.jpg',
  wolf_pack: '/images/events/wolves.jpg',
  corrupt_guard: '/images/events/bandit.jpg',
  blizzard: '/images/events/blizzard.jpg',
  stranded_traveler: '/images/events/traveler.jpg',
  hidden_treasure: '/images/events/traveler.jpg',
  wandering_merchant: '/images/events/traveler.jpg',
  broken_wheel: '/images/events/blizzard.jpg',
};

export function EventScreen() {
  const { state, resolveEvent } = useGame();
  const event = state.pendingEvent;
  const [chosen, setChosen] = useState(false);

  if (!event) return null;

  const imageSrc = EVENT_IMAGES[event.id] || '';

  function handleChoice(choiceIdx: number) {
    const choice = event!.choices[choiceIdx];
    const result = choice.resolve(state);
    resolveEvent(result);
    setChosen(true);
    // Auto-dismiss after short delay
    setTimeout(() => setChosen(false), 100);
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div className="fade-in" style={{
        background: 'linear-gradient(180deg, #2a1a0a 0%, #1a0e06 100%)',
        border: '2px solid var(--gold-dark)',
        borderRadius: '10px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 0 40px rgba(200,150,42,0.2), 0 10px 40px rgba(0,0,0,0.8)',
        overflow: 'hidden',
      }}>
        {/* Event header image */}
        <div style={{
          height: '180px',
          background: `linear-gradient(180deg, transparent 60%, #2a1a0a), url(${imageSrc}) center/cover`,
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
              className="btn"
              onClick={() => handleChoice(i)}
              disabled={chosen}
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
      </div>
    </div>
  );
}

// Resolution popup (shows briefly after choosing)
export function EventResolutionToast() {
  const { state } = useGame();
  const res = state.lastEventResolution;
  const [visible, setVisible] = useState(false);

  // Show toast when resolution changes
  if (res && !visible) {
    setVisible(true);
    setTimeout(() => setVisible(false), 3000);
  }

  if (!visible || !res) return null;

  return (
    <div className="fade-in" style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 999,
      background: res.success ? 'rgba(26,74,26,0.95)' : 'rgba(138,42,26,0.95)',
      border: `1px solid ${res.success ? 'var(--green-light)' : 'var(--red)'}`,
      borderRadius: '8px',
      padding: '12px 20px',
      maxWidth: '500px',
      fontSize: '14px',
      color: 'var(--parchment)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
    }}>
      <span style={{ fontSize: '16px', marginRight: '6px' }}>{res.success ? '✅' : '❌'}</span>
      {res.message}
    </div>
  );
}
