import { Component, Input } from '@angular/core';
import { LudocardDeckItem } from '../../ludocard-deck.service';

@Component({
  selector: 'app-ludo-track-card',
  templateUrl: './ludo-track-card.component.html',
  styleUrls: ['./ludo-track-card.component.scss']
})
export class LudoTrackCardComponent {
  @Input({ required: true }) card!: LudocardDeckItem;
  /** Large single-card layout on the couples board. */
  @Input() variant: 'inline' | 'hero' = 'inline';
}
