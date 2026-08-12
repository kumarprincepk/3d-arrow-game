import { Game } from '../game/Game';
import { StateMode } from '../game/GameState';

export class SettingsModal {
  private game: Game;
  public element: HTMLElement;

  constructor(game: Game) {
    this.game = game;
    this.element = document.createElement('div');
    this.element.id = 'settings-overlay';
    this.element.className = 'ui-modal-wrapper hidden';

    this.createDom();
    this.bindEvents();
  }

  private createDom() {
    this.element.innerHTML = `
      <div class="glass-card settings-card">
        <h2 class="modal-title">SETTINGS</h2>
        
        <div class="setting-item">
          <span>SOUND EFFECTS</span>
          <label class="toggle-switch">
            <input type="checkbox" id="toggle-sound" ${this.game.gameState.settings.soundEnabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <span>BACKGROUND MUSIC</span>
          <label class="toggle-switch">
            <input type="checkbox" id="toggle-music" ${this.game.gameState.settings.musicEnabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>

        <button class="btn btn-secondary" id="btn-close-settings">CLOSE</button>
      </div>
    `;

    document.body.appendChild(this.element);
  }

  private bindEvents() {
    this.game.gameState.on('openSettings', () => {
      this.element.classList.remove('hidden');
    });

    document.getElementById('toggle-sound')?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      this.game.gameState.settings.soundEnabled = checked;
      this.game.gameState.saveToStorage();
    });

    document.getElementById('toggle-music')?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      this.game.gameState.settings.musicEnabled = checked;
      if (checked) {
        if (this.game.gameState.mode === StateMode.PLAYING) this.game.audioManager.startMusic();
      } else {
        this.game.audioManager.stopMusic();
      }
      this.game.gameState.saveToStorage();
    });

    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      this.game.audioManager.playHover();
      this.element.classList.add('hidden');
    });
  }
}
