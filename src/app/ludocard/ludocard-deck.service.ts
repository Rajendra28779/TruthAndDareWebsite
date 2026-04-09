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
    { id: 1, value: 'Give me a 1-minute shoulder massage.', type: LUDOCARD_TYPE_DARE, img: 'assets/ludocard/ludocard-01.svg', openStatus: 0 },
    { id: 2, value: "Smell and sniff any favorite part of your partner's body.", type: LUDOCARD_TYPE_DARE, img: 'assets/ludocard/ludocard-02.svg', openStatus: 0 },
    { id: 3, value: 'Place a kiss on my hand and pretend you’re a prince/princess.', type: LUDOCARD_TYPE_DARE, img: 'assets/ludocard/ludocard-03.svg', openStatus: 0 },
    { id: 4, value: 'Lick your partners upper lip', type: LUDOCARD_TYPE_DARE, img: 'assets/ludocard/ludocard-04.svg', openStatus: 0 },
    { id: 5, value: 'Open Your Dress', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/opendress.jpg', openStatus: 0 },
    { id: 6, value: 'Bonus +2', type: LUDOCARD_TYPE_BONUS, img: null, bonus: 2, openStatus: 0 },
    { id: 7, value: 'Spank On your partner Back And feel it.', type: LUDOCARD_TYPE_DARE, img: 'assets/ludocard/ludocard-07.svg', openStatus: 0 },
    { id: 8, value: 'Lick your partners lower lip', type: LUDOCARD_TYPE_DARE, img: 'assets/ludocard/ludocard-08.svg', openStatus: 0 },
    { id: 9, value: "Say 'Eat Me' to your Partner", type: LUDOCARD_TYPE_DARE, img: 'assets/ludocard/ludocard-09.svg', openStatus: 0 },
    { id: 10, value: 'Bonus +1', type: LUDOCARD_TYPE_BONUS, img: null, bonus: 1, openStatus: 0 },
    { id: 11, value: 'Kiss on belly', type: LUDOCARD_TYPE_DARE, img: 'assets/ludocard/ludocard-11.svg', openStatus: 0 },
    { id: 12, value: 'Spank On your partner Back And feel it.', type: LUDOCARD_TYPE_DARE, img: 'assets/ludocard/ludocard-12.svg', openStatus: 0 },
    { id: 13, value: 'Kiss On your partner lip', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/liokiss.jpg', openStatus: 0 },
    { id: 14, value: 'kiss on your partner neck', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/neckkiss2.jpg', openStatus: 0 },
    { id: 15, value: 'kiss on your partner neck', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/neckkiss.jpg', openStatus: 0 },
    { id: 16, value: 'Skip this turn', type: LUDOCARD_TYPE_SKIP, img: 'assets/ludocard/no-symbol.svg', bonus: 1, openStatus: 0 },
    { id: 17, value: 'Taste Of Your Partner Sweat', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/Tasteofcream.jpg', openStatus: 0 },
    { id: 18, value: 'Bonus +3', type: LUDOCARD_TYPE_BONUS, img: null, bonus: 3, openStatus: 0 },
    { id: 19, value: 'Do your Job ! Blow Job', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/blowjob1.png', openStatus: 0 },
    { id: 20, value: 'Face under throne', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/Faceunderthrone.jpg', openStatus: 0 },
    { id: 21, value: 'Face off', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/Faceoff.jpg', openStatus: 0 },
    { id: 22, value: 'Nill Down', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/Standing0.jpg', openStatus: 0 },
    { id: 23, value: 'Bonus +3', type: LUDOCARD_TYPE_BONUS, img: null, bonus: 3, openStatus: 0 },
    { id: 24, value: 'Spank On your partner Back And feel it.', type: LUDOCARD_TYPE_DARE, img: 'assets/ludocard/ludocard-24.svg', openStatus: 0 },
    { id: 25, value: "Stay close to eachother's lips but try not to kiss till 10 sec", type: LUDOCARD_TYPE_DARE, img: 'assets/xpic/ludocard-25.svg', openStatus: 0 },
    { id: 26, value: 'Skip this turn', type: LUDOCARD_TYPE_SKIP, img: 'assets/ludocard/no-symbol.svg', bonus: 0, openStatus: 0 },
    { id: 27, value: 'Copper field', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/Copperfield.jpg', openStatus: 0 },
    { id: 28, value: 'Do your Job ! Blow Job', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/blowjob2.jpg', openStatus: 0 },
    { id: 29, value: 'Skip this turn', type: LUDOCARD_TYPE_SKIP, img: 'assets/ludocard/no-symbol.svg', bonus: 1, openStatus: 0 },
    { id: 30, value: 'Butter Fly', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/Butterfly.jpg', openStatus: 0 },
    { id: 31, value: 'Bonus +2', type: LUDOCARD_TYPE_BONUS, img: null, bonus: 2, openStatus: 0 },
    { id: 32, value: 'Cow Girl', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/cowgirl.jpg', openStatus: 0 },    
    { id: 33, value: 'open the Leg', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/openleg.jpg', openStatus: 0 },
    { id: 34, value: 'Leg On shoulder', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/Gwhiz.jpg', openStatus: 0 },
    { id: 35, value: 'Thigh Master', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/Thighmaster.jpg', openStatus: 0 },
    { id: 36, value: 'Pretzel', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/Thepretzel.jpg', openStatus: 0 },    
    { id: 37, value: 'Reverse Cow Girl', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/reversecowgirl.jpg', openStatus: 0 },    
    { id: 38, value: 'Skip this turn', type: LUDOCARD_TYPE_SKIP, img: 'assets/ludocard/no-symbol.svg', bonus: 1, openStatus: 0 },
    { id: 39, value: 'Sandwichhhh...', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/missonary1.jpg', openStatus: 0 },    
    { id: 40, value: 'Bonus +2', type: LUDOCARD_TYPE_BONUS, img: null, bonus: 2, openStatus: 0 },
    { id: 41, value: 'Learn from Dog', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/doggy.jpg', openStatus: 0 },
    { id: 42, value: 'Bloom the Lotus', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/lotus1.jpg', openStatus: 0 },
    { id: 43, value: 'Fell Like Heaven', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/Heaven.jpg', openStatus: 0 },
    { id: 44, value: 'Skip this turn', type: LUDOCARD_TYPE_SKIP, img: 'assets/ludocard/no-symbol.svg', bonus: 1, openStatus: 0 },
    { id: 45, value: 'Lets Try Horse Ride', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/horseride.jpg', openStatus: 0 },
    { id: 46, value: 'Try 69 69', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/69pose.jpg', openStatus: 0 },
    { id: 47, value: 'Try new Swiss Ball', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/Swissballorchair.jpg', openStatus: 0 },
    { id: 48, value: 'Stand And Deliver', type: LUDOCARD_TYPE_CARD, img: 'assets/xpic/Standanddeliver.jpg', openStatus: 0 },
  ];

  /** Last deck item is the finish line (win + tease overlay after resolution). */
  get finaleCard(): LudocardDeckItem | undefined {
    const n = this.cards.length;
    return n > 0 ? this.cards[n - 1] : undefined;
  }

  getCardByIndex(index: number): LudocardDeckItem | undefined {
    return this.cards[index];
  }
}
