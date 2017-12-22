import { OfflineMatch } from "./OfflineMatch";
import { Player } from "./Player";
import { GameEvent, DealtHandEvent, PlayerMoneyChangeEvent, PotChangeEvent, GameStartEvent, GameEndEvent, BetAwaitEvent, BetMadeEvent, DealtFlopEvent, DealtTurnEvent, DealtRiverEvent } from "./events";
import { Bet, BetType } from "./Bet";
import { Betting } from "./betting";
import { Pot } from "./Pot";
import { Deck } from "./Deck";
import { Card } from "./Card";
import { Hands } from "./Hands";

enum BettingStage {
    NONE,
    PREFLOP,
    FLOP,
    TURN,
    RIVER,
    COMPLETE
};

export class OfflineGame {
    private players: Player[];
    private bettingPlayers: Player[];
    private unfoldedPlayers: Player[];

    private deck: Deck;
    private flop: Card[];
    private turn: Card[];
    private river: Card[];

    private bets: { [name: string]: number };
    private baselines: number[];
    private pots: Pot[];
    private initialMoney: { [name: string]: number };

    private ante: number;
    private smallBlind: number;
    private bigBlind: number;
    private currentBet: number;
    private minRaise: number;

    private firstPlayer: Player;
    private currentPlayer: Player;
    private lastPlayer: Player;
    private lastRaiser: Player;

    private canRaise: boolean;
    private lastPlayerFlag: boolean;

    private bettingStage: BettingStage;
    private match: OfflineMatch;

    constructor(players: Player[], button: number, match: OfflineMatch, ante: number) {
        this.match = match;

        this.players = players.slice(0);
        this.bettingPlayers = players.slice(0);
        this.unfoldedPlayers = players.slice(0);

        this.deck = new Deck();
        this.deck.shuffle();
        this.flop = [];
        this.turn = [];
        this.river = [];

        this.bets = {};
        this.baselines = [];
        this.pots = [new Pot()];
        this.initialMoney = {};

        this.ante = ante;
        this.smallBlind = ante * 4;
        this.bigBlind = ante * 8;
        this.currentBet = this.ante + this.bigBlind;
        this.minRaise = this.bigBlind;

        this.firstPlayer = this.getPrevPlayer(this.players[button]);
        this.lastPlayer = this.getPrevPlayer(this.firstPlayer); //Where to end betting if no one raises
        this.currentPlayer = this.firstPlayer;
        this.lastRaiser = null;

        this.canRaise = true;
        this.lastPlayerFlag = false;

        this.bettingStage = BettingStage.NONE;

        this.init();
    }

    init(): void {
        for (let player of this.players) {
            this.bets[player.getName()] = 0;
            this.initialMoney[player.getName()] = player.getMoney();
            player.resetHand();
        }

        this.dispatchEvent(new GameStartEvent(this.players));
        this.deductAntes(this.ante);
        if (this.players.length === 2) { // Blinds have special rules with only 2 players
            this.deductBlind(this.firstPlayer, this.smallBlind);
            this.deductBlind(this.lastPlayer, this.bigBlind);
        } else {
            this.deductBlind(this.getPrevPlayer(this.lastPlayer), this.smallBlind);
            this.deductBlind(this.lastPlayer, this.bigBlind);
        }
        this.deal();

        for (let player of this.players) {
            this.dispatchEvent(new DealtHandEvent(player, player.getHand()));
        }

        this.bettingStage = BettingStage.PREFLOP;
        this.dispatchEvent(new BetAwaitEvent(this.currentPlayer, this.makeBet, this.currentBet, this.bets[this.currentPlayer.getName()], this.canRaise, this.minRaise, this.getEligiblePot));
    }

    dispatchEvent(e: GameEvent) {
        this.match.dispatchEvent(e);
    }

    deal(): void {
        for (let player of this.players) {
            player.deal(this.deck.deal());
        }
        for (let player of this.players) {
            player.deal(this.deck.deal());
        }
    };

