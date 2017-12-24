import { Player } from "./Player";
import { GameEvent } from "./events"

export interface Round {

    start();
    getAllEvents(player: Player): GameEvent[];
    getLastEvent(player: Player): GameEvent;
    getCurrentStage();
    handleBet(player, bet);
    finish();

}