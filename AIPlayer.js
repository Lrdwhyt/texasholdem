var AIController = function (player) {
    var player;
    var callbackFunction;
    var board = [];

    //Allows game to notify player of events
    this.dispatchEvent = function (e) {
        if (e instanceof BetAwaitEvent) {

            if (e.player === player) {
                if (Math.random() > 0.9) {
                    e.callback(player, new Bet(BetType.RAISE, 5));
                } else {
                    e.callback(player, new Bet(BetType.CALL));
                }
            }

        }

    }

}