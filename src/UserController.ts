import { UserView } from "./UserView";
import { Player } from "./Player";
import { GameEvent, DealtHandEvent, PlayerMoneyChangeEvent, PotChangeEvent, RoundStartEvent, RoundEndEvent, BetAwaitEvent, BetMadeEvent, DealtFlopEvent, DealtTurnEvent, DealtRiverEvent } from "./events";
import { Bet, BetType } from "./Bet";
import { Betting } from "./betting";
import { Round } from "./Round";

export interface Controller {
    dispatchEvent(e: GameEvent): void;
}

export class UserController implements Controller {
    private player: Player;
    private currentRound: Round | undefined;
    private amountToCall: number;
    private currentBet: number;
    private amountCommitted: number;
    private canRaise: boolean;
    private minRaise: number;
    private hasQueuedBet: boolean;
    private isTurnToBet: boolean;
    private queuedBet: Bet;
    private view: UserView;

    constructor(player: Player) {
        this.player = player;
        this.view = new UserView(this);
    }

    placeBet(bet: Bet) {
        if (this.isTurnToBet === false) {
            let bettingButtons = document.getElementsByClassName("prebet");
            for (let i = 0; i < bettingButtons.length; ++i) {
                bettingButtons[i].classList.remove("prebet");
            }
            if (this.hasQueuedBet === false || this.queuedBet.type !== bet.type) {
                switch (bet.type) {
                    case BetType.Raise:
                        document.getElementById("raise").classList.add("prebet");
                        break;

                    case BetType.Check:
                        document.getElementById("check").classList.add("prebet");
                        break;

                    case BetType.AllIn:
                        document.getElementById("all-in").classList.add("prebet");
                        break;

                    case BetType.Call:
                        document.getElementById("call").classList.add("prebet");
                        break;

                    case BetType.Fold:
                        document.getElementById("fold").classList.add("prebet");
                        break;
                }
                this.hasQueuedBet = true;
                this.queuedBet = bet;
            } else if (this.queuedBet.type === bet.type) {
                this.hasQueuedBet = false;
            }
            return;
        } else {
            let bettingButtons = document.getElementsByClassName("prebet");
            for (let i = 0; i < bettingButtons.length; ++i) {
                bettingButtons[i].classList.remove("prebet");
            }
        }

        if (bet.type === BetType.AllIn) {
            if (this.player.getMoney() <= this.amountToCall) {
                bet = new Bet(BetType.Call);
            } else {
                bet = new Bet(BetType.Raise, this.player.getMoney());
            }
        }

        this.hasQueuedBet = false;

        if (Betting.isValidBet(this.player, bet, this.amountToCall, this.canRaise, this.minRaise)) {
            this.isTurnToBet = false;
            if (bet.type === BetType.Fold) {
                this.view.disableBetting();
            }
            this.currentRound.handleBet(this.player, bet);
        } else {
            this.view.notifyInvalidBet();
        }
    }

