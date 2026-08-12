export const StateMode = {
  LOADING: 'LOADING',
  MAIN_MENU: 'MAIN_MENU',
  TUTORIAL: 'TUTORIAL',
  LEVEL_START: 'LEVEL_START',
  PLAYING: 'PLAYING',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
} as const;

export type StateMode = typeof StateMode[keyof typeof StateMode];

export interface PlayerSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  reducedMotion: boolean;
}

export class GameState {
  public mode: StateMode = StateMode.LOADING;
  public level: number = 1;
  public score: number = 0;
  public highScore: number = 0;
  public highestLevel: number = 1;
  public bestCombo: number = 0;
  public arrowsHit: number = 0;
  public totalArrowsSpawned: number = 0;
  public levelRestartsLeft: number = 3;
  
  public settings: PlayerSettings = {
    soundEnabled: true,
    musicEnabled: true,
    reducedMotion: false
  };

  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  public setMode(newMode: StateMode, data?: any) {
    this.mode = newMode;
    this.emit('modeChange', { mode: newMode, data });
  }

  public on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  public loadFromStorage() {
    try {
      const savedScore = localStorage.getItem('arrowRush_highScore');
      if (savedScore) this.highScore = parseInt(savedScore, 10) || 0;

      const savedLevel = localStorage.getItem('arrowRush_highestLevel');
      if (savedLevel) this.highestLevel = parseInt(savedLevel, 10) || 1;

      const savedSettings = localStorage.getItem('arrowRush_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (e) {
      console.warn('LocalStorage unavailable or restricted:', e);
    }
  }

  public saveToStorage() {
    try {
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('arrowRush_highScore', this.highScore.toString());
      }
      if (this.level > this.highestLevel) {
        this.highestLevel = this.level;
        localStorage.setItem('arrowRush_highestLevel', this.highestLevel.toString());
      }
      localStorage.setItem('arrowRush_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  public resetSession() {
    this.level = 1;
    this.score = 0;
    this.bestCombo = 0;
    this.arrowsHit = 0;
    this.totalArrowsSpawned = 0;
    this.levelRestartsLeft = 3;
  }
}
