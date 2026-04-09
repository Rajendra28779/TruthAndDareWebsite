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
/** Rule 7: when a mover lands on the other pawn, the bumped player moves back this many cells. */
const COLLISION_PUSH_BACK_STEPS = 3;
// Dice onto the finish: exact count only — overshoot → no move, turn passes (`beginHerMoveAfterDice` / `beginHimMoveAfterDice`).

/** Playful roast toward him when he wins — random one on win overlay. */
const WIN_TAUNTS_HIM_WON: readonly string[] = [
  'Bro, final level reached and still no mood? At this point, even NPCs show more interest than you 💀😂',
  'You completed everything and still like “meh”… bro even weak WiFi connects faster than your feelings 📶😭',
  'Final stage unlocked and you’re calm? Bhai, this is romance… not yoga class 🧘‍♂️😂',
  'Bro came all the way to the end just to act innocent… what is this? Tutorial mode? 😭😆',
  'Oscar goes to you for best “no reaction” performance… even statues have more expression 🗿😂',
  'If after all this you’re still not in the mood… bro your system didn’t just lag, it crashed completely 💻💀',
];

/** Playful roast toward her when she wins — random one on win overlay. */
const WIN_TAUNTS_HER_WON: readonly string[] = [
  'Girl completed everything and still like “hmm okay”… excuse me?? where is the drama queen energy? 😭😂',
  'If you’re still not feeling it… I think we need to check your “romance settings” 😆',
  'If you’re still not feeling anything… I think your “romance app” is not installed properly 😂',
  'You reached the end just to act innocent… wow, commitment to acting is real 😭😆',
  'Final stage and you’re this calm? Sis, this is romance… not a meditation retreat 🧘‍♀️😂',
  'You did everything and still acting “okay okay”… where is the main character energy?? 🎬💀',
];

