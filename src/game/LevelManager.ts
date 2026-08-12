import * as THREE from 'three';
import { GameState, StateMode } from './GameState';
import { getLevelConfig, type LevelConfig } from '../config/levels';
import { ArrowPool } from '../objects/ArrowPool';
import { Arrow } from '../objects/Arrow';
import type { ArrowType } from '../config/constants';

export class LevelManager {
  private gameState: GameState;
  private arrowPool: ArrowPool;

  public currentConfig!: LevelConfig;
  public arrowsCompleted: number = 0;
  public totalArrowsRequired: number = 5;
  public timeRemaining: number = 0;

  private spawnTimer: number = 0;
  public activeTargetArrow: Arrow | null = null;
  public activeDecoyArrows: Arrow[] = [];

  constructor(gameState: GameState, arrowPool: ArrowPool) {
    this.gameState = gameState;
    this.arrowPool = arrowPool;
  }

  public startLevel(levelNum: number) {
    this.gameState.level = levelNum;
    this.currentConfig = getLevelConfig(levelNum);
    this.arrowsCompleted = 0;
    this.totalArrowsRequired = this.currentConfig.targetCount;
    this.timeRemaining = this.currentConfig.timeLimit || 0;
    this.spawnTimer = 0.5; // Short delay before first spawn

    this.arrowPool.resetAll();
    this.activeTargetArrow = null;
    this.activeDecoyArrows = [];

    this.gameState.emit('levelStart', {
      level: levelNum,
      config: this.currentConfig,
      totalRequired: this.totalArrowsRequired
    });
  }

  public update(delta: number): { targetExpired: boolean } {
    let targetExpired = false;

    if (this.gameState.mode !== StateMode.PLAYING) return { targetExpired };

    // Level Timer update
    if (this.currentConfig.timeLimit && this.timeRemaining > 0) {
      this.timeRemaining = Math.max(0, this.timeRemaining - delta);
      this.gameState.emit('timerUpdate', { timeRemaining: this.timeRemaining });

      if (this.timeRemaining <= 0) {
        this.gameState.setMode(StateMode.GAME_OVER);
        return { targetExpired: true };
      }
    }

    // Check active target expiration
    if (this.activeTargetArrow && this.activeTargetArrow.active) {
      if (this.activeTargetArrow.lifespan <= 0 && this.activeTargetArrow.state === 'IDLE') {
        this.activeTargetArrow.triggerError();
        targetExpired = true;
        this.activeTargetArrow = null;
      }
    }

    // Spawn cadence
    if (!this.activeTargetArrow && this.arrowsCompleted < this.totalArrowsRequired) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        this.spawnTargetAndDecoys();
        this.spawnTimer = this.currentConfig.spawnInterval;
      }
    }

    return { targetExpired };
  }

  private spawnTargetAndDecoys() {
    // 1. Pick direction & position for main target arrow
    const allowedDirs = this.currentConfig.allowedDirections;
    const targetDirKey = allowedDirs[Math.floor(Math.random() * allowedDirs.length)];

    const targetPos = this.getRandomSpawnPosition();

    // Determine special arrow type
    let arrowType: ArrowType = 'STANDARD';
    if (Math.random() < this.currentConfig.specialArrowChance && this.currentConfig.specialTypesAllowed.length > 0) {
      const allowedSpecials = this.currentConfig.specialTypesAllowed;
      arrowType = allowedSpecials[Math.floor(Math.random() * allowedSpecials.length)];
    }

    this.activeTargetArrow = this.arrowPool.spawnArrow(
      targetPos,
      targetDirKey,
      arrowType,
      this.currentConfig.arrowScale,
      this.currentConfig.arrowLifespan,
      true
    );

    this.gameState.totalArrowsSpawned++;

    // 2. Spawn Decoy/Fake arrows only on advanced levels (Level 15+)
    if (this.gameState.level >= 15) {
      const decoyCount = Math.min(3, Math.floor(this.gameState.level / 4));
      for (let i = 0; i < decoyCount; i++) {
        const decoyPos = this.getRandomSpawnPosition(targetPos);
        const decoyDirKey = allowedDirs[Math.floor(Math.random() * allowedDirs.length)];
        const isBomb = Math.random() < 0.25;

        const decoy = this.arrowPool.spawnArrow(
          decoyPos,
          decoyDirKey,
          isBomb ? 'BOMB' : 'STANDARD',
          this.currentConfig.arrowScale * 0.9,
          this.currentConfig.arrowLifespan * 1.1,
          false
        );
        if (decoy) this.activeDecoyArrows.push(decoy);
      }
    }
  }

  private getRandomSpawnPosition(avoidPos?: THREE.Vector3): THREE.Vector3 {
    let pos = new THREE.Vector3();
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 10) {
      attempts++;
      pos.set(
        (Math.random() - 0.5) * 7.5,
        (Math.random() - 0.5) * 4.5,
        (Math.random() - 0.5) * 3.0
      );

      if (!avoidPos || pos.distanceTo(avoidPos) > 2.5) {
        valid = true;
      }
    }
    return pos;
  }

  public registerTargetHit(): boolean {
    this.arrowsCompleted++;
    this.activeTargetArrow = null;

    // Clear decoys
    this.activeDecoyArrows.forEach(d => d.reset());
    this.activeDecoyArrows = [];

    this.gameState.emit('objectiveUpdate', {
      completed: this.arrowsCompleted,
      total: this.totalArrowsRequired
    });

    if (this.arrowsCompleted >= this.totalArrowsRequired) {
      this.gameState.setMode(StateMode.LEVEL_COMPLETE);
      return true; // Level Finished!
    }
    return false;
  }

  public clearCurrentWave() {
    if (this.activeTargetArrow) {
      this.activeTargetArrow.reset();
      this.activeTargetArrow = null;
    }
    this.activeDecoyArrows.forEach(d => d.reset());
    this.activeDecoyArrows = [];
  }
}
