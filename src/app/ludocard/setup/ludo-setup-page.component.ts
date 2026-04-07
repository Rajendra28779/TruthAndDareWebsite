import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LudocardCoupleService } from '../ludocard-couple.service';

@Component({
  selector: 'app-ludo-setup',
  templateUrl: './ludo-setup-page.component.html',
  styleUrls: ['./ludo-setup-page.component.scss'],
  host: { class: 'ludo-setup-route' },
})
export class LudoSetupPageComponent {
  showCoupleDisclaimer = true;
  showNameStep = false;
  herName = '';
  hisName = '';
  message: string | null = null;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly couple: LudocardCoupleService,
  ) {}

  dismissDisclaimer(): void {
    this.showCoupleDisclaimer = false;
    this.showNameStep = true;
  }

  startGame(): void {
    this.message = null;
    const h = this.herName.trim();
    const m = this.hisName.trim();
    if (!h || !m) {
      this.message = 'Please enter both names.';
      return;
    }
    this.couple.setCouple(h, m);
    void this.router.navigate(['game'], { relativeTo: this.route });
  }
}
