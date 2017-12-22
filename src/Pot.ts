import { Player } from "./Player";

export class Pot {
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
        Object.keys(this.bets).forEach(function (key) {
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