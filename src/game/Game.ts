import * as THREE from 'three';
import { GameState, StateMode } from './GameState';
import { ScoreManager } from './ScoreManager';
import { LifeManager } from './LifeManager';
import { ComboManager } from './ComboManager';
import { LevelManager } from './LevelManager';
import { InputManager } from './InputManager';

import { ArrowPool } from '../objects/ArrowPool';
import { ParticleSystem } from '../objects/ParticleSystem';
import { BackgroundObjects } from '../objects/BackgroundObjects';
import { TrailEffect } from '../effects/TrailEffect';
import { CameraEffects } from '../effects/CameraEffects';
import { AudioManager } from '../audio/AudioManager';
import { createPlatformAdapter, type IPlatformAdapter } from '../platform/PlatformAdapter';
import { Arrow } from '../objects/Arrow';
import { GAME_SETTINGS } from '../config/constants';

export class Game {
  public container: HTMLElement;
  public gameState: GameState;
  public platformAdapter: IPlatformAdapter;
  public audioManager: AudioManager;

  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public renderer!: THREE.WebGLRenderer;

  public scoreManager: ScoreManager;
  public lifeManager: LifeManager;
  public comboManager: ComboManager;
  public levelManager!: LevelManager;
  public inputManager!: InputManager;

  public arrowPool!: ArrowPool;
  public particleSystem!: ParticleSystem;
  public backgroundObjects!: BackgroundObjects;
  public trailEffect!: TrailEffect;
  public cameraEffects!: CameraEffects;
  public borderOverlay?: any;

  private clock: THREE.Clock = new THREE.Clock();
  private countdownTimer: number = 0;
  private lastCountdownText: string = '';
  private isRunning: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.gameState = new GameState();
    this.platformAdapter = createPlatformAdapter();
    this.audioManager = new AudioManager(this.gameState);

    this.scoreManager = new ScoreManager(this.gameState);
    this.lifeManager = new LifeManager(this.gameState);
    this.comboManager = new ComboManager(this.gameState);

    this.initThreeJS();
    this.initGameObjects();
    this.bindStateEvents();
    this.handleResize();

    window.addEventListener('resize', () => this.handleResize());

    this.platformAdapter.init().then(() => {
      this.platformAdapter.onPause(() => {
        if (this.gameState.mode === StateMode.PLAYING) {
          this.gameState.setMode(StateMode.PAUSED);
        }
      });
    });

