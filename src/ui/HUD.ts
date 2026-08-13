import { Game } from '../game/Game';
import { StateMode } from '../game/GameState';

export class HUD {
  private game: Game;
  public element: HTMLElement;

  private heartsContainer!: HTMLElement;
  private levelText!: HTMLElement;
  private progressBarFill!: HTMLElement;
  private objectiveText!: HTMLElement;
  private scoreText!: HTMLElement;
  private comboText!: HTMLElement;
  private timerContainer!: HTMLElement;
  private timerText!: HTMLElement;
  private countdownOverlay!: HTMLElement;

  constructor(game: Game) {
    this.game = game;
    this.element = document.createElement('div');
    this.element.id = 'hud-overlay';
    this.element.className = 'hud-container';

    this.createDom();
    this.bindEvents();
  }

  private createDom() {
    this.element.innerHTML = `
      <div class="hud-header">
        <!-- Top Left: 5 Lives -->
        <div class="hud-lives-box" id="hud-lives">
          <span class="heart-icon active">❤️</span>
          <span class="heart-icon active">❤️</span>
          <span class="heart-icon active">❤️</span>
          <span class="heart-icon active">❤️</span>
          <span class="heart-icon active">❤️</span>
        </div>

        <!-- Top Center: Level Objective -->
        <div class="hud-level-box">
          <div class="level-title" id="hud-level-num">LEVEL 1</div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" id="hud-progress-fill" style="width: 0%"></div>
          </div>
          <div class="objective-text" id="hud-objective">ARROWS: 0 / 5</div>
        </div>

        <!-- Top Right: Score & Combo -->
        <div class="hud-score-box">
          <div class="score-label">SCORE</div>
          <div class="score-value" id="hud-score">0</div>
          <div class="combo-badge hidden" id="hud-combo">COMBO ×1</div>
        </div>
      </div>

      <!-- Level Timer Bar (If active) -->
      <div class="hud-timer-bar hidden" id="hud-timer-container">
        <div class="timer-label">TIME</div>
        <div class="timer-value" id="hud-timer">15.0</div>
      </div>

      <!-- Controls Hint for Mobile, Tablet, Laptop & Desktop -->
      <div class="hud-controls-hint" id="hud-controls-hint">
        🎯 <strong>HOW TO PLAY:</strong> Tap / Click glowing <strong>Cyan Target Arrow</strong> OR press <strong>W A S D / Arrow Keys (Space for 3D Circles)</strong>!
      </div>

      <!-- Countdown Overlay -->
      <div class="countdown-overlay hidden" id="hud-countdown">
        <div class="countdown-text" id="hud-countdown-num">3</div>
      </div>

      <!-- Dynamic Score Popup Anchor -->
      <div id="hud-popups-container"></div>
    `;

    document.body.appendChild(this.element);

    this.heartsContainer = document.getElementById('hud-lives')!;
    this.levelText = document.getElementById('hud-level-num')!;
    this.progressBarFill = document.getElementById('hud-progress-fill')!;
    this.objectiveText = document.getElementById('hud-objective')!;
    this.scoreText = document.getElementById('hud-score')!;
    this.comboText = document.getElementById('hud-combo')!;
    this.timerContainer = document.getElementById('hud-timer-container')!;
    this.timerText = document.getElementById('hud-timer')!;
    this.countdownOverlay = document.getElementById('hud-countdown')!;
  }

  private bindEvents() {
    this.game.gameState.on('modeChange', ({ mode }) => {
      if (mode === StateMode.PLAYING || mode === StateMode.LEVEL_START) {
        this.element.classList.remove('hidden');
      } else {
        this.element.classList.add('hidden');
      }

      if (mode === StateMode.LEVEL_START) {
        this.countdownOverlay.classList.remove('hidden');
        this.countdownOverlay.style.display = 'flex';
      } else {
        this.countdownOverlay.classList.add('hidden');
        this.countdownOverlay.style.display = 'none';
      }
    });

    this.game.gameState.on('countdownUpdate', ({ text }) => {
      const numElem = document.getElementById('hud-countdown-num');
      if (numElem) {
        numElem.textContent = text;
      }
    });

    this.game.gameState.on('livesUpdate', ({ lives, lost }) => {
      const heartElems = Array.from(this.heartsContainer.children) as HTMLElement[];
      heartElems.forEach((h, idx) => {
        if (idx < lives) {
          h.className = 'heart-icon active';
        } else {
          h.className = 'heart-icon broken';
        }
      });

      if (lost) {
        this.heartsContainer.classList.add('heart-shake');
        setTimeout(() => this.heartsContainer.classList.remove('heart-shake'), 400);
      }
    });

    this.game.gameState.on('scoreUpdate', ({ score, added, speedCategory, arrowType }) => {
      this.scoreText.textContent = score.toLocaleString();
      if (added > 0) {
        this.showScorePopup(added, speedCategory || 'NORMAL', arrowType);
      }
    });

    this.game.gameState.on('comboUpdate', ({ combo, multiplier }) => {
      if (combo >= 2) {
        this.comboText.textContent = `COMBO ×${multiplier}`;
        this.comboText.classList.remove('hidden');
        this.comboText.classList.add('pulse');
        setTimeout(() => this.comboText.classList.remove('pulse'), 300);
      } else {
        this.comboText.classList.add('hidden');
      }
    });

    this.game.gameState.on('levelStart', ({ level, totalRequired }) => {
      this.levelText.textContent = `LEVEL ${level}`;
      this.objectiveText.textContent = `ARROWS: 0 / ${totalRequired}`;
      this.progressBarFill.style.width = '0%';
    });

    this.game.gameState.on('objectiveUpdate', ({ completed, total }) => {
      this.objectiveText.textContent = `ARROWS: ${completed} / ${total}`;
      const pct = Math.min(100, Math.floor((completed / total) * 100));
      this.progressBarFill.style.width = `${pct}%`;
    });

    this.game.gameState.on('timerUpdate', ({ timeRemaining }) => {
      if (timeRemaining > 0) {
        this.timerContainer.classList.remove('hidden');
        this.timerText.textContent = timeRemaining.toFixed(1);
      } else {
        this.timerContainer.classList.add('hidden');
      }
    });

    this.game.gameState.on('showToast', ({ message }) => {
      this.showToast(message);
    });
  }

  private showToast(message: string) {
    const toast = document.createElement('div');
    toast.className = 'hud-toast-notice';
    toast.textContent = message;

    const container = document.getElementById('hud-popups-container');
    if (container) {
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 1200);
    }
  }

  private showScorePopup(points: number, speedCategory: 'PERFECT' | 'GOOD' | 'NORMAL', arrowType?: string) {
    const popup = document.createElement('div');
    const categoryClass = speedCategory.toLowerCase();
    popup.className = `score-popup ${categoryClass} ${arrowType ? arrowType.toLowerCase() : ''}`;

    let labelHtml = '';
    if (speedCategory === 'PERFECT') {
      labelHtml = `<div class="popup-title">PERFECT!</div>`;
    } else if (speedCategory === 'GOOD') {
      labelHtml = `<div class="popup-title">GOOD!</div>`;
    }

    popup.innerHTML = `${labelHtml}<div class="popup-value">+${points}</div>`;

    popup.style.left = `${50 + (Math.random() - 0.5) * 18}%`;
    popup.style.top = `${38 + (Math.random() - 0.5) * 10}%`;

    const container = document.getElementById('hud-popups-container');
    if (container) {
      container.appendChild(popup);
      setTimeout(() => popup.remove(), 800);
    }
  }
}
