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

        <div class="rewarded-ad-box">
          <button class="btn btn-gold" id="btn-double-score">🎬 DOUBLE SCORE (2X)!</button>
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
        if (this.game.platformAdapter.requestBanner) {
          this.game.platformAdapter.requestBanner('banner-container-lc');
        }
      } else {
        this.element.classList.add('hidden');
        if (this.game.platformAdapter.clearAllBanners) {
          this.game.platformAdapter.clearAllBanners();
        }
      }
    });

    const doubleScoreBtn = document.getElementById('btn-double-score') as HTMLButtonElement;
    doubleScoreBtn?.addEventListener('click', () => {
      this.game.audioManager.playHover();
      if (this.game.platformAdapter.requestRewardedAd) {
        this.game.platformAdapter.requestRewardedAd(
          () => {
            // Reward: Double the current session score!
            const bonus = this.game.gameState.score;
            this.game.gameState.score += bonus;
            this.game.gameState.emit('scoreUpdate', { score: this.game.gameState.score, added: bonus });
            this.game.audioManager.playSpecial();
            this.game.gameState.emit('showToast', { message: '🌟 REWARD UNLOCKED: 2X SCORE DOUBLED!' });
            if (doubleScoreBtn) {
              doubleScoreBtn.disabled = true;
              doubleScoreBtn.textContent = '✅ 2X SCORE CLAIMED!';
            }
          },
          () => {
            this.game.gameState.emit('showToast', { message: '⚠️ Ad unavailable. Try again!' });
          }
        );
      }
    });

    document.getElementById('btn-next-level')?.addEventListener('click', () => {
      this.game.audioManager.playHover();
      if (this.game.platformAdapter.requestMidgameAd) {
        this.game.platformAdapter.requestMidgameAd(() => {
          this.game.startLevel(this.game.gameState.level + 1);
        });
      } else {
        this.game.startLevel(this.game.gameState.level + 1);
      }
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
