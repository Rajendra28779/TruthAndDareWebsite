import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LudoCardRoutingModule } from './ludocard-routing.module';
import { LudoSetupPageComponent } from './setup/ludo-setup-page.component';
import { LudoGamePageComponent } from './game/ludo-game-page.component';
import { LudoTrackCardComponent } from './components/ludo-track-card/ludo-track-card.component';

@NgModule({
  declarations: [LudoSetupPageComponent, LudoGamePageComponent, LudoTrackCardComponent],
  imports: [CommonModule, FormsModule, LudoCardRoutingModule],
})
export class LudoCardModule {}
