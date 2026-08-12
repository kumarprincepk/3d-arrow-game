import { Game } from '../game/Game';
import { StateMode } from '../game/GameState';

export class PauseModal {
  private game: Game;
  public element: HTMLElement;

  constructor(game: Game) {
    this.game = game;
    this.element = document.createElement('div');
    this.element.id = 'pause-overlay';
    this.element.className = 'ui-modal-wrapper hidden';

    this.createDom();
    this.bindEvents();
  }

  private createDom() {
    this.element.innerHTML = `
      <div class="glass-card pause-card">
        <h2 class="modal-title">GAME PAUSED</h2>
        
        <div class="button-column">
          <button class="btn btn-primary" id="btn-resume">RESUME</button>
          <button class="btn btn-secondary" id="btn-restart">RESTART LEVEL</button>
          <button class="btn btn-secondary" id="btn-pause-menu">MAIN MENU</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.element);
  }

  private bindEvents() {
    this.game.gameState.on('modeChange', ({ mode }) => {
      if (mode === StateMode.PAUSED) {
        this.element.classList.remove('hidden');
      } else {
        this.element.classList.add('hidden');
      }
    });

    document.getElementById('btn-resume')?.addEventListener('click', () => {
      this.game.audioManager.playHover();
      this.game.gameState.setMode(StateMode.PLAYING);
    });

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      this.game.audioManager.playHover();
      this.game.startLevel(this.game.gameState.level);
    });

    document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
      this.game.audioManager.playHover();
      this.game.gameState.setMode(StateMode.MAIN_MENU);
    });
  }
}
