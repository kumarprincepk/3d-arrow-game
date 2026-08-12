import * as THREE from 'three';
import { DIRECTION_VECTORS, type DirectionKey, type ArrowType } from '../config/constants';

export class Arrow {
  public mesh: THREE.Group;
  public hitboxMesh: THREE.Mesh;
  public arrowType: ArrowType = 'STANDARD';
  public directionKey: DirectionKey = 'UP';
  public directionVector: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

  public isTarget: boolean = false;
  public active: boolean = false;
  public state: 'IDLE' | 'HOVER' | 'LAUNCHING' | 'ERROR' = 'IDLE';

  public lifespan: number = 3.0;
  public maxLifespan: number = 3.0;
  public spawnTime: number = 0;

  private bodyMesh: THREE.Mesh;
  private headMesh: THREE.Mesh;
  private haloMesh: THREE.Mesh;
  private targetRingMesh: THREE.Mesh;

  private bodyMat: THREE.MeshStandardMaterial;
  private headMat: THREE.MeshStandardMaterial;
  private haloMat: THREE.MeshBasicMaterial;
  private targetRingMat: THREE.MeshBasicMaterial;

  private baseScale: number = 1.0;
  private hoverScaleTarget: number = 1.0;
  private currentScale: number = 1.0;
  private launchSpeed: number = 22.0;

  private floatOffset: number = Math.random() * Math.PI * 2;
  public initialPosition: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    this.mesh = new THREE.Group();

