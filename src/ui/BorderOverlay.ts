import { Game } from '../game/Game';
import { StateMode } from '../game/GameState';

export class BorderOverlay {
  private game: Game;
  public element: HTMLElement;

  constructor(game: Game) {
    this.game = game;
    this.element = document.createElement('div');
    this.element.id = 'game-border-overlay';
    this.element.className = 'cyber-border-container';

    this.createDom();
    this.bindEvents();
  }

  private createDom() {
    this.element.innerHTML = `
      <!-- 4 Screen Edges -->
      <div class="border-edge border-top"></div>
      <div class="border-edge border-right"></div>
      <div class="border-edge border-bottom"></div>
      <div class="border-edge border-left"></div>

      <!-- Traveling Energy Beam Highlight -->
      <div class="traveling-beam-container">
        <div class="traveling-beam" id="border-light-beam"></div>
      </div>
    `;

    document.body.appendChild(this.element);
  }

  private bindEvents() {
    this.game.gameState.on('modeChange', ({ mode }) => {
      if (mode === StateMode.PLAYING || mode === StateMode.LEVEL_START) {
        this.element.classList.remove('hidden');
      } else if (mode === StateMode.MAIN_MENU) {
        this.element.classList.remove('hidden'); // Beautiful frame on main menu too!
      }
    });

    this.game.gameState.on('livesUpdate', ({ lost }) => {
      if (lost) {
        this.pulseDamage();
      }
    });
  }

  public pulseHit() {
    this.element.classList.remove('hit-pulse', 'special-surge', 'damage-flash');
    // Force reflow
    void this.element.offsetWidth;
    this.element.classList.add('hit-pulse');
  }

  public pulseSpecial() {
    this.element.classList.remove('hit-pulse', 'special-surge', 'damage-flash');
    void this.element.offsetWidth;
    this.element.classList.add('special-surge');
  }

  public pulseDamage() {
    this.element.classList.remove('hit-pulse', 'special-surge', 'damage-flash');
    void this.element.offsetWidth;
    this.element.classList.add('damage-flash');
  }
}
