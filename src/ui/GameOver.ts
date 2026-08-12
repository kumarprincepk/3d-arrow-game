import { Game } from '../game/Game';
import { StateMode } from '../game/GameState';

export class GameOver {
  private game: Game;
  public element: HTMLElement;

  private restartLevelBtn!: HTMLButtonElement;
  private retryStartBtn!: HTMLButtonElement;
  private restartsLeftSpan!: HTMLElement;

  constructor(game: Game) {
    this.game = game;
    this.element = document.createElement('div');
    this.element.id = 'game-over-overlay';
    this.element.className = 'ui-modal-wrapper hidden';

    this.createDom();
    this.bindEvents();
  }

  private createDom() {
    this.element.innerHTML = `
      <div class="glass-card game-over-card">
        <h2 class="modal-title neon-red">GAME OVER</h2>
        
        <div class="stats-grid">
          <div class="stat-row">
            <span>FINAL SCORE</span>
            <strong id="go-score">0</strong>
          </div>
          <div class="stat-row">
            <span>LEVEL REACHED</span>
            <strong id="go-level">1</strong>
          </div>
          <div class="stat-row">
            <span>BEST COMBO</span>
            <strong id="go-combo">×0</strong>
          </div>
          <div class="stat-row">
            <span>ARROWS HIT</span>
            <strong id="go-hits">0</strong>
          </div>
          <div class="stat-row">
            <span>ACCURACY</span>
            <strong id="go-accuracy">0%</strong>
          </div>
        </div>

        <div class="menu-button-group">
          <!-- Restart Level Button (Allows up to 3 attempts) -->
          <button class="btn btn-primary" id="btn-restart-level">
            RESTART LEVEL (<span id="go-restarts-left">3</span>/3)
          </button>

          <div class="button-row">
            <button class="btn btn-secondary" id="btn-retry-start">RETRY FROM START</button>
            <button class="btn btn-secondary" id="btn-menu">MAIN MENU</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.element);

    this.restartLevelBtn = document.getElementById('btn-restart-level') as HTMLButtonElement;
    this.retryStartBtn = document.getElementById('btn-retry-start') as HTMLButtonElement;
    this.restartsLeftSpan = document.getElementById('go-restarts-left')!;
  }

  private bindEvents() {
    this.game.gameState.on('modeChange', ({ mode }) => {
      if (mode === StateMode.GAME_OVER) {
        this.element.classList.remove('hidden');
        this.updateStats();
      } else {
        this.element.classList.add('hidden');
      }
    });

    this.restartLevelBtn.addEventListener('click', () => {
      if (this.game.gameState.levelRestartsLeft > 0) {
        this.game.audioManager.playHover();
        this.game.restartCurrentLevel();
      }
    });

    this.retryStartBtn.addEventListener('click', () => {
      this.game.audioManager.playHover();
      this.game.startNewGame();
    });

    document.getElementById('btn-menu')?.addEventListener('click', () => {
      this.game.audioManager.playHover();
      this.game.gameState.setMode(StateMode.MAIN_MENU);
    });
  }

  private updateStats() {
    document.getElementById('go-score')!.textContent = this.game.gameState.score.toLocaleString();
    document.getElementById('go-level')!.textContent = this.game.gameState.level.toString();
    document.getElementById('go-combo')!.textContent = `×${this.game.gameState.bestCombo}`;
    document.getElementById('go-hits')!.textContent = this.game.gameState.arrowsHit.toString();

    const total = this.game.gameState.totalArrowsSpawned || 1;
    const hit = this.game.gameState.arrowsHit;
    const acc = Math.min(100, Math.floor((hit / total) * 100));
    document.getElementById('go-accuracy')!.textContent = `${acc}%`;

    const restartsLeft = this.game.gameState.levelRestartsLeft;
    this.restartsLeftSpan.textContent = restartsLeft.toString();

    if (restartsLeft > 0) {
      this.restartLevelBtn.style.display = 'block';
      this.restartLevelBtn.disabled = false;
      this.retryStartBtn.className = 'btn btn-secondary';
    } else {
      // All 3 restarts used: Hide/disable Restart Level, highlight Retry From Start as primary!
      this.restartLevelBtn.style.display = 'none';
      this.retryStartBtn.className = 'btn btn-primary';
    }
  }
}
