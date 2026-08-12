import { Game } from '../game/Game';
import { StateMode } from '../game/GameState';

export class MainMenu {
  private game: Game;
  public element: HTMLElement;

  constructor(game: Game) {
    this.game = game;
    this.element = document.createElement('div');
    this.element.id = 'main-menu-overlay';
    this.element.className = 'ui-modal-wrapper';

    this.createDom();
    this.bindEvents();
  }

  private createDom() {
    this.element.innerHTML = `
      <div class="glass-card menu-card">
        <h1 class="game-title">ARROW RUSH <span class="neon-3d">3D</span></h1>
        <p class="game-subtitle">FOLLOW THE LIGHT. HIT THE ARROW.</p>

        <div class="high-score-badge">
          BEST SCORE: <span id="menu-high-score">${this.game.gameState.highScore.toLocaleString()}</span>
        </div>

        <div class="menu-button-group">
          <button class="btn btn-primary" id="btn-play">PLAY</button>
          <button class="btn btn-secondary" id="btn-tutorial">HOW TO PLAY</button>
          <button class="btn btn-secondary" id="btn-settings">SETTINGS</button>
          <button class="btn btn-icon" id="btn-fullscreen">FULLSCREEN ⛶</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.element);
  }

  private bindEvents() {
    this.game.gameState.on('modeChange', ({ mode }) => {
      if (mode === StateMode.MAIN_MENU) {
        this.element.classList.remove('hidden');
        const scoreElem = document.getElementById('menu-high-score');
        if (scoreElem) scoreElem.textContent = this.game.gameState.highScore.toLocaleString();
      } else {
        this.element.classList.add('hidden');
      }
    });

    document.getElementById('btn-play')?.addEventListener('click', () => {
      this.game.audioManager.playHover();
      this.game.startNewGame();
    });

    document.getElementById('btn-tutorial')?.addEventListener('click', () => {
      this.game.audioManager.playHover();
      this.game.gameState.setMode(StateMode.TUTORIAL);
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
      this.game.audioManager.playHover();
      this.game.gameState.emit('openSettings', {});
    });

    document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
      this.game.audioManager.playHover();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }
}