    modMoney(player: Player, money: number): void {
        player.modMoney(money);
        this.dispatchEvent(new PlayerMoneyChangeEvent(player, money));
    }

    deductAntes(ante: number): void {
        for (let player of this.players) {
            if (player.getMoney() >= ante) {
                this.bets[player.getName()] += ante;
                this.modMoney(player, -ante);
                if (player.getMoney() === 0) {
                    this.addBaseline(this.bets[player.getName()]);
                    this.removeFromBetting(player);
                }
            } else { // Not enough money to cover ante
                this.bets[player.getName()] += player.getMoney();
                this.modMoney(player, -player.getMoney());
                this.addBaseline(this.bets[player.getName()]);
                this.removeFromBetting(player);
            }
        }
    }

    deductBlind(player: Player, amount: number) {
        if (player.getMoney() >= amount) {
            this.bets[player.getName()] += amount;
            this.modMoney(player, -amount);
            if (player.getMoney() === 0) {
                this.addBaseline(this.bets[player.getName()]);
                this.removeFromBetting(player);
            }
        } else { // Not enough money to cover blind
            this.bets[player.getName()] += player.getMoney();
            this.modMoney(player, -player.getMoney());
            this.addBaseline(this.bets[player.getName()]);
            this.removeFromBetting(player);
        }
    }

    getNextPlayer(player: Player): Player {
        let i = this.bettingPlayers.indexOf(player);
        ++i;
        if (i >= this.bettingPlayers.length) {
            return this.bettingPlayers[0];
        } else {
            return this.bettingPlayers[i];
        }
    }

    getPrevPlayer(player: Player): Player {
        let i = this.bettingPlayers.indexOf(player);
        if (i === 0) {
            return this.bettingPlayers[this.bettingPlayers.length - 1];
        } else {
            return this.bettingPlayers[i - 1];
        }
    }

    getEligiblePot = (player: Player, amount: number): number => {
        let totalBet: number = this.bets[player.getName()] + amount;
        let pot: number = totalBet;
        for (let p in this.bets) {
            if (p !== player.getName()) {
                if (totalBet > this.bets[p]) {
                    pot += this.bets[p];
                } else {
                    pot += totalBet;
                }
            }
        }
        return pot;
    }

    addBaseline(baseline: number): void {
        if (this.baselines.indexOf(baseline) >= 0) { // Already registered as a baseline
            return;
        }

        this.baselines.push(baseline);
        this.baselines.sort(function (a, b) {
            return a - b; // Low to high
        });
        let results = [];
        let previousBaseline = 0;
        for (let b of this.baselines) {
            let newPot = new Pot();
            newPot.baseline = b - previousBaseline;
            previousBaseline = b;
            results.push(newPot);
        }
        results.push(new Pot());
        this.pots = results;
        this.updatePots(); // Redistribute pots
    }

    processPot(pot: Pot) {
        if (pot.players.length === 1) { // Only one player eligible for pot, who automatically wins it.
            this.modMoney(pot.players[0], pot.size());
            return {
                player: pot.players[0],
                showdown: false
            };
        }
        let results = {};
        let winners: Player[] = [];
        let bestScore: number = 0;
        for (let player of pot.players) {
            let playerHand = Hands.bestHand(player.getHand().concat(this.flop).concat(this.turn).concat(this.river));
            let playerScore: number = playerHand.score;
            results[player.getName()] = {
                player: player.getName(),
                cards: player.getHand(),
                hand: playerHand.hand,
                score: playerScore,
                showdown: true
            };
            if (playerScore > bestScore) {
                bestScore = playerScore;
                winners = [player];
            } else if (playerScore === bestScore) {
                winners.push(player);
            }
        }
        if (winners.length === 1) {
            this.modMoney(winners[0], pot.size());
        } else { // Split pot
            for (let player of winners) {
                this.modMoney(player, Math.floor(pot.size() / winners.length));
            }
        }
        return results;
    }

