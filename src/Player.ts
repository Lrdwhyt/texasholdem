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
    currentBet: number;
    amountCommitted: number;
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
        if (this.isTurnToBet === false) {
            let bettingButtons = document.getElementsByClassName("prebet");
            for (let i = 0; i < bettingButtons.length; ++i) {
                bettingButtons[i].classList.remove("prebet");
            }
            if (this.hasQueuedBet === false || this.queuedBet.type !== bet.type) {
                switch (bet.type) {
                    case BetType.Raise:
                        document.getElementById("raise").classList.add("prebet");
                        break;

                    case BetType.Check:
                        document.getElementById("check").classList.add("prebet");
                        break;

                    case BetType.AllIn:
                        document.getElementById("all-in").classList.add("prebet");
                        break;

                    case BetType.Call:
                        document.getElementById("call").classList.add("prebet");
                        break;

                    case BetType.Fold:
                        document.getElementById("fold").classList.add("prebet");
                        break;
                }
                this.hasQueuedBet = true;
                this.queuedBet = bet;
            } else if (this.queuedBet.type === bet.type) {
                this.hasQueuedBet = false;
            }
            return;
        } else {
            let bettingButtons = document.getElementsByClassName("prebet");
            for (let i = 0; i < bettingButtons.length; ++i) {
                bettingButtons[i].classList.remove("prebet");
            }
        }

        if (bet.type === BetType.AllIn) {
            if (this.player.getMoney() <= this.amountToCall) {
                bet = new Bet(BetType.Call);
            } else {
                bet = new Bet(BetType.Raise, this.player.getMoney());
            }
        }

        this.hasQueuedBet = false;

        if (Betting.isValidBet(this.player, bet, this.amountToCall, this.canRaise, this.minRaise)) {
            this.isTurnToBet = false;
            if (bet.type === BetType.Fold) {
                this.view.disableBetting();
            }
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
            this.currentBet = 0;
            this.minRaise = 0;
            this.amountCommitted = 0;
            this.amountToCall = 0;
            this.view.fillBetAmount2(0);

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
                this.currentBet = e.current;
                this.amountCommitted = e.committed;
                this.view.disableBetting();
                this.view.restrictToValid(this.amountToCall, e.canRaise, e.minRaise, this.player.getMoney());
                this.isTurnToBet = true;
                if (this.hasQueuedBet === true) {
                    this.placeBet(this.queuedBet);
                }
            } else {
                this.currentBet = e.current;
                this.amountToCall = this.currentBet - this.amountCommitted;
                this.canRaise = e.canRaise;
                this.minRaise = e.minRaise;
                this.view.disableBetting();
                this.view.restrictToValid(this.amountToCall, e.canRaise, e.minRaise, this.player.getMoney());
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
            this.view.resetBettingUI();
            this.view.restrictToValid(this.amountToCall, this.canRaise, this.minRaise, this.player.getMoney());

        } else if (e instanceof DealtTurnEvent) {

            for (let card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }
            console.log("Turn dealt");
            this.hasQueuedBet = false;
            this.view.resetBetting();
            this.view.resetBettingUI();
            this.view.restrictToValid(this.amountToCall, this.canRaise, this.minRaise, this.player.getMoney());

        } else if (e instanceof DealtRiverEvent) {

            for (let card of e.cards) {
                document.getElementById("board").appendChild(card.getImage());
            }
            console.log("River dealt");
            this.hasQueuedBet = false;
            this.view.resetBetting();
            this.view.resetBettingUI();
            this.view.restrictToValid(this.amountToCall, this.canRaise, this.minRaise, this.player.getMoney());

        } else if (e instanceof GameEndEvent) {
            this.view.resetBettingUI();
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

    increaseBet(amount: number): number {
        let result = Math.floor(amount + this.minRaise / 2);
        if (result > this.player.getMoney()) {
            result = this.player.getMoney();
        }
        return result;
    }

    decreaseBet(amount: number): number {
        let result = Math.floor(amount - this.minRaise / 2);
        if (result < this.amountToCall + this.minRaise) {
            result = this.amountToCall + this.minRaise;
        }
        return result;
    }

    constrainBetAmount(amount: number): number {
        let result: number = amount;
        if (result < this.amountToCall + this.minRaise) {
            result = this.amountToCall + this.minRaise;
        }
        if (result > this.player.getMoney()) {
            result = this.player.getMoney();
        }
        return result;
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
        document.getElementById("raise").addEventListener("click", () => {
            let amount = parseInt((<HTMLInputElement>document.getElementById("bet")).value);
            this.controller.placeBet(new Bet(BetType.Raise, amount));
        });
        document.getElementById("call").addEventListener("click", () => {
            this.controller.placeBet(new Bet(BetType.Call));
        });
        document.getElementById("check").addEventListener("click", () => {
            this.controller.placeBet(new Bet(BetType.Check));
        });
        document.getElementById("fold").addEventListener("click", () => {
            this.controller.placeBet(new Bet(BetType.Fold));
        });
        document.getElementById("all-in").addEventListener("click", () => {
            this.controller.placeBet(new Bet(BetType.AllIn));
        });
        document.getElementById("increase-bet").addEventListener("click", () => {
            let betInput: HTMLInputElement = <HTMLInputElement>document.getElementById("bet");
            betInput.value = String(this.controller.increaseBet(parseInt(betInput.value)));
        });
        document.getElementById("decrease-bet").addEventListener("click", () => {
            let betInput: HTMLInputElement = <HTMLInputElement>document.getElementById("bet");
            betInput.value = String(this.controller.decreaseBet(parseInt(betInput.value)));
        });
    }

    disableBetting(): void {
        let bettingButtons: HTMLCollectionOf<HTMLButtonElement> = <HTMLCollectionOf<HTMLButtonElement>>document.getElementsByClassName("bet-control");
        for (let i = 0; i < bettingButtons.length; ++i) {
            this.disableBetButton(bettingButtons[i]);
        }
    }

    resetBettingUI(): void {
        let bettingButtons: HTMLCollectionOf<HTMLButtonElement> = <HTMLCollectionOf<HTMLButtonElement>>document.getElementsByClassName("bet-control");
        for (let i = 0; i < bettingButtons.length; ++i) {
            bettingButtons[i].classList.remove("prebet");
            //this.disableBetButton(bettingButtons[i]);
        }
        this.disableBetting();
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

    enableBetButton(button: HTMLButtonElement) {
        button.disabled = false;
        button.classList.remove("invalid-bet");
    }

    disableBetButton(button: HTMLButtonElement) {
        button.disabled = true;
        button.classList.add("invalid-bet");
    }

    fillBetAmount2(amount: number) {
        let betInput: HTMLInputElement = <HTMLInputElement>document.getElementById("bet");
        let betAmount: number = amount;
        betInput.value = String(this.controller.constrainBetAmount(betAmount));
    }

    fillBetAmount() {
        let betInput: HTMLInputElement = <HTMLInputElement>document.getElementById("bet");
        let betAmount: number = parseInt(betInput.value);
        if (!(betAmount > 0)) {
            betAmount = 0;
        }
        betInput.value = String(this.controller.constrainBetAmount(betAmount));
    }

    restrictToValid(amountToCall: number, canRaise: boolean, minRaise: number, money: number): void {
        let allInButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("all-in");
        let foldButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("fold");
        let checkButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("check");
        let callButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("call");
        let raiseButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("raise");

        this.fillBetAmount();

        this.enableBetButton(allInButton);
        this.enableBetButton(foldButton);

        if (amountToCall > 0) {
            this.enableBetButton(callButton);
            if (money >= amountToCall) {
                callButton.textContent = "Call (-" + amountToCall + ")";
            } else {
                callButton.textContent = "Call (-" + money + ")";
            }
        } else {
            this.enableBetButton(checkButton);
            callButton.textContent = "Call";
        }

        if (canRaise === true || money <= amountToCall) {
            this.enableBetButton(allInButton);
        }

        if (canRaise === true && money > amountToCall) {
            this.enableBetButton(raiseButton);
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