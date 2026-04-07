import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateService } from '../../date.service';

import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
  let component: GamePageComponent;
  let fixture: ComponentFixture<GamePageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GamePageComponent],
      providers: [DateService]
    });
    fixture = TestBed.createComponent(GamePageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
