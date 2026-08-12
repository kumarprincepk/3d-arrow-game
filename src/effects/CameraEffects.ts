import * as THREE from 'three';

export class CameraEffects {
  private camera: THREE.PerspectiveCamera;
  private basePos: THREE.Vector3;
  private targetOffset: THREE.Vector3 = new THREE.Vector3();
  private currentOffset: THREE.Vector3 = new THREE.Vector3();
  private shakeIntensity: number = 0;
  private pulseFov: number = 0;
  private baseFov: number;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.basePos = camera.position.clone();
    this.baseFov = camera.fov;
  }

  public setMouseParallax(normalizedX: number, normalizedY: number) {
    this.targetOffset.set(normalizedX * 1.2, normalizedY * 0.8, 0);
  }

  public triggerShake(intensity: number = 0.4) {
    this.shakeIntensity = intensity;
  }

  public triggerPunch(fovAmount: number = -3) {
    this.pulseFov = fovAmount;
  }

  public update(delta: number) {
    // Parallax smooth lerp
    this.currentOffset.lerp(this.targetOffset, delta * 4);

    // Shake decay
    const shakeOffset = new THREE.Vector3();
    if (this.shakeIntensity > 0.001) {
      shakeOffset.set(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity * 0.5
      );
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta * 2.5);
    }

    // FOV recoil lerp
    if (Math.abs(this.pulseFov) > 0.01) {
      this.camera.fov = this.baseFov + this.pulseFov;
      this.pulseFov = THREE.MathUtils.lerp(this.pulseFov, 0, delta * 8);
      this.camera.updateProjectionMatrix();
    } else if (this.camera.fov !== this.baseFov) {
      this.camera.fov = this.baseFov;
      this.camera.updateProjectionMatrix();
    }

    // Apply combined positions
    this.camera.position.copy(this.basePos).add(this.currentOffset).add(shakeOffset);
    this.camera.lookAt(0, 0, 0);
  }

  public resetBasePosition(pos: THREE.Vector3) {
    this.basePos.copy(pos);
    this.camera.position.copy(pos);
  }
}
