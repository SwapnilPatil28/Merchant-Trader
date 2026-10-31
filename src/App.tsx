import { GameProvider, useGame } from './context/GameContext';
import { HUD } from './components/HUD';
import { MessageLog } from './components/MessageLog';
import { ToastContainer, useMessageLogToasts } from './components/Toasts';
import { TutorialPopup } from './components/TutorialPopup';
import { TitleScreen } from './screens/TitleScreen';
import { TownScreen } from './screens/TownScreen';
import { MapScreen } from './screens/MapScreen';
import { TravelScreen } from './screens/TravelScreen';
import { EventScreen } from './screens/EventScreen';
import { TavernScreen } from './screens/TavernScreen';
import { WainwrightScreen } from './screens/WainwrightScreen';
import { GameOverScreen, VictoryScreen } from './screens/GameOverVictoryScreens';
import { StatsScreen } from './screens/StatsScreen';
import { useState, useRef, useEffect, useCallback } from 'react';

/* ── Background Music Hook ────────────────────────────── */
function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(() => {
    const saved = localStorage.getItem('merchant_music_muted');
    return saved === null ? false : saved === 'true';
  });
  const [started, setStarted] = useState(false);

  // Create the audio element once
  useEffect(() => {
    const audio = new Audio('/audio/Caravan_at_Twilight.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    audio.preload = 'auto';
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Sync muted state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
    localStorage.setItem('merchant_music_muted', String(muted));
  }, [muted]);

  // Start playback on first user interaction (browser autoplay policy)
  useEffect(() => {
    if (started) return;
    const tryPlay = () => {
      if (audioRef.current && !started) {
        audioRef.current.play().then(() => setStarted(true)).catch(() => {});
      }
    };
    document.addEventListener('click', tryPlay, { once: false });
    document.addEventListener('keydown', tryPlay, { once: false });
    return () => {
      document.removeEventListener('click', tryPlay);
      document.removeEventListener('keydown', tryPlay);
    };
  }, [started]);

  const toggle = useCallback(() => setMuted(m => !m), []);

  return { muted, toggle, started };
}

function GameRouter() {
  const { state } = useGame();
  const [showTutorial, setShowTutorial] = useState(false);
  const prevScreenRef = useRef(state.screen);

  const showHUD = state.screen !== 'title' && state.screen !== 'game_over' && state.screen !== 'victory';
  const showHelpBtn = state.screen !== 'title' && state.screen !== 'game_over' && state.screen !== 'victory';

  // Auto-show toasts for new messages
  useMessageLogToasts(state.messageLog, state.screen !== 'title');

  // Detect new game start: title → town on day 1 with 0 trades
  useEffect(() => {
    if (
      prevScreenRef.current === 'title' &&
      state.screen === 'town' &&
      state.currentDay === 1 &&
      state.player.totalTradesMade === 0
    ) {
      setShowTutorial(true);
    }
    prevScreenRef.current = state.screen;
  }, [state.screen, state.currentDay, state.player.totalTradesMade]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {showHUD && <HUD />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {state.screen === 'title' && <TitleScreen />}
        {state.screen === 'town' && <TownScreen />}
        {state.screen === 'map' && <MapScreen />}
        {state.screen === 'travel' && <TravelScreen />}
        {state.screen === 'tavern' && <TavernScreen />}
        {state.screen === 'wainwright' && <WainwrightScreen />}
        {state.screen === 'stats' && <StatsScreen />}
        {state.screen === 'game_over' && <GameOverScreen />}
        {state.screen === 'victory' && <VictoryScreen />}
      </div>
      <MessageLog />

      {/* Event overlay */}
      {state.pendingEvent && <EventScreen />}

      {/* Tutorial popup */}
      {showTutorial && <TutorialPopup onClose={() => setShowTutorial(false)} />}

      {/* Toast notifications */}
      <ToastContainer />

      {/* Floating help button */}
      {showHelpBtn && (
        <button
          onClick={() => setShowTutorial(true)}
          title="How to Play"
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #3a2a12, #2a1a06)',
            border: '2px solid var(--gold-dark)',
            color: 'var(--gold-light)',
            fontSize: '18px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
            zIndex: 900,
            transition: 'all 0.15s ease',
            fontFamily: 'var(--font-display)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--gold-light)';
            e.currentTarget.style.background = 'linear-gradient(180deg, #5a3a18, #3a2208)';
            e.currentTarget.style.boxShadow = '0 0 16px rgba(200,150,42,0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--gold-dark)';
            e.currentTarget.style.background = 'linear-gradient(180deg, #3a2a12, #2a1a06)';
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.5)';
          }}
        >
          ?
        </button>
      )}
    </div>
  );
}

export default function App() {
  const { muted, toggle } = useBackgroundMusic();

  return (
    <GameProvider>
      <GameRouter />
      {/* Music mute/unmute toggle */}
      <button
        onClick={toggle}
        title={muted ? 'Unmute Music' : 'Mute Music'}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '62px',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #3a2a12, #2a1a06)',
          border: '2px solid var(--gold-dark)',
          color: 'var(--gold-light)',
          fontSize: '18px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          zIndex: 900,
          transition: 'all 0.15s ease',
          fontFamily: 'var(--font-display)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--gold-light)';
          e.currentTarget.style.background = 'linear-gradient(180deg, #5a3a18, #3a2208)';
          e.currentTarget.style.boxShadow = '0 0 16px rgba(200,150,42,0.4)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--gold-dark)';
          e.currentTarget.style.background = 'linear-gradient(180deg, #3a2a12, #2a1a06)';
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.5)';
        }}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </GameProvider>
  );
}
