import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TruthanddareRoutingModule } from './truthanddare-routing.module';
import { MenuPageComponent } from './menu/menu-page.component';
import { GamePageComponent } from './game/game-page.component';

@NgModule({
  declarations: [
    MenuPageComponent,
    GamePageComponent
  ],
  imports: [
    CommonModule,
    TruthanddareRoutingModule
  ]
})
export class TruthanddareModule { }
