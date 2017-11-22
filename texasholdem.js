var BetType = {
    FOLD: 0,
    CHECK: 1,
    CALL: 2,
    RAISE: 3,
    ALL_IN: 4
};

var BettingStage = {
    NONE: 0,
    PREFLOP: 1,
    FLOP: 2,
    TURN: 3,
    RIVER: 4
};

var OfflineMatch = function () {

    var players = [];
    var game;
    var buttonPosition = 0;

    var addPlayer = function (player) {
        players.push(player);
    }

    var dispatchEvent = function (e) {
        if (e instanceof DealtHandEvent) {
            e.player.getController().dispatchEvent(e);
            return;
        }

        for (let player of players) {
            player.getController().dispatchEvent(e);
        }

        if (e instanceof GameEndEvent) {
            game = null;
            for (let i = players.length - 1; i >= 0; --i) {
                if (players[i].getMoney() <= 0) {
                    players.splice(i, 1);
                }
            }
        }

    }

    var startGame = function () {
        if (players.length >= 2 && (game === undefined || game === null)) {
            game = new Game(players, buttonPosition, dispatchEvent);
        }
    }

    return {
        addPlayer: addPlayer,
        startGame: startGame,
        dispatchEvent: dispatchEvent
    }

};

var MatchController = function (match) {
    var match;
    document.getElementById("match-controls").addEventListener("click", function (e) {
        if (e.target.id === "next-game") {
            match.startGame();
        }
    });
}

var Pot = function () {
    this.bet = 0;
    this.players = [];
    this.total = 0;
}

Pot.prototype.add = function(amount) {
    this.total += amount;
}

