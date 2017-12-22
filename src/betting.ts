import { Player } from "./Player";
import { Bet, BetType } from "./Bet";

export class Betting {
    static isValidBet(player: Player, bet: Bet, amountToCall: number, canRaise: boolean, minRaise: number): boolean {
        switch (bet.type) {
            case BetType.Call:
                if (amountToCall > 0 && player.getMoney() > 0) {
                    return true;
                } else {
                    return false;
                }

            case BetType.Raise:
                if (canRaise === true && player.getMoney() >= bet.amount && (bet.amount >= amountToCall + minRaise || (bet.amount > amountToCall && amountToCall + minRaise > player.getMoney()))) {
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