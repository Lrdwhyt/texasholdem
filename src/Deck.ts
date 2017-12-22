import { Rank } from "./Rank";
import { Suit } from "./Suit";
import { Card } from "./Card";

export class Deck {
    private cards: Card[];

    constructor() {
        this.cards = [];
        for (let suit of [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs]) {
            for (let rank of [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace]) {
                this.cards.push(new Card(rank, suit));
            }
        }
    }

    shuffle(): void {
        for (let i = this.cards.length - 1; i > 0; --i) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = this.cards[i];
            this.cards[i] = this.cards[j];
            this.cards[j] = temp;
        }
    };

    deal(): Card {
        return this.cards.pop();
    };

    pop(): void {
        this.cards.pop();
    };

    getCards(): Card[] {
        return this.cards;
    };
}