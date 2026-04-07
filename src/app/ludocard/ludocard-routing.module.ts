import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LudoSetupPageComponent } from './setup/ludo-setup-page.component';
import { LudoGamePageComponent } from './game/ludo-game-page.component';

const routes: Routes = [
  { path: '', component: LudoSetupPageComponent },
  { path: 'game', component: LudoGamePageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LudoCardRoutingModule {}
