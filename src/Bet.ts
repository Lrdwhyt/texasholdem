import { BetType, Betting } from "./betting";

export class Bet {
    public type: BetType;
    public amount: number;

    constructor(type: BetType, amount?: number) {
        this.type = type;
        this.amount = amount;
    }
}