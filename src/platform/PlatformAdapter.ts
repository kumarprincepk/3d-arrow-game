export interface IPlatformAdapter {
  name: string;
  init(): Promise<void>;
  gameplayStart(): void;
  gameplayStop(): void;
  happyTime(): void;
  requestMidgameAd?(onComplete?: () => void): void;
  requestRewardedAd?(onSuccess?: () => void, onFailure?: () => void): void;
  requestBanner?(containerId: string): void;
  clearAllBanners?(): void;
  onPause(callback: () => void): void;
  onResume(callback: () => void): void;
}

export class StandaloneAdapter implements IPlatformAdapter {
  public name = 'Standalone';
  private pauseCallbacks: Array<() => void> = [];
  private resumeCallbacks: Array<() => void> = [];

  public async init(): Promise<void> {
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseCallbacks.forEach(cb => cb());
      } else {
        this.resumeCallbacks.forEach(cb => cb());
      }
    });

    window.addEventListener('blur', () => {
      this.pauseCallbacks.forEach(cb => cb());
    });
  }

  public gameplayStart(): void {}
  public gameplayStop(): void {}
  public happyTime(): void {}

  public requestBanner(_containerId: string): void {}
  public clearAllBanners(): void {}

  public onPause(callback: () => void): void {
    this.pauseCallbacks.push(callback);
  }

  public onResume(callback: () => void): void {
    this.resumeCallbacks.push(callback);
  }
}

export class CrazyGamesAdapter implements IPlatformAdapter {
  public name = 'CrazyGames';
  private sdk: any = null;
  private standalone = new StandaloneAdapter();

  public async init(): Promise<void> {
    await this.standalone.init();
    if ((window as any).CrazyGames?.SDK) {
      try {
        this.sdk = (window as any).CrazyGames.SDK;
        await this.sdk.init();

        // Mute audio through SDK settings listener
        if (this.sdk?.game?.settings?.onAudioParamChange) {
          this.sdk.game.settings.onAudioParamChange((mute: boolean) => {
            if (mute) {
              this.standalone.onPause(() => {});
            }
          });
        }
      } catch (e) {
        console.warn('CrazyGames SDK init fallback:', e);
      }
    }
  }

  public gameplayStart(): void {
    this.clearAllBanners();
    if (this.sdk?.gameplay?.gameplayStart) {
      this.sdk.gameplay.gameplayStart();
    }
  }

  public gameplayStop(): void {
    if (this.sdk?.gameplay?.gameplayStop) {
      this.sdk.gameplay.gameplayStop();
    }
  }

  public happyTime(): void {
    if (this.sdk?.gameplay?.happytime) {
      this.sdk.gameplay.happytime();
    }
  }

  public requestMidgameAd(onComplete?: () => void): void {
    if (this.sdk?.ad?.requestAd) {
      const callbacks = {
        adStarted: () => console.log('CrazyGames Midroll Ad started'),
        adFinished: () => {
          if (onComplete) onComplete();
        },
        adError: (error: any) => {
          console.warn('CrazyGames Ad Error:', error);
          if (onComplete) onComplete();
        }
      };

      try {
        this.sdk.ad.requestAd('midroll', callbacks);
      } catch (e) {
        try {
          this.sdk.ad.requestAd('midgame', callbacks);
        } catch (e2) {
          if (onComplete) onComplete();
        }
      }
    } else {
      if (onComplete) onComplete();
    }
  }

  public requestRewardedAd(onSuccess?: () => void, onFailure?: () => void): void {
    if (this.sdk?.ad?.requestAd) {
      this.sdk.ad.requestAd('rewarded', {
        adStarted: () => console.log('CrazyGames Rewarded Ad started'),
        adFinished: () => {
          if (onSuccess) onSuccess();
        },
        adError: (error: any) => {
          console.warn('CrazyGames Rewarded Ad Error:', error);
          if (onFailure) onFailure();
        }
      });
    } else {
      if (onSuccess) onSuccess();
    }
  }

  public requestBanner(containerId: string): void {
    if (this.sdk?.banner?.requestResponsiveBanner) {
      try {
        this.sdk.banner.requestResponsiveBanner(containerId);
      } catch (e) {
        console.warn('CrazyGames Banner Error:', e);
      }
    }
  }

  public clearAllBanners(): void {
    if (this.sdk?.banner?.clearAllBanners) {
      try {
        this.sdk.banner.clearAllBanners();
      } catch (e) {
        console.warn('CrazyGames Clear Banner Error:', e);
      }
    }
  }

  public onPause(callback: () => void): void {
    this.standalone.onPause(callback);
  }

  public onResume(callback: () => void): void {
    this.standalone.onResume(callback);
  }
}

export class PokiAdapter implements IPlatformAdapter {
  public name = 'Poki';
  private sdk: any = null;
  private standalone = new StandaloneAdapter();

  public async init(): Promise<void> {
    await this.standalone.init();
    if ((window as any).PokiSDK) {
      try {
        this.sdk = (window as any).PokiSDK;
        await this.sdk.init();
      } catch (e) {
        console.warn('Poki SDK init fallback:', e);
      }
    }
  }

  public gameplayStart(): void {
    if (this.sdk?.gameplayStart) {
      this.sdk.gameplayStart();
    }
  }

  public gameplayStop(): void {
    if (this.sdk?.gameplayStop) {
      this.sdk.gameplayStop();
    }
  }

  public happyTime(): void {
    if (this.sdk?.happyTime) {
      this.sdk.happyTime(0.8);
    }
  }

  public onPause(callback: () => void): void {
    this.standalone.onPause(callback);
  }

  public onResume(callback: () => void): void {
    this.standalone.onResume(callback);
  }
}

export function createPlatformAdapter(): IPlatformAdapter {
  if ((window as any).CrazyGames?.SDK) return new CrazyGamesAdapter();
  if ((window as any).PokiSDK) return new PokiAdapter();
  return new StandaloneAdapter();
}