    updatePots(): void { // Distribute players and their bets according to pot baselines
        for (let player of this.players) {
            if (this.pots.length === 1) { // No side pots
                this.pots[0].add(player, this.bets[player.getName()]);
            } else {
                let totalToBet = this.bets[player.getName()];
                for (let pot of this.pots) {
                    if (pot.baseline < totalToBet && pot.baseline !== 0) {
                        pot.add(player, pot.baseline);
                        totalToBet -= pot.baseline;
                    } else {
                        pot.add(player, totalToBet);
                        break;
                    }
                }
            }
            if (this.unfoldedPlayers.indexOf(player) === -1) {
                for (let pot of this.pots) { // Player is not eligible for pots and should be removed
                    pot.remove(player);
                }
            }
        }
        this.dispatchEvent(new PotChangeEvent(this.pots));
    }

    removeFromBetting(player: Player): void {
        if (player === this.lastPlayer) {
            this.lastPlayer = this.getPrevPlayer(this.lastPlayer);
        }
        if (player === this.firstPlayer) {
            this.firstPlayer = this.getNextPlayer(this.firstPlayer);
        }
        if (player === this.currentPlayer) {
            this.currentPlayer = this.getNextPlayer(this.currentPlayer);
        }
        let index = this.bettingPlayers.indexOf(player);
        if (index !== -1) {
            this.bettingPlayers.splice(index, 1);
            if (this.bettingPlayers.length === 1 && this.bets[this.bettingPlayers[0].getName()] === this.currentBet) {
                this.bettingPlayers.pop();
            }
        }
    }

    processBet(player: Player, bet: Bet): void {
        let amountToCall: number = this.currentBet - this.bets[player.getName()];
        switch (bet.type) {
            case BetType.Call:
                if (player.getMoney() > amountToCall) {
                    this.bets[player.getName()] += amountToCall;
                    this.modMoney(player, -amountToCall);
                } else { // Player is all-in
                    this.bets[player.getName()] += player.getMoney();
                    this.modMoney(player, -player.getMoney());
                    this.addBaseline(this.bets[player.getName()]);
                    if (player === this.lastPlayer) {
                        this.lastPlayerFlag = true;
                    }
                    this.removeFromBetting(player);
                }
                break;

            case BetType.Check:
                break;

            case BetType.Raise:
                if (bet.amount - amountToCall >= this.minRaise) { // If raise is greater than min-raise amount, re-open betting
                    this.lastRaiser = player;
                    this.canRaise = true;
                    this.minRaise = bet.amount - amountToCall;
                }
                this.lastPlayer = this.getPrevPlayer(player);
                this.currentBet += bet.amount - amountToCall;
                this.bets[player.getName()] += bet.amount;
                if (bet.amount === player.getMoney()) { // Player raises to all-in
                    this.addBaseline(this.bets[player.getName()]);
                    if (player === this.lastPlayer) {
                        this.lastPlayerFlag = true;
                    }
                    this.removeFromBetting(player);
                }
                this.modMoney(player, -bet.amount);
                break;

            case BetType.Fold:
                if (this.firstPlayer === player) {
                    this.firstPlayer = this.getNextPlayer(player);
                }
                if (player === this.lastPlayer) {
                    this.lastPlayerFlag = true;
                }
                this.removeFromBetting(player);
                this.unfoldedPlayers.splice(this.unfoldedPlayers.indexOf(player), 1);
                for (let pot of this.pots) { // Folded players not eligible for pots
                    pot.remove(player);
                }
                break;
        }
    }

    dealFlop(): void {
        this.deck.pop();
        this.flop.push(this.deck.deal());
        this.flop.push(this.deck.deal());
        this.flop.push(this.deck.deal());
        this.dispatchEvent(new DealtFlopEvent(this.flop));
    };

    dealTurn(): void {
        this.deck.pop();
        this.turn.push(this.deck.deal());
        this.dispatchEvent(new DealtTurnEvent(this.turn));
    }

    dealRiver(): void {
        this.deck.pop();
        this.river.push(this.deck.deal());
        this.dispatchEvent(new DealtRiverEvent(this.river));
    }

