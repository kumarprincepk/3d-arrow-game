import { GAME_SETTINGS } from '../config/constants';
import { GameState, StateMode } from './GameState';

export class LifeManager {
  private gameState: GameState;
  public lives: number = GAME_SETTINGS.MAX_LIVES;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  public reset() {
    this.lives = GAME_SETTINGS.MAX_LIVES;
    this.gameState.emit('livesUpdate', { lives: this.lives, lost: false, restored: false });
  }

  public loseLife(): boolean {
    if (this.lives <= 0) return true;

    this.lives = Math.max(0, this.lives - 1);
    this.gameState.emit('livesUpdate', { lives: this.lives, lost: true, restored: false });

    if (this.lives === 0) {
      this.gameState.setMode(StateMode.GAME_OVER);
      return true;
    }
    return false;
  }

  public addLife(): boolean {
    if (this.lives >= GAME_SETTINGS.MAX_LIVES) return false;
    this.lives++;
    this.gameState.emit('livesUpdate', { lives: this.lives, lost: false, restored: true });
    return true;
  }
}
