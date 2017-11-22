var AIController = function (player) {
    var player;
    var callbackFunction;
    var board = [];

    //Allows game to notify player of events
    this.dispatchEvent = function (e) {
        if (e instanceof BettingPreflopAwaitEvent) {

            if (e.player === player) {
                e.callback(player, Bets.CALL);
            }

        } else if (e instanceof BettingFlopAwaitEvent) {

            if (e.player === player) {
                if (Math.random() > 0.9) {
                    e.callback(player, Bets.RAISE, 1);
                } else {
                    e.callback(player, Bets.CALL);
                }
            }

        } else if (e instanceof BettingTurnAwaitEvent) {

            if (e.player === player) {
                e.callback(player, Bets.CALL);
            }

        } else if (e instanceof BettingRiverAwaitEvent) {

            if (e.player === player) {
                e.callback(player, Bets.CALL);
            }

        }

    }

}