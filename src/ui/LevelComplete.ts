import { Game } from '../game/Game';
import { StateMode } from '../game/GameState';

export class LevelComplete {
  private game: Game;
  public element: HTMLElement;

  constructor(game: Game) {
    this.game = game;
    this.element = document.createElement('div');
    this.element.id = 'level-complete-overlay';
    this.element.className = 'ui-modal-wrapper hidden';

    this.createDom();
    this.bindEvents();
  }

  private createDom() {
    this.element.innerHTML = `
      <div class="glass-card level-complete-card">
        <h2 class="modal-title neon-green" id="lc-title">LEVEL 1 COMPLETED!</h2>
        <div class="level-speed-badge" id="lc-speed-badge">⚡ NEXT LEVEL SPEED INCREASED!</div>
        
        <div class="stats-grid">
          <div class="stat-row">
            <span>LEVEL SCORE</span>
            <strong id="lc-score">0</strong>
          </div>
          <div class="stat-row">
            <span>BEST COMBO</span>
            <strong id="lc-combo">×0</strong>
          </div>
          <div class="stat-row">
            <span>ACCURACY</span>
            <strong id="lc-accuracy">100%</strong>
          </div>
        </div>

        <button class="btn btn-primary" id="btn-next-level">NEXT LEVEL ➜</button>
      </div>
    `;

    document.body.appendChild(this.element);
  }

  private bindEvents() {
    this.game.gameState.on('modeChange', ({ mode }) => {
      if (mode === StateMode.LEVEL_COMPLETE) {
        this.element.classList.remove('hidden');
        this.updateStats();
      } else {
        this.element.classList.add('hidden');
      }
    });

    document.getElementById('btn-next-level')?.addEventListener('click', () => {
      this.game.audioManager.playHover();
      this.game.startLevel(this.game.gameState.level + 1);
    });
  }

  private updateStats() {
    const currentLevel = this.game.gameState.level;
    document.getElementById('lc-title')!.textContent = `LEVEL ${currentLevel} COMPLETED! 🎉`;
    document.getElementById('lc-score')!.textContent = this.game.gameState.score.toLocaleString();
    document.getElementById('lc-combo')!.textContent = `×${this.game.comboManager.getMultiplier()}`;

    const total = this.game.gameState.totalArrowsSpawned || 1;
    const hit = this.game.gameState.arrowsHit;
    const acc = Math.min(100, Math.floor((hit / total) * 100));
    document.getElementById('lc-accuracy')!.textContent = `${acc}%`;
  }
}