    dispatchEvent(e: GameEvent): void {

        if (e instanceof RoundStartEvent) {
            this.currentRound = e.round;
            console.log("Game started");
            this.view.resetUI();
            let otherPlayers = e.players.slice(0);
            let index = otherPlayers.indexOf(this.player);
            if (index !== -1) {
                otherPlayers.splice(index, 1);
                this.view.drawUser(this.player);
            } else {
                document.getElementById("bet-controls").innerHTML = "";
            }
            this.view.drawBoard(otherPlayers);
            this.hasQueuedBet = false;
            this.currentBet = 0;
            this.minRaise = 0;
            this.amountCommitted = 0;
            this.amountToCall = 0;
            this.view.setBetAmount(0);

        } else if (e instanceof PlayerMoneyChangeEvent) {
            this.view.updatePlayerMoney(e.player.getName(), e.player.getMoney());
            console.log("[GameEvent] " + e.player.getName() + " money changed: " + e.change);

            if (e.player === this.player) {
                this.amountCommitted -= e.change;
                this.amountToCall = this.currentBet - this.amountCommitted;
            }

        } else if (e instanceof DealtHandEvent) {

            for (let card of e.hand) {
                document.getElementById("user-cards").appendChild(card.getImage());
            }

        } else if (e instanceof BetAwaitEvent) {

            this.view.updateTurn(e.player.getName());

            if (e.player === this.player) {
                console.log("Your turn!");
                this.amountToCall = e.current - e.committed;
                this.canRaise = e.canRaise;
                this.minRaise = e.minRaise;
                this.currentBet = e.current;
                this.amountCommitted = e.committed;
                this.view.disableBetting();
                this.view.restrictToValid(this.amountToCall, e.canRaise, this.player.getMoney());
                this.isTurnToBet = true;
                if (this.hasQueuedBet === true) {
                    this.placeBet(this.queuedBet);
                }
            } else {
                this.currentBet = e.current;
                this.amountToCall = this.currentBet - this.amountCommitted;
                this.canRaise = e.canRaise;
                this.minRaise = e.minRaise;
                this.view.disableBetting();
                this.view.restrictToValid(this.amountToCall, e.canRaise, this.player.getMoney());
            }

        } else if (e instanceof BetMadeEvent) {

            this.view.resetPlayerTurnIndicator(e.player.getName());
            let msg: string = "[GameBetting] ";

            switch (e.bet.type) {
                case BetType.Raise:
                    msg += e.player.getName() + " bet " + e.bet.amount;
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = " bet $" + e.bet.amount;
                    break;

                case BetType.Call:
                    msg += e.player.getName() + " called"
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = " called";
                    break;

                case BetType.Check:
                    msg += e.player.getName() + " checked"
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = " checked";
                    break;

                case BetType.Fold:
                    msg += e.player.getName() + " folded";
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = " folded";
                    document.querySelector("[name=" + e.player.getName() + "]").className += " folded";
                    break;

                default:
                    msg += e.player.getName() + " made an unrecognised action";
                    break;
            }

            console.log(msg);

        } else if (e instanceof PotChangeEvent) {

            this.view.updatePot(e.pots);

        } else if (e instanceof DealtFlopEvent) {

            for (let card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }
            console.log("Flop dealt");
            this.hasQueuedBet = false;
            this.view.resetBetStatusText();
            this.view.resetBettingUI();
            this.view.restrictToValid(this.amountToCall, this.canRaise, this.player.getMoney());

        } else if (e instanceof DealtTurnEvent) {

            for (let card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }
            console.log("Turn dealt");
            this.hasQueuedBet = false;
            this.view.resetBetStatusText();
            this.view.resetBettingUI();
            this.view.restrictToValid(this.amountToCall, this.canRaise, this.player.getMoney());

        } else if (e instanceof DealtRiverEvent) {

            for (let card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }
            console.log("River dealt");
            this.hasQueuedBet = false;
            this.view.resetBetStatusText();
            this.view.resetBettingUI();
            this.view.restrictToValid(this.amountToCall, this.canRaise, this.player.getMoney());

        } else if (e instanceof RoundEndEvent) {
            this.view.resetBettingUI();
            if (e.result) {
                for (let playerName in e.moneyChange) {
                    let ele = document.querySelector("[name=" + playerName + "] .money");
                    if (e.moneyChange[playerName] > 0) {
                        ele.textContent += " (+" + e.moneyChange[playerName] + ")";
                    } else if (e.moneyChange[playerName] < 0) {
                        ele.textContent += " (" + e.moneyChange[playerName] + ")";
                    }
                }
                Object.keys(e.result).forEach((key) => {
                    if (e.result[key].player === this.player.getName()) {
                        return;
                    }
                    let ele = document.querySelector("[name=" + e.result[key].player + "] .cards");
                    if (e.result[key].showdown === true) {
                        for (let card of e.result[key].cards) {
                            ele.appendChild(card.getImage());
                        }
                        console.log(e.result[key].player + ":" + e.result[key].score);
                    }
                });
            }
        }
    }

    increaseBet(amount: number): number {
        let result = Math.floor(amount + this.minRaise / 2);
        if (result > this.player.getMoney()) {
            result = this.player.getMoney();
        }
        return result;
    }

    decreaseBet(amount: number): number {
        let result = Math.floor(amount - this.minRaise / 2);
        return this.constrainBetAmount(result);
    }

    constrainBetAmount(amount: number): number {
        let result: number = amount;
        if (result < this.amountToCall + this.minRaise) {
            result = this.amountToCall + this.minRaise;
        }
        if (result > this.player.getMoney()) {
            result = this.player.getMoney();
        }
        return result;
    }

}