import * as THREE from 'three';
import { THEMES, type ThemeConfig } from '../config/constants';

export class BackgroundObjects {
  public group: THREE.Group;
  private scene: THREE.Scene;
  private gridFloor!: THREE.GridHelper;
  private rings: THREE.Mesh[] = [];
  private cubes: THREE.Mesh[] = [];
  private starPoints!: THREE.Points;
  private starMaterial!: THREE.PointsMaterial;

  public currentThemeConfig: ThemeConfig = THEMES.NEON_VOID;
  private ringMaterial!: THREE.MeshBasicMaterial;
  private cubeMaterial!: THREE.MeshStandardMaterial;

  private hitPulseFactor: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.createStars();
    this.createGrid();
    this.createRings();
    this.createCubes();

    this.applyTheme('NEON_VOID');
  }

  private createStars() {
    const starCount = 600;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 120;
      positions[i + 1] = (Math.random() - 0.5) * 120;
      positions[i + 2] = -20 - Math.random() * 80;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.25,
      transparent: true,
      opacity: 0.85
    });

    this.starPoints = new THREE.Points(geo, this.starMaterial);
    this.group.add(this.starPoints);
  }

  private createGrid() {
    this.gridFloor = new THREE.GridHelper(120, 40, 0x00f0ff, 0x005577);
    this.gridFloor.position.y = -6;
    this.gridFloor.position.z = -20;
    this.group.add(this.gridFloor);
  }

  private createRings() {
    const ringGeo = new THREE.TorusGeometry(14, 0.06, 16, 64);
    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });

    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(ringGeo, this.ringMaterial);
      ring.position.z = -35 - i * 25;
      ring.rotation.z = Math.random() * Math.PI;
      this.rings.push(ring);
      this.group.add(ring);
    }
  }

  private createCubes() {
    const cubeGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    this.cubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x7000ff,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });

    for (let i = 0; i < 12; i++) {
      const cube = new THREE.Mesh(cubeGeo, this.cubeMaterial);
      cube.position.set(
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 20,
        -5 - Math.random() * 40
      );
      cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      this.cubes.push(cube);
      this.group.add(cube);
    }
  }

  public applyTheme(themeKey: keyof typeof THEMES) {
    const config = THEMES[themeKey] || THEMES.NEON_VOID;
    this.currentThemeConfig = config;

    this.scene.background = new THREE.Color(config.bgColor);
    if (this.scene.fog) {
      this.scene.fog.color.setHex(config.fogColor);
    } else {
      this.scene.fog = new THREE.FogExp2(config.fogColor, 0.02);
    }

    this.ringMaterial.color.setHex(config.ringColor);
    this.cubeMaterial.color.setHex(config.particleColors[0]);
    this.starMaterial.color.setHex(config.particleColors[1] || 0xffffff);

    // Re-create grid colors
    this.group.remove(this.gridFloor);
    this.gridFloor.geometry.dispose();
    this.gridFloor = new THREE.GridHelper(120, 40, config.gridColor, config.gridColor);
    this.gridFloor.position.y = -6;
    this.gridFloor.position.z = -20;
    this.group.add(this.gridFloor);
  }

  public triggerHitPulse() {
    this.hitPulseFactor = 1.0;
  }

  public update(delta: number, elapsedTotal: number, combo: number = 0) {
    // Rotation of background rings
    const ringSpeed = 0.3 + combo * 0.05;
    this.rings.forEach((ring, idx) => {
      ring.rotation.z += delta * ringSpeed * (idx % 2 === 0 ? 1 : -1);
      const ringPulseScale = 1.0 + (this.hitPulseFactor * 0.15);
      ring.scale.setScalar(ringPulseScale);
    });

    // Floating cubes
    this.cubes.forEach((cube, idx) => {
      cube.rotation.x += delta * 0.5;
      cube.rotation.y += delta * 0.8;
      cube.position.y += Math.sin(elapsedTotal * 1.5 + idx) * 0.005;
    });

    // Hit pulse decay
    if (this.hitPulseFactor > 0) {
      this.hitPulseFactor = Math.max(0, this.hitPulseFactor - delta * 4);
    }

    // Grid scrolling
    this.gridFloor.position.z += delta * (2.0 + Math.min(combo, 15) * 0.4);
    if (this.gridFloor.position.z > 0) {
      this.gridFloor.position.z = -20;
    }
  }
}
