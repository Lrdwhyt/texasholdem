enum BettingStage {
    NONE,
    PREFLOP,
    FLOP,
    TURN,
    RIVER,
    COMPLETE
};

class OfflineMatch {

    private players: Player[];
    private game: OfflineGame;
    private buttonPosition: number;
    private hands: number;

    constructor() {
        this.players = [];
        this.buttonPosition = 0;
        this.hands = 0;
    }

    addPlayer(player: Player): void {
        this.players.push(player);
    }

    dispatchEvent(e: GameEvent): void {
        if (e instanceof DealtHandEvent) {
            e.player.getController().dispatchEvent(e);
            return;
        }
        for (let player of this.players) {
            player.getController().dispatchEvent(e);
        }
        if (e instanceof GameEndEvent) {
            this.game = null;
            for (let i = this.players.length - 1; i >= 0; --i) {
                if (this.players[i].getMoney() <= 0) {
                    this.players.splice(i, 1);
                }
            }
        }
    }

    startGame(): void {
        if (this.players.length >= 2 && (this.game === undefined || this.game === null)) {
            ++this.buttonPosition;
            if (this.buttonPosition >= this.players.length) {
                this.buttonPosition = 0;
            }
            ++this.hands;
            this.game = new OfflineGame(this.players, this.buttonPosition, this, 50 * Math.pow(3, Math.floor(this.hands / 5)));
        }
    }

}

class MatchController {
    match: OfflineMatch;

    constructor(match: OfflineMatch) {
        this.match = match;
        document.getElementById("next-game").addEventListener("click", (e) => {
            match.startGame();
        });
    }
}

class OfflineGame {
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
    private currentBet: number;
    private minRaise: number;

    private firstPlayer: Player;
    private currentPlayer: Player;
    private lastPlayer: Player;
    private lastRaiser: Player;
    private lastPlayerFlag: boolean;

    private bettingStage: BettingStage;
    private button: number;
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
        this.currentBet = this.ante;
        this.minRaise = this.ante * 2;

        this.firstPlayer = this.getPrevPlayer(this.players[button]);
        this.lastPlayer = this.getPrevPlayer(this.firstPlayer); //Where to end betting if no one raises
        this.currentPlayer = this.firstPlayer;
        this.lastRaiser = null;

        this.lastPlayerFlag = false;


        this.bettingStage = BettingStage.NONE;

        this.button = button;

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
        this.deal();

        for (let player of this.players) {
            this.dispatchEvent(new DealtHandEvent(player, player.getHand()));
        }

        this.bettingStage = BettingStage.PREFLOP;
        this.dispatchEvent(new BetAwaitEvent(this.currentPlayer, this.makeBet, this.currentBet, this.bets[this.currentPlayer.getName()], this.minRaise, this.getEligiblePot));
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

    processPot(pot): any {
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
        let bestHand: Card[];
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
                bestHand = playerHand.hand;
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

    isValidBet(player: Player, bet: Bet): boolean {
        switch (bet.type) {
            case BetType.CALL:
                if (this.currentBet - this.bets[player.getName()] > 0 && player.getMoney() > 0) {
                    return true;
                } else {
                    return false;
                }

            case BetType.RAISE:
                let amountToCall: number = this.currentBet - this.bets[player.getName()];
                if (player.getMoney() >= bet.amount && (bet.amount >= amountToCall + this.minRaise || bet.amount === player.getMoney())) {
                    return true;
                } else {
                    return false;
                }

            case BetType.CHECK:
                if (this.currentBet - this.bets[player.getName()] === 0) {
                    return true;
                } else {
                    return false;
                }

            case BetType.FOLD:
                return true;

            default:
                return false;
        }
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
        this.bettingPlayers.splice(this.bettingPlayers.indexOf(player), 1);
        if (this.bettingPlayers.length === 1 && this.bets[this.bettingPlayers[0].getName()] === this.currentBet) {
            this.bettingPlayers.pop();
        }
    }

    processBet(player: Player, bet: Bet): void {
        switch (bet.type) {
            case BetType.CALL:
                let toCallDifference = this.currentBet - this.bets[player.getName()];
                if (player.getMoney() > toCallDifference) {
                    this.bets[player.getName()] += toCallDifference;
                    this.modMoney(player, -toCallDifference);
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

            case BetType.CHECK:
                break;

            case BetType.RAISE:
                this.lastRaiser = player;
                this.lastPlayer = this.getPrevPlayer(this.lastRaiser);
                if (bet.amount - this.currentBet > this.minRaise) {
                    this.minRaise = bet.amount - this.currentBet;
                }
                this.currentBet += bet.amount - (this.currentBet - this.bets[player.getName()]);
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

            case BetType.FOLD:
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
        if (Betting.isValidBet(player, bet, amountToCall, this.minRaise) === false) {
            this.dispatchEvent(new BetAwaitEvent(this.currentPlayer, this.makeBet, this.currentBet, this.bets[this.currentPlayer.getName()], this.minRaise, this.getEligiblePot));
            return; // Not a valid bet
        }

        this.currentPlayer = this.getNextPlayer(player);
        this.processBet(player, bet);
        this.updatePots();
        this.dispatchEvent(new BetMadeEvent(player, bet));

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
                    break;

                case BettingStage.FLOP:
                    this.dealTurn();
                    this.bettingStage = BettingStage.TURN;
                    this.currentPlayer = this.firstPlayer;
                    this.lastPlayer = this.getPrevPlayer(this.firstPlayer);
                    break;

                case BettingStage.TURN:
                    this.dealRiver();
                    this.bettingStage = BettingStage.RIVER;
                    this.currentPlayer = this.firstPlayer;
                    this.lastPlayer = this.getPrevPlayer(this.firstPlayer);
                    break;

                case BettingStage.RIVER:
                    this.bettingStage = BettingStage.COMPLETE;
                    this.finishToEnd();
                    break;
            }
        }
        if (this.bettingStage !== BettingStage.COMPLETE) {
            this.dispatchEvent(new BetAwaitEvent(this.currentPlayer, this.makeBet, this.currentBet, this.bets[this.currentPlayer.getName()], this.minRaise, this.getEligiblePot));
        }
    }

}