function pickRandomString(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)] ?? '';
}

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
  /** Dice value for the current move (used for “Not complete” penalty: back by roll + 2). */
  private readonly lastDiceRollSteps: Record<'her' | 'him', number> = { her: 1, him: 1 };
  /** After bumped player fully resolves their new tile, run mover’s landing (same turn). */
  private afterBumpedResolution: (() => void) | null = null;

  /** 0 or 1 — earned only when a Skip tile first opens on a dice landing; spent → 0. */
  herBlockPowerStock = 0;
  himBlockPowerStock = 0;
  /** At most one Block power may be spent per player per full turn (roll → resolve). */
  herBlockPowerUsedThisTurn = false;
  himBlockPowerUsedThisTurn = false;

  /** Rulebook: winning — set when a pawn is on the final track cell after turn resolution. */
  gameWinner: 'her' | 'him' | 'both' | null = null;

  /** One random playful line on the win overlay (pools depend on who won). */
  winTauntMessage = '';

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
    this.afterBumpedResolution = null;
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

  /** Total cells: GO + one slot per deck card (last card = finish). */
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

  /** Card at linear track index: 0 = GO (none), 1…N = `cards[0]…cards[N-1]` (last = finish). */
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

  /** True for the last deck card — finish tile (same as `deck.finaleCard`). */
  isFinaleDeckCard(card: LudocardDeckItem): boolean {
    const fin = this.deck.finaleCard;
    return fin != null && card === fin;
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
    if (this.gameWinner || this.activeTurn !== 'her' || this.herRolling) {
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
    if (this.gameWinner || this.activeTurn !== 'him' || this.himRolling) {
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
    this.lastDiceRollSteps.her = steps;
    const finish = this.finalTrackIndex;
    const from = this.herTrackIndex;
    if (from + steps > finish) {
      this.showToast(
        `♀ Her: need exact dice count to reach the finish — rolled ${steps}, pawn stays; turn passes`,
      );
      this.endTurnAfterResolution('her');
      return;
    }
    const to = from + steps;
    this.animateTrackIndex('her', from, to, () => {
      this.finishLandingAfterMove('her', to, { grantBlockPowerOnSkipOpen: true });
    });
  }

  private beginHimMoveAfterDice(steps: number): void {
    this.lastDiceRollSteps.him = steps;
    const finish = this.finalTrackIndex;
    const from = this.himTrackIndex;
    if (from + steps > finish) {
      this.showToast(
        `♂ His: need exact dice count to reach the finish — rolled ${steps}, pawn stays; turn passes`,
      );
      this.endTurnAfterResolution('him');
      return;
    }
    const to = from + steps;
    this.animateTrackIndex('him', from, to, () => {
      this.finishLandingAfterMove('him', to, { grantBlockPowerOnSkipOpen: true });
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

  /**
   * Block power: max 1 per player. Set when they first open a Skip tile from a dice landing
   * (not bonus slides or collision bumps). Using power → 0; opening again → 1.
   */
  private grantBlockPowerCappedAtOne(who: 'her' | 'him'): void {
    const label = who === 'her' ? '♀ Her' : '♂ His';
    if (who === 'her') {
      this.herBlockPowerStock = 1;
    } else {
      this.himBlockPowerStock = 1;
    }
    this.showToast(`${label}: Block power (max 1) — opened Block tile`);
  }

  private finishLandingAfterMove(
    who: 'her' | 'him',
    idx: number,
    opts?: { skipCollisionCheck?: boolean; grantBlockPowerOnSkipOpen?: boolean },
  ): void {
    const skipCollisionCheck = opts?.skipCollisionCheck === true;
    const grantBlockPowerOnSkipOpen = opts?.grantBlockPowerOnSkipOpen === true;
    const maxIdx = Math.max(0, this.trackSlotCount - 1);
    const other: 'her' | 'him' = who === 'her' ? 'him' : 'her';
    const otherIdx = other === 'her' ? this.herTrackIndex : this.himTrackIndex;

    // Rule 7: mover shares a cell with the other pawn → other goes back 3, resolves new tile first.
    // Rule 5: same Block (Skip) tile → safe zone, no bump / no extra task from collision.
    // Rule 8: bumped player may auto-spend Block power → no bump, no bumped task; mover resolves.
    // Skip while a collision callback is already queued (avoids broken nested chains, e.g. bonus chains).
    const landCardForCollision = idx > 0 ? this.getCardAtTrackIndex(idx) : null;
    const skipCollisionForSafeBlock =
      landCardForCollision != null && this.isSkipCard(landCardForCollision);

    if (
      !skipCollisionCheck &&
      idx > 0 &&
      otherIdx === idx &&
      this.afterBumpedResolution == null &&
      !skipCollisionForSafeBlock
    ) {
      const bumped = other;
      const mover = who;

      // Rule 8 (+ Rule 9): one spend per cycle — same gate as manual “Use Block power”.
      if (this.canUseBlockPower(bumped)) {
        if (bumped === 'her') {
          this.herBlockPowerStock = 0;
          this.herBlockPowerUsedThisTurn = true;
        } else {
          this.himBlockPowerStock = 0;
          this.himBlockPowerUsedThisTurn = true;
        }
        this.showToast(
          `🛡 ${bumped === 'her' ? '♀ Her' : '♂ His'}: Block power auto — no push back, no collision task`,
        );
        this.finishLandingAfterMove(mover, idx, {
          skipCollisionCheck: true,
          grantBlockPowerOnSkipOpen: true,
        });
        return;
      }

      const bumpedTo = Math.max(0, idx - COLLISION_PUSH_BACK_STEPS);
      const savedBumpedRoll = this.lastDiceRollSteps[bumped];
      const moverRoll = this.lastDiceRollSteps[mover];
      this.showToast(
        `${mover === 'her' ? '♀ Her' : '♂ His'} landed on ${bumped === 'her' ? '♀ Her' : '♂ His'} — ${bumped === 'her' ? '♀' : '♂'} back ${COLLISION_PUSH_BACK_STEPS}`,
      );
      this.afterBumpedResolution = () => {
        this.lastDiceRollSteps[bumped] = savedBumpedRoll;
        this.finishLandingAfterMove(mover, idx, {
          skipCollisionCheck: true,
          grantBlockPowerOnSkipOpen: true,
        });
      };
      // Rule 3 penalty on bumped’s forced task uses this turn’s invader dice until collision chain ends.
      this.lastDiceRollSteps[bumped] = moverRoll;
      this.animateTrackIndex(bumped, idx, bumpedTo, () => {
        this.finishLandingAfterMove(bumped, bumpedTo, { grantBlockPowerOnSkipOpen: false });
      });
      return;
    }

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
              this.finishLandingAfterMove(who, next, { grantBlockPowerOnSkipOpen: false });
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

    const firstOpenThisLand = card.openStatus === 0;
    if (firstOpenThisLand) {
      card.openStatus = 1;
    }
    if (
      card.type === LUDOCARD_TYPE_SKIP &&
      firstOpenThisLand &&
      grantBlockPowerOnSkipOpen
    ) {
      this.grantBlockPowerCappedAtOne(who);
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
    if (this.gameWinner) {
      return;
    }
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
    /* Backdrop / Escape: treat like task done — no penalty (avoids punishing mis-taps). */
    this.closeCardActionModalAndPassTurn(true);
  }

  onCardActionComplete(): void {
    this.closeCardActionModalAndPassTurn(true);
  }

  /** Rule 3: refuse / fail → move back by this turn’s dice roll + 2, then end turn. */
  onCardActionNotComplete(): void {
    this.closeCardActionModalAndPassTurn(false);
  }

  /** Rule 6: spend 1 Block power — skip task and avoid penalty; one spend per turn max. */
  onUseBlockPowerInModal(): void {
    const w = this.cardActionModalWho;
    if (w == null || !this.canUseBlockPower(w)) {
      return;
    }
    if (w === 'her') {
      this.herBlockPowerStock = 0;
      this.herBlockPowerUsedThisTurn = true;
    } else {
      this.himBlockPowerStock = 0;
      this.himBlockPowerUsedThisTurn = true;
    }
    this.showToast('🛡 Block power — task skipped, no penalty');
    this.closeCardActionModalAndPassTurn(true);
  }

  canUseBlockPower(who: 'her' | 'him'): boolean {
    const stock = who === 'her' ? this.herBlockPowerStock : this.himBlockPowerStock;
    const used = who === 'her' ? this.herBlockPowerUsedThisTurn : this.himBlockPowerUsedThisTurn;
    return stock > 0 && !used;
  }

  get cardActionModalCanUseBlockPower(): boolean {
    const w = this.cardActionModalWho;
    return w != null && this.canUseBlockPower(w);
  }

  private closeCardActionModalAndPassTurn(completedTask: boolean): void {
    const who = this.pendingTurnAfterCardModal;
    this.cardActionModalEnter = false;
    this.cardActionModalOpen = false;
    this.cardActionModalCard = null;
    this.cardActionModalTrackIndex = null;
    this.cardActionModalWho = null;
    this.pendingTurnAfterCardModal = null;
    if (!who) {
      return;
    }
    if (completedTask) {
      this.endTurnAfterResolution(who);
      return;
    }
    const rollSteps = this.lastDiceRollSteps[who];
    const penaltySteps = rollSteps + 2;
    const from = who === 'her' ? this.herTrackIndex : this.himTrackIndex;
    const to = Math.max(0, from - penaltySteps);
    const label = who === 'her' ? '♀ Her' : '♂ His';
    this.showToast(`${label}: move back ${penaltySteps} (${rollSteps} roll + 2)`);
    if (from === to) {
      this.endTurnAfterResolution(who);
      return;
    }
    this.animateTrackIndex(who, from, to, () => {
      this.endTurnAfterResolution(who);
    });
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
    if (this.afterBumpedResolution) {
      const next = this.afterBumpedResolution;
      this.afterBumpedResolution = null;
      this.herMoveBusy = true;
      this.himMoveBusy = true;
      next();
      return;
    }
    this.herMoveBusy = false;
    this.himMoveBusy = false;
    /* Fresh spend allowance next time anyone resolves after this roll cycle (incl. collision chains). */
    this.herBlockPowerUsedThisTurn = false;
    this.himBlockPowerUsedThisTurn = false;
    if (who === 'her') {
      this.activeTurn = 'him';
    } else {
      this.activeTurn = 'her';
    }
    this.maybeDeclareWinner();
  }

  /** Last board index (final space). GO = 0; win = reach here after resolution. */
  get finalTrackIndex(): number {
    return Math.max(0, this.trackSlotCount - 1);
  }

  get winnerHeadline(): string {
    if (this.gameWinner === 'her') {
      return `${this.herName} wins!`;
    }
    if (this.gameWinner === 'him') {
      return `${this.hisName} wins!`;
    }
    if (this.gameWinner === 'both') {
      return 'Both reached the finish!';
    }
    return '';
  }

  private maybeDeclareWinner(): void {
    if (this.gameWinner !== null) {
      return;
    }
    const last = this.finalTrackIndex;
    if (last < 1) {
      return;
    }
    const herFin = this.herTrackIndex >= last;
    const himFin = this.himTrackIndex >= last;
    if (herFin && !himFin) {
      this.gameWinner = 'her';
    } else if (himFin && !herFin) {
      this.gameWinner = 'him';
    } else if (herFin && himFin) {
      this.gameWinner = 'both';
    }
    if (this.gameWinner !== null) {
      this.assignWinTauntForOutcome();
      this.showToast(`🏆 ${this.winnerHeadline}`);
    }
  }

  /** Him won → bro/roast-him lines; her won → girl/sis lines; tie → random pool. */
  private assignWinTauntForOutcome(): void {
    const w = this.gameWinner;
    if (w === 'him') {
      this.winTauntMessage = pickRandomString(WIN_TAUNTS_HIM_WON);
    } else if (w === 'her') {
      this.winTauntMessage = pickRandomString(WIN_TAUNTS_HER_WON);
    } else if (w === 'both') {
      this.winTauntMessage = pickRandomString(
        Math.random() < 0.5 ? WIN_TAUNTS_HIM_WON : WIN_TAUNTS_HER_WON,
      );
    } else {
      this.winTauntMessage = '';
    }
  }

  /** New round: same couple, fresh board (Rulebook reset). */
  startNewRound(): void {
    this.gameWinner = null;
    this.winTauntMessage = '';
    this.herTrackIndex = 0;
    this.himTrackIndex = 0;
    this.activeTurn = 'her';
    this.herBlockPowerStock = 0;
    this.himBlockPowerStock = 0;
    this.herBlockPowerUsedThisTurn = false;
    this.himBlockPowerUsedThisTurn = false;
    this.afterBumpedResolution = null;
    this.boardFlipTrackIndex = null;
    this.cardActionModalOpen = false;
    this.cardActionModalEnter = false;
    this.cardActionModalCard = null;
    this.cardActionModalTrackIndex = null;
    this.cardActionModalWho = null;
    this.pendingTurnAfterCardModal = null;
    for (const c of this.deck.cards) {
      c.openStatus = 0;
    }
    this.showToast('New round — board reset');
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
