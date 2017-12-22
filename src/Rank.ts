export class Rank {
    static Two = new Rank(2);
    static Three = new Rank(3);
    static Four = new Rank(4);
    static Five = new Rank(5);
    static Six = new Rank(6);
    static Seven = new Rank(7);
    static Eight = new Rank(8);
    static Nine = new Rank(9);
    static Ten = new Rank(10);
    static Jack = new Rank(11);
    static Queen = new Rank(12);
    static King = new Rank(13);
    static Ace = new Rank(1);

    private readonly val: number;

    constructor(val: number) {
        this.val = val;
    }

    public value(): number {
        if (this.val === 1) {
            return 13;
        } else {
            return this.val - 1;
        }

    }

    public valueAceLow(): number {
        return this.val;
    }

    public toString(): string {
        switch (this.val) {
            case 1:
                return "A";

            case 13:
                return "K";

            case 12:
                return "Q";

            case 11:
                return "J";

            default:
                return this.val.toString();
        }
    }
}