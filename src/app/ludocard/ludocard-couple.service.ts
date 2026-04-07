import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LudocardCoupleService {
  femaleName = '';
  maleName = '';

  setCouple(female: string, male: string): void {
    this.femaleName = female.trim();
    this.maleName = male.trim();
  }

  hasCouple(): boolean {
    return this.femaleName.length > 0 && this.maleName.length > 0;
  }

  clear(): void {
    this.femaleName = '';
    this.maleName = '';
  }
}
