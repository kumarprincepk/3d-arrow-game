import './style.css';
import { Game } from './game/Game';
import { StateMode } from './game/GameState';

import { HUD } from './ui/HUD';
import { MainMenu } from './ui/MainMenu';
import { Tutorial } from './ui/Tutorial';
import { LevelComplete } from './ui/LevelComplete';
import { GameOver } from './ui/GameOver';
import { SettingsModal } from './ui/SettingsModal';
import { PauseModal } from './ui/PauseModal';
import { BorderOverlay } from './ui/BorderOverlay';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app');
  if (!container) return;

  const game = new Game(container);

  // Instantiating UI system overlays
  game.borderOverlay = new BorderOverlay(game);
  new HUD(game);
  new MainMenu(game);
  new Tutorial(game);
  new LevelComplete(game);
  new GameOver(game);
  new SettingsModal(game);
  new PauseModal(game);

  // Transition from initial loading to main menu
  setTimeout(() => {
    game.gameState.setMode(StateMode.MAIN_MENU);
  }, 100);
});
