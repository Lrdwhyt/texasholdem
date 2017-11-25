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
    let toCall = 0;

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
                if (toCall > player.getMoney()) {
                    callback(player, new Bet(BetType.CALL));
                } else {
                    callback(player, new Bet(BetType.RAISE, player.getMoney()));
                }
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
        document.getElementById("user-info").innerHTML = "";
        document.getElementById("user-cards").innerHTML = "";
        document.getElementById("board").innerHTML = "";
        document.getElementById("players-left").innerHTML = "";
        document.getElementById("players-top").innerHTML = "";
        document.getElementById("players-right").innerHTML = "";
        document.querySelectorAll(".text").forEach(function (ele) {
            ele.innerHTML = "he";
        });
    }

    var resetBetting = function () {
        document.querySelectorAll(".text").forEach(function (ele) {
            ele.innerHTML = "";
        });
    }

    var drawBoard = function (players) {
        let otherPlayers = players.slice(0);
        let index = otherPlayers.indexOf(player);
        otherPlayers.splice(index, 1);
        console.log(players.length);
        document.getElementById("user-info").appendChild(drawPlayer(player));
        switch (otherPlayers.length) {
            case 1:
                document.getElementById("players-top").appendChild(drawPlayer(otherPlayers[0]));
                break;

            case 2:
                document.getElementById("players-left").appendChild(drawPlayer(otherPlayers[0]));
                document.getElementById("players-right").appendChild(drawPlayer(otherPlayers[1]));
                break;

            case 3:
                document.getElementById("players-left").appendChild(drawPlayer(otherPlayers[0]));
                document.getElementById("players-top").appendChild(drawPlayer(otherPlayers[1]));
                document.getElementById("players-right").appendChild(drawPlayer(otherPlayers[2]));
                break;

            case 4:
                document.getElementById("players-left").appendChild(drawPlayer(otherPlayers[0]));
                document.getElementById("players-top").appendChild(drawPlayer(otherPlayers[1]));
                document.getElementById("players-top").appendChild(drawPlayer(otherPlayers[2]));
                document.getElementById("players-right").appendChild(drawPlayer(otherPlayers[3]));
                break;

            case 5:
                document.getElementById("players-left").appendChild(drawPlayer(otherPlayers[1]));
                document.getElementById("players-left").appendChild(drawPlayer(otherPlayers[0]));
                document.getElementById("players-top").appendChild(drawPlayer(otherPlayers[2]));
                document.getElementById("players-right").appendChild(drawPlayer(otherPlayers[3]));
                document.getElementById("players-right").appendChild(drawPlayer(otherPlayers[4]));
                break;

            case 6:
                document.getElementById("players-left").appendChild(drawPlayer(otherPlayers[1]));
                document.getElementById("players-left").appendChild(drawPlayer(otherPlayers[0]));
                document.getElementById("players-top").appendChild(drawPlayer(otherPlayers[2]));
                document.getElementById("players-top").appendChild(drawPlayer(otherPlayers[3]));
                document.getElementById("players-right").appendChild(drawPlayer(otherPlayers[4]));
                document.getElementById("players-right").appendChild(drawPlayer(otherPlayers[5]));
                break;

            case 7:
                document.getElementById("players-left").appendChild(drawPlayer(otherPlayers[2]));
                document.getElementById("players-left").appendChild(drawPlayer(otherPlayers[1]));
                document.getElementById("players-left").appendChild(drawPlayer(otherPlayers[0]));
                document.getElementById("players-top").appendChild(drawPlayer(otherPlayers[3]));
                document.getElementById("players-right").appendChild(drawPlayer(otherPlayers[4]));
                document.getElementById("players-right").appendChild(drawPlayer(otherPlayers[5]));
                document.getElementById("players-right").appendChild(drawPlayer(otherPlayers[6]));
                break;

            case 8:
                document.getElementById("players-left").appendChild(drawPlayer(otherPlayers[2]));
                document.getElementById("players-left").appendChild(drawPlayer(otherPlayers[1]));
                document.getElementById("players-left").appendChild(drawPlayer(otherPlayers[0]));
                document.getElementById("players-top").appendChild(drawPlayer(otherPlayers[3]));
                document.getElementById("players-top").appendChild(drawPlayer(otherPlayers[4]));
                document.getElementById("players-right").appendChild(drawPlayer(otherPlayers[5]));
                document.getElementById("players-right").appendChild(drawPlayer(otherPlayers[6]));
                document.getElementById("players-right").appendChild(drawPlayer(otherPlayers[7]));
                break;
        }
    }

    var drawPlayer = function (player) {
        var playerRoot = document.createElement("div");
        playerRoot.setAttribute("name", player.getName());
        playerRoot.className = "player";
        var name = document.createElement("div");
        name.className = "name";
        name.textContent = player.getName();
        var money = document.createElement("div");
        money.className = "money";
        money.textContent = player.getMoney();
        let text = document.createElement("div");
        text.className = "text";
        playerRoot.appendChild(name);
        playerRoot.appendChild(money);
        playerRoot.appendChild(text);
        return playerRoot;
    }

    var updatePot = function (pots) {

        if (pots.length === 1 || pots[1].size() === 0) { // Only main pot
            document.getElementById("pots").textContent = "Main pot: " + pots[0].size();
        } else {
            for (let index in pots) {
                if (index === "0") {
                    document.getElementById("pots").textContent = "Main pot: " + pots[index].size();
                } else if (pots[index].players.length > 1) {
                    document.getElementById("pots").textContent += ", Side pot " + index + ": " + pots[index].size();
                }
            }
        }
    }

    var restrictToValid = function (current, committed, minRaise, money) {
        if (current - committed > 0) {
            document.getElementById("call").disabled = false;
            document.getElementById("check").disabled = true;
            if (money >= current - committed) {
                document.getElementById("call").textContent = "Call (-" + (current - committed) + ")";
            } else {
                document.getElementById("call").textContent = "Call (-" + money + ")";
            }
        } else {
            document.getElementById("call").disabled = true;
            document.getElementById("check").disabled = false;
            document.getElementById("call").textContent = "Call";
        }

        if (minRaise + current - committed > money) {
            document.getElementById("raise").disabled = true;
        } else {
            document.getElementById("raise").disabled = false;
        }
    }

    //Allows game to notify player of events
    var dispatchEvent = function (e) {

        if (e instanceof GameStartEvent) {

            resetUI();
            drawBoard(e.players);

        } else if (e instanceof PlayerMoneyChangeEvent) {
            document.querySelector("[name=" + e.player.getName() + "] .money").textContent = e.player.getMoney();
            console.log(e.player.getName() + " money changed: " + e.change);

        } else if (e instanceof DealtHandEvent) {

            for (var card of e.hand) {
                document.getElementById("user-cards").appendChild(card.getImage());
            }

        } else if (e instanceof BetAwaitEvent) {

            //TODO: Fade out/disable invalid bet options
            if (e.player === player) {
                console.log("Your turn!");
                callbackFunction = e.callback;
                toCall = e.current - e.committed;
                restrictToValid(e.current, e.committed, e.minRaise, player.getMoney());
            }

        } else if (e instanceof BetMadeEvent) {

            let msg = "";

            switch (e.bet.type) {
                case BetType.RAISE:
                    msg = e.player.getName() + " raised to " + e.bet.amount;
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = "BET " + e.bet.amount;
                    break;

                case BetType.CALL:
                    msg = e.player.getName() + " called"
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = "CALLED";
                    break;

                case BetType.CHECK:
                    msg = e.player.getName() + " checked"
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = "CHECKED";
                    break;

                case BetType.FOLD:
                    msg = e.player.getName() + " folded";
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = "FOLDED";
                    document.querySelector("[name=" + e.player.getName() + "]").className += " folded";
                    break;

                default:
                    msg = e.player.getName() + " made an unrecognised action";
                    break;
            }

            console.log(msg);

        } else if (e instanceof PotChangeEvent) {

            updatePot(e.pots);

        } else if (e instanceof DealtFlopEvent) {

            for (var card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }
            console.log("Flop dealt")
            resetBetting();

        } else if (e instanceof DealtTurnEvent) {

            for (var card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }
            console.log("Turn dealt")
            resetBetting();

        } else if (e instanceof DealtRiverEvent) {

            for (var card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }
            console.log("River dealt")
            resetBetting();

        } else if (e instanceof GameEndEvent) {

            if (e.result) {
                Object.keys(e.result).forEach(function (key, i) {
                    if (e.result[key].player === player.getName()) {
                        return;
                    }
                    var ele = document.querySelector("[name=" + e.result[key].player + "]");
                    for (var card of e.result[key].cards) {
                        ele.appendChild(card.getImage());
                    }
                    let score = document.createElement("div");
                    score.textContent = e.result[key].score;
                    ele.appendChild(score);
                });
            }
        }
    }

    return {
        dispatchEvent: dispatchEvent
    }

}