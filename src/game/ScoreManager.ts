import { GAME_SETTINGS, type ArrowType } from '../config/constants';
import { GameState } from './GameState';

export class ScoreManager {
  private gameState: GameState;
  public multiplierActiveTimer: number = 0;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  public calculateReactionScore(
    arrowType: ArrowType = 'STANDARD',
    reactionTimeMs: number = 300,
    maxLifespanSec: number = 3.0,
    comboMultiplier: number = 1
  ): { addedPoints: number; speedCategory: 'PERFECT' | 'GOOD' | 'NORMAL'; speedFactor: number } {
    // 1. Calculate reaction speed factor (1.0 for <280ms, down to 0.2 for slow)
    let speedFactor = 1.0;
    let speedCategory: 'PERFECT' | 'GOOD' | 'NORMAL' = 'NORMAL';

    if (reactionTimeMs <= 280) {
      speedFactor = 1.0;
      speedCategory = 'PERFECT';
    } else if (reactionTimeMs <= 650) {
      speedFactor = 1.0 - ((reactionTimeMs - 280) / (650 - 280)) * 0.4;
      speedCategory = 'GOOD';
    } else {
      const maxMs = Math.max(1000, maxLifespanSec * 1000);
      speedFactor = Math.max(0.2, 0.6 - ((reactionTimeMs - 650) / (maxMs - 650)) * 0.4);
      speedCategory = 'NORMAL';
    }

    // 2. Base value by arrow type
    let baseTypeScore = GAME_SETTINGS.BASE_SCORE_HIT;
    switch (arrowType) {
      case 'GOLD':
        baseTypeScore = 250;
        break;
      case 'SPEED':
      case 'FREEZE':
      case 'MULTIPLIER':
      case 'HEART':
        baseTypeScore = 150;
        break;
      case 'STANDARD':
      default:
        baseTypeScore = 100;
        break;
    }

    // 3. Combine Type value × Reaction Speed Factor × Combo Multipliers
    const activeMultiplier = this.multiplierActiveTimer > 0 ? comboMultiplier * 2 : comboMultiplier;
    const addedPoints = Math.round(baseTypeScore * speedFactor * activeMultiplier);

    this.gameState.score += addedPoints;
    if (this.gameState.score > this.gameState.highScore) {
      this.gameState.highScore = this.gameState.score;
    }

    this.gameState.emit('scoreUpdate', {
      score: this.gameState.score,
      added: addedPoints,
      speedCategory,
      speedFactor,
      arrowType,
      highScore: this.gameState.highScore
    });

    return { addedPoints, speedCategory, speedFactor };
  }

  public addHitScore(comboMultiplier: number, isPerfect: boolean): number {
    return this.calculateReactionScore('STANDARD', isPerfect ? 200 : 550, 3.0, comboMultiplier).addedPoints;
  }

  public addLevelBonus(level: number, remainingTimeBonus: number = 0): number {
    const bonus = GAME_SETTINGS.LEVEL_COMPLETE_BONUS + (level * 150) + remainingTimeBonus;
    this.gameState.score += bonus;
    this.gameState.emit('scoreUpdate', {
      score: this.gameState.score,
      added: bonus,
      isPerfect: false,
      highScore: this.gameState.highScore
    });
    return bonus;
  }

  public update(delta: number) {
    if (this.multiplierActiveTimer > 0) {
      this.multiplierActiveTimer = Math.max(0, this.multiplierActiveTimer - delta);
    }
  }

  public setDoubleMultiplier(durationSeconds: number) {
    this.multiplierActiveTimer = Math.max(this.multiplierActiveTimer, durationSeconds);
  }
}
