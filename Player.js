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
                callback(player, new Bet(BetType.RAISE, amount));
                break;

            case "call":
                var callback = callbackFunction;
                callbackFunction = null;
                callback(player, new Bet(BetType.CALL));
                break;

            case "all-in":
                var callback = callbackFunction;
                callbackFunction = null;
                callback(player, new Bet(BetType.RAISE, player.getMoney()));
                break;

            case "fold":
                var callback = callbackFunction;
                callbackFunction = null;
                callback(player, new Bet(BetType.FOLD));
                break;

            case "check":
                var callback = callbackFunction;
                callbackFunction = null;
                callback(player, new Bet(BetType.CHECK));
                break;
        }
    });

    var resetUI = function () {
        document.getElementById("user-cards").innerHTML = "";
        document.getElementById("board").innerHTML = "";
        document.getElementById("players").innerHTML = "";
    }

    var drawBoard = function (players) {
        for (let player of players) {
            var playerRoot = document.createElement("div");
            playerRoot.setAttribute("name", player.getName());
            playerRoot.className = "player";
            var name = document.createElement("div");
            name.className = "name";
            name.textContent = player.getName();
            var money = document.createElement("div");
            money.className = "money";
            money.textContent = player.getMoney();
            playerRoot.appendChild(name);
            playerRoot.appendChild(money);
            document.getElementById("players").appendChild(playerRoot);
        }
    }

    var updatePot = function(pot) {
        //console.log(pot.baseline);
    }

    //Allows game to notify player of events
    var dispatchEvent = function (e) {

        if (e instanceof GameStartEvent) {

            resetUI();
            drawBoard(e.players);

        } else if (e instanceof PlayerMoneyChangeEvent) {
            document.querySelector("[name=" + e.player.getName() + "] .money").textContent = e.player.getMoney();

        } else if (e instanceof DealtHandEvent) {

            for (var card of e.hand) {
                document.getElementById("user-cards").appendChild(card.getImage());
            }

        } else if (e instanceof BetAwaitEvent) {
            if (e.player === player) {
                console.log("Your turn!");
                callbackFunction = e.callback;
            }

        } else if (e instanceof BetMadeEvent) {

            console.log(e.player.getName() + " bet " + e.bet.type + ", " + e.bet.amount);

        } else if (e instanceof PotChangeEvent) {
            for (let pot in e.pots) {
                updatePot(pot);
            }
        } else if (e instanceof DealtFlopEvent) {

            console.log("Flop" + e.cards);
            for (var card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }

        } else if (e instanceof DealtTurnEvent) {

            console.log(e.cards);
            for (var card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }

        } else if (e instanceof DealtRiverEvent) {

            console.log(e.cards);
            for (var card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }

        } else if (e instanceof GameEndEvent) {

            if (e.result) {
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
    }

    return {
        dispatchEvent: dispatchEvent
    }

}