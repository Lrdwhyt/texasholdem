import { UserController } from "./UserController";
import { Player } from "./Player";
import { Bet, BetType } from "./Bet";
import { Betting } from "./betting";
import { Pot } from "./Pot";

export class UserView {
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

        if (money > 0) {
            this.enableBetButton(foldButton);
        }

        if (amountToCall > 0 && money > 0) {
            this.enableBetButton(callButton);
            if (money >= amountToCall) {
                callButton.textContent = "Call (-" + amountToCall + ")";
            } else {
                callButton.textContent = "Call (-" + money + ")";
            }
        } else {
            if (money > 0) {
                this.enableBetButton(checkButton);
            }
            callButton.textContent = "Call";
        }

        if (money > 0 && (canRaise === true || money <= amountToCall)) {
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