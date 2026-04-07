import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { Router } from '@angular/router';
import { LudocardCoupleService } from '../ludocard-couple.service';
import {
  LUDOCARD_TYPE_BONUS,
  LUDOCARD_TYPE_CARD,
  LUDOCARD_TYPE_DARE,
  LUDOCARD_TYPE_SKIP,
  LudocardDeckItem,
  LudocardDeckService,
} from '../ludocard-deck.service';

export type TrackSlot =
  | { kind: 'go' }
  | { kind: 'players'; card: LudocardDeckItem }
  | { kind: 'deck'; card: LudocardDeckItem };

const PLAY_ROLL_MS = 2000;
const PLAY_ROLL_TICK_MS = 85;

@Component({
  selector: 'app-ludo-game',
  templateUrl: './ludo-game-page.component.html',
  styleUrls: ['./ludo-game-page.component.scss'],
  host: { class: 'ludo-route' },
})
export class LudoGamePageComponent implements OnInit, AfterViewInit, OnDestroy {
  diceHer = 1;
  diceHim = 1;
  diceHerSpin = false;
  diceHimSpin = false;

  /** Big digit above dice — matches `diceHer` / `diceHim` after each roll. */
  herReadout = 1;
  himReadout = 1;

  herRolling = false;
  himRolling = false;

  private herRollTick: ReturnType<typeof setInterval> | null = null;
  private herRollEnd: ReturnType<typeof setTimeout> | null = null;
  private himRollTick: ReturnType<typeof setInterval> | null = null;
  private himRollEnd: ReturnType<typeof setTimeout> | null = null;

  toastMessage = '';
  toastVisible = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  /** True while viewport is portrait — prompt user to rotate (esp. phones). */
  portraitHint = false;

  private readonly onOrientOrResize = (): void => this.updatePortraitHint();

  private lockTriedAfterGesture = false;

  readonly dotPatterns: Record<number, [number, number][]> = {
    1: [[32, 32]],
    2: [
      [20, 20],
      [44, 44],
    ],
    3: [
      [20, 20],
      [32, 32],
      [44, 44],
    ],
    4: [
      [20, 20],
      [44, 20],
      [20, 44],
      [44, 44],
    ],
    5: [
      [20, 20],
      [44, 20],
      [32, 32],
      [20, 44],
      [44, 44],
    ],
    6: [
      [20, 20],
      [44, 20],
      [20, 32],
      [44, 32],
      [20, 44],
      [44, 44],
    ],
  };

  readonly herDiceColors = {
    top: '#c084fc',
    right: '#7c3fc0',
    left: '#9b5de5',
    dot: '#1a0a2e',
  };

  readonly hisDiceColors = {
    top: '#60a5fa',
    right: '#1e5fa0',
    left: '#3b82c4',
    dot: '#03122e',
  };

