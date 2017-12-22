import { Controller } from "./UserController";
import { Card } from "./Card";

export class Player {
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