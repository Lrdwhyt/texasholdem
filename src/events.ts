import { Player } from "./Player";
import { Pot } from "./Pot";
import { Bet } from "./Bet";
import { Card } from "./Card";
import { Round } from "./Round";

export interface GameEvent { }

export class DealtHandEvent implements GameEvent {
    public player: Player;
    public hand: Card[];

    constructor(player: Player, hand: Card[]) {
        this.player = player;
        this.hand = hand;
    }
}

export class PlayerMoneyChangeEvent implements GameEvent {
    public player: Player;
    public change: number;

    constructor(player: Player, change: number) {
        this.player = player;
        this.change = change;
    }
}

export class PotChangeEvent implements GameEvent {
    public pots: Pot[];

    constructor(pots: Pot[]) {
        this.pots = pots;
    }
}

export class RoundStartEvent implements GameEvent {
    public round: Round;
    public players: Player[];
    public button: number;

    constructor(round: Round, players: Player[], button: number) {
        this.round = round;
        this.players = players;
        this.button = button;
    }
}

export class BetAwaitEvent implements GameEvent {
    public player: Player;
    public current: number;
    public committed: number;
    public canRaise: boolean;
    public minRaise: number;
    public potCheck;

    constructor(player: Player, current: number, committed: number, canRaise: boolean, minRaise: number, potCheck) {
        this.player = player;
        this.current = current;
        this.committed = committed;
        this.canRaise = canRaise;
        this.minRaise = minRaise;
        this.potCheck = potCheck;
    }
}

export class BetMadeEvent implements GameEvent {
    public player: Player;
    public bet: Bet;

    constructor(player: Player, bet: Bet) {
        this.player = player;
        this.bet = bet;
    }
}

export class DealtFlopEvent implements GameEvent {
    public cards: Card[];

    constructor(cards: Card[]) {
        this.cards = cards;
    }
}

export class DealtTurnEvent implements GameEvent {
    public cards: Card[];

    constructor(cards: Card[]) {
        this.cards = cards;
    }
}

export class DealtRiverEvent implements GameEvent {
    public cards: Card[];

    constructor(cards: Card[]) {
        this.cards = cards;
    }
}

export class RoundEndEvent implements GameEvent {
    public result;
    public moneyChange: { [name: string]: number };

    constructor(result, moneyChange: { [name: string]: number }) {
        this.result = result;
        this.moneyChange = moneyChange;
    }
}