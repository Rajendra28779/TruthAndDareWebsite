import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LudoGamePageComponent } from './ludo-game-page.component';
import { LudocardCoupleService } from '../ludocard-couple.service';
import { LudocardDeckService } from '../ludocard-deck.service';
describe('LudoGamePageComponent', () => {
  let component: LudoGamePageComponent;
  let fixture: ComponentFixture<LudoGamePageComponent>;

  beforeEach(() => {
    const coupleStub: Partial<LudocardCoupleService> = {
      femaleName: 'Her',
      maleName: 'Him',
      hasCouple: () => true,
    };
    const deckStub: Partial<LudocardDeckService> = {
      cards: [],
    };
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [LudoGamePageComponent],
      providers: [
        { provide: LudocardCoupleService, useValue: coupleStub },
        { provide: LudocardDeckService, useValue: deckStub },
      ],
    });
    fixture = TestBed.createComponent(LudoGamePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
