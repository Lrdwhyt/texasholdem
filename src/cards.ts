enum HandCombinations {
    HighCard,
    OnePair,
    TwoPair,
    ThreeOfAKind,
    Straight,
    Flush,
    FullHouse,
    FourOfAKind,
    StraightFlush
}

enum Suit {
    Spades = "S",
    Hearts = "H",
    Diamonds = "D",
    Clubs = "C"
}

class Rank {
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

    private val: number;

    constructor(val) {
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
        switch(this.val) {
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


class Card {
    public rank: Rank;
    public suit: Suit;

    constructor(rank: Rank, suit: Suit) {
        this.rank = rank;
        this.suit = suit;
    }

    equals(that): boolean {
        return (this.rank === that.rank && this.suit === that.suit);
    }

    getImage(): HTMLElement {
        let img = document.createElement("img");
        img.src = "img/cards/" + this.rank.toString() + this.suit + ".png";
        img.alt = this.toString();
        img.className = "card";
        return img;
    }

    toString(): string {
        return this.rank.toString() + this.suit;
    }

}

class Deck {
    private cards: Card[];

    constructor() {
        this.cards = [];
        for (let suit of [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs]) {
            for (let rank of [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace]) {
                this.cards.push(new Card(rank, suit));
            }
        }
    }

    shuffle(): void {
        for (let i = this.cards.length - 1; i > 0; --i) {
            let j = Math.floor(Math.random() * (i + 1));
            let ele = this.cards[i];
            this.cards[i] = this.cards[j];
            this.cards[j] = ele;
        }
    };

    deal(): Card {
        return this.cards.pop();
    };

    pop(): void {
        this.cards.pop();
    };

    getCards(): Card[] {
        return this.cards;
    };

}

var Hands = (function () {

    var difference = function (set, subset) {
        let result = set.slice(0);
        for (let item of subset) {
            result.splice(result.indexOf(item), 1);
        }
        return result;
    }

    var sort = function (cards, isAceLow?: boolean) {
        let results = cards.slice(0);
        if (isAceLow) {
            results.sort(function (a, b) {
                return a.rank.valueAceLow() - b.rank.valueAceLow();
            });
        } else {
            results.sort(function (a, b) {
                return a.rank.value() - b.rank.value();
            });
        }
        return results;
    }

    var getHighestCard = function (cards) {
        return sort(cards)[cards.length - 1];
    }

    var getNHighestCards = function (cards, n: number) {
        let sorted = sort(cards);
        let result = [];
        while (result.length < n) {
            result.push(sorted.pop());
        }
        return result;
    }

    var sortBySuit = function (cards) {
        let results = cards.slice(0);
        results.sort(function (a, b) {
            if (a.suit > b.suit) {
                return 1;
            } else {
                return -1;
            }
        });
        return results;
    }

    var groupByRank = function (cards) {
        let results = [];
        let sorted = sort(cards);
        let currentIndex: number = 0;
        for (let i in sorted) {
            if (results[currentIndex] === undefined) {
                results[currentIndex] = [];
                results[currentIndex].push(sorted[i]);
            } else {
                if (results[currentIndex][0].rank === sorted[i].rank) {
                    results[currentIndex].push(sorted[i]);
                } else {
                    results[++currentIndex] = [sorted[i]];
                }
            }
        }
        results.sort(function (a, b) {
            return b.length - a.length;
        });
        return results;
    }

    var groupBySuit = function (cards) {
        let results = [];
        cards = sortBySuit(cards);
        let currentIndex: number = 0;
        for (let i in cards) {
            if (results[currentIndex] === undefined) {
                results[currentIndex] = [];
                results[currentIndex].push(cards[i]);
            } else {
                if (results[currentIndex][0].suit === cards[i].suit) {
                    results[currentIndex].push(cards[i]);
                } else {
                    ++currentIndex;
                    results[currentIndex] = [cards[i]];
                }
            }
        }
        results.sort(function (a, b) {
            return b.length - a.length;
        });
        return results;
    }

    var getScore = function (cards): number {
        let score: number = 0;
        for (let i = 0; i < cards.length; ++i) {
            score += cards[i].rank.value() * Math.pow(14, cards.length - i - 1);
        }
        return score;
    }

    var longestSequence = function (cards) { //longest sequence of cards (including A low/high) with 5+ cards
        let sorted = sort(cards);
        let hand = [];
        let currentRank;

        for (let card of sorted) {
            if (currentRank === undefined || currentRank === null) {
                currentRank = card.rank.value();
                hand.push(card);
            } else {
                if (card.rank.value() === currentRank) {
                    continue;
                } else if (card.rank.value() === currentRank + 1) {
                    currentRank = card.rank.value();
                    hand.push(card);
                } else {
                    if (hand.length >= 5) {
                        return hand;
                    } else {
                        currentRank = card.rank.value();
                        hand = [card];
                    }
                }
            }
        }
        if (hand.length >= 5) {
            // Consistency - don't want to return sequences of <5 cards
            return hand;
        }
        hand = [];
        sorted = sort(cards, true);
        currentRank = null;
        for (let card of sorted) {
            if (currentRank === undefined || currentRank === null) {
                currentRank = card.rank.valueAceLow();
                hand.push(card);
            } else {
                if (card.rank.valueAceLow() === currentRank) {
                    continue;
                } else if (card.rank.valueAceLow() === currentRank + 1) {
                    currentRank = card.rank.valueAceLow();
                    hand.push(card);
                } else {
                    if (hand.length >= 5) {
                        return hand;
                    } else {
                        currentRank = card.rank.valueAceLow();
                        hand = [card];
                    }
                }
            }
        }
        if (hand.length >= 5) {
            // Consistency - don't want to return sequences of <5 sorted
            return hand;
        } else {
            return [];
        }
    }

    var bestHand = function (cards) {
        let hand: Card[] = [];
        let score: number;

        let mostCommonSuits = groupBySuit(cards);
        let largestSuit = mostCommonSuits[0];
        let mostCommonRanks = groupByRank(cards);
        let longestStraight = longestSequence(cards);

        if (largestSuit.length >= 5) { // Straight flush
            let ls = longestSequence(mostCommonSuits[0]);
            if (ls.length >= 5) {
                let highestCard = getHighestCard(ls);
                let secondHighestCard = getHighestCard(difference(ls, [highestCard]));
                if (highestCard.rank === "A" && secondHighestCard.rank != "K") {
                    ls = sort(ls, true);
                    hand = ls.slice(-5);
                    score = 8 * Math.pow(14, 5) + secondHighestCard.rank.value();
                } else {
                    hand = getNHighestCards(ls, 5);
                    score = 8 * Math.pow(14, 5) + highestCard.rank.value();
                }
                return {
                    hand: hand,
                    score: score,
                    type: HandCombinations.StraightFlush
                };
            }
        }

        if (mostCommonRanks[0].length === 4) { // Four of a kind
            let quad = mostCommonRanks[0];
            let kicker = getNHighestCards(difference(cards, quad), 1);
            hand = quad.concat(kicker);
            score = 7 * Math.pow(14, 5) + quad[0].rank.value() * 14 + kicker[0].rank.value();
            return {
                hand: hand,
                score: score,
                type: HandCombinations.FourOfAKind
            };
        } else if (mostCommonRanks[0].length === 3 && mostCommonRanks[1].length >= 2) { // Full house
            let triple = mostCommonRanks[0];
            let pair;
            if (mostCommonRanks[2].length === 2 && mostCommonRanks[2][0].rank.value() > mostCommonRanks[1][0].rank.value()) {
                pair = mostCommonRanks[2];
            } else {
                pair = mostCommonRanks[1].slice(0, 2);
            }
            hand = triple.concat(pair);
            score = 6 * Math.pow(14, 5) + triple[0].rank.value() * 14 + pair[0].rank.value();
            return {
                hand: hand,
                score: score,
                type: HandCombinations.FullHouse
            };
        } else if (largestSuit.length >= 5) { // Flush
            hand = getNHighestCards(largestSuit, 5);
            score = 5 * Math.pow(14, 5) + getScore(hand);
            return {
                hand: hand,
                score: score,
                type: HandCombinations.Flush
            };
        } else if (longestStraight.length >= 5) { // Straight
            let highestCard = getHighestCard(longestStraight);
            let secondHighestCard = getHighestCard(difference(longestStraight, [highestCard]));
            if (highestCard.rank === "A" && secondHighestCard.rank != "K") {
                longestStraight = sort(longestStraight, true);
                hand = longestStraight.slice(-5);
                score = 4 * Math.pow(14, 5) + secondHighestCard.rank.value();
            } else {
                hand = getNHighestCards(longestStraight, 5);
                score = 4 * Math.pow(14, 5) + highestCard.rank.value();
            }
            return {
                hand: hand,
                score: score,
                type: HandCombinations.Straight
            };
        } else if (mostCommonRanks[0].length === 3) { // Three of a kind
            let triple = mostCommonRanks[0];
            let kickers = getNHighestCards(difference(cards, triple), 2);
            hand = triple.concat(kickers);
            score = 3 * Math.pow(14, 5) + triple[0].rank.value() * Math.pow(14, 3) + getScore(kickers);
            return {
                hand: hand,
                score: score,
                type: HandCombinations.ThreeOfAKind
            };
        } else if (mostCommonRanks[0].length === 2 && mostCommonRanks[1].length === 2) { // Two pair
            let highPair;
            let lowPair;
            if (mostCommonRanks[2].length === 2) {
                // Check which 2 pairs are highest
                if (mostCommonRanks[2][0].rank.value() > mostCommonRanks[1][0].rank.value()) {
                    highPair = mostCommonRanks[2];
                }
                lowPair = mostCommonRanks[1];
            } else {
                highPair = mostCommonRanks[1];
                lowPair = mostCommonRanks[0];
            }
            hand = highPair.concat(lowPair);
            let remainder = difference(cards, hand);
            let kicker = getHighestCard(remainder)
            hand.push(kicker);
            score = 2 * Math.pow(14, 5) + highPair[0].rank.value() * Math.pow(14, 2) + lowPair[0].rank.value() * Math.pow(14, 1) + kicker.rank.value();
            return {
                hand: hand,
                score: score,
                type: HandCombinations.TwoPair
            };
        } else if (mostCommonRanks[0].length === 2) { // One pair
            let pair = mostCommonRanks[0];
            let kickers = getNHighestCards(difference(cards, pair), 3);
            hand = pair.concat(kickers);
            score = Math.pow(14, 5) + pair[0].rank.value() * Math.pow(14, 3) + getScore(kickers);
            return {
                hand: hand,
                score: score,
                type: HandCombinations.OnePair
            };
        } else { // High card
            hand = getNHighestCards(cards, 5);
            score = getScore(hand);
            return {
                hand: hand,
                score: score,
                type: HandCombinations.HighCard
            };
        }

    }

    return {
        bestHand: bestHand,
        getScore: getScore,
        difference: difference
    };

})();