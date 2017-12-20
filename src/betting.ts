enum BetType {
    Fold,
    Check,
    Call,
    Raise,
    All_in
};

class Bet {
    public type: BetType;
    public amount: number;

    constructor(type: BetType, amount?: number) {
        this.type = type;
        this.amount = amount;
    }
}

class Pot {
    public baseline: number;
    public bets;
    public players: Player[];

    constructor() {
        this.players = [];
        this.bets = {};
        this.baseline = 0;
    }

    add(player: Player, amount: number): void {
        if (this.players.indexOf(player) === -1) {
            this.players.push(player);
        }
        this.bets[player.getName()] = amount;
    }

    size(): number {
        let size: number = 0;
        let obj = this.bets;
        Object.keys(this.bets).forEach(function (key, index, b) {
            size += obj[key];
        });
        return size;
    }

    remove(player: Player): void {
        let index = this.players.indexOf(player);
        if (index >= 0) {
            this.players.splice(index, 1);
        }
    }
}

class Betting {
    static isValidBet(player: Player, bet: Bet, amountToCall: number, minRaise: number): boolean {
        switch (bet.type) {
            case BetType.Call:
                if (amountToCall > 0 && player.getMoney() > 0) {
                    return true;
                } else {
                    return false;
                }

            case BetType.Raise:
                if (player.getMoney() >= bet.amount && (bet.amount >= amountToCall + minRaise || (bet.amount > amountToCall && amountToCall + minRaise > player.getMoney()))) {
                    return true;
                } else {
                    return false;
                }

            case BetType.Check:
                if (amountToCall === 0) {
                    return true;
                } else {
                    return false;
                }

            case BetType.Fold:
                return true;

            default:
                return false;
        }
    }
}