import * as THREE from 'three';
import { Arrow } from '../objects/Arrow';
import { CameraEffects } from '../effects/CameraEffects';
import type { DirectionKey } from '../config/constants';

export class InputManager {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private cameraEffects: CameraEffects;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;

  private hoveredArrow: Arrow | null = null;
  private onArrowClickedCallback: ((arrow: Arrow, isPerfect: boolean) => void) | null = null;
  private onKeyPressDirectionCallback: ((direction: DirectionKey) => void) | null = null;
  private onEmptyClickCallback: (() => void) | null = null;
  private enabled: boolean = true;

  // Touch Swipe Gesture State
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    cameraEffects: CameraEffects
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.cameraEffects = cameraEffects;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-999, -999);

    this.bindEvents();
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled && this.hoveredArrow) {
      this.hoveredArrow.setHover(false);
      this.hoveredArrow = null;
      this.domElement.style.cursor = 'default';
    }
  }

  public onArrowClick(callback: (arrow: Arrow, isPerfect: boolean) => void) {
    this.onArrowClickedCallback = callback;
  }

  public onKeyPressDirection(callback: (direction: DirectionKey) => void) {
    this.onKeyPressDirectionCallback = callback;
  }

  public onEmptyClick(callback: () => void) {
    this.onEmptyClickCallback = callback;
  }

  private bindEvents() {
    const updatePointer = (clientX: number, clientY: number) => {
      const rect = this.domElement.getBoundingClientRect();
      this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      // Parallax update
      this.cameraEffects.setMouseParallax(this.pointer.x, this.pointer.y);
    };

    this.domElement.addEventListener('pointermove', (e) => {
      updatePointer(e.clientX, e.clientY);
    });

    const handlePointerDown = (e: PointerEvent) => {
      if (!this.enabled) return;
      updatePointer(e.clientX, e.clientY);
      this.processRaycast(true);
    };

    this.domElement.addEventListener('pointerdown', handlePointerDown);

    // Mobile & Tablet Touch Swipe / Slide Gesture Recognition
    this.domElement.addEventListener('touchstart', (e: TouchEvent) => {
      if (!this.enabled || e.touches.length === 0) return;
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = performance.now();
    }, { passive: true });

    this.domElement.addEventListener('touchend', (e: TouchEvent) => {
      if (!this.enabled || e.changedTouches.length === 0 || !this.onKeyPressDirectionCallback) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - this.touchStartX;
      const deltaY = touchEndY - this.touchStartY;
      const elapsedTime = performance.now() - this.touchStartTime;

      const distance = Math.hypot(deltaX, deltaY);
      const minSwipeDistance = 35; // Minimum pixel drag to qualify as swipe

      if (distance >= minSwipeDistance && elapsedTime < 450) {
        let swipeDir: DirectionKey | null = null;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          swipeDir = deltaX > 0 ? 'RIGHT' : 'LEFT';
        } else {
          swipeDir = deltaY > 0 ? 'DOWN' : 'UP';
        }

        if (swipeDir) {
          this.onKeyPressDirectionCallback(swipeDir);
        }
      }
    }, { passive: true });

    // Keyboard Arrow Keys support for Laptop & Desktop Players
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.enabled || !this.onKeyPressDirectionCallback) return;

      let keyDir: DirectionKey | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          keyDir = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          keyDir = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          keyDir = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          keyDir = 'RIGHT';
          break;
        case ' ':
        case 'Spacebar':
        case 'e':
        case 'E':
        case 'f':
        case 'F':
        case 'Enter':
          keyDir = 'FORWARD';
          break;
        case 'q':
        case 'Q':
        case 'b':
        case 'B':
        case 'Shift':
          keyDir = 'BACKWARD';
          break;
      }

      if (keyDir) {
        e.preventDefault();
        this.onKeyPressDirectionCallback(keyDir);
      }
    });
  }

  public update(targetMeshes: THREE.Mesh[]) {
    if (!this.enabled || targetMeshes.length === 0) return;
    this.processRaycast(false, targetMeshes);
  }

  private processRaycast(isClick: boolean, targetMeshes?: THREE.Mesh[]) {
    if (this.pointer.x === -999 && this.pointer.y === -999) return;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshesToTest = targetMeshes || [];
    const intersects = this.raycaster.intersectObjects(meshesToTest, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const arrow: Arrow = hitMesh.userData?.arrowInstance;

      if (arrow && arrow.active && (arrow.state === 'IDLE' || arrow.state === 'HOVER')) {
        if (isClick) {
          const distToCenter = intersects[0].distance;
          const isPerfect = distToCenter < 12.5;

          if (this.onArrowClickedCallback) {
            this.onArrowClickedCallback(arrow, isPerfect);
          }
        } else {
          // Hover state & cursor feedback
          if (this.hoveredArrow !== arrow) {
            if (this.hoveredArrow) this.hoveredArrow.setHover(false);
            this.hoveredArrow = arrow;
            this.hoveredArrow.setHover(true);
            this.domElement.style.cursor = 'pointer';
          }
        }
        return;
      }
    }

    // No arrow intersected
    if (!isClick && this.hoveredArrow) {
      this.hoveredArrow.setHover(false);
      this.hoveredArrow = null;
      this.domElement.style.cursor = 'default';
    } else if (isClick && this.onEmptyClickCallback) {
      this.onEmptyClickCallback();
    }
  }
}
