import { Injectable } from '@angular/core';

/** Deck cell kinds — matches `type` on each item. */
export const LUDOCARD_TYPE_CARD = 1;
export const LUDOCARD_TYPE_DARE = 2;
export const LUDOCARD_TYPE_SKIP = 3;
export const LUDOCARD_TYPE_BONUS = 4;

export interface LudocardDeckItem {
  id: number;
  value: string;
  /** 1 = card, 2 = dare, 3 = skip, 4 = bonus */
  type: number;
  /** Asset path (e.g. `assets/ludocard/...`); null when no image (e.g. bonus-only). */
  img: string | null;
  /** For `type` 4: bonus amount (1–3). Skip rows may use `0`. */
  bonus?: number;
  /** 0 = closed, 1 = opened */
  openStatus: number;
}

@Injectable({
  providedIn: 'root',
})
export class LudocardDeckService {
  readonly cards: LudocardDeckItem[] = [
    { id: 1, value: 'Card 1', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/couple.svg', openStatus: 0 },
    { id: 2, value: 'Card 2', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-02.svg', openStatus: 0 },
    { id: 3, value: 'Card 3', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-03.svg', openStatus: 0 },
    { id: 4, value: 'Card 4', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-04.svg', openStatus: 0 },
    { id: 5, value: 'Card 5', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-05.svg', openStatus: 0 },

    { id: 6, value: 'Bonus +2', type: LUDOCARD_TYPE_BONUS, img: null, bonus: 2, openStatus: 0 },

    { id: 7, value: 'Card 7', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-07.svg', openStatus: 0 },
    { id: 8, value: 'Card 8', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-08.svg', openStatus: 0 },
    { id: 9, value: 'Card 9', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-09.svg', openStatus: 0 },

    { id: 10, value: 'Bonus +1', type: LUDOCARD_TYPE_BONUS, img: null, bonus: 1, openStatus: 0 },

    { id: 11, value: 'Card 11', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-11.svg', openStatus: 0 },
    { id: 12, value: 'Card 12', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-12.svg', openStatus: 0 },
    { id: 13, value: 'Card 13', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-13.svg', openStatus: 0 },
    { id: 14, value: 'Card 14', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-14.svg', openStatus: 0 },
    { id: 15, value: 'Card 15', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-15.svg', openStatus: 0 },

    { id: 16, value: 'Skip this turn', type: LUDOCARD_TYPE_SKIP, img: 'assets/ludocard/no-symbol.svg', bonus: 0, openStatus: 0 },

    { id: 17, value: 'Card 17', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-17.svg', openStatus: 0 },

    { id: 18, value: 'Bonus +3', type: LUDOCARD_TYPE_BONUS, img: null, bonus: 3, openStatus: 0 },

    { id: 19, value: 'Card 19', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-19.svg', openStatus: 0 },
    { id: 20, value: 'Card 20', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-20.svg', openStatus: 0 },
    { id: 21, value: 'Card 21', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-21.svg', openStatus: 0 },
    { id: 22, value: 'Card 22', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-22.svg', openStatus: 0 },

    { id: 23, value: 'Bonus +3', type: LUDOCARD_TYPE_BONUS, img: null, bonus: 3, openStatus: 0 },

    { id: 24, value: 'Card 24', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-24.svg', openStatus: 0 },
    { id: 25, value: 'Card 25', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-25.svg', openStatus: 0 },

    { id: 26, value: 'Skip this turn', type: LUDOCARD_TYPE_SKIP, img: 'assets/ludocard/no-symbol.svg', bonus: 0, openStatus: 0 },

    { id: 27, value: 'Card 27', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-27.svg', openStatus: 0 },
    { id: 28, value: 'Card 28', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-28.svg', openStatus: 0 },

    { id: 29, value: 'Skip this turn', type: LUDOCARD_TYPE_SKIP, img: 'assets/ludocard/no-symbol.svg', bonus: 0, openStatus: 0 },
    { id: 30, value: 'Card 30', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-30.svg', openStatus: 0 },

    { id: 31, value: 'Bonus +2', type: LUDOCARD_TYPE_BONUS, img: null, bonus: 2, openStatus: 0 },
    
    { id: 32, value: 'Card 32', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-32.svg', openStatus: 0 },

    { id: 33, value: 'Card 33', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-33.svg', openStatus: 0 },

    { id: 34, value: 'Card 34', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-34.svg', openStatus: 0 },
    { id: 35, value: 'Card 35', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-35.svg', openStatus: 0 },
    { id: 36, value: 'Card 36', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-36.svg', openStatus: 0 },
    { id: 37, value: 'Card 37', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-37.svg', openStatus: 0 },    

    { id: 38, value: 'Skip this turn', type: LUDOCARD_TYPE_SKIP, img: 'assets/ludocard/no-symbol.svg', bonus: 0, openStatus: 0 },

    { id: 39, value: 'Card 39', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-39.svg', openStatus: 0 },
    
    { id: 40, value: 'Bonus +2', type: LUDOCARD_TYPE_BONUS, img: null, bonus: 2, openStatus: 0 },
    { id: 41, value: 'Card 41', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-41.svg', openStatus: 0 },

    { id: 42, value: 'Card 42', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-39.svg', openStatus: 0 },
    { id: 43, value: 'Card 43', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-40.svg', openStatus: 0 },

    { id: 44, value: 'Skip this turn', type: LUDOCARD_TYPE_SKIP, img: 'assets/ludocard/no-symbol.svg', bonus: 0, openStatus: 0 },

    { id: 45, value: 'Card 45', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-39.svg', openStatus: 0 },
    { id: 46, value: 'Card 46', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-40.svg', openStatus: 0 },
    { id: 47, value: 'Card 47', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-41.svg', openStatus: 0 },
    { id: 48, value: 'Card 48', type: LUDOCARD_TYPE_CARD, img: 'assets/ludocard/ludocard-39.svg', openStatus: 0 },
  ];

  getCardByIndex(index: number): LudocardDeckItem | undefined {
    return this.cards[index];
  }
}
