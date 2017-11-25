var Strategy = {
    PASSIVE: 0,
    NORMAL: 1,
    TRICKY: 2,
    AGGRESSIVE: 3
}

var calculateAction = function (cards, board, currentBet, committed, minRaise, money) {

    let deck = new Deck();

    let totalLosses = 0;
    let totalWins = 0;
    let totalDraws = 0;
    let totalWinsOrDraws = 0;

    let trials = 20;

    for (let i = 0; i < trials; ++i) {
        deck.shuffle();
        let possibleDraws = Hands.difference(deck.getCards(), cards.concat(board));
        let possibleBoard = board;
        while (possibleBoard.length < 5) {
            possibleBoard.push(possibleDraws.pop());
        }

        let possibleHand = cards.concat(possibleBoard);

        let hypotheticalHand = [possibleDraws.pop(), possibleDraws.pop()];

        let hypotheticalResult = Hands.bestHand(hypotheticalHand.concat(possibleBoard));
        let bestHand = Hands.bestHand(possibleHand);

        if (bestHand.score > hypotheticalResult.score) {
            ++totalWins;
        } else if (bestHand.score === hypotheticalResult.score) {
            ++totalDraws;
        } else {
            ++totalLosses;
        }
    }

    let winRatio = totalWins / trials;
    let lossRatio = totalLosses / trials;

    let toCall = currentBet - committed;
    let toRaise = currentBet - committed + minRaise;

    // TODO: Improve decisionmaking
    if (toCall === 0) {
        if (winRatio <= 0.5) {
            return new Bet(BetType.CHECK);
        } else {
            if (money > toRaise) {
                let b = parseInt(toRaise * 3);
                if (money > b) {
                    return new Bet(BetType.RAISE, b);
                } else {
                    return new Bet(BetType.RAISE, toRaise);
                }
            } else {
                return new Bet(BetType.CHECK);
            }
        }
    } else {
        if (winRatio <= 0.35) {
            let chance = currentBet / (committed + money) + 0.3;
            chance -= winRatio;
            if (chance > 0.8) {
                chance = 0.8;
            }
            if (Math.random() > chance) {
                return new Bet(BetType.CALL);
            } else {
                return new Bet(BetType.FOLD);
            }
        } else if (winRatio <= 0.6) {
            let chance = currentBet / (committed + money) + 0.3;
            chance -= winRatio;
            if (chance > 0.7) {
                chance = 0.7;
            }
            if (Math.random() > chance) {
                return new Bet(BetType.CALL);
            } else {
                return new Bet(BetType.FOLD);
            }
        } else if (winRatio <= 0.8) {
            let chance = currentBet / (committed + money) + 0.4;
            chance -= winRatio;
            if (chance > 0.6) {
                chance = 0.6;
            }
            if (Math.random() > chance) {
                return new Bet(BetType.CALL);
            } else {
                return new Bet(BetType.FOLD);
            }
        } else {
            let chance = currentBet / (committed + money) + 0.5;
            chance -= winRatio;
            if (chance > 0.5) {
                chance = 0.5;
            }
            if (Math.random() > chance) {
                if (money >= toRaise) {
                    let b = parseInt(toRaise * 5);
                    if (money >= b) {
                        return new Bet(BetType.RAISE, b);
                    } else {
                        return new Bet(BetType.RAISE, toRaise);
                    }
                } else {
                    return new Bet(BetType.CALL);
                }
            } else {
                return new Bet(BetType.CALL);
            }
        }
    }

}

var AIController = function (player, style) {
    var player;
    var callbackFunction;
    let hand = [];
    let board = [];
    let strategy = style;

    //Allows game to notify player of events
    this.dispatchEvent = function (e) {
        if (e instanceof GameStartEvent) {
            board = [];
        } else if (e instanceof DealtHandEvent) {
            hand = e.hand;
        } else if (e instanceof DealtFlopEvent || e instanceof DealtTurnEvent || e instanceof DealtRiverEvent) {
            board = board.concat(e.cards);
        } else if (e instanceof BetAwaitEvent) {

            if (e.player === player) {

                let bet = null;

                switch (strategy) {
                    case Strategy.NORMAL:
                        bet = calculateAction(hand, board, e.current, e.committed, e.minRaise, player.getMoney());
                        break;

                    case Strategy.PASSIVE:
                        bet = calculateAction(hand, board, e.current, e.committed, e.minRaise, player.getMoney());
                        break;

                    case Strategy.TRICKY:
                        bet = calculateAction(hand, board, e.current, e.committed, e.minRaise, player.getMoney());
                        break;

                    case Strategy.AGGRESSIVE:
                        bet = calculateAction(hand, board, e.current, e.committed, e.minRaise, player.getMoney());
                        break;

                }

                e.callback(player, bet);

            }

        }

    }

}