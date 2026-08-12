export interface ThemeConfig {
  name: string;
  bgColor: number;
  gridColor: number;
  ringColor: number;
  fogColor: number;
  particleColors: number[];
  accentColor: string;
}

export const THEMES: Record<string, ThemeConfig> = {
  NEON_VOID: {
    name: 'NEON VOID',
    bgColor: 0x050510,
    gridColor: 0x00f0ff,
    ringColor: 0xff007f,
    fogColor: 0x050510,
    particleColors: [0x00f0ff, 0xff007f, 0x7000ff],
    accentColor: '#00f0ff'
  },
  CYBER_GRID: {
    name: 'CYBER GRID',
    bgColor: 0x021208,
    gridColor: 0x00ff66,
    ringColor: 0xccff00,
    fogColor: 0x021208,
    particleColors: [0x00ff66, 0xccff00, 0x00ffff],
    accentColor: '#00ff66'
  },
  ENERGY_CORE: {
    name: 'ENERGY CORE',
    bgColor: 0x120305,
    gridColor: 0xff3300,
    ringColor: 0xff9900,
    fogColor: 0x120305,
    particleColors: [0xff3300, 0xff9900, 0xff0055],
    accentColor: '#ff3300'
  },
  COSMIC_TUNNEL: {
    name: 'COSMIC TUNNEL',
    bgColor: 0x0a0314,
    gridColor: 0xa855f7,
    ringColor: 0xec4899,
    fogColor: 0x0a0314,
    particleColors: [0xa855f7, 0xec4899, 0x3b82f6],
    accentColor: '#a855f7'
  },
  INFINITE_VOID: {
    name: 'INFINITE VOID',
    bgColor: 0x080c14,
    gridColor: 0x38bdf8,
    ringColor: 0xfacc15,
    fogColor: 0x080c14,
    particleColors: [0x38bdf8, 0xfacc15, 0xffffff],
    accentColor: '#38bdf8'
  }
};

export const DIRECTION_VECTORS = {
  UP: { x: 0, y: 1, z: 0 },
  DOWN: { x: 0, y: -1, z: 0 },
  LEFT: { x: -1, y: 0, z: 0 },
  RIGHT: { x: 1, y: 0, z: 0 },
  FORWARD: { x: 0, y: 0, z: -1 },
  BACKWARD: { x: 0, y: 0, z: 1 },
  UP_LEFT: { x: -0.707, y: 0.707, z: 0 },
  UP_RIGHT: { x: 0.707, y: 0.707, z: 0 },
  DOWN_LEFT: { x: -0.707, y: -0.707, z: 0 },
  DOWN_RIGHT: { x: 0.707, y: -0.707, z: 0 }
};

export type DirectionKey = keyof typeof DIRECTION_VECTORS;

export const ARROW_TYPES = {
  STANDARD: 'STANDARD',
  GOLD: 'GOLD',
  SPEED: 'SPEED',
  FREEZE: 'FREEZE',
  MULTIPLIER: 'MULTIPLIER',
  HEART: 'HEART',
  BOMB: 'BOMB'
} as const;

export type ArrowType = keyof typeof ARROW_TYPES;

export const GAME_SETTINGS = {
  MAX_LIVES: 5,
  BASE_SCORE_HIT: 100,
  PERFECT_HIT_BONUS: 150,
  LEVEL_COMPLETE_BONUS: 1000,
  RAYCAST_HITBOX_SCALE: 1.4, // Generous hitbox for mobile & fast click response
  DEFAULT_DESKTOP_CAMERA_Z: 14,
  POOL_SIZE_ARROWS: 30,
  POOL_SIZE_PARTICLES: 200
};
