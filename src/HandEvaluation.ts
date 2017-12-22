import { Card } from "./Card";
import { HandType } from "./HandType";

export class HandEvaluation {

    public readonly cards: Card[];
    public readonly hand: Card[];
    public readonly score: number;
    public readonly type: HandType;

    constructor(cards: Card[], hand: Card[], score: number, type: HandType) {
        this.cards = cards;
        this.hand = hand;
        this.score = score;
        this.type = type;
    }

}