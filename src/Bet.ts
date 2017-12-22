export enum BetType {
    Fold,
    Check,
    Call,
    Raise,
    AllIn
};

export class Bet {
    public type: BetType;
    public amount: number;

    constructor(type: BetType, amount?: number) {
        this.type = type;
        this.amount = amount;
    }

    isValid(canRaise) {

    }

}