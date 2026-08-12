import { Game } from '../game/Game';
import { StateMode } from '../game/GameState';

export class Tutorial {
  private game: Game;
  public element: HTMLElement;

  constructor(game: Game) {
    this.game = game;
    this.element = document.createElement('div');
    this.element.id = 'tutorial-overlay';
    this.element.className = 'ui-modal-wrapper hidden';

    this.createDom();
    this.bindEvents();
  }

  private createDom() {
    this.element.innerHTML = `
      <div class="glass-card tutorial-card">
        <h2 class="modal-title">HOW TO PLAY</h2>
        
        <div class="tutorial-scroll-container">
          <div class="tutorial-steps">
            <div class="step-item">
              <div class="step-num">1</div>
              <div class="step-content">
                <strong>HIT THE TARGET CIRCLE</strong>
                <span>Click the glowing <strong>Cyan Arrow inside the target ring</strong> before it expires.</span>
              </div>
            </div>

            <div class="step-item">
              <div class="step-num">2</div>
              <div class="step-content">
                <strong>LAPTOP & KEYBOARD CONTROLS</strong>
                <span>Use mouse clicks OR press matching <strong>Arrow Keys (⬆️ ⬇️ ⬅️ ➡️ / W A S D)</strong>.</span>
              </div>
            </div>

            <div class="step-item">
              <div class="step-num">3</div>
              <div class="step-content">
                <strong>REACTION SPEED SCORING</strong>
                <span>Faster reactions = higher points & multipliers (<strong>PERFECT! +150</strong>, <strong>GOOD! +85</strong>).</span>
              </div>
            </div>

            <div class="step-item">
              <div class="step-num">4</div>
              <div class="step-content">
                <strong>RESTORE & INCREASE LIVES ❤️</strong>
                <span>Hit <strong>Bright Pink Heart Arrows</strong> to restore lost lives (up to 5 max lives)!</span>
              </div>
            </div>

            <div class="step-item">
              <div class="step-num">5</div>
              <div class="step-content">
                <strong>SPECIAL ARROWS & HAZARDS</strong>
                <span>Hit <strong>Gold Arrows</strong> for bonus points. Avoid <strong>Red Bomb Arrows</strong>!</span>
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn-primary" id="btn-start-tutorial">GOT IT! START GAME</button>
      </div>
    `;

    document.body.appendChild(this.element);
  }

  private bindEvents() {
    this.game.gameState.on('modeChange', ({ mode }) => {
      if (mode === StateMode.TUTORIAL) {
        this.element.classList.remove('hidden');
      } else {
        this.element.classList.add('hidden');
      }
    });

    document.getElementById('btn-start-tutorial')?.addEventListener('click', () => {
      this.game.audioManager.playHover();
      this.game.startNewGame();
    });
  }
}
