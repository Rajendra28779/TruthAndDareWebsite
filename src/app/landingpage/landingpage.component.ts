import { Component } from "@angular/core";
import { Router } from "@angular/router";

export type LandingGameAccent = "violet" | "rose" | "cyan" | "amber";

export interface LandingGame {
  id: string;
  title: string;
  tagline: string;
  description: string;
  /** When null, game is not playable yet */
  route: string[] | null;
  icon: string;
  accent: LandingGameAccent;
  tags: string[];
  available: boolean;
}

@Component({
  selector: 'app-landingpage',
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.scss'],
  host: { class: 'hub-route' },
})
export class LandingpageComponent {
  /** Add entries here as you ship new games */
  readonly games: LandingGame[] = [
    {
      id: "truth-dare",
      title: "Truth & Dare",
      tagline: "Spin the bottle — laugh, confess, dare",
      description:
        "Modes for friend groups and parties, duo & couple flows, and optional grown-up decks when you want the night to stay between you.",
      route: ["/truthanddare/menu"],
      icon: "bi-chat-heart-fill",
      accent: "violet",
      tags: ["Friends & masti", "Couples & romance", "Private / bedtime"],
      available: true
    },
    {
      id: "ludo-card",
      title: "Desire Dice",
      tagline: "For couples — private, romantic play",
      description:
        "Couples-only experience with romantic and adult intimate prompts between consenting partners. You’ll confirm before the game opens.",
      route: ["/ludocard"],
      icon: "bi-heart-fill",
      accent: "rose",
      tags: ["Couples", "Romance", "18+ private"],
      available: true
    }
  ];

  constructor(private readonly route: Router) { }

  openGame(game: LandingGame): void {
    if (!game.available || !game.route?.length) {
      return;
    }
    this.route.navigate(game.route);
  }
}
