import { Rank } from "./Rank";
import { Suit } from "./Suit";

const CARD_PATH: string = "../img/cards/"

export class Card {
    public readonly rank: Rank;
    public readonly suit: Suit;

    constructor(rank: Rank, suit: Suit) {
        this.rank = rank;
        this.suit = suit;
    }

    equals(that: Card): boolean {
        return (this.rank === that.rank && this.suit === that.suit);
    }

    getImage(): HTMLElement {
        let img = document.createElement("img");
        img.src = CARD_PATH + this.suit.getShorthand() + this.rank.toString() + ".png";
        img.alt = this.toString();
        img.className = "card";
        return img;
    }

    toString(): string {
        return this.suit.getSymbol() + this.rank.toString();
    }

}