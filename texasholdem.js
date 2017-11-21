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
        if (e instanceof GameEndEvent) {
            for (let i = players.length - 1; i >= 0; --i) {
                if (players[i].getMoney() <= 0) {
                    players.splice(i, 1);
                }
            }
            //setTimeout(startGame, 5000);
        }
    }

    var startGame = function () {
        if (players.length >= 2) {
            game = new Game(players, buttonPosition, dispatchEvent);
        }
    }

    return {
        addPlayer: addPlayer,
        startGame: startGame,
        dispatchEvent: dispatchEvent
    }

};

var Game = function (players, button, matchCallback) {

    var dispatchEvent = function (e) {
        if (e instanceof DealtHandEvent) {
            e.player.getController().dispatchEvent(e);
            return;
        }

        if (e instanceof GameEndEvent) {
            matchNotify(e);
        }

        for (let player of players) {
            player.getController().dispatchEvent(e);
        }
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
            winners[0].modMoney(pot);
        } else { // Split pot
            for (var player of winners) {
                player.modMoney(parseInt(pot / winners.length));
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

    var betPreflop = function (player, type, amount) {
        if (player != currentPlayer) {
            return;
        }
        //Bet
        dispatchEvent(new BettingPreflopBetEvent(player, type, amount));
        processBet(player, type, amount);
        if (player != lastPlayer) {
            dispatchEvent(new BettingPreflopAwaitEvent(currentPlayer, betPreflop, bets[currentPlayer], currentBet));
        } else {
            currentPlayer = firstPlayer;
            lastPlayer = getPrevPlayer(firstPlayer);
            dealFlop();
        }
    };

    var processBet = function (player, type, amount) {
        // TODO: check that bet is valid
        currentPlayer = getNextPlayer(player);
        if (type == Bets.CALL) {
            var toCallDifference = currentBet - bets[player.getName()];
            if (player.getMoney() >= toCallDifference) {
                pot += toCallDifference;
                bets[player.getName()] += toCallDifference;
                player.modMoney(-toCallDifference);
            } else {
                // TODO: All-in, create side pots
                pot += player.getMoney();
                player.modMoney(-player.getMoney());
                bets[player.getName()] += player.getMoney();
            }
        } else if (type === Bets.CHECK) {
            if (currentBet === bets[player.getName()]) {
                // Valid bet
            } else {
                // Can't check
                return;
            }
        } else if (type == Bets.RAISE) {
            var toRaiseDifference = currentBet - bets[player.getName()] + amount;
            if (amount > 0 && player.getMoney() >= toRaiseDifference) {
                // Valid raise
                lastPlayer = getPrevPlayer(player);
                currentBet += amount;
                bets[player.getName()] += toRaiseDifference;
                pot += toRaiseDifference;
                player.modMoney(-toRaiseDifference);
            } else {
                // invalid raise amount
                return;
            }

        } else if (type == Bets.FOLD) {
            if (firstPlayer === player) {
                firstPlayer = getPrevPlayer(player);
            }
            players.remove(player);
            if (players.length === 1) {
                //Only one player left, who wins by default
                dispatchEvent(new GameEndEvent());
            }
        }
    }

    var betFlop = function (player, type, amount) {
        if (player != currentPlayer) {
            return;
        }
        //Bet
        dispatchEvent(new BettingFlopBetEvent(player, type, amount));
        processBet(player, type, amount);
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
        dispatchEvent(new BettingTurnBetEvent(player, type, amount));
        processBet(player, type, amount);
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
        dispatchEvent(new BettingRiverBetEvent(player, type, amount));
        processBet(player, type, amount);
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
        turn.push(deck.deal());
        dispatchEvent(new DealtTurnEvent(turn));
        dispatchEvent(new BettingTurnAwaitEvent(currentPlayer, betTurn));
    }

    var dealRiver = function () {
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
    var players;
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

var PlayerMoneyChange = function (player, change) {
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