    // Materials
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x005577,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8
    });

    this.headMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00aaff,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9
    });

    this.haloMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.targetRingMat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    // 1. Shaft (Cylinder)
    const shaftGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.4, 16);
    shaftGeo.translate(0, -0.2, 0);
    this.bodyMesh = new THREE.Mesh(shaftGeo, this.bodyMat);
    this.mesh.add(this.bodyMesh);

    // 2. Arrowhead (Cone)
    const headGeo = new THREE.ConeGeometry(0.55, 0.9, 16);
    headGeo.translate(0, 0.85, 0);
    this.headMesh = new THREE.Mesh(headGeo, this.headMat);
    this.mesh.add(this.headMesh);

    // 3. Glowing Halo Aura
    const haloGeo = new THREE.ConeGeometry(0.75, 2.2, 16);
    haloGeo.translate(0, 0.3, 0);
    this.haloMesh = new THREE.Mesh(haloGeo, this.haloMat);
    this.mesh.add(this.haloMesh);

    // 4. Target Indicator Ring
    const ringGeo = new THREE.RingGeometry(0.9, 1.05, 32);
    ringGeo.rotateX(Math.PI / 2);
    this.targetRingMesh = new THREE.Mesh(ringGeo, this.targetRingMat);
    this.targetRingMesh.visible = false;
    this.mesh.add(this.targetRingMesh);

    // 5. Invisible Enlarged Hitbox for reliable Mobile & Mouse clicks
    const hitGeo = new THREE.BoxGeometry(1.6, 2.4, 1.6);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.hitboxMesh = new THREE.Mesh(hitGeo, hitMat);
    this.hitboxMesh.userData = { arrowInstance: this };
    this.mesh.add(this.hitboxMesh);

    this.mesh.visible = false;
  }

  public init(
    pos: THREE.Vector3,
    directionKey: DirectionKey,
    arrowType: ArrowType = 'STANDARD',
    scale: number = 1.0,
    lifespan: number = 3.0,
    isTarget: boolean = true
  ) {
    this.active = true;
    this.state = 'IDLE';
    this.isTarget = isTarget;
    this.directionKey = directionKey;
    this.arrowType = arrowType;
    this.baseScale = scale;
    this.currentScale = scale;
    this.hoverScaleTarget = scale;
    this.lifespan = lifespan;
    this.maxLifespan = lifespan;
    this.spawnTime = performance.now();

    this.initialPosition.copy(pos);
    this.mesh.position.copy(pos);
    this.mesh.scale.setScalar(scale);
    this.mesh.visible = true;

    // Apply orientation
    const v = DIRECTION_VECTORS[directionKey];
    this.directionVector.set(v.x, v.y, v.z).normalize();
    this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.directionVector);

    // Color theme by type
    this.applyTypeStyles();

    this.targetRingMesh.visible = isTarget;
  }

  public getReactionTimeMs(): number {
    return Math.max(0, performance.now() - this.spawnTime);
  }

  private applyTypeStyles() {
    let mainColor = 0x00f0ff;
    let emissiveColor = 0x005577;
    let ringColor = 0x00f0ff;

    switch (this.arrowType) {
      case 'GOLD':
        mainColor = 0xffd700;
        emissiveColor = 0xffa500;
        ringColor = 0xffff00;
        break;
      case 'SPEED':
        mainColor = 0x00ffcc;
        emissiveColor = 0x00aa88;
        ringColor = 0x00ffcc;
        break;
      case 'FREEZE':
        mainColor = 0x3b82f6;
        emissiveColor = 0x1d4ed8;
        ringColor = 0x60a5fa;
        break;
      case 'MULTIPLIER':
        mainColor = 0xa855f7;
        emissiveColor = 0x7e22ce;
        ringColor = 0xc084fc;
        break;
      case 'HEART':
        mainColor = 0xff0055;
        emissiveColor = 0xaa0033;
        ringColor = 0xff3377;
        break;
      case 'BOMB':
        mainColor = 0xff2200;
        emissiveColor = 0x990000;
        ringColor = 0xff0000;
        break;
      case 'STANDARD':
      default:
        mainColor = this.isTarget ? 0x00f0ff : 0x555577;
        emissiveColor = this.isTarget ? 0x0088cc : 0x111122;
        ringColor = 0x00f0ff;
        break;
    }

    this.bodyMat.color.setHex(mainColor);
    this.bodyMat.emissive.setHex(emissiveColor);
    this.headMat.color.setHex(mainColor);
    this.headMat.emissive.setHex(emissiveColor);
    this.haloMat.color.setHex(mainColor);
    this.targetRingMat.color.setHex(ringColor);
  }

  public setHover(hover: boolean) {
    if (this.state !== 'IDLE' && this.state !== 'HOVER') return;
    this.state = hover ? 'HOVER' : 'IDLE';
    this.hoverScaleTarget = hover ? this.baseScale * 1.2 : this.baseScale;
    this.bodyMat.emissiveIntensity = hover ? 1.4 : 0.6;
    this.headMat.emissiveIntensity = hover ? 1.8 : 0.9;
  }

  public triggerLaunch(): THREE.Vector3 {
    this.state = 'LAUNCHING';
    this.bodyMat.emissiveIntensity = 2.5;
    this.headMat.emissiveIntensity = 3.0;
    this.hoverScaleTarget = this.baseScale * 1.45;
    return this.directionVector.clone();
  }

  public triggerError() {
    this.state = 'ERROR';
    this.bodyMat.color.setHex(0xff0000);
    this.bodyMat.emissive.setHex(0xaa0000);
    this.headMat.color.setHex(0xff0000);
    this.headMat.emissive.setHex(0xaa0000);
  }

  public update(delta: number, elapsedTotal: number) {
    if (!this.active) return;

    // Lifespan count down
    if (this.state === 'IDLE' || this.state === 'HOVER') {
      this.lifespan -= delta;
    }

    // Smooth scale interpolation
    this.currentScale = THREE.MathUtils.lerp(this.currentScale, this.hoverScaleTarget, delta * 12);
    this.mesh.scale.setScalar(this.currentScale);

    if (this.state === 'IDLE' || this.state === 'HOVER') {
      // Gentle floating animation
      const floatVal = Math.sin(elapsedTotal * 2.5 + this.floatOffset) * 0.12;
      this.mesh.position.y = this.initialPosition.y + floatVal;

      // Pulse target ring
      if (this.isTarget) {
        const ringPulse = 1.0 + Math.sin(elapsedTotal * 6) * 0.15;
        this.targetRingMesh.scale.setScalar(ringPulse);
        this.targetRingMat.opacity = 0.6 + Math.sin(elapsedTotal * 6) * 0.3;
      }
    } else if (this.state === 'LAUNCHING') {
      // Fly forward at high velocity & fade out
      this.mesh.position.addScaledVector(this.directionVector, this.launchSpeed * delta);
      this.haloMat.opacity -= delta * 2.5;
      this.bodyMat.opacity = Math.max(0, this.bodyMat.opacity - delta * 2.5);
      this.headMat.opacity = Math.max(0, this.headMat.opacity - delta * 2.5);

      if (this.haloMat.opacity <= 0) {
        this.reset();
      }
    } else if (this.state === 'ERROR') {
      // Error shake
      this.mesh.position.x = this.initialPosition.x + (Math.random() - 0.5) * 0.3;
      this.mesh.position.y = this.initialPosition.y + (Math.random() - 0.5) * 0.3;
    }
  }

  public reset() {
    this.active = false;
    this.mesh.visible = false;
    this.targetRingMesh.visible = false;
    this.bodyMat.opacity = 1;
    this.headMat.opacity = 1;
    this.haloMat.opacity = 0.25;
    this.state = 'IDLE';
  }
}
