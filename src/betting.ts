enum BetType {
    FOLD,
    CHECK,
    CALL,
    RAISE,
    ALL_IN
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
    baseline: number;
    bets;
    players: Player[];

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