import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
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

/** Dice / ROLL button — tumbling die + blinking readout */
const DICE_ROLL_MS = 1500;
/** Play button — same animation, can use a different length */
const PLAY_ROLL_MS = 2000;
const ROLL_TICK_MS = 85;
/** Delay between board steps when moving pawn (6 → 7 → 8). */
const TRACK_STEP_MS = 115;
/** After landing on a bonus tile: show it opened, then wait before moving forward. */
const BONUS_REVEAL_PAUSE_MS = 520;
/** CARD/DARE: board tile flip, then open the action modal (matches flip duration). */
const BOARD_FLIP_THEN_MODAL_MS = 500;

@Component({
  selector: 'app-ludo-game',
  templateUrl: './ludo-game-page.component.html',
  styleUrls: ['./ludo-game-page.component.scss'],
  host: { class: 'ludo-route' },
})
export class LudoGamePageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('boardInner', { read: ElementRef }) boardInner?: ElementRef<HTMLElement>;

  diceHer = 1;
  diceHim = 1;

  /** Big digit above dice — matches `diceHer` / `diceHim` after each roll. */
  herReadout = 1;
  himReadout = 1;

  herRolling = false;
  himRolling = false;

  /** Whose turn it is to roll — HER starts; switches after each completed roll. */
  activeTurn: 'her' | 'him' = 'her';

  /** Board positions (linear index: 0 = GO, then PLAYERS, then deck cells). */
  herTrackIndex = 0;
  himTrackIndex = 0;

  /** Brief highlight on dice readout after a roll lands. */
  herReadoutFlash = false;
  himReadoutFlash = false;

  /** True while pawn is stepping or resolving bonus after a roll (dice disabled). */
  herMoveBusy = false;
  himMoveBusy = false;

  private herRollTick: ReturnType<typeof setInterval> | null = null;
  private herRollEnd: ReturnType<typeof setTimeout> | null = null;
  private himRollTick: ReturnType<typeof setInterval> | null = null;
  private himRollEnd: ReturnType<typeof setTimeout> | null = null;

  private readonly pendingMoveTimeouts: ReturnType<typeof setTimeout>[] = [];

  private queueTrackedTimeout(fn: () => void, ms: number): void {
    let id!: ReturnType<typeof setTimeout>;
    id = setTimeout(() => {
      const ix = this.pendingMoveTimeouts.indexOf(id);
      if (ix >= 0) {
        this.pendingMoveTimeouts.splice(ix, 1);
      }
      fn();
    }, ms);
    this.pendingMoveTimeouts.push(id);
  }

  toastMessage = '';
  toastVisible = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  /** True while viewport is portrait — prompt user to rotate (esp. phones). */
  portraitHint = false;

  rulesModalOpen = false;

  /** Shown after a tile is revealed by landing; turn passes only after Complete / Not complete. */
  cardActionModalOpen = false;
  cardActionModalCard: LudocardDeckItem | null = null;
  /** Track index of the tile shown in the action modal (for label, e.g. PLAYERS at 1). */
  cardActionModalTrackIndex: number | null = null;
  /** Drives flip / forward CSS animation after the modal mounts. */
  cardActionModalEnter = false;
  /** Track index whose tile plays the pre-modal flip (CARD/DARE only). */
  boardFlipTrackIndex: number | null = null;
  /** Whose turn landed on this tile — header shows their name. */
  cardActionModalWho: 'her' | 'him' | null = null;
  private pendingTurnAfterCardModal: 'her' | 'him' | null = null;

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
    this.pendingMoveTimeouts.forEach((id) => clearTimeout(id));
    this.pendingMoveTimeouts.length = 0;
    this.boardFlipTrackIndex = null;
  }

  /** Many browsers only lock after a user gesture — retry once after first tap. */
  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    if (this.cardActionModalOpen) {
      this.dismissCardActionModal();
      return;
    }
    if (this.rulesModalOpen) {
      this.closeRulesModal();
    }
  }

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
      lock?: (orientation: string) => Promise<void>;
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

  get isHerTurn(): boolean {
    return this.activeTurn === 'her';
  }

  get isHisTurn(): boolean {
    return this.activeTurn === 'him';
  }

  /** Total cells on the track (GO + deck path). */
  get trackSlotCount(): number {
    if (this.deck.cards.length === 0) {
      return 1;
    }
    return 1 + this.deck.cards.length;
  }

  get herPawnLabel(): string {
    return this.shortPlayerLabel(this.herName);
  }

  get hisPawnLabel(): string {
    return this.shortPlayerLabel(this.hisName);
  }

  private shortPlayerLabel(name: string): string {
    const t = name.trim();
    if (!t.length) {
      return '…';
    }
    return t.length > 9 ? `${t.slice(0, 8)}…` : t;
  }

  /** Linear index for a grid cell (handles last row with fewer than 7 columns). */
  cellIndex(rowIndex: number, colIndex: number): number {
    const rows = this.trackRows;
    let idx = 0;
    for (let r = 0; r < rowIndex; r++) {
      idx += rows[r].length;
    }
    return idx + colIndex;
  }

  isHerAt(rowIndex: number, colIndex: number): boolean {
    return this.herTrackIndex === this.cellIndex(rowIndex, colIndex);
  }

  isHimAt(rowIndex: number, colIndex: number): boolean {
    return this.himTrackIndex === this.cellIndex(rowIndex, colIndex);
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

  /** Card at linear track index: 0 = GO (none), 1 = first card, … */
  getCardAtTrackIndex(trackIndex: number): LudocardDeckItem | null {
    if (trackIndex <= 0) {
      return null;
    }
    const i = trackIndex - 1;
    if (i >= 0 && i < this.deck.cards.length) {
      return this.deck.cards[i];
    }
    return null;
  }

  rollHer(): void {
    this.runHerAnimatedRoll(DICE_ROLL_MS);
  }

  rollHim(): void {
    this.runHimAnimatedRoll(DICE_ROLL_MS);
  }

  playHer(): void {
    this.runHerAnimatedRoll(PLAY_ROLL_MS);
  }

  playHim(): void {
    this.runHimAnimatedRoll(PLAY_ROLL_MS);
  }

  private runHerAnimatedRoll(durationMs: number): void {
    if (this.activeTurn !== 'her' || this.herRolling) {
      return;
    }
    this.clearHerPlayRollTimersOnly();
    const final = Math.floor(Math.random() * 6) + 1;
    this.herRolling = true;
    this.herRollTick = setInterval(() => {
      this.herReadout = Math.floor(Math.random() * 6) + 1;
    }, ROLL_TICK_MS);
    this.herRollEnd = setTimeout(() => {
      this.clearHerPlayRollTimersOnly();
      this.diceHer = final;
      this.herReadout = final;
      this.herRolling = false;
      this.herReadoutFlash = true;
      setTimeout(() => {
        this.herReadoutFlash = false;
      }, 900);
      this.showToast(`♀ Her rolled ${final}!`);
      this.herMoveBusy = true;
      this.beginHerMoveAfterDice(final);
    }, durationMs);
  }

  private runHimAnimatedRoll(durationMs: number): void {
    if (this.activeTurn !== 'him' || this.himRolling) {
      return;
    }
    this.clearHimPlayRollTimersOnly();
    const final = Math.floor(Math.random() * 6) + 1;
    this.himRolling = true;
    this.himRollTick = setInterval(() => {
      this.himReadout = Math.floor(Math.random() * 6) + 1;
    }, ROLL_TICK_MS);
    this.himRollEnd = setTimeout(() => {
      this.clearHimPlayRollTimersOnly();
      this.diceHim = final;
      this.himReadout = final;
      this.himRolling = false;
      this.himReadoutFlash = true;
      setTimeout(() => {
        this.himReadoutFlash = false;
      }, 900);
      this.showToast(`♂ His rolled ${final}!`);
      this.himMoveBusy = true;
      this.beginHimMoveAfterDice(final);
    }, durationMs);
  }

  private beginHerMoveAfterDice(steps: number): void {
    const maxIdx = Math.max(0, this.trackSlotCount - 1);
    const from = this.herTrackIndex;
    const to = Math.min(from + steps, maxIdx);
    this.animateTrackIndex('her', from, to, () => {
      this.finishLandingAfterMove('her', to);
    });
  }

  private beginHimMoveAfterDice(steps: number): void {
    const maxIdx = Math.max(0, this.trackSlotCount - 1);
    const from = this.himTrackIndex;
    const to = Math.min(from + steps, maxIdx);
    this.animateTrackIndex('him', from, to, () => {
      this.finishLandingAfterMove('him', to);
    });
  }

  /**
   * Steps pawn one cell at a time; intermediate cells stay unrevealed.
   * Opens tiles when resolving a landing; bonus tiles open first, then the pawn moves by the bonus amount.
   */
  private animateTrackIndex(
    who: 'her' | 'him',
    from: number,
    to: number,
    done: () => void,
  ): void {
    if (from === to) {
      this.scrollTrackCellIntoView(to);
      done();
      return;
    }
    const dir = to > from ? 1 : -1;
    let cur = from;
    const step = (): void => {
      cur += dir;
      if (who === 'her') {
        this.herTrackIndex = cur;
      } else {
        this.himTrackIndex = cur;
      }
      this.scrollTrackCellIntoView(cur);
      if (cur === to) {
        done();
        return;
      }
      this.queueTrackedTimeout(step, TRACK_STEP_MS);
    };
    this.queueTrackedTimeout(step, TRACK_STEP_MS);
  }

  private finishLandingAfterMove(who: 'her' | 'him', idx: number): void {
    const maxIdx = Math.max(0, this.trackSlotCount - 1);
    const card = this.getCardAtTrackIndex(idx);

    if (!card) {
      this.endTurnAfterResolution(who);
      return;
    }

    if (card.type === LUDOCARD_TYPE_BONUS) {
      const n = card.bonus;
      if (n != null && n >= 1) {
        const next = Math.min(idx + n, maxIdx);
        if (next > idx) {
          if (card.openStatus === 0) {
            card.openStatus = 1;
          }
          this.scrollTrackCellIntoView(idx);
          this.queueTrackedTimeout(() => {
            this.animateTrackIndex(who, idx, next, () => {
              this.finishLandingAfterMove(who, next);
            });
          }, BONUS_REVEAL_PAUSE_MS);
          return;
        }
      }
      if (card.openStatus === 0) {
        card.openStatus = 1;
      }
      this.scrollTrackCellIntoView(idx);
      this.offerCardActionModalIfApplicable(card, who, idx);
      return;
    }

    if (card.openStatus === 0) {
      card.openStatus = 1;
    }
    this.scrollTrackCellIntoView(idx);
    this.offerCardActionModalIfApplicable(card, who, idx);
  }

  /**
   * Bonus & skip (blocker): board only, no modal.
   * CARD: full card in modal. DARE: `value` text only. Others: end turn.
   */
  private offerCardActionModalIfApplicable(
    card: LudocardDeckItem,
    who: 'her' | 'him',
    trackIndex: number,
  ): void {
    if (card.type === LUDOCARD_TYPE_SKIP || card.type === LUDOCARD_TYPE_BONUS) {
      this.endTurnAfterResolution(who);
      return;
    }
    if (card.type === LUDOCARD_TYPE_CARD || card.type === LUDOCARD_TYPE_DARE) {
      this.scheduleBoardFlipThenModal(card, who, trackIndex);
      return;
    }
    this.endTurnAfterResolution(who);
  }

  private prefersReducedMotion(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }

  /** Board tile flip ~0.5s, then existing modal open animation. */
  private scheduleBoardFlipThenModal(
    card: LudocardDeckItem,
    who: 'her' | 'him',
    trackIndex: number,
  ): void {
    if (this.prefersReducedMotion()) {
      this.openCardActionModal(card, who, trackIndex);
      return;
    }
    this.boardFlipTrackIndex = trackIndex;
    this.queueTrackedTimeout(() => {
      this.boardFlipTrackIndex = null;
      this.openCardActionModal(card, who, trackIndex);
    }, BOARD_FLIP_THEN_MODAL_MS);
  }

  private scrollTrackCellIntoView(trackIndex: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const run = (): void => {
      const root = this.boardInner?.nativeElement;
      if (!root) {
        return;
      }
      const el = root.querySelector(`[data-track-index="${trackIndex}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    };
    requestAnimationFrame(() => {
      setTimeout(run, 0);
    });
  }

  private openCardActionModal(card: LudocardDeckItem, who: 'her' | 'him', trackIndex: number): void {
    this.cardActionModalEnter = false;
    this.cardActionModalCard = card;
    this.cardActionModalTrackIndex = trackIndex;
    this.cardActionModalWho = who;
    this.pendingTurnAfterCardModal = who;
    this.cardActionModalOpen = true;
    this.scrollTrackCellIntoView(trackIndex);
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.cardActionModalEnter = true;
      }, 40);
    });
  }

  dismissCardActionModal(): void {
    this.closeCardActionModalAndPassTurn();
  }

  /** Wire your game rules (penalties, etc.) here later. */
  onCardActionComplete(): void {
    this.closeCardActionModalAndPassTurn();
  }

  /** Wire your game rules (penalties, etc.) here later. */
  onCardActionNotComplete(): void {
    this.closeCardActionModalAndPassTurn();
  }

  private closeCardActionModalAndPassTurn(): void {
    const who = this.pendingTurnAfterCardModal;
    this.cardActionModalEnter = false;
    this.cardActionModalOpen = false;
    this.cardActionModalCard = null;
    this.cardActionModalTrackIndex = null;
    this.cardActionModalWho = null;
    this.pendingTurnAfterCardModal = null;
    if (who) {
      this.endTurnAfterResolution(who);
    }
  }

  get cardActionModalPlayerName(): string {
    if (this.cardActionModalWho === 'her') {
      return this.herName;
    }
    if (this.cardActionModalWho === 'him') {
      return this.hisName;
    }
    return '';
  }

  isModalCardType(card: LudocardDeckItem): boolean {
    return card.type === LUDOCARD_TYPE_CARD;
  }

  isModalDareType(card: LudocardDeckItem): boolean {
    return card.type === LUDOCARD_TYPE_DARE;
  }

  private endTurnAfterResolution(who: 'her' | 'him'): void {
    this.herMoveBusy = false;
    this.himMoveBusy = false;
    if (who === 'her') {
      this.activeTurn = 'him';
    } else {
      this.activeTurn = 'her';
    }
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

  openRulesModal(): void {
    this.rulesModalOpen = true;
  }

  closeRulesModal(): void {
    this.rulesModalOpen = false;
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
