import { GameProvider, useGame } from './context/GameContext';
import { HUD } from './components/HUD';
import { MessageLog } from './components/MessageLog';
import { TitleScreen } from './screens/TitleScreen';
import { TownScreen } from './screens/TownScreen';
import { MapScreen } from './screens/MapScreen';
import { TravelScreen } from './screens/TravelScreen';
import { EventScreen } from './screens/EventScreen';
import { TavernScreen } from './screens/TavernScreen';
import { WainwrightScreen } from './screens/WainwrightScreen';
import { GameOverScreen, VictoryScreen } from './screens/GameOverVictoryScreens';

function GameRouter() {
  const { state } = useGame();

  const showHUD = state.screen !== 'title' && state.screen !== 'game_over' && state.screen !== 'victory';

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
        {state.screen === 'game_over' && <GameOverScreen />}
        {state.screen === 'victory' && <VictoryScreen />}
      </div>
      <MessageLog />

      {/* Event overlay */}
      {state.pendingEvent && <EventScreen />}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}

