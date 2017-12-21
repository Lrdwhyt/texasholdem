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
    canRaise: boolean;
    minRaise: number;
    hasQueuedBet: boolean;
    isTurnToBet: boolean;
    queuedBet: Bet;
    view: UserView;

    constructor(player: Player, root: HTMLElement) {
        this.player = player;
        this.view = new UserView(root, this);
    }

    placeBet(bet: Bet) {
        if (bet.type === BetType.AllIn) {
            if (this.player.getMoney() <= this.amountToCall) {
                bet = new Bet(BetType.Call);
            } else {
                bet = new Bet(BetType.Raise, this.player.getMoney());
            }
        }
        if (this.isTurnToBet === false) {
            this.hasQueuedBet = true;
            this.queuedBet = bet;
        }
        
        if (Betting.isValidBet(this.player, bet, this.amountToCall, this.canRaise, this.minRaise)) {
            // this.view.disableBetting();
            this.isTurnToBet = false;
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
            if (index !== -1) {
                otherPlayers.splice(index, 1);
                this.view.drawUser(this.player);
            } else {
                document.getElementById("bet-controls").innerHTML = "";
            }
            this.view.drawBoard(otherPlayers);
            this.hasQueuedBet = false;

        } else if (e instanceof PlayerMoneyChangeEvent) {
            this.view.updatePlayerMoney(e.player.getName(), e.player.getMoney());
            console.log("[GameEvent] " + e.player.getName() + " money changed: " + e.change);

        } else if (e instanceof DealtHandEvent) {

            for (let card of e.hand) {
                document.getElementById("user-cards").appendChild(card.getImage());
            }

        } else if (e instanceof BetAwaitEvent) {

            this.view.updateTurn(e.player.getName());

            if (e.player === this.player) {
                console.log("Your turn!");
                this.callbackFunction = e.callback;
                this.amountToCall = e.current - e.committed;
                this.canRaise = e.canRaise;
                this.minRaise = e.minRaise;
                this.view.restrictToValid(e.current, e.committed, e.canRaise, e.minRaise, this.player.getMoney());
                if (this.hasQueuedBet === true && Betting.isValidBet(this.player, this.queuedBet, this.amountToCall, this.canRaise, this.minRaise) === true) {
                    this.placeBet(this.queuedBet);
                } else {
                    this.isTurnToBet = true;
                }
            }

        } else if (e instanceof BetMadeEvent) {

            this.view.updateTurnRemove(e.player.getName());
            let msg: string = "[GameBetting] ";

            switch (e.bet.type) {
                case BetType.Raise:
                    msg += e.player.getName() + " bet " + e.bet.amount;
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = " bet $" + e.bet.amount;
                    break;

                case BetType.Call:
                    msg += e.player.getName() + " called"
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = " called";
                    break;

                case BetType.Check:
                    msg += e.player.getName() + " checked"
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = " checked";
                    break;

                case BetType.Fold:
                    msg += e.player.getName() + " folded";
                    document.querySelector("[name=" + e.player.getName() + "] .text").textContent = " folded";
                    document.querySelector("[name=" + e.player.getName() + "]").className += " folded";
                    break;

                default:
                    msg += e.player.getName() + " made an unrecognised action";
                    break;
            }

            console.log(msg);

        } else if (e instanceof PotChangeEvent) {

            this.view.updatePot(e.pots);

        } else if (e instanceof DealtFlopEvent) {

            for (let card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }
            console.log("Flop dealt");
            this.hasQueuedBet = false;
            this.view.resetBetting();

        } else if (e instanceof DealtTurnEvent) {

            for (let card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }
            console.log("Turn dealt");
            this.hasQueuedBet = false;
            this.view.resetBetting();

        } else if (e instanceof DealtRiverEvent) {

            for (let card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }
            console.log("River dealt");
            this.hasQueuedBet = false;
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
                Object.keys(e.result).forEach((key) => {
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

    init(): void {
        this.root.querySelector("#raise").addEventListener("click", () => {
            let amount = parseInt((<HTMLInputElement>document.getElementById("bet")).value);
            this.controller.placeBet(new Bet(BetType.Raise, amount));
        });
        this.root.querySelector("#call").addEventListener("click", () => {
            this.controller.placeBet(new Bet(BetType.Call));
        });
        this.root.querySelector("#check").addEventListener("click", () => {
            this.controller.placeBet(new Bet(BetType.Check));
        });
        this.root.querySelector("#fold").addEventListener("click", () => {
            this.controller.placeBet(new Bet(BetType.Fold));
        });
        this.root.querySelector("#all-in").addEventListener("click", () => {
            this.controller.placeBet(new Bet(BetType.AllIn));
        });
    }

    disableBetting(): void {
        (<HTMLButtonElement>document.getElementById("raise")).disabled = true;
        (<HTMLButtonElement>document.getElementById("call")).disabled = true;
        (<HTMLButtonElement>document.getElementById("all-in")).disabled = true;
        (<HTMLButtonElement>document.getElementById("check")).disabled = true;
        (<HTMLButtonElement>document.getElementById("fold")).disabled = true;
    }

    notifyInvalidBet() {
        alert("Invalid bet!");
    }

    resetUI(): void {
        document.getElementById("user-info").innerHTML = "";
        document.getElementById("user-cards").innerHTML = "";
        document.getElementById("board").innerHTML = "";
        document.getElementById("players-left").innerHTML = "";
        document.getElementById("players-top").innerHTML = "";
        document.getElementById("players-right").innerHTML = "";
    }

    resetBetting(): void {
        let texts = document.querySelectorAll(".text")
        for (let i = 0; i < texts.length; ++i) {
            texts[i].innerHTML = "";
        };
    }

    drawPlayer(player: Player): HTMLDivElement {
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
        let timeBar = document.createElement("div");
        timeBar.className = "timebar";

        playerRoot.appendChild(cards);
        playerInfo.appendChild(name);
        playerInfo.appendChild(text);
        playerInfo.appendChild(money);
        playerInfo.appendChild(timeBar);
        playerRoot.appendChild(playerInfo);
        return playerRoot;
    }

    drawUser(player: Player): void {
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
        let timeBar = document.createElement("div");
        timeBar.className = "timebar";

        playerInfo.appendChild(name);
        playerInfo.appendChild(text);
        playerInfo.appendChild(money);
        playerInfo.appendChild(timeBar);
        playerRoot.appendChild(playerInfo);
        document.getElementById("user-info").appendChild(playerRoot);
    }

    drawBoard(players: Player[]): void {
        let otherPlayers = players.slice(0);
        let leftColumn: HTMLElement = document.getElementById("players-left");
        let centerColumn: HTMLElement = document.getElementById("players-top");
        let rightColumn: HTMLElement = document.getElementById("players-right");

        switch (otherPlayers.length) {
            case 1:
                centerColumn.appendChild(this.drawPlayer(otherPlayers[0]));
                break;

            case 2:
                leftColumn.appendChild(this.drawPlayer(otherPlayers[0]));
                rightColumn.appendChild(this.drawPlayer(otherPlayers[1]));
                break;

            case 3:
                leftColumn.appendChild(this.drawPlayer(otherPlayers[0]));
                centerColumn.appendChild(this.drawPlayer(otherPlayers[1]));
                rightColumn.appendChild(this.drawPlayer(otherPlayers[2]));
                break;

            case 4:
                leftColumn.appendChild(this.drawPlayer(otherPlayers[0]));
                centerColumn.appendChild(this.drawPlayer(otherPlayers[1]));
                centerColumn.appendChild(this.drawPlayer(otherPlayers[2]));
                rightColumn.appendChild(this.drawPlayer(otherPlayers[3]));
                break;

            case 5:
                leftColumn.appendChild(this.drawPlayer(otherPlayers[1]));
                leftColumn.appendChild(this.drawPlayer(otherPlayers[0]));
                centerColumn.appendChild(this.drawPlayer(otherPlayers[2]));
                rightColumn.appendChild(this.drawPlayer(otherPlayers[3]));
                rightColumn.appendChild(this.drawPlayer(otherPlayers[4]));
                break;

            case 6:
                leftColumn.appendChild(this.drawPlayer(otherPlayers[1]));
                leftColumn.appendChild(this.drawPlayer(otherPlayers[0]));
                centerColumn.appendChild(this.drawPlayer(otherPlayers[2]));
                centerColumn.appendChild(this.drawPlayer(otherPlayers[3]));
                rightColumn.appendChild(this.drawPlayer(otherPlayers[4]));
                rightColumn.appendChild(this.drawPlayer(otherPlayers[5]));
                break;

            case 7:
                leftColumn.appendChild(this.drawPlayer(otherPlayers[2]));
                leftColumn.appendChild(this.drawPlayer(otherPlayers[1]));
                leftColumn.appendChild(this.drawPlayer(otherPlayers[0]));
                centerColumn.appendChild(this.drawPlayer(otherPlayers[3]));
                rightColumn.appendChild(this.drawPlayer(otherPlayers[4]));
                rightColumn.appendChild(this.drawPlayer(otherPlayers[5]));
                rightColumn.appendChild(this.drawPlayer(otherPlayers[6]));
                break;

            case 8:
                leftColumn.appendChild(this.drawPlayer(otherPlayers[2]));
                leftColumn.appendChild(this.drawPlayer(otherPlayers[1]));
                leftColumn.appendChild(this.drawPlayer(otherPlayers[0]));
                centerColumn.appendChild(this.drawPlayer(otherPlayers[3]));
                centerColumn.appendChild(this.drawPlayer(otherPlayers[4]));
                rightColumn.appendChild(this.drawPlayer(otherPlayers[5]));
                rightColumn.appendChild(this.drawPlayer(otherPlayers[6]));
                rightColumn.appendChild(this.drawPlayer(otherPlayers[7]));
                break;
        }
    }

    updatePot(pots: Pot[]): void {
        let potElement: HTMLElement | null = document.getElementById("pots");
        if (pots.length === 1 || pots[1].size() === 0) { // Only main pot
            potElement.textContent = "Pot: $" + pots[0].size();
        } else {
            for (let index in pots) {
                if (index === "0") {
                    potElement.textContent = "Main pot: $" + pots[index].size();
                } else if (pots[index].players.length > 1) {
                    potElement.textContent += ", side pot " + index + ": $" + pots[index].size();
                }
            }
        }
    }

    restrictToValid(current: number, committed: number, canRaise: boolean, minRaise: number, money: number): void {
        (<HTMLInputElement>document.getElementById("bet")).value = String(current - committed + minRaise);
        (<HTMLButtonElement>document.getElementById("all-in")).disabled = false;
        (<HTMLButtonElement>document.getElementById("fold")).disabled = false;

        let amountToCall = current - committed;

        if (current - committed > 0) {
            (<HTMLButtonElement>document.getElementById("call")).disabled = false;
            (<HTMLButtonElement>document.getElementById("check")).disabled = true;
            if (money >= current - committed) {
                document.getElementById("call").textContent = "Call (-" + amountToCall + ")";
            } else {
                document.getElementById("call").textContent = "Call (-" + money + ")";
            }
        } else {
            (<HTMLButtonElement>document.getElementById("call")).disabled = true;
            (<HTMLButtonElement>document.getElementById("check")).disabled = false;
            document.getElementById("call").textContent = "Call";
        }

        if (canRaise === false && money > amountToCall) {
            (<HTMLButtonElement>document.getElementById("all-in")).disabled = true;
        }

        if (canRaise === true && money > amountToCall) {
            (<HTMLButtonElement>document.getElementById("raise")).disabled = false;
        } else {
            (<HTMLButtonElement>document.getElementById("raise")).disabled = true;
        }
    }

    updatePlayerMoney(playerName: string, amount: number): void {
        document.querySelector("[name=" + playerName + "]").getElementsByClassName("money")[0].textContent = "$" + String(amount);
    }

    updateTurnRemove(playerName: string): void {
        document.querySelector("[name=" + playerName + "]").classList.remove("awaiting");
    }

    updateTurn(playerName: string): void {
        let awaitingPlayers = document.getElementsByClassName("awaiting");
        for (let i = 0; i < awaitingPlayers.length; ++i) {
            awaitingPlayers[i].classList.remove("awaiting");
        }
        let playerBlock: HTMLDivElement = document.querySelector("[name=" + playerName + "]");
        playerBlock.classList.add("awaiting");
        playerBlock.querySelector(".text").innerHTML = "";
    }

}