var Strategy = {
    NORMAL: 0,
    TRICKY: 1,
    AGGRESSIVE: 2
}

var calculateAction = function (cards, board, currentBet, committed, money) {
    let deck = new Deck();
    deck.shuffle();
    let possibleDraws = Hands.difference(deck.getCards(), cards.concat(board));

    let possibleHand = [];
    while (possibleHand.length < 7) {
        possibleHand.push(possibleDraws.pop());
    }

    let score = Hands.bestHand(possibleHand).score;
    let toCall = currentBet - committed;

    // TODO: Improve decisionmaking
    if (toCall === 0) {
        if (score < 540000 && board.length === 5) {
            return new Bet(BetType.CHECK);
        } else if (score < 570000) {
            return new Bet(BetType.CHECK);
        } else {
            return new Bet(BetType.RAISE, parseInt((score - 570000) / 5000000 * money));
        }
    } else {
        if (score < 500000) {
            if (toCall > committed - money * 0.01) {
                return new Bet(BetType.FOLD);
            } else {
                return new Bet(BetType.CALL);
            }
        } else if (score < 535000) {
            if (toCall > committed * 2 - money * 0.01) {
                return new Bet(BetType.FOLD);
            } else {
                return new Bet(BetType.CALL);
            }
        } else {
            return new Bet(BetType.CALL);
        }
    }

}

var AIController = function (player) {
    var player;
    var callbackFunction;
    let hand = [];
    let board = [];

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

                let bet = calculateAction(hand, board, e.current, e.committed, player.getMoney());

                e.callback(player, bet);

            }

        }

    }

}