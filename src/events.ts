interface GameEvent { }

class DealtHandEvent implements GameEvent {
    public player: Player;
    public hand: Card[];

    constructor(player: Player, hand: Card[]) {
        this.player = player;
        this.hand = hand;
    }
}

class PlayerMoneyChangeEvent implements GameEvent {
    public player: Player;
    public change: number;

    constructor(player: Player, change: number) {
        this.player = player;
        this.change = change;
    }
}

class PotChangeEvent implements GameEvent {
    public pots: Pot[];

    constructor(pots: Pot[]) {
        this.pots = pots;
    }
}

class GameStartEvent implements GameEvent {
    public players: Player[];

    constructor(players: Player[]) {
        this.players = players;
    }
}

class BetAwaitEvent implements GameEvent {
    public player: Player;
    public callback;
    public current: number;
    public committed: number;
    public minRaise: number;
    public potCheck;

    constructor(player: Player, callback, current: number, committed: number, minRaise: number, potCheck) {
        this.player = player;
        this.callback = callback;
        this.current = current;
        this.committed = committed;
        this.minRaise = minRaise;
        this.potCheck = potCheck;
    }
}

class BetMadeEvent implements GameEvent {
    public player: Player;
    public bet: Bet;

    constructor(player: Player, bet: Bet) {
        this.player = player;
        this.bet = bet;
    }
}

class DealtFlopEvent implements GameEvent {
    public cards: Card[];

    constructor(cards: Card[]) {
        this.cards = cards;
    }
}

class DealtTurnEvent implements GameEvent {
    public cards: Card[];

    constructor(cards: Card[]) {
        this.cards = cards;
    }
}

class DealtRiverEvent implements GameEvent {
    public cards: Card[];

    constructor(cards: Card[]) {
        this.cards = cards;
    }
}

class GameEndEvent implements GameEvent {
    public result;
    public moneyChange: { [name: string]: number };

    constructor(result, moneyChange: { [name: string]: number }) {
        this.result = result;
        this.moneyChange = moneyChange;
    }
}