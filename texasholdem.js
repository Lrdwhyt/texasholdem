var Bets = {
    FOLD: 0,
    CHECK: 1,
    CALL: 2,
    RAISE: 3,
    ALL_IN: 4
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

    var processBet = function (player, type, amount) {
        // TODO: check that bet is valid
        if (type == Bets.CALL) {
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
        } else if (type === Bets.CHECK) {
            if (currentBet === bets[player.getName()]) {
                // Valid bet
            } else {
                // Can't check
                console.log("invalid check");
                return false;
            }
        } else if (type == Bets.RAISE) {
            var toRaiseDifference = currentBet - bets[player.getName()] + amount;
            if (amount > 0 && player.getMoney() >= toRaiseDifference) {
                // Valid raise
                lastPlayer = getPrevPlayer(player);
                currentBet += amount;
                bets[player.getName()] += toRaiseDifference;
                pot += toRaiseDifference;
                modMoney(player, -toRaiseDifference);
            } else {
                // invalid raise amount
                return false;
            }

        } else if (type == Bets.FOLD) {
            if (firstPlayer === player) {
                firstPlayer = getPrevPlayer(player);
            }
            players.splice(players.indexOf(player), 1);
            if (players.length === 1) {
                //Only one player left, who wins by default
                dispatchEvent(new GameEndEvent());
            }
        }
    }

    var betPreflop = function (player, type, amount) {
        if (player != currentPlayer) {
            return;
        }
        //Bet
        if (processBet(player, type, amount) === false) {
            dispatchEvent(new BettingPreflopAwaitEvent(currentPlayer, betPreflop, bets[currentPlayer], currentBet));
            return;
        } else {
            dispatchEvent(new BettingPreflopBetEvent(player, type, amount));
            currentPlayer = getNextPlayer(player);
        }
        if (player != lastPlayer) {
            dispatchEvent(new BettingPreflopAwaitEvent(currentPlayer, betPreflop, bets[currentPlayer], currentBet));
        } else {
            currentPlayer = firstPlayer;
            lastPlayer = getPrevPlayer(firstPlayer);
            dealFlop();
        }
    };

    var betFlop = function (player, type, amount) {
        if (player != currentPlayer) {
            return;
        }
        //Bet
        if (processBet(player, type, amount) === false) {
            dispatchEvent(new BettingFlopAwaitEvent(currentPlayer, betFlop, bets[currentPlayer], currentBet));
            return;
        } else {
            dispatchEvent(new BettingFlopBetEvent(player, type, amount));
            currentPlayer = getNextPlayer(player);
        }
        // Bet successfully processed
        if (player != lastPlayer) {
            dispatchEvent(new BettingFlopAwaitEvent(currentPlayer, betFlop, bets[currentPlayer], currentBet));
        } else {
            currentPlayer = firstPlayer;
            lastPlayer = getPrevPlayer(firstPlayer);
            dealTurn();
        }
    };

    var betTurn = function (player, type, amount) {
        if (player != currentPlayer) {
            return;
        }
        //Bet
        if (processBet(player, type, amount) === false) {
            dispatchEvent(new BettingTurnAwaitEvent(currentPlayer, betTurn, bets[currentPlayer], currentBet));
            return;
        } else {
            dispatchEvent(new BettingTurnBetEvent(player, type, amount));
            currentPlayer = getNextPlayer(player);
        }
        if (player != lastPlayer) {
            dispatchEvent(new BettingTurnAwaitEvent(currentPlayer, betTurn, bets[currentPlayer], currentBet));
        } else {
            currentPlayer = firstPlayer;
            lastPlayer = getPrevPlayer(firstPlayer);
            dealRiver();
        }
    };

    var betRiver = function (player, type, amount) {
        if (player != currentPlayer) {
            return;
        }
        //Bet
        if (processBet(player, type, amount) === false) {
            dispatchEvent(new BettingRiverAwaitEvent(currentPlayer, betRiver, bets[currentPlayer], currentBet));
            return;
        } else {
            dispatchEvent(new BettingRiverBetEvent(player, type, amount));
            currentPlayer = getNextPlayer(player);
        }
        if (player != lastPlayer) {
            dispatchEvent(new BettingRiverAwaitEvent(currentPlayer, betRiver, bets[currentPlayer], currentBet));
        } else {
            // results
            dispatchEvent(new GameEndEvent(processPot()));
        }
    };

    var dealFlop = function () {
        deck.pop();
        flop.push(deck.deal());
        flop.push(deck.deal());
        flop.push(deck.deal());
        dispatchEvent(new DealtFlopEvent(flop));
        dispatchEvent(new BettingFlopAwaitEvent(currentPlayer, betFlop));
    };

    var dealTurn = function () {
        deck.pop();
        turn.push(deck.deal());
        dispatchEvent(new DealtTurnEvent(turn));
        dispatchEvent(new BettingTurnAwaitEvent(currentPlayer, betTurn));
    }

    var dealRiver = function () {
        deck.pop();
        river.push(deck.deal());
        dispatchEvent(new DealtRiverEvent(river));
        dispatchEvent(new BettingRiverAwaitEvent(currentPlayer, betRiver));
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
    var pot = 0;
    var bets = {};
    var matchNotify = matchCallback;

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

    dispatchEvent(new BettingPreflopAwaitEvent(currentPlayer, betPreflop, bets[currentPlayer], 0));

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

var BettingPreflopAwaitEvent = function (player, callback, current, toCall) {
    this.player = player;
    this.callback = callback;
    this.current = current;
    this.toCall = toCall;
};

var BettingPreflopBetEvent = function (player, type, amount) {
    this.player = player;
    this.type = type;
    this.amount = amount;
};

var DealtFlopEvent = function (cards) {
    this.cards = cards;
};

var BettingFlopAwaitEvent = function (player, callback, current, toCall) {
    this.player = player;
    this.callback = callback;
    this.current = current;
    this.toCall = toCall;
};

var BettingFlopBetEvent = function (player, type, amount) {
    this.player = player;
    this.type = type;
    this.amount = amount;
};

var DealtTurnEvent = function (cards) {
    this.cards = cards;
};

var BettingTurnAwaitEvent = function (player, callback, current, toCall) {
    this.player = player;
    this.callback = callback;
    this.current = current;
    this.toCall = toCall;
};

var BettingTurnBetEvent = function (player, type, amount) {
    this.player = player;
    this.type = type;
    this.amount = amount;
};

var DealtRiverEvent = function (cards) {
    this.cards = cards;
};

var BettingRiverAwaitEvent = function (player, callback, current, toCall) {
    this.player = player;
    this.callback = callback;
    this.current = current;
    this.toCall = toCall;
};

var BettingRiverBetEvent = function (player, type, amount) {
    this.player = player;
    this.type = type;
    this.amount = amount;
};

var GameEndEvent = function (result) {
    this.result = result;
};