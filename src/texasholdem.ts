enum BetType {
    FOLD,
    CHECK,
    CALL,
    RAISE,
    ALL_IN
};

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
    private game;
    private buttonPosition: number;

    constructor() {
        this.players = [];
        this.buttonPosition = 0;
    }

    addPlayer(player: Player): void {
        this.players.push(player);
    }

    dispatchEvent(e): void {
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
            this.game = new Game(this.players, this.buttonPosition, this);
        }
    }

}

var MatchController = function (match) {
    var match;
    document.getElementById("match-controls").addEventListener("click", function (e) {
        if ((<HTMLElement>e.target).id === "next-game") {
            match.startGame();
        }
    });
}

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

    add(player: Player, amount: number) {
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

    remove(player): void {
        let index = this.players.indexOf(player);
        if (index >= 0) {
            this.players.splice(index, 1);
        }
    }

}

var Game = function (matchPlayers, button, matchCallback) {

    var dispatchEvent = function (e) {
        parentMatch.dispatchEvent(e);
    }

    var modMoney = function (player, money) {
        player.modMoney(money);
        dispatchEvent(new PlayerMoneyChangeEvent(player, money));
    }

    var getEligiblePot = function (player, amount) {
        let totalBet: number = bets[player.getName()] + amount;
        let pot: number = totalBet;
        for (let p in bets) {
            if (p !== player.getName()) {
                if (totalBet > bets[p]) {
                    pot += bets[p];
                } else {
                    pot += totalBet;
                }
            }
        }
        return pot;
    }

    var processPot = function (pot) {
        let results = {};
        let winners = [];
        let bestScore: number = 0;
        let bestHand;
        for (let player of pot.players) {
            let playerHand = Hands.bestHand(player.getHand().concat(flop).concat(turn).concat(river));
            let playerScore: number = playerHand.score;
            results[player.getName()] = {
                player: player.getName(),
                cards: player.getHand(),
                hand: playerHand.hand,
                score: playerScore
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
            modMoney(winners[0], pot.size());
        } else { // Split pot
            for (var player of winners) {
                modMoney(player, Math.floor(pot.size() / winners.length));
            }
        }
        return results;
    }

    var addBaseline = function (baseline) {
        if (baselines.indexOf(baseline) >= 0) { // Already registered as a baseline
            return;
        }

        baselines.push(baseline);
        baselines.sort(function (a, b) {
            return a - b; // Low to high
        });
        let results = [];
        let previousBaseline = 0;
        for (let b of baselines) {
            let newPot = new Pot();
            newPot.baseline = b - previousBaseline;
            previousBaseline = b;
            results.push(newPot);
        }
        results.push(new Pot());
        pots = results;
        updatePots(); // Redistribute pots
    }

    var updatePots = function () { // Distribute players and their bets according to pot baselines
        for (let player of players) {
            if (pots.length === 1) { // No side pots
                pots[0].add(player, bets[player.getName()]);
            } else {
                let totalToBet = bets[player.getName()];
                for (let pot of pots) {
                    if (pot.baseline < totalToBet && pot.baseline !== 0) {
                        pot.add(player, pot.baseline);
                        totalToBet -= pot.baseline;
                    } else {
                        pot.add(player, totalToBet);
                        break;
                    }
                }
            }
            if (unfoldedPlayers.indexOf(player) === -1) {
                for (let pot of pots) { // Player is not eligible for pots and should be removed
                    pot.remove(player);
                }
            }
        }
        dispatchEvent(new PotChangeEvent(pots));
    }

    var deductAntes = function (ante: number) {
        for (let player of players) {
            if (player.getMoney() >= ante) {
                bets[player.getName()] += ante;
                modMoney(player, -ante);
                if (player.getMoney() === 0) {
                    addBaseline(bets[player.getName()]);
                    removeFromBetting(player);
                }
            } else { // Not enough money to cover ante
                bets[player.getName()] += player.getMoney();
                modMoney(player, -player.getMoney());
                addBaseline(bets[player.getName()]);
                removeFromBetting(player);
            }
        }
    }

    var getNextPlayer = function (player: Player): Player {
        var i = bettingPlayers.indexOf(player);
        ++i;
        if (i >= bettingPlayers.length) {
            return bettingPlayers[0];
        } else {
            return bettingPlayers[i];
        }
    }

    var getPrevPlayer = function (player: Player): Player {
        var i = bettingPlayers.indexOf(player);
        if (i === 0) {
            return bettingPlayers[bettingPlayers.length - 1];
        } else {
            return bettingPlayers[i - 1];
        }
    }

    var isValidBet = function (player: Player, bet: Bet) {
        switch (bet.type) {
            case BetType.CALL:
                if (currentBet - bets[player.getName()] > 0 && player.getMoney() > 0) {
                    return true;
                } else {
                    return false;
                }

            case BetType.RAISE:
                let toCallDifference = currentBet - bets[player.getName()];
                if (player.getMoney() >= bet.amount && (bet.amount >= toCallDifference + minRaise || bet.amount === player.getMoney())) {
                    return true;
                } else {
                    return false;
                }

            case BetType.CHECK:
                if (currentBet - bets[player.getName()] === 0) {
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

    var removeFromBetting = function (player: Player) {
        if (player === lastPlayer) {
            lastPlayer = getPrevPlayer(lastPlayer);
        }
        if (player === firstPlayer) {
            firstPlayer = getNextPlayer(firstPlayer);
        }
        if (player === currentPlayer) {
            currentPlayer = getNextPlayer(currentPlayer);
        }
        bettingPlayers.splice(bettingPlayers.indexOf(player), 1);
        if (bettingPlayers.length === 1 && bets[bettingPlayers[0].getName()] === currentBet) {
            bettingPlayers.pop();
        }
    }

    var processBet = function (player: Player, bet: Bet) {
        switch (bet.type) {
            case BetType.CALL:
                let toCallDifference = currentBet - bets[player.getName()];
                if (player.getMoney() > toCallDifference) {
                    bets[player.getName()] += toCallDifference;
                    modMoney(player, -toCallDifference);
                } else { // Player is all-in
                    bets[player.getName()] += player.getMoney();
                    modMoney(player, -player.getMoney());
                    addBaseline(bets[player.getName()]);
                    if (player === lastPlayer) {
                        lastPlayerFlag = true;
                    }
                    removeFromBetting(player);
                }
                break;

            case BetType.CHECK:
                break;

            case BetType.RAISE:
                lastRaiser = player;
                lastPlayer = getPrevPlayer(lastRaiser);
                if (bet.amount - currentBet > minRaise) {
                    minRaise = bet.amount - currentBet;
                }
                currentBet += bet.amount - (currentBet - bets[player.getName()]);
                bets[player.getName()] += bet.amount;
                if (bet.amount === player.getMoney()) { // Player raises to all-in
                    addBaseline(bets[player.getName()]);
                    if (player === lastPlayer) {
                        lastPlayerFlag = true;
                    }
                    removeFromBetting(player);
                }
                modMoney(player, -bet.amount);
                break;

            case BetType.FOLD:
                if (firstPlayer === player) {
                    firstPlayer = getNextPlayer(player);
                }
                if (player === lastPlayer) {
                    lastPlayerFlag = true;
                }
                removeFromBetting(player);
                unfoldedPlayers.splice(unfoldedPlayers.indexOf(player), 1);
                for (let pot of pots) { // Folded players not eligible for pots
                    pot.remove(player);
                }
                break;
        }
    }

    var dealFlop = function () {
        deck.pop();
        flop.push(deck.deal());
        flop.push(deck.deal());
        flop.push(deck.deal());
        dispatchEvent(new DealtFlopEvent(flop));
    };

    var dealTurn = function () {
        deck.pop();
        turn.push(deck.deal());
        dispatchEvent(new DealtTurnEvent(turn));
    }

    var dealRiver = function () {
        deck.pop();
        river.push(deck.deal());
        dispatchEvent(new DealtRiverEvent(river));
    }

    var finish = function () {
        if (bettingStage !== BettingStage.RIVER) {
            switch (bettingStage) {
                case BettingStage.PREFLOP:
                    dealFlop();
                case BettingStage.FLOP:
                    dealTurn();
                case BettingStage.TURN:
                    dealRiver();
            }
        }
        let result = null;
        for (let index in pots) {
            if (index === "0") {
                result = processPot(pots[index]);
            } else {
                processPot(pots[index]);
            }
        }
        dispatchEvent(new GameEndEvent(result));
    }

    var makeBet = function (player, bet) {
        if (currentPlayer !== player) {
            return; // Not player's turn to bet
        } else if (isValidBet(player, bet) === false) {
            dispatchEvent(new BetAwaitEvent(currentPlayer, makeBet, currentBet, bets[currentPlayer.getName()], minRaise, getEligiblePot));
            return; // Not a valid bet
        }

        currentPlayer = getNextPlayer(player);
        processBet(player, bet);
        updatePots();
        dispatchEvent(new BetMadeEvent(player, bet));

        if (bettingPlayers.length === 0 || unfoldedPlayers.length === 1 || bettingPlayers.length === 1 && currentBet === bets[bettingPlayers[0].getName()]) {
            //Only one player left
            finish();
            return;
        }

        if (player === lastPlayer || lastPlayerFlag === true) {
            lastPlayerFlag = false;
            switch (bettingStage) {
                case BettingStage.PREFLOP:
                    dealFlop();
                    bettingStage = BettingStage.FLOP;
                    currentPlayer = firstPlayer;
                    lastPlayer = getPrevPlayer(firstPlayer);
                    break;

                case BettingStage.FLOP:
                    dealTurn();
                    bettingStage = BettingStage.TURN;
                    currentPlayer = firstPlayer;
                    lastPlayer = getPrevPlayer(firstPlayer);
                    break;

                case BettingStage.TURN:
                    dealRiver();
                    bettingStage = BettingStage.RIVER;
                    currentPlayer = firstPlayer;
                    lastPlayer = getPrevPlayer(firstPlayer);
                    break;

                case BettingStage.RIVER:
                    bettingStage = BettingStage.COMPLETE;
                    finish();
                    break;
            }
        }
        if (bettingStage !== BettingStage.COMPLETE) {
            dispatchEvent(new BetAwaitEvent(currentPlayer, makeBet, currentBet, bets[currentPlayer.getName()], minRaise, getEligiblePot));
        }
    }

    var deal = function () {
        for (let player of players) {
            player.deal(deck.deal());
        }
        for (let player of players) {
            player.deal(deck.deal());
        }
    };

    let players: Player[] = matchPlayers.slice(0);
    let bettingPlayers: Player[] = matchPlayers.slice(0);
    let unfoldedPlayers: Player[] = matchPlayers.slice(0);

    let parentMatch = matchCallback;

    let deck: Deck = new Deck();
    deck.shuffle();
    let flop: Card[] = [];
    let turn: Card[] = [];
    let river: Card[] = [];

    let bets = {};
    let baselines: number[] = [];
    let pots: Pot[] = [new Pot()];

    for (let player of players) {
        bets[player.getName()] = 0;
    }

    let bettingStage: BettingStage = BettingStage.NONE;

    for (let player of players) {
        player.resetHand();
    }

    dispatchEvent(new GameStartEvent(players));

    let ante: number = 25;
    let firstPlayer: Player = getPrevPlayer(players[button]); //Keep track of where to resume betting each round
    let currentPlayer: Player = firstPlayer;
    let lastPlayer: Player = getPrevPlayer(currentPlayer); //Where to end betting if no one raises
    let lastPlayerFlag: boolean = false;
    let lastRaiser: Player = null;
    let currentBet: number = ante;
    let minRaise: number = ante * 2;

    deductAntes(ante);

    deal();

    for (let player of players) {
        dispatchEvent(new DealtHandEvent(player, player.getHand()));
    }

    bettingStage = BettingStage.PREFLOP;

    dispatchEvent(new BetAwaitEvent(currentPlayer, makeBet, currentBet, bets[currentPlayer.getName()], minRaise, getEligiblePot));

}

var DealtHandEvent = function (player, hand) {
    this.player = player;
    this.hand = hand;
}

var PlayerMoneyChangeEvent = function (player, change) {
    this.player = player;
    this.change = change;
};

class PotChangeEvent {
    public pots;

    constructor(pots) {
        this.pots = pots;
    }
}

var GameStartEvent = function (players) {
    this.players = players;
};

var BetAwaitEvent = function (player, callback, current, committed, minRaise, potCheck) {
    this.player = player;
    this.callback = callback;
    this.current = current;
    this.committed = committed;
    this.minRaise = minRaise;
    this.potCheck = potCheck;
};

var BetMadeEvent = function (player, bet) {
    this.player = player;
    this.bet = bet;
};

var DealtFlopEvent = function (cards) {
    this.cards = cards;
};

var DealtTurnEvent = function (cards) {
    this.cards = cards;
};

var DealtRiverEvent = function (cards) {
    this.cards = cards;
};

var GameEndEvent = function (result) {
    this.result = result;
};