import * as THREE from 'three';

export class TrailEffect {
  public group: THREE.Group;
  private trails: Array<{ mesh: THREE.Mesh; life: number; maxLife: number; active: boolean }> = [];
  private boxGeo: THREE.BoxGeometry;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.boxGeo = new THREE.BoxGeometry(0.15, 0.15, 1.2);
  }

  public spawnTrail(startPos: THREE.Vector3, direction: THREE.Vector3, colorHex: number) {
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const mesh = new THREE.Mesh(this.boxGeo, mat);
    mesh.position.copy(startPos);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().normalize());

    this.group.add(mesh);
    this.trails.push({ mesh, life: 0.35, maxLife: 0.35, active: true });
  }

  public update(delta: number) {
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const t = this.trails[i];
      if (t.active) {
        t.life -= delta;
        const ratio = Math.max(0, t.life / t.maxLife);
        (t.mesh.material as THREE.MeshBasicMaterial).opacity = ratio * 0.8;
        t.mesh.scale.set(1 + (1 - ratio), 1 + (1 - ratio), 1 + (1 - ratio) * 2);

        if (t.life <= 0) {
          t.active = false;
          this.group.remove(t.mesh);
          t.mesh.geometry.dispose();
          (t.mesh.material as THREE.Material).dispose();
          this.trails.splice(i, 1);
        }
      }
    }
  }
}
