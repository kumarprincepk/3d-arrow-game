import * as THREE from 'three';
import { Arrow } from './Arrow';
import { GAME_SETTINGS, type DirectionKey, type ArrowType } from '../config/constants';

export class ArrowPool {
  public group: THREE.Group;
  private pool: Arrow[] = [];
  public raycastTargetMeshes: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    for (let i = 0; i < GAME_SETTINGS.POOL_SIZE_ARROWS; i++) {
      const arrow = new Arrow();
      this.group.add(arrow.mesh);
      this.pool.push(arrow);
      this.raycastTargetMeshes.push(arrow.hitboxMesh);
    }
  }

  public getAvailableArrow(): Arrow | null {
    for (const arrow of this.pool) {
      if (!arrow.active) return arrow;
    }
    return null;
  }

  public spawnArrow(
    pos: THREE.Vector3,
    directionKey: DirectionKey,
    arrowType: ArrowType = 'STANDARD',
    scale: number = 1.0,
    lifespan: number = 3.0,
    isTarget: boolean = true
  ): Arrow | null {
    const arrow = this.getAvailableArrow();
    if (arrow) {
      arrow.init(pos, directionKey, arrowType, scale, lifespan, isTarget);
      return arrow;
    }
    return null;
  }

  public update(delta: number, elapsedTotal: number): Arrow[] {
    const activeArrows: Arrow[] = [];
    for (const arrow of this.pool) {
      if (arrow.active) {
        arrow.update(delta, elapsedTotal);
        activeArrows.push(arrow);
      }
    }
    return activeArrows;
  }

  public resetAll() {
    for (const arrow of this.pool) {
      arrow.reset();
    }
  }
}
