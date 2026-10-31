import { useEffect, useState } from 'react';

interface TutorialPopupProps {
  onClose: () => void;
}

export function TutorialPopup({ onClose }: TutorialPopupProps) {
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #2a1a0a 0%, #1a0e06 100%)',
          border: '2px solid var(--gold-dark)',
          borderRadius: '10px',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: '0 0 60px rgba(200,150,42,0.25), 0 10px 40px rgba(0,0,0,0.8)',
          transform: visible ? 'scale(1)' : 'scale(0.95)',
          transition: 'transform 0.2s ease',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '12px',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid var(--panel-border)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--parchment-darker)',
            fontSize: '16px',
            cursor: 'pointer',
            zIndex: 2,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--gold)';
            e.currentTarget.style.color = 'var(--gold-light)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--panel-border)';
            e.currentTarget.style.color = 'var(--parchment-darker)';
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{
          padding: '20px 24px 12px',
          textAlign: 'center',
          borderBottom: '1px solid var(--panel-border)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>⚖️</div>
          <h2 style={{
            fontSize: '1.6rem',
            color: 'var(--gold-light)',
            textShadow: '0 0 20px rgba(200,150,42,0.5)',
            marginBottom: '4px',
          }}>
            How to Play
          </h2>
          <p style={{
            fontSize: '13px',
            color: 'var(--parchment-darker)',
            fontStyle: 'italic',
          }}>
            Your guide to becoming a Trade Baron
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 24px 20px' }}>

          {/* Goal */}
          <Section emoji="🎯" title="Your Goal">
            Amass <Gold>100,000 Gold</Gold> and purchase the <strong>Merchant Estate</strong> in the Capital City.
            You start with just a backpack and 200 gold.
          </Section>

          {/* Core Loop */}
          <Section emoji="🔄" title="The Trading Loop">
            <StepList steps={[
              { icon: '🏪', text: 'Buy goods where supply is high and prices are low' },
              { icon: '🗺️', text: 'Open the Map and pick a destination where those goods are scarce' },
              { icon: '🛤️', text: 'Travel there — each day costs food and guard wages' },
              { icon: '💰', text: 'Sell your cargo at a premium and pocket the profit' },
            ]} />
          </Section>

          {/* Key Tips - two column grid */}
          <Section emoji="💡" title="Key Tips">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <TipBox emoji="📈" text="Watch the sparkline charts — rising prices mean high demand" />
              <TipBox emoji="❄️" text="Winter crushes food production — stock up in Autumn!" />
              <TipBox emoji="🛡️" text="Hire guards at the Tavern to survive dangerous routes" />
              <TipBox emoji="🍞" text="Always carry enough food — starving guards will desert you" />
              <TipBox emoji="📜" text="Take contracts at the Tavern for bonus gold rewards" />
              <TipBox emoji="⭐" text="Level up through trading to unlock powerful skills" />
            </div>
          </Section>

          {/* Quick Reference */}
          <Section emoji="🏘️" title="Town Guide">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: '12px' }}>
              <TownRow emoji="🌾" name="Valley Farm" sells="Wheat, Food" />
              <TownRow emoji="⛏️" name="Mountain Forge" sells="Iron, Weapons" />
              <TownRow emoji="🏜️" name="Desert Bazaar" sells="Spices, Silk" />
              <TownRow emoji="🌲" name="Deepwood Camp" sells="Timber, Furs" />
              <TownRow emoji="🏰" name="Capital City" sells="Luxuries, Cloth" />
              <TownRow emoji="⚓" name="Port Harbor" sells="Fish, Salt, Rope" />
              <TownRow emoji="⛪" name="Monastery" sells="Wine, Herbs, Books" />
              <TownRow emoji="🏴" name="Border Fort" sells="Weapons (needs everything!)" />
            </div>
          </Section>

          {/* Navigation */}
          <Section emoji="🧭" title="Navigation">
            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '3px', color: 'var(--parchment)' }}>
              <div>🏪 <strong>Town</strong> — Buy and sell goods, buy food rations</div>
              <div>🍺 <strong>Tavern</strong> — Hire guards, pick up delivery contracts</div>
              <div>🔧 <strong>Wainwright</strong> — Upgrade your vehicle for more cargo space</div>
              <div>📊 <strong>Ledger</strong> — View stats, reputation, and learn skills</div>
              <div>🗺️ <strong>Map</strong> — Plan routes, check weather and trade rumors</div>
            </div>
          </Section>

          {/* Start button */}
          <button
            className="btn btn-gold w-full"
            onClick={handleClose}
            style={{
              marginTop: '16px',
              justifyContent: 'center',
              padding: '12px',
              fontSize: '16px',
            }}
          >
            ⚖️ Begin Trading!
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function Section({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '6px',
      }}>
        <span style={{ fontSize: '16px' }}>{emoji}</span>
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--gold-light)',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          letterSpacing: '0.04em',
        }}>
          {title}
        </span>
      </div>
      <div style={{
        fontSize: '13px',
        color: 'var(--parchment)',
        lineHeight: '1.5',
        paddingLeft: '24px',
      }}>
        {children}
      </div>
    </div>
  );
}

function Gold({ children }: { children: React.ReactNode }) {
  return <span style={{ color: 'var(--gold-light)', fontWeight: 600 }}>{children}</span>;
}

function StepList({ steps }: { steps: { icon: string; text: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {steps.map((step, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
          borderLeft: '2px solid var(--gold-dark)',
        }}>
          <span style={{ fontSize: '14px', flexShrink: 0 }}>{step.icon}</span>
          <span style={{ fontSize: '12px' }}>{step.text}</span>
        </div>
      ))}
    </div>
  );
}

function TipBox({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div style={{
      padding: '6px 8px',
      background: 'rgba(0,0,0,0.25)',
      border: '1px solid var(--panel-border)',
      borderRadius: '4px',
      fontSize: '11px',
      color: 'var(--parchment)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '6px',
    }}>
      <span style={{ fontSize: '13px', flexShrink: 0 }}>{emoji}</span>
      <span style={{ lineHeight: '1.4' }}>{text}</span>
    </div>
  );
}

function TownRow({ emoji, name, sells }: { emoji: string; name: string; sells: string }) {
  return (
    <div style={{ display: 'flex', gap: '4px', padding: '2px 0' }}>
      <span>{emoji}</span>
      <span style={{ color: 'var(--parchment)', fontWeight: 600, minWidth: '90px' }}>{name}</span>
      <span style={{ color: 'var(--parchment-darker)' }}>— {sells}</span>
    </div>
  );
}

