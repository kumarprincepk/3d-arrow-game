import type { DirectionKey, ArrowType } from './constants';

export interface LevelConfig {
  levelNumber: number;
  theme: 'NEON_VOID' | 'CYBER_GRID' | 'ENERGY_CORE' | 'COSMIC_TUNNEL' | 'INFINITE_VOID';
  targetCount: number;
  spawnInterval: number; // Seconds between spawns
  arrowLifespan: number; // Time in seconds before arrow expires if missed
  allowedDirections: DirectionKey[];
  arrowScale: number;
  movingArrows: boolean;
  rotatingArrows: boolean;
  timeLimit?: number; // Optional level timer
  specialArrowChance: number; // 0 to 1
  specialTypesAllowed: ArrowType[];
}

export function getLevelConfig(level: number): LevelConfig {
  // Determine Theme by level bracket
  let theme: LevelConfig['theme'] = 'NEON_VOID';
  if (level >= 6 && level <= 10) theme = 'CYBER_GRID';
  else if (level >= 11 && level <= 15) theme = 'ENERGY_CORE';
  else if (level >= 16 && level <= 20) theme = 'COSMIC_TUNNEL';
  else if (level > 20) theme = 'INFINITE_VOID';

  // Arrow occurrence speed scaling (Level 1: ~1.3s, Level 2: 0.75s, Level 3: 0.60s, Level 4: 0.48s...)
  let spawnInterval = 1.3;
  let arrowLifespan = 3.2;

  if (level === 2) {
    spawnInterval = 0.75;
    arrowLifespan = 2.2;
  } else if (level === 3) {
    spawnInterval = 0.60;
    arrowLifespan = 1.6;
  } else if (level === 4) {
    spawnInterval = 0.48;
    arrowLifespan = 1.3;
  } else if (level >= 5) {
    spawnInterval = Math.max(0.25, 0.40 - (level - 5) * 0.03);
    arrowLifespan = Math.max(0.85, 1.1 - (level - 5) * 0.04);
  }

  const targetCount = Math.min(35, 5 + (level - 1) * 2);
  const arrowScale = Math.max(0.65, 1.4 - level * 0.025);

  // Direction unlocks (Keep standard 4-way keyboard directions for Levels 1-10)
  let allowedDirections: DirectionKey[] = ['UP', 'RIGHT', 'LEFT'];
  if (level >= 2) allowedDirections = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  if (level >= 11) allowedDirections = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'FORWARD', 'BACKWARD'];
  if (level >= 20) {
    allowedDirections = [
      'UP', 'DOWN', 'LEFT', 'RIGHT', 'FORWARD', 'BACKWARD',
      'UP_LEFT', 'UP_RIGHT', 'DOWN_LEFT', 'DOWN_RIGHT'
    ];
  }

  // Special arrows unlock gradually (Positive powerups early, Hazards at Level 15+)
  const specialTypesAllowed: ArrowType[] = [];
  if (level >= 2) specialTypesAllowed.push('GOLD');
  if (level >= 3) specialTypesAllowed.push('HEART');
  if (level >= 4) specialTypesAllowed.push('MULTIPLIER');
  if (level >= 5) specialTypesAllowed.push('FREEZE', 'SPEED');
  if (level >= 15) specialTypesAllowed.push('BOMB');

  const specialArrowChance = level >= 2 ? Math.min(0.35, 0.08 + level * 0.015) : 0;
  const timeLimit = level >= 12 ? Math.max(12, Math.floor(targetCount * (arrowLifespan * 0.85))) : undefined;

  return {
    levelNumber: level,
    theme,
    targetCount,
    spawnInterval,
    arrowLifespan,
    allowedDirections,
    arrowScale,
    movingArrows: level >= 10,
    rotatingArrows: level >= 15,
    timeLimit,
    specialArrowChance,
    specialTypesAllowed
  };
}
