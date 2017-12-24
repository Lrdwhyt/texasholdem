import { Round } from "./Round";
import { LocalRound } from "./LocalRound";
import { Player } from "./Player";
import { GameEvent, DealtHandEvent, RoundEndEvent } from "./events";

export class LocalTable {
    private players: Player[];
    private people: Player[];
    private game: Round;
    private buttonPosition: number;
    private hands: number;

    constructor() {
        this.people = [];
        this.buttonPosition = 0;
        this.hands = 0;
    }

    addPlayer(player: Player): void {
        this.people.push(player);
    }

    dispatchEvent(e: GameEvent): void {
        if (e instanceof DealtHandEvent) {
            e.player.getController().dispatchEvent(e);
            return;
        }
        for (let player of this.people) {
            player.getController().dispatchEvent(e);
        }
        if (e instanceof RoundEndEvent) {
            this.game = undefined;
        }
    }

    startGame(): void {
        this.players = [];
        for (let person of this.people) {
            if (person.getMoney() > 0) {
                this.players.push(person);
            }
        }
        if (this.players.length >= 2 && (this.game === undefined || this.game === null)) {
            ++this.buttonPosition;
            if (this.buttonPosition >= this.players.length) {
                this.buttonPosition = 0;
            }
            ++this.hands;
            this.game = new LocalRound(this.players, this.buttonPosition, this, 50 * Math.pow(2, Math.floor(this.hands / 6)));
        }
    }

    finish() {
        if (this.game !== undefined) {
            this.game.finish();
            this.game = undefined;
        }
    }
}