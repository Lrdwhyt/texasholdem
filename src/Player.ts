class Player {
    private name: string;
    private money: number;
    private hand: Card[];
    private controller: Controller;

    constructor(name: string, money: number) {
        this.name = name;
        this.money = money;
        this.hand = [];
    }

    getName(): string {
        return this.name;
    }

    getHand(): Card[] {
        return this.hand;
    }

    resetHand(): void {
        this.hand = [];
    }

    getMoney(): number {
        return this.money;
    }

    modMoney(amount: number): void {
        this.money += amount;
    }

    setController(newController: Controller) {
        this.controller = newController;
    }

    getController(): Controller {
        return this.controller;
    }

    deal(card: Card): void {
        this.hand.push(card);
    }
}

interface Controller {
    dispatchEvent(e: GameEvent): void;
}

class UserController implements Controller {
    callbackFunction: (player: Player, bet: Bet) => void;
    player: Player;
    root: HTMLElement;
    amountToCall: number;
    minRaise: number;
    view: UserView;

    constructor(player: Player, root: HTMLElement) {
        this.player = player;
        this.view = new UserView(root, this);
    }

    placeBet(bet: Bet) {
        if (bet.type === BetType.ALL_IN) {
            if (this.player.getMoney() <= this.amountToCall) {
                bet = new Bet(BetType.CALL);
            } else {
                bet = new Bet(BetType.RAISE, this.player.getMoney());
            }
        }
        if (Betting.isValidBet(this.player, bet, this.amountToCall, this.minRaise)) {
            this.view.disableBetting();
            this.callbackFunction(this.player, bet);
        } else {
            this.view.notifyInvalidBet();
        }
    }

    dispatchEvent(e: GameEvent): void {

        if (e instanceof GameStartEvent) {
            console.log("Game started");
            this.view.resetUI();
            let otherPlayers = e.players.slice(0);
            let index = otherPlayers.indexOf(this.player);
            otherPlayers.splice(index, 1);
            this.view.drawUser(this.player);
            this.view.drawBoard(otherPlayers);

        } else if (e instanceof PlayerMoneyChangeEvent) {
            document.querySelector("[name=" + e.player.getName() + "] .money").textContent = "$" + e.player.getMoney().toString();
            console.log(e.player.getName() + " money changed: " + e.change);

        } else if (e instanceof DealtHandEvent) {

            for (let card of e.hand) {
                document.getElementById("user-cards").appendChild(card.getImage());
            }

        } else if (e instanceof BetAwaitEvent) {

            if (e.player === this.player) {
                console.log("Your turn!");
                this.callbackFunction = e.callback;
                this.amountToCall = e.current - e.committed;
                this.minRaise = e.minRaise;
                this.view.restrictToValid(e.current, e.committed, e.minRaise, this.player.getMoney());
            }

        } else if (e instanceof BetMadeEvent) {

            let msg = "";

            switch (e.bet.type) {
                case BetType.RAISE:
                    msg = e.player.getName() + " raised to " + e.bet.amount;
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = " bet $" + e.bet.amount;
                    break;

                case BetType.CALL:
                    msg = e.player.getName() + " called"
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = " called";
                    break;

                case BetType.CHECK:
                    msg = e.player.getName() + " checked"
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = " checked";
                    break;

                case BetType.FOLD:
                    msg = e.player.getName() + " folded";
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = " folded";
                    document.querySelector("[name=" + e.player.getName() + "]").className += " folded";
                    break;

                default:
                    msg = e.player.getName() + " made an unrecognised action";
                    break;
            }

            console.log(msg);

        } else if (e instanceof PotChangeEvent) {

            this.view.updatePot(e.pots);

        } else if (e instanceof DealtFlopEvent) {

            for (let card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }
            console.log("Flop dealt")
            this.view.resetBetting();

        } else if (e instanceof DealtTurnEvent) {

            for (let card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }
            console.log("Turn dealt")
            this.view.resetBetting();

        } else if (e instanceof DealtRiverEvent) {

            for (let card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }
            console.log("River dealt")
            this.view.resetBetting();

        } else if (e instanceof GameEndEvent) {

            if (e.result) {
                for (let playerName in e.moneyChange) {
                    if (e.moneyChange[playerName] > 0) {
                        let ele = document.querySelector("[name=" + playerName + "] .money");
                        ele.textContent += " (+" + e.moneyChange[playerName] + ")";
                    } else if (e.moneyChange[playerName] < 0) {
                        let ele = document.querySelector("[name=" + playerName + "] .money");
                        ele.textContent += " (" + e.moneyChange[playerName] + ")";
                    }
                }
                Object.keys(e.result).forEach((key, i) => {
                    if (e.result[key].player === this.player.getName()) {
                        return;
                    }
                    let ele = document.querySelector("[name=" + e.result[key].player + "] .cards");
                    if (e.result[key].showdown === true) {
                        for (let card of e.result[key].cards) {
                            ele.appendChild(card.getImage());
                        }
                        console.log(e.result[key].player + ":" + e.result[key].score);
                    }
                });
            }
        }
    }

}

class UserView {
    root: HTMLElement;
    controller: UserController;

    constructor(root: HTMLElement, controller: UserController) {
        this.root = root;
        this.controller = controller;
        this.init();
    }

    init() {
        this.root.querySelector("#raise").addEventListener("click", () => {
            let amount = parseInt((<HTMLInputElement>document.getElementById("bet")).value);
            this.controller.placeBet(new Bet(BetType.RAISE, amount));
        });
        this.root.querySelector("#call").addEventListener("click", () => {
            this.controller.placeBet(new Bet(BetType.CALL));
        });
        this.root.querySelector("#check").addEventListener("click", () => {
            this.controller.placeBet(new Bet(BetType.CHECK));
        });
        this.root.querySelector("#fold").addEventListener("click", () => {
            this.controller.placeBet(new Bet(BetType.FOLD));
        });
        this.root.querySelector("#all-in").addEventListener("click", () => {
            this.controller.placeBet(new Bet(BetType.ALL_IN));
        });
    }

    disableBetting() {
        (<HTMLButtonElement>document.getElementById("raise")).disabled = true;
        (<HTMLButtonElement>document.getElementById("call")).disabled = true;
        (<HTMLButtonElement>document.getElementById("all-in")).disabled = true;
        (<HTMLButtonElement>document.getElementById("check")).disabled = true;
        (<HTMLButtonElement>document.getElementById("fold")).disabled = true;
    }

    notifyInvalidBet() {
        alert("Invalid bet!");
    }

    resetUI() {
        document.getElementById("user-info").innerHTML = "";
        document.getElementById("user-cards").innerHTML = "";
        document.getElementById("board").innerHTML = "";
        document.getElementById("players-left").innerHTML = "";
        document.getElementById("players-top").innerHTML = "";
        document.getElementById("players-right").innerHTML = "";
        let texts = document.querySelectorAll(".text")
        for (let i = 0; i < texts.length; ++i) {
            texts[i].innerHTML = "he";
        };
    }

    resetBetting() {
        let texts = document.querySelectorAll(".text")
        for (let i = 0; i < texts.length; ++i) {
            texts[i].innerHTML = "";
        };
    }

    drawPlayer(player: Player) {
        let playerRoot = document.createElement("div");
        playerRoot.setAttribute("name", player.getName());
        playerRoot.className = "player";
        let playerInfo = document.createElement("div");
        playerInfo.className = "player-info";

        let cards = document.createElement("div");
        cards.className = "cards";
        let name = document.createElement("span");
        name.className = "name";
        name.textContent = player.getName();
        let money = document.createElement("div");
        money.className = "money";
        money.textContent = player.getMoney().toString();
        let text = document.createElement("span");
        text.className = "text";
        playerRoot.appendChild(cards);
        playerInfo.appendChild(name);
        playerInfo.appendChild(text);
        playerInfo.appendChild(money);
        playerRoot.appendChild(playerInfo);
        return playerRoot;
    }

    drawUser(player: Player) {
        let playerRoot = document.createElement("div");
        playerRoot.setAttribute("name", player.getName());
        playerRoot.className = "player";
        let playerInfo = document.createElement("div");
        playerInfo.className = "player-info";

        let name = document.createElement("span");
        name.className = "name";
        name.textContent = player.getName();
        let money = document.createElement("div");
        money.className = "money";
        money.textContent = player.getMoney().toString();
        let text = document.createElement("span");
        text.className = "text";

        playerInfo.appendChild(name);
        playerInfo.appendChild(text);
        playerInfo.appendChild(money);
        playerRoot.appendChild(playerInfo);
        document.getElementById("user-info").appendChild(playerRoot);
    }

    drawBoard(players: Player[]) {
        let otherPlayers = players.slice(0);
        switch (otherPlayers.length) {
            case 1:
                document.getElementById("players-top").appendChild(this.drawPlayer(otherPlayers[0]));
                break;

            case 2:
                document.getElementById("players-left").appendChild(this.drawPlayer(otherPlayers[0]));
                document.getElementById("players-right").appendChild(this.drawPlayer(otherPlayers[1]));
                break;

            case 3:
                document.getElementById("players-left").appendChild(this.drawPlayer(otherPlayers[0]));
                document.getElementById("players-top").appendChild(this.drawPlayer(otherPlayers[1]));
                document.getElementById("players-right").appendChild(this.drawPlayer(otherPlayers[2]));
                break;

            case 4:
                document.getElementById("players-left").appendChild(this.drawPlayer(otherPlayers[0]));
                document.getElementById("players-top").appendChild(this.drawPlayer(otherPlayers[1]));
                document.getElementById("players-top").appendChild(this.drawPlayer(otherPlayers[2]));
                document.getElementById("players-right").appendChild(this.drawPlayer(otherPlayers[3]));
                break;

            case 5:
                document.getElementById("players-left").appendChild(this.drawPlayer(otherPlayers[1]));
                document.getElementById("players-left").appendChild(this.drawPlayer(otherPlayers[0]));
                document.getElementById("players-top").appendChild(this.drawPlayer(otherPlayers[2]));
                document.getElementById("players-right").appendChild(this.drawPlayer(otherPlayers[3]));
                document.getElementById("players-right").appendChild(this.drawPlayer(otherPlayers[4]));
                break;

            case 6:
                document.getElementById("players-left").appendChild(this.drawPlayer(otherPlayers[1]));
                document.getElementById("players-left").appendChild(this.drawPlayer(otherPlayers[0]));
                document.getElementById("players-top").appendChild(this.drawPlayer(otherPlayers[2]));
                document.getElementById("players-top").appendChild(this.drawPlayer(otherPlayers[3]));
                document.getElementById("players-right").appendChild(this.drawPlayer(otherPlayers[4]));
                document.getElementById("players-right").appendChild(this.drawPlayer(otherPlayers[5]));
                break;

            case 7:
                document.getElementById("players-left").appendChild(this.drawPlayer(otherPlayers[2]));
                document.getElementById("players-left").appendChild(this.drawPlayer(otherPlayers[1]));
                document.getElementById("players-left").appendChild(this.drawPlayer(otherPlayers[0]));
                document.getElementById("players-top").appendChild(this.drawPlayer(otherPlayers[3]));
                document.getElementById("players-right").appendChild(this.drawPlayer(otherPlayers[4]));
                document.getElementById("players-right").appendChild(this.drawPlayer(otherPlayers[5]));
                document.getElementById("players-right").appendChild(this.drawPlayer(otherPlayers[6]));
                break;

            case 8:
                document.getElementById("players-left").appendChild(this.drawPlayer(otherPlayers[2]));
                document.getElementById("players-left").appendChild(this.drawPlayer(otherPlayers[1]));
                document.getElementById("players-left").appendChild(this.drawPlayer(otherPlayers[0]));
                document.getElementById("players-top").appendChild(this.drawPlayer(otherPlayers[3]));
                document.getElementById("players-top").appendChild(this.drawPlayer(otherPlayers[4]));
                document.getElementById("players-right").appendChild(this.drawPlayer(otherPlayers[5]));
                document.getElementById("players-right").appendChild(this.drawPlayer(otherPlayers[6]));
                document.getElementById("players-right").appendChild(this.drawPlayer(otherPlayers[7]));
                break;
        }
    }

    updatePot(pots) {
        if (pots.length === 1 || pots[1].size() === 0) { // Only main pot
            document.getElementById("pots").textContent = "Pot: $" + pots[0].size();
        } else {
            for (let index in pots) {
                if (index === "0") {
                    document.getElementById("pots").textContent = "Main pot: $" + pots[index].size();
                } else if (pots[index].players.length > 1) {
                    document.getElementById("pots").textContent += ", side pot " + index + ": $" + pots[index].size();
                }
            }
        }
    }

    restrictToValid(current, committed, minRaise, money) {
        (<HTMLButtonElement>document.getElementById("all-in")).disabled = false;
        (<HTMLButtonElement>document.getElementById("fold")).disabled = false;

        if (current - committed > 0) {
            (<HTMLButtonElement>document.getElementById("call")).disabled = false;
            (<HTMLButtonElement>document.getElementById("check")).disabled = true;
            if (money >= current - committed) {
                document.getElementById("call").textContent = "Call (-" + (current - committed) + ")";
            } else {
                document.getElementById("call").textContent = "Call (-" + money + ")";
            }
        } else {
            (<HTMLButtonElement>document.getElementById("call")).disabled = true;
            (<HTMLButtonElement>document.getElementById("check")).disabled = false;
            document.getElementById("call").textContent = "Call";
        }

        if (minRaise + current - committed > money) {
            (<HTMLButtonElement>document.getElementById("raise")).disabled = true;
        } else {
            (<HTMLButtonElement>document.getElementById("raise")).disabled = false;
        }
    }

}