export class Suit {
    static Spades = new Suit("Spades");
    static Hearts = new Suit("Hearts");
    static Diamonds = new Suit("Diamonds");
    static Clubs = new Suit("Clubs");

    private readonly val: string;

    constructor(suit: string) {
        this.val = suit;
    }

    public toString(): string {
        return this.val;
    }

    public getShorthand(): string {
        return this.val.charAt(0);
    }

    public getSymbol(): string {
        switch (this.val) {
            case "S":
                return "♠";

            case "H":
                return "♥";

            case "D":
                return "♦";

            case "C":
                return "♣";
        }
    }
}