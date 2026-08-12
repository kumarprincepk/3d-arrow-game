import { GameState } from './GameState';

export class ComboManager {
  private gameState: GameState;
  public combo: number = 0;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  public reset() {
    this.combo = 0;
    this.gameState.emit('comboUpdate', { combo: 0, multiplier: 1, reset: true });
  }

  public registerHit(): number {
    this.combo++;
    if (this.combo > this.gameState.bestCombo) {
      this.gameState.bestCombo = this.combo;
    }

    const multiplier = this.getMultiplier();
    this.gameState.emit('comboUpdate', {
      combo: this.combo,
      multiplier,
      reset: false
    });
    return multiplier;
  }

  public registerMiss() {
    if (this.combo > 0) {
      this.combo = 0;
      this.gameState.emit('comboUpdate', { combo: 0, multiplier: 1, reset: true });
    }
  }

  public getMultiplier(): number {
    if (this.combo >= 20) return 8;
    if (this.combo >= 15) return 5;
    if (this.combo >= 10) return 4;
    if (this.combo >= 5) return 3;
    if (this.combo >= 3) return 2;
    return 1;
  }
}