    this.startLoop();
  }

  private initThreeJS() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, GAME_SETTINGS.DEFAULT_DESKTOP_CAMERA_Z);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00ffff, 1.2);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);
  }

  private initGameObjects() {
    this.cameraEffects = new CameraEffects(this.camera);
    this.backgroundObjects = new BackgroundObjects(this.scene);
    this.particleSystem = new ParticleSystem(this.scene);
    this.trailEffect = new TrailEffect(this.scene);
    this.arrowPool = new ArrowPool(this.scene);

    this.levelManager = new LevelManager(this.gameState, this.arrowPool);
    this.inputManager = new InputManager(this.camera, this.renderer.domElement, this.cameraEffects);

    this.inputManager.onArrowClick((arrow: Arrow) => {
      this.handleArrowClick(arrow);
    });

    this.inputManager.onKeyPressDirection((keyDirection) => {
      if (this.gameState.mode !== StateMode.PLAYING) return;
      const targetArrow = this.levelManager.activeTargetArrow;

      if (targetArrow && targetArrow.active && targetArrow.directionKey === keyDirection) {
        this.handleArrowClick(targetArrow);
      } else {
        this.gameState.emit('showToast', { message: '🎯 MATCH THE GLOWING CYAN ARROW!' });
        this.handleMiss();
      }
    });

    this.inputManager.onEmptyClick(() => {
      if (this.gameState.mode === StateMode.PLAYING) {
        this.handleMiss();
      }
    });
  }

  private bindStateEvents() {
    this.gameState.on('modeChange', ({ mode }) => {
      if (mode === StateMode.PLAYING) {
        this.inputManager.setEnabled(true);
        this.platformAdapter.gameplayStart();
        this.audioManager.startMusic();
      } else {
        this.inputManager.setEnabled(false);
        if (mode === StateMode.GAME_OVER || mode === StateMode.MAIN_MENU) {
          this.audioManager.stopMusic();
          this.platformAdapter.gameplayStop();
        }
      }
    });
  }

  public startNewGame() {
    this.gameState.resetSession();
    this.lifeManager.reset();
    this.comboManager.reset();
    this.startLevel(1);
  }

  public startLevel(levelNum: number) {
    if (levelNum !== this.gameState.level) {
      this.gameState.levelRestartsLeft = 3;
    }
    this.levelManager.startLevel(levelNum);
    this.backgroundObjects.applyTheme(this.levelManager.currentConfig.theme);
    
    // Countdown state (3, 2, 1, GO!)
    this.countdownTimer = 3.6;
    this.lastCountdownText = '';
    this.gameState.setMode(StateMode.LEVEL_START);
  }

  public restartCurrentLevel() {
    if (this.gameState.levelRestartsLeft > 0) {
      this.gameState.levelRestartsLeft--;
      this.lifeManager.reset();
      this.startLevel(this.gameState.level);
    }
  }

  private handleArrowClick(arrow: Arrow) {
    if (this.gameState.mode !== StateMode.PLAYING) return;

    if (arrow.arrowType === 'BOMB') {
      // Clicked bomb hazard!
      arrow.triggerError();
      this.particleSystem.burst(arrow.mesh.position, 0xff0000, 25, 8);
      this.gameState.emit('showToast', { message: '⚠️ BOMB ARROW! AVOID RED ARROWS!' });
      this.handleMiss();
      return;
    }

    if (arrow.isTarget) {
      // CORRECT TARGET HIT!
      this.gameState.arrowsHit++;
      const launchVector = arrow.triggerLaunch();
      const rxTimeMs = arrow.getReactionTimeMs();

      // Combo & Reaction Speed Scoring
      const comboMult = this.comboManager.registerHit();
      const { speedCategory } = this.scoreManager.calculateReactionScore(
        arrow.arrowType,
        rxTimeMs,
        arrow.maxLifespan,
        comboMult
      );

      const isPerfect = speedCategory === 'PERFECT';

      // Audio & VFX scaled by reaction speed
      this.audioManager.playHit(comboMult, isPerfect);
      const particleCount = isPerfect ? 35 : (speedCategory === 'GOOD' ? 22 : 14);
      const particleSpeed = isPerfect ? 9 : 6;
      this.particleSystem.burst(arrow.mesh.position, 0x00f0ff, particleCount, particleSpeed);
      this.trailEffect.spawnTrail(arrow.mesh.position, launchVector, 0x00ffff);
      this.backgroundObjects.triggerHitPulse();
      this.cameraEffects.triggerPunch(isPerfect ? -3.0 : (speedCategory === 'GOOD' ? -1.8 : -1.0));

      // Border Animation Reaction
      if (arrow.arrowType !== 'STANDARD') {
        if (this.borderOverlay) this.borderOverlay.pulseSpecial();
      } else {
        if (this.borderOverlay) this.borderOverlay.pulseHit();
      }

      // Handle Special Arrow Secondary Gameplay Effects
      if (arrow.arrowType === 'GOLD') {
        this.audioManager.playSpecial();
      } else if (arrow.arrowType === 'HEART') {
        this.lifeManager.addLife();
        this.audioManager.playSpecial();
      } else if (arrow.arrowType === 'MULTIPLIER') {
        this.scoreManager.setDoubleMultiplier(8);
        this.audioManager.playSpecial();
      }

      // Check level objective progress
      const levelFinished = this.levelManager.registerTargetHit();
      if (levelFinished) {
        this.handleLevelComplete();
      }
    } else {
      // Non-target decoy arrow clicked
      arrow.triggerError();
      this.handleMiss();
    }
  }

  private handleMiss() {
    this.comboManager.registerMiss();
    this.audioManager.playWrong();
    this.cameraEffects.triggerShake(0.5);

    const gameOver = this.lifeManager.loseLife();
    if (gameOver) {
      this.audioManager.playGameOver();
    }
  }

  private handleLevelComplete() {
    this.levelManager.clearCurrentWave();
    const remainingTimeBonus = Math.floor(this.levelManager.timeRemaining * 100);
    this.scoreManager.addLevelBonus(this.gameState.level, remainingTimeBonus);
    this.platformAdapter.happyTime();
    this.audioManager.playLevelComplete();
    this.cameraEffects.triggerPunch(-4.0);
    this.gameState.saveToStorage();
  }

  private handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private startLoop() {
    this.isRunning = true;
    this.clock.start();
    const animate = () => {
      if (this.isRunning) {
        requestAnimationFrame(animate);
        this.update();
        this.render();
      }
    };
    animate();
  }

  private update() {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTotal = this.clock.getElapsedTime();

    // Level Countdown logic
    if (this.gameState.mode === StateMode.LEVEL_START) {
      this.countdownTimer -= delta;
      const val = Math.floor(this.countdownTimer);
      const text = val > 0 ? val.toString() : 'GO!';

      if (text !== this.lastCountdownText) {
        this.lastCountdownText = text;
        this.gameState.emit('countdownUpdate', { text });
        this.audioManager.playCountdownTick(text === 'GO!');
      }

      if (this.countdownTimer <= 0) {
        this.gameState.setMode(StateMode.PLAYING);
      }
    }

    // Active Level update
    if (this.gameState.mode === StateMode.PLAYING) {
      const { targetExpired } = this.levelManager.update(delta);
      if (targetExpired) {
        this.handleMiss();
      }
      this.scoreManager.update(delta);
    }

    // System updates
    this.arrowPool.update(delta, elapsedTotal);
    this.particleSystem.update(delta);
    this.trailEffect.update(delta);
    this.backgroundObjects.update(delta, elapsedTotal, this.comboManager.combo);
    this.cameraEffects.update(delta);

    this.inputManager.update(this.arrowPool.raycastTargetMeshes);
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }
}