    finish(): void {
        let result = null;
        for (let index in this.pots) {
            if (index === "0") {
                result = this.processPot(this.pots[index]);
            } else {
                this.processPot(this.pots[index]);
            }
        }
        let moneyChange = {};
        for (let player of this.players) {
            moneyChange[player.getName()] = player.getMoney() - this.initialMoney[player.getName()];
        }
        this.dispatchEvent(new GameEndEvent(result, moneyChange));
    }

    finishToEnd(): void {
        if (this.bettingStage !== BettingStage.RIVER) {
            switch (this.bettingStage) {
                case BettingStage.PREFLOP:
                    this.dealFlop();
                case BettingStage.FLOP:
                    this.dealTurn();
                case BettingStage.TURN:
                    this.dealRiver();
            }
        }
        let result = null;
        for (let index in this.pots) {
            if (index === "0") {
                result = this.processPot(this.pots[index]);
            } else {
                this.processPot(this.pots[index]);
            }
        }
        let moneyChange = {};
        for (let player of this.players) {
            moneyChange[player.getName()] = player.getMoney() - this.initialMoney[player.getName()];
        }
        this.dispatchEvent(new GameEndEvent(result, moneyChange));
    }

    makeBet = (player: Player, bet: Bet): void => {
        if (this.currentPlayer !== player) {
            return; // Not player's turn to bet
        }
        let amountToCall: number = this.currentBet - this.bets[player.getName()];
        if (Betting.isValidBet(player, bet, amountToCall, this.canRaise, this.minRaise) === false) {
            console.log("[GameBug] " + player.getName() + " made an invalid bet: " + bet.type + ", " + bet.amount);
            return; // Not a valid bet
        }

        this.currentPlayer = this.getNextPlayer(player);
        this.processBet(player, bet);
        this.updatePots();
        this.dispatchEvent(new BetMadeEvent(player, bet));

        if (this.lastRaiser === this.currentPlayer) {
            this.canRaise = false; // No one after this can raise anymore
        }

        if (this.unfoldedPlayers.length === 1) { // Last player wins by default
            this.finish();
            return;
        } else if (this.bettingPlayers.length === 0 || this.bettingPlayers.length === 1 && this.currentBet === this.bets[this.bettingPlayers[0].getName()]) {
            // Only one player or no players left betting, so no need to continue betting
            this.finishToEnd();
            return;
        }

        if (player === this.lastPlayer || this.lastPlayerFlag === true) {
            this.lastPlayerFlag = false;
            switch (this.bettingStage) {
                case BettingStage.PREFLOP:
                    this.dealFlop();
                    this.bettingStage = BettingStage.FLOP;
                    this.currentPlayer = this.firstPlayer;
                    this.lastPlayer = this.getPrevPlayer(this.firstPlayer);
                    this.lastRaiser = this.firstPlayer; // Allows big blind to raise if betting is checked to them
                    this.canRaise = true;
                    break;

                case BettingStage.FLOP:
                    this.dealTurn();
                    this.bettingStage = BettingStage.TURN;
                    this.currentPlayer = this.firstPlayer;
                    this.lastPlayer = this.getPrevPlayer(this.firstPlayer);
                    this.lastRaiser = this.firstPlayer;
                    this.canRaise = true;
                    break;

                case BettingStage.TURN:
                    this.dealRiver();
                    this.bettingStage = BettingStage.RIVER;
                    this.currentPlayer = this.firstPlayer;
                    this.lastPlayer = this.getPrevPlayer(this.firstPlayer);
                    this.lastRaiser = this.firstPlayer;
                    this.canRaise = true;
                    break;

                case BettingStage.RIVER:
                    this.bettingStage = BettingStage.COMPLETE;
                    this.finishToEnd();
                    break;
            }
        }
        if (this.bettingStage !== BettingStage.COMPLETE) {
            this.dispatchEvent(new BetAwaitEvent(this.currentPlayer, this.makeBet, this.currentBet, this.bets[this.currentPlayer.getName()], this.canRaise, this.minRaise, this.getEligiblePot));
        }
    }

    terminate() {
        this.currentPlayer = null;
        // Prevent further bets
    }

}