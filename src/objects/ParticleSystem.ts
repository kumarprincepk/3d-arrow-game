import * as THREE from 'three';
import { GAME_SETTINGS } from '../config/constants';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifespan: number;
  maxLife: number;
  active: boolean;
  scaleInitial: number;
}

export class ParticleSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];
  private sphereGeo: THREE.SphereGeometry;
  private matCache: Map<number, THREE.MeshBasicMaterial> = new Map();

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.sphereGeo = new THREE.SphereGeometry(0.08, 8, 8);

    // Initialize particle pool
    for (let i = 0; i < GAME_SETTINGS.POOL_SIZE_PARTICLES; i++) {
      const mat = this.getMaterial(0x00f0ff);
      const mesh = new THREE.Mesh(this.sphereGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        lifespan: 0,
        maxLife: 1,
        active: false,
        scaleInitial: 1
      });
    }
  }

  private getMaterial(colorHex: number): THREE.MeshBasicMaterial {
    if (!this.matCache.has(colorHex)) {
      this.matCache.set(colorHex, new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
      }));
    }
    return this.matCache.get(colorHex)!;
  }

  public burst(pos: THREE.Vector3, colorHex: number = 0x00f0ff, count: number = 20, speed: number = 6) {
    const mat = this.getMaterial(colorHex);
    let spawned = 0;

    for (const p of this.particles) {
      if (!p.active) {
        p.active = true;
        p.mesh.visible = true;
        p.mesh.material = mat;
        p.mesh.position.copy(pos);

        // Random spherical explosion velocity
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const spd = (0.4 + Math.random() * 0.6) * speed;

        p.velocity.set(
          Math.sin(phi) * Math.cos(theta) * spd,
          Math.sin(phi) * Math.sin(theta) * spd,
          Math.cos(phi) * spd
        );

        p.maxLife = 0.4 + Math.random() * 0.4;
        p.lifespan = p.maxLife;
        p.scaleInitial = 0.8 + Math.random() * 0.8;
        p.mesh.scale.setScalar(p.scaleInitial);

        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  public update(delta: number) {
    for (const p of this.particles) {
      if (p.active) {
        p.lifespan -= delta;

        if (p.lifespan <= 0) {
          p.active = false;
          p.mesh.visible = false;
        } else {
          p.mesh.position.addScaledVector(p.velocity, delta);
          p.velocity.multiplyScalar(0.94); // Drag

          const lifeRatio = p.lifespan / p.maxLife;
          p.mesh.scale.setScalar(p.scaleInitial * lifeRatio);
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = lifeRatio;
        }
      }
    }
  }

  public dispose() {
    this.sphereGeo.dispose();
    this.matCache.forEach(mat => mat.dispose());
  }
}