  constructor(
    private readonly router: Router,
    readonly couple: LudocardCoupleService,
    readonly deck: LudocardDeckService,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  ngOnInit(): void {
    if (!this.couple.hasCouple()) {
      void this.router.navigate(['/ludocard']);
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.updatePortraitHint();
    window.addEventListener('orientationchange', this.onOrientOrResize);
    window.addEventListener('resize', this.onOrientOrResize);
    this.tryLockLandscape();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('orientationchange', this.onOrientOrResize);
      window.removeEventListener('resize', this.onOrientOrResize);
      this.unlockLandscape();
    }
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.clearHerPlayRoll();
    this.clearHimPlayRoll();
  }

  /** Many browsers only lock after a user gesture — retry once after first tap. */
  @HostListener('document:click')
  onDocumentClickForLandscapeLock(): void {
    if (!isPlatformBrowser(this.platformId) || this.lockTriedAfterGesture) {
      return;
    }
    this.lockTriedAfterGesture = true;
    this.tryLockLandscape();
  }

  private updatePortraitHint(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.portraitHint = window.matchMedia('(orientation: portrait)').matches;
  }

  private tryLockLandscape(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const so = screen.orientation as ScreenOrientation & {
      lock?: (orientation: OrientationLockType) => Promise<void>;
    };
    if (typeof so?.lock === 'function') {
      void so.lock('landscape').catch(() => {});
    }
    const scr = screen as unknown as {
      lockOrientation?: (o: string) => boolean;
      mozLockOrientation?: (o: string) => boolean;
      msLockOrientation?: (o: string) => boolean;
    };
    try {
      scr.lockOrientation?.('landscape');
      scr.mozLockOrientation?.('landscape');
      scr.msLockOrientation?.('landscape');
    } catch {
      /* unsupported */
    }
  }

  private unlockLandscape(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const so = screen.orientation as ScreenOrientation & { unlock?: () => void };
    if (typeof so?.unlock === 'function') {
      try {
        so.unlock();
      } catch {
        /* */
      }
    }
    const scr = screen as unknown as {
      unlockOrientation?: () => void;
      mozUnlockOrientation?: () => void;
      msUnlockOrientation?: () => void;
    };
    try {
      scr.unlockOrientation?.();
      scr.mozUnlockOrientation?.();
      scr.msUnlockOrientation?.();
    } catch {
      /* */
    }
  }

  get herName(): string {
    return this.couple.femaleName;
  }

  get hisName(): string {
    return this.couple.maleName;
  }

  get trackRows(): TrackSlot[][] {
    const slots: TrackSlot[] = [{ kind: 'go' }];
    if (this.deck.cards.length > 0) {
      slots.push({ kind: 'players', card: this.deck.cards[0] });
      for (let i = 1; i < this.deck.cards.length; i++) {
        slots.push({ kind: 'deck', card: this.deck.cards[i] });
      }
    }
    const rows: TrackSlot[][] = [];
    for (let i = 0; i < slots.length; i += 7) {
      rows.push(slots.slice(i, i + 7));
    }
    return rows;
  }

  herDots(): [number, number][] {
    return this.dotPatterns[this.diceHer] ?? this.dotPatterns[1];
  }

  himDots(): [number, number][] {
    return this.dotPatterns[this.diceHim] ?? this.dotPatterns[1];
  }

  /** Orange pill label for bonus cells (`type` 4). */
  bonusBadgeLabel(card: LudocardDeckItem): string | null {
    if (card.type !== LUDOCARD_TYPE_BONUS) {
      return null;
    }
    const n = card.bonus;
    if (n == null || n < 1) {
      return null;
    }
    return `+${n}`;
  }

  isSkipCard(card: LudocardDeckItem): boolean {
    return card.type === LUDOCARD_TYPE_SKIP;
  }

  /** Normal track tile: playing card or dare (`type` 1 or 2). */
  isFaceCard(cell: LudocardDeckItem): boolean {
    return cell.type === LUDOCARD_TYPE_CARD || cell.type === LUDOCARD_TYPE_DARE;
  }

  /** `openStatus === 0`: blank tile (? + Sl. No. only). */
  isDeckHidden(card: LudocardDeckItem): boolean {
    return card.openStatus === 0;
  }

  /** Sl. No. on the tile — uses the card’s `id` (e.g. 1, 2, 3…). */
  trackSerialNo(card: LudocardDeckItem): number {
    return card.id;
  }

  revealDeckCell(card: LudocardDeckItem): void {
    if (card.openStatus !== 0) {
      return;
    }
    card.openStatus = 1;
  }

  rollHer(): void {
    this.diceHer = Math.floor(Math.random() * 6) + 1;
    this.herReadout = this.diceHer;
    this.diceHerSpin = true;
    setTimeout(() => {
      this.diceHerSpin = false;
    }, 150);
    this.showToast(`♀ Her rolled ${this.diceHer}!`);
  }

  rollHim(): void {
    this.diceHim = Math.floor(Math.random() * 6) + 1;
    this.himReadout = this.diceHim;
    this.diceHimSpin = true;
    setTimeout(() => {
      this.diceHimSpin = false;
    }, 150);
    this.showToast(`♂ His rolled ${this.diceHim}!`);
  }

  playHer(): void {
    if (this.herRolling) {
      return;
    }
    this.clearHerPlayRollTimersOnly();
    const final = Math.floor(Math.random() * 6) + 1;
    this.herRolling = true;
    this.herRollTick = setInterval(() => {
      this.herReadout = Math.floor(Math.random() * 6) + 1;
    }, PLAY_ROLL_TICK_MS);
    this.herRollEnd = setTimeout(() => {
      this.clearHerPlayRollTimersOnly();
      this.diceHer = final;
      this.herReadout = final;
      this.herRolling = false;
      this.showToast(`♀ Her rolled ${final}!`);
    }, PLAY_ROLL_MS);
  }

  playHim(): void {
    if (this.himRolling) {
      return;
    }
    this.clearHimPlayRollTimersOnly();
    const final = Math.floor(Math.random() * 6) + 1;
    this.himRolling = true;
    this.himRollTick = setInterval(() => {
      this.himReadout = Math.floor(Math.random() * 6) + 1;
    }, PLAY_ROLL_TICK_MS);
    this.himRollEnd = setTimeout(() => {
      this.clearHimPlayRollTimersOnly();
      this.diceHim = final;
      this.himReadout = final;
      this.himRolling = false;
      this.showToast(`♂ His rolled ${final}!`);
    }, PLAY_ROLL_MS);
  }

  private clearHerPlayRollTimersOnly(): void {
    if (this.herRollTick) {
      clearInterval(this.herRollTick);
      this.herRollTick = null;
    }
    if (this.herRollEnd) {
      clearTimeout(this.herRollEnd);
      this.herRollEnd = null;
    }
  }

  private clearHimPlayRollTimersOnly(): void {
    if (this.himRollTick) {
      clearInterval(this.himRollTick);
      this.himRollTick = null;
    }
    if (this.himRollEnd) {
      clearTimeout(this.himRollEnd);
      this.himRollEnd = null;
    }
  }

  private clearHerPlayRoll(): void {
    this.clearHerPlayRollTimersOnly();
    this.herRolling = false;
  }

  private clearHimPlayRoll(): void {
    this.clearHimPlayRollTimersOnly();
    this.himRolling = false;
  }

  onDeckCardClick(card: LudocardDeckItem): void {
    this.showToast(`${card.value} (#${card.id})`);
  }

  onGiftClick(): void {
    this.showToast('🎁 Mystery reward!');
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.toastVisible = true;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      this.toastTimer = null;
    }, 2200);
  }

  trackRowByIndex(index: number): number {
    return index;
  }

  trackSlotByKind(_i: number, slot: TrackSlot): string {
    if (slot.kind === 'go') {
      return 'go';
    }
    if (slot.kind === 'players') {
      return `p-${slot.card.id}`;
    }
    return `d-${slot.card.id}`;
  }
}