var Game = function (matchPlayers, button, matchCallback) {

    var dispatchEvent = function (e) {
        matchNotify(e);
    }

    var modMoney = function (player, money) {
        player.modMoney(money);
        dispatchEvent(new PlayerMoneyChangeEvent(player, money));
    }

    var processPot = function (participants) {
        var results = {};
        var winners = [];
        var bestScore = 0;
        var bestHand;
        for (var player of players) {
            var playerHand = Hands.bestHand(player.getHand().concat(flop).concat(turn).concat(river));
            var playerScore = playerHand.score;
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
            modMoney(winners[0], pot);
        } else { // Split pot
            for (var player of winners) {
                modMoney(player, parseInt(pot / winners.length));
            }
        }
        return results;
    }

    var getNextPlayer = function (player) {
        var i = players.indexOf(player);
        ++i;
        if (i >= players.length) {
            return players[0];
        } else {
            return players[i];
        }
    }

    var getPrevPlayer = function (player) {
        var i = players.indexOf(player);
        if (i === 0) {
            return players[players.length - 1];
        } else {
            return players[i - 1];
        }
    }

    var isValidBet = function (player, bet) {
        switch (bet.type) {
            case BetType.CALL:
                if (currentBet - bets[player.getName()] > 0) {
                    return true;
                } else {
                    return false;
                }
                break;

            case BetType.RAISE:
                // TODO: Implement
                break;

            case BetType.CHECK:
                if (currentBet - bets[player.getName()] === 0) {
                    return true;
                } else {
                    return false;
                }
                break;

            case BetType.FOLD:
                return true;
                break;
        }
    }

    var processBet = function (player, bet) {
        switch(bet.type) {
            case BetType.CALL:
                var toCallDifference = currentBet - bets[player.getName()];
                if (player.getMoney() >= toCallDifference) {
                    pot += toCallDifference;
                    bets[player.getName()] += toCallDifference;
                    modMoney(player, -toCallDifference);
                } else {
                    // TODO: All-in, create side pots
                    pot += player.getMoney();
                    modMoney(player, -player.getMoney());
                    bets[player.getName()] += player.getMoney();
                }
                break;

            case BetType.CHECK:
                if (currentBet === bets[player.getName()]) {
                    // Valid bet
                } else {
                    // Can't check
                    console.log("invalid check");
                    return false;
                }
                break;

            case BetType.RAISE:
                var toRaiseDifference = currentBet - bets[player.getName()] + bet.amount;
                if (bet.amount > 0 && player.getMoney() >= toRaiseDifference) {
                    // Valid raise
                    lastPlayer = getPrevPlayer(player);
                    currentBet += bet.amount;
                    bets[player.getName()] += toRaiseDifference;
                    pot += toRaiseDifference;
                    modMoney(player, -toRaiseDifference);
                } else {
                    // invalid raise amount
                    return false;
                }
                break;

            case BetType.FOLD:
                if (firstPlayer === player) {
                    firstPlayer = getPrevPlayer(player);
                }
                players.splice(players.indexOf(player), 1);
                if (players.length === 1) {
                    //Only one player left, who wins by default
                    dispatchEvent(new GameEndEvent());
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
        bettingStage = BettingStage.FLOP;
        dispatchEvent(new BetAwaitEvent(currentPlayer, makeBet));
    };

    var dealTurn = function () {
        deck.pop();
        turn.push(deck.deal());
        dispatchEvent(new DealtTurnEvent(turn));
        bettingStage = BettingStage.TURN;
        dispatchEvent(new BetAwaitEvent(currentPlayer, makeBet));
    }

    var dealRiver = function () {
        deck.pop();
        river.push(deck.deal());
        dispatchEvent(new DealtRiverEvent(river));
        bettingStage = BettingStage.RIVER;
        dispatchEvent(new BetAwaitEvent(currentPlayer, makeBet));
    }

    var makeBet = function(player, bet) {
        if (currentPlayer !== player) {
            return; // Not player's turn to bet
        } else if (isValidBet(player, bet) === false) {
            dispatchEvent(new BetAwaitEvent(currentPlayer, makeBet));
            return; // Not a valid bet
        }
        processBet(player, bet);
        dispatchEvent(new BetMadeEvent(player, bet));
        currentPlayer = getNextPlayer(player);

        if (player === lastPlayer) {
            switch (bettingStage) {
                case BettingStage.PREFLOP:
                    dealFlop();
                    break;

                case BettingStage.FLOP:
                    dealTurn();
                    break;

                case BettingStage.TURN:
                    dealRiver();
                    break;

                case BettingStage.RIVER:
                    dispatchEvent(new GameEndEvent(processPot()));
                    break;
            }
        } else {
            dispatchEvent(new BetAwaitEvent(currentPlayer, makeBet, mainPot, bets[currentPlayer]));
        }
    }

    var deal = function () {
        for (var player of players) {
            player.deal(deck.deal());
        }
        for (var player of players) {
            player.deal(deck.deal());
        }
    };

    var deck = new Deck();
    deck.shuffle();
    var players = matchPlayers.slice(0);
    var flop = [];
    var turn = [];
    var river = [];
    var mainPot = new Pot();
    var sidePots = [];
    var pot = 0;
    var bets = {};
    var matchNotify = matchCallback;
    var bettingStage = BettingStage.NONE;

    for (let player of players) {
        player.resetHand();
    }

    dispatchEvent(new GameStartEvent(players));

    deal();

    for (let player of players) {
        dispatchEvent(new DealtHandEvent(player, player.getHand()));
    }

    var firstPlayer = getPrevPlayer(players[button]); //Keep track of where to resume betting each round
    var currentPlayer = firstPlayer;
    var lastPlayer = getPrevPlayer(currentPlayer); //Where to end betting if no one raises
    var currentBet = 0;

    for (var player of players) {
        bets[player.getName()] = 0;
    }
    bettingStage = BettingStage.PREFLOP;

    dispatchEvent(new BetAwaitEvent(currentPlayer, makeBet, bets[currentPlayer], 0));

}

var DealtHandEvent = function (player, hand) {
    this.player = player;
    this.hand = hand;
}

var PlayerMoneyChangeEvent = function (player, change) {
    this.player = player;
    this.change = change;
};

var GameStartEvent = function (players) {
    this.players = players;
};

var BetAwaitEvent = function (player, callback, current, toCall) {
    this.player = player;
    this.callback = callback;
    this.current = current;
    this.toCall = toCall;
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

var Bet = function(type, amount) {
    this.type = type;
    this.amount = amount;
}