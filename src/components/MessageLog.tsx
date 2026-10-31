import { useGame } from '../context/GameContext';
import { useRef, useEffect } from 'react';

export function MessageLog() {
  const { state } = useGame();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messageLog.length]);

  if (state.screen === 'title' || state.screen === 'game_over' || state.screen === 'victory') return null;

  return (
    <div ref={scrollRef} style={{
      background: 'rgba(10,6,2,0.9)',
      borderTop: '1px solid var(--panel-border)',
      padding: '4px 12px',
      maxHeight: '60px',
      overflow: 'auto',
      flexShrink: 0,
    }}>
      {state.messageLog.slice(-5).map((msg, i) => (
        <div key={i} style={{
          fontSize: '12px',
          color: 'var(--parchment-darker)',
          fontStyle: 'italic',
          padding: '1px 0',
          opacity: 0.5 + i * 0.1,
        }}>
          {msg}
        </div>
      ))}
    </div>
  );
}

