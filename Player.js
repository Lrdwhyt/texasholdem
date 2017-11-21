var Player = function (name, money) {
    var name;
    var money;
    var hand = [];
    var controller;

    var getName = function () {
        return name;
    }

    var getHand = function () {
        return hand;
    }

    var resetHand = function () {
        hand = [];
    }

    var getMoney = function () {
        return money;
    }

    var modMoney = function (amount) {
        money += amount;
    }

    var setController = function (newController) {
        controller = newController;
    }

    var getController = function () {
        return controller;
    }

    var deal = function (card) {
        hand.push(card);
    }

    return {
        getName: getName,
        getHand: getHand,
        getMoney: getMoney,
        modMoney: modMoney,
        deal: deal,
        getController: getController,
        setController: setController,
        resetHand: resetHand
    }
}

var UserController = function (player, root) {
    var callbackFunction;
    var player;
    var root;

    console.log("Game started");
    root.querySelector("#actions").addEventListener("click", function (e) {
        switch (e.target.id) {
            case "raise":
                var amount = parseInt(document.getElementById("bet").value);
                var callback = callbackFunction;
                callbackFunction = null;
                callback(player, Bets.RAISE, amount);
                break;
            case "call":
                var callback = callbackFunction;
                callbackFunction = null;
                callback(player, Bets.CALL);
                break;
            case "all-in":
                var callback = callbackFunction;
                callbackFunction = null;
                callback(player, Bets.ALL_IN);
                break;
            case "fold":
                var callback = callbackFunction;
                callbackFunction = null;
                callback(player, Bets.FOLD);
                break;
            case "check":
                var callback = callbackFunction;
                callbackFunction = null;
                callback(player, Bets.CHECK);
                break;
        }
    });

    var resetUI = function () {

        document.getElementById("user-cards").innerHTML = "";
        document.getElementById("board").innerHTML = "";

    }

    //Allows game to notify player of events
    var dispatchEvent = function (e) {

        if (e instanceof GameStartEvent) {
            
            resetUI();

        } else if (e instanceof DealtHandEvent) {

            for (var card of e.hand) {
                document.getElementById("user-cards").appendChild(card.getImage());
            }

        } else if (e instanceof BettingPreflopAwaitEvent) {
            console.log(e.player === player);

            if (e.player === player) {
                console.log("Your turn!");
                callbackFunction = e.callback;
            }

        } else if (e instanceof BettingPreflopBetEvent) {

            console.log(e.player.getName() + " bet " + e.type + ", " + e.amount);

        } else if (e instanceof DealtFlopEvent) {

            console.log("Flop" + e.cards);
            for (var card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }

        } else if (e instanceof BettingFlopAwaitEvent) {

            if (e.player === player) {
                console.log("Your turn!");
                callbackFunction = e.callback;
            }

        } else if (e instanceof BettingFlopBetEvent) {

            console.log(e.player.getName() + " bet " + e.type + ", " + e.amount);

        } else if (e instanceof DealtTurnEvent) {

            console.log(e.cards);
            for (var card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }

        } else if (e instanceof BettingTurnAwaitEvent) {

            if (e.player === player) {
                console.log("Your turn!");
                callbackFunction = e.callback;
            }

        } else if (e instanceof BettingTurnBetEvent) {

            console.log(e.player.getName() + " bet " + e.type + ", " + e.amount);

        } else if (e instanceof DealtRiverEvent) {

            console.log(e.cards);
            for (var card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }

        } else if (e instanceof BettingRiverAwaitEvent) {

            if (e.player === player) {
                console.log("Your turn!");
                callbackFunction = e.callback;
            }

        } else if (e instanceof BettingRiverBetEvent) {

            console.log(e.player.getName() + " bet " + e.type + ", " + e.amount);

        } else if (e instanceof GameEndEvent) {

            Object.keys(e.result).forEach(function (key, i) {
                console.log(e.result[key].player);
                var ele = document.querySelector("[name=" + e.result[key].player + "]");
                for (var card of e.result[key].hand) {
                    ele.appendChild(card.getImage());
                }
                ele.append(e.result[key].score);
                console.log(e.result[key].score);
            });

        }
    }

    return {
        dispatchEvent: dispatchEvent
    }

}