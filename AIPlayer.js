var AIController = function (player) {
    var player;
    var callbackFunction;
    var board = [];

    //Allows game to notify player of events
    this.dispatchEvent = function (e) {
        if (e instanceof BetAwaitEvent) {

            if (e.player === player) {
                var toCall = e.current - e.committed;
                if (Math.random() > 0.9) {
                    e.callback(player, new Bet(BetType.RAISE, toCall + 5));
                } else if (toCall > 0) {
                    e.callback(player, new Bet(BetType.CALL));
                } else {
                    e.callback(player, new Bet(BetType.CHECK));
                }
            }

        }

    }

}