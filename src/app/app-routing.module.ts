import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingpageComponent } from './landingpage/landingpage.component';

const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', component: LandingpageComponent },
  { path: 'gamepage', redirectTo: 'truthanddare/game', pathMatch: 'full' },
  {
    path: 'truthanddare',
    loadChildren: () => import('./truthanddare/truthanddare.module').then(m => m.TruthanddareModule)
  },
  {
    path: 'ludocard',
    loadChildren: () => import('./ludocard/ludocard.module').then(m => m.LudoCardModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
