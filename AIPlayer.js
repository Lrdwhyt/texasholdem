var Strategy = {
    PASSIVE: 0,
    NORMAL: 1,
    TRICKY: 2,
    AGGRESSIVE: 3
}

var calculateAction = function (cards, board, currentBet, committed, minRaise, money) {
    let deck = new Deck();
    deck.shuffle();
    let possibleDraws = Hands.difference(deck.getCards(), cards.concat(board));

    let totalScore = 0;
    let totalType = 0;

    for (let i = 0; i < 10; ++i) {
        let possibleHand = cards.concat(board);
        while (possibleHand.length < 7) {
            possibleHand.push(possibleDraws.pop());
        }

        let bestHand = Hands.bestHand(possibleHand);
        let score = bestHand.score;
        let type = bestHand.type;

        totalScore += score;
        totalType += type;
    }

    let avgScore = totalScore / 10;
    let avgType = totalType / 10;

    let toCall = currentBet - committed;
    let toRaise = currentBet - committed + minRaise;

    // TODO: Improve decisionmaking
    if (toCall === 0) {
        if (avgType < 1.3) {
            return new Bet(BetType.CHECK);
        } else {
            if (money > toRaise) {
                let b = parseInt(toRaise * Math.sqrt(avgType));
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
        if (avgType < 1.2) {
            let chance = currentBet / (committed + money);
            chance += 0.3;
            if (chance > 1) {
                chance = 1;
            }
            chance -= 0.4;
            if (Math.random() > chance) {
                return new Bet(BetType.CALL);
            } else {
                return new Bet(BetType.FOLD);
            }
        } else if (avgType < 1.6) {
            let chance = currentBet / (committed + money);
            chance += 0.3;
            if (chance > 1) {
                chance = 1;
            }
            chance -= 0.2;
            if (Math.random() > chance) {
                return new Bet(BetType.CALL);
            } else {
                return new Bet(BetType.FOLD);
            }
        } else if (avgType < 2.4) {
            let chance = currentBet / (committed + money);
            if (chance > 1) {
                chance = 1;
            }
            chance /= 2;
            if (Math.random() > chance) {
                return new Bet(BetType.CALL);
            } else {
                return new Bet(BetType.FOLD);
            }
        } else {
            let chance = currentBet / (committed + money);
            chance += 0.4;
            if (chance > 0.9) {
                chance = 0.9;
            }
            if (Math.random() > chance) {
                if (money >= toRaise) {
                    let b = parseInt(toRaise * avgType);
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