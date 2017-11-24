var HandCombinations = {
    HIGH_CARD: 0,
    ONE_PAIR: 1,
    TWO_PAIR: 2,
    THREE_OF_A_KIND: 3,
    STRAIGHT: 4,
    FLUSH: 5,
    FULL_HOUSE: 6,
    FOUR_OF_A_KIND: 7,
    STRAIGHT_FLUSH: 8
};

var Deck = function () {
    var cards = [];
    for (var suit of ["S", "H", "D", "C"]) {
        for (var rank of [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"]) {
            cards.push(new Card(rank, suit));
        }
    }

    this.shuffle = function () {
        for (var i = cards.length - 1; i > 0; --i) {
            var j = Math.floor(Math.random() * (i + 1));
            var ele = cards[i];
            cards[i] = cards[j];
            cards[j] = ele;
        }
    };

    this.deal = function () {
        return cards.pop();
    };

    this.pop = function () {
        cards.pop();
    };

    this.getCards = function() {
        return cards;
    };
};

Deck.prototype.shuffle = function () { };
Deck.prototype.deal = function () { };
Deck.prototype.pop = function () { };

var Card = function (rank, suit) {
    this.rank = rank;
    this.suit = suit;
};

Card.prototype.equals = function (that) {
    return (this.rank == that.rank && this.suit == that.suit);
};

Card.prototype.getImage = function () {
    var img = document.createElement("img");
    img.src = "cards-svg/" + this.rank + this.suit + ".png";
    img.alt = this.toString();
    img.className = "card";
    return img;
};

Card.prototype.toString = function () {
    return this.rank + this.suit;
}

Card.prototype.rankNumber = function () {
    return {
        2: 1,
        3: 2,
        4: 3,
        5: 4,
        6: 5,
        7: 6,
        8: 7,
        9: 8,
        10: 9,
        "J": 10,
        "Q": 11,
        "K": 12,
        "A": 13,
    }[this.rank];
}

Card.prototype.rankNumberAceLow = function () {
    return {
        "A": 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        6: 6,
        7: 7,
        8: 8,
        9: 9,
        10: 10,
        "J": 11,
        "Q": 12,
        "K": 13
    }[this.rank];
}

var Hands = (function () {

    var Types = {
        "STRAIGHT": "Straight"
    }

    var difference = function (set, subset) {
        var result = set.slice(0);
        for (var item of subset) {
            result.splice(result.indexOf(item), 1);
        }
        return result;
    }

    var sort = function (cards, isAceLow) {
        var results = cards.slice(0);
        if (isAceLow) {
            results.sort(function (a, b) {
                return a.rankNumberAceLow() - b.rankNumberAceLow();
            });
        } else {
            results.sort(function (a, b) {
                return a.rankNumber() - b.rankNumber();
            });
        }
        return results;
    }

    var getHighestCard = function (cards) {
        return sort(cards)[cards.length - 1];
    }

    var getNHighestCards = function (cards, n) {
        var sorted = sort(cards);
        var result = [];
        while (result.length < n) {
            result.push(sorted.pop());
        }
        return result;
    }

    var sortBySuit = function (cards) {
        var results = cards.slice(0);
        results.sort(function (a, b) {
            if (a.suit > b.suit) {
                return 1;
            } else {
                return -1;
            }
            return a.suit - b.suit;
        });
        return results;
    }

    var groupByRank = function (cards) {
        var results = [];
        var sorted = sort(cards);
        var currentIndex = 0;
        for (var i in sorted) {
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
        var results = [];
        cards = sortBySuit(cards);
        var currentIndex = 0;
        for (var i in cards) {
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

    var getScore = function (cards) {
        var score = 0;
        for (var i = 0; i < cards.length; ++i) {
            score += cards[i].rankNumber() * Math.pow(14, cards.length - i - 1);
        }
        return score;
    }

    var longestSequence = function (cards) { //longest sequence of cards (including A low/high) with 5+ cards
        var sorted = sort(cards);
        var hand = [];
        var currentRank;

        for (var card of sorted) {
            if (currentRank === undefined || currentRank === null) {
                currentRank = card.rankNumber();
                hand.push(card);
            } else {
                if (card.rankNumber() === currentRank) {
                    continue;
                } else if (card.rankNumber() === currentRank + 1) {
                    currentRank = card.rankNumber();
                    hand.push(card);
                } else {
                    if (hand.length >= 5) {
                        return hand;
                    } else {
                        currentRank = card.rankNumber();
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
        for (var card of sorted) {
            if (currentRank === undefined || currentRank === null) {
                currentRank = card.rankNumberAceLow();
                hand.push(card);
            } else {
                if (card.rankNumberAceLow() === currentRank) {
                    continue;
                } else if (card.rankNumberAceLow() === currentRank + 1) {
                    currentRank = card.rankNumberAceLow();
                    hand.push(card);
                } else {
                    if (hand.length >= 5) {
                        return hand;
                    } else {
                        currentRank = card.rankNumberAceLow();
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
        var hand = [];
        var score;

        var mostCommonSuits = groupBySuit(cards);
        var largestSuit = mostCommonSuits[0];
        var mostCommonRanks = groupByRank(cards);
        var longestStraight = longestSequence(cards);

        if (largestSuit.length >= 5) { // Straight flush
            var ls = longestSequence(mostCommonSuits[0]);
            if (ls.length >= 5) {
                var highestCard = getHighestCard(ls);
                var secondHighestCard = getHighestCard(difference(ls, [highestCard]));
                if (highestCard.rank === "A" && secondHighestCard.rank != "K") {
                    ls = sort(ls, true);
                    hand = ls.slice(-5);
                    score = 8 * Math.pow(14, 5) + secondHighestCard.rankNumber();
                } else {
                    hand = getNHighestCards(ls, 5);
                    score = 8 * Math.pow(14, 5) + highestCard.rankNumber();
                }
                return {
                    hand: hand,
                    score: score,
                    type: HandCombinations.STRAIGHT_FLUSH
                };
            }
        }

        if (mostCommonRanks[0].length === 4) { // Four of a kind
            var quad = mostCommonRanks[0];
            var kicker = getNHighestCards(difference(cards, quad), 1);
            hand = quad.concat(kicker);
            score = 7 * Math.pow(14, 5) + quad[0].rankNumber() * 14 + kicker[0].rankNumber();
            return {
                hand: hand,
                score: score,
                type: HandCombinations.FOUR_OF_A_KIND
            };
        } else if (mostCommonRanks[0].length === 3 && mostCommonRanks[1].length >= 2) { // Full house
            var triple = mostCommonRanks[0];
            var pair;
            if (mostCommonRanks[2].length === 2 && mostCommonRanks[2][0].rankNumber() > mostCommonRanks[1][0].rankNumber()) {
                pair = mostCommonRanks[2];
            } else {
                pair = mostCommonRanks[1].slice(0, 2);
            }
            hand = triple.concat(pair);
            score = 6 * Math.pow(14, 5) + triple[0].rankNumber() * 14 + pair[0].rankNumber();
            return {
                hand: hand,
                score: score,
                type: HandCombinations.FULL_HOUSE
            };
        } else if (largestSuit.length >= 5) { // Flush
            hand = getNHighestCards(largestSuit, 5);
            score = 5 * Math.pow(14, 5) + getScore(hand);
            return {
                hand: hand,
                score: score,
                type: HandCombinations.FLUSH
            };
        } else if (longestStraight.length >= 5) { // Straight
            var highestCard = getHighestCard(longestStraight);
            var secondHighestCard = getHighestCard(difference(longestStraight, [highestCard]));
            if (highestCard.rank === "A" && secondHighestCard.rank != "K") {
                longestStraight = sort(longestStraight, true);
                hand = longestStraight.slice(-5);
                score = 4 * Math.pow(14, 5) + secondHighestCard.rankNumber();
            } else {
                hand = getNHighestCards(longestStraight, 5);
                score = 4 * Math.pow(14, 5) + highestCard.rankNumber();
            }
            return {
                hand: hand,
                score: score,
                type: HandCombinations.STRAIGHT
            };
        } else if (mostCommonRanks[0].length === 3) { // Three of a kind
            var triple = mostCommonRanks[0];
            var kickers = getNHighestCards(difference(cards, triple), 2);
            hand = triple.concat(kickers);
            score = 3 * Math.pow(14, 5) + triple[0].rankNumber() * Math.pow(14, 3) + getScore(kickers);
            return {
                hand: hand,
                score: score,
                type: HandCombinations.THREE_OF_A_KIND
            };
        } else if (mostCommonRanks[0].length === 2 && mostCommonRanks[1].length === 2) { // Two pair
            var highPair;
            var lowPair;
            if (mostCommonRanks[2].length === 2) {
                // Check which 2 pairs are highest
                if (mostCommonRanks[2][0].rankNumber() > mostCommonRanks[1][0].rankNumber()) {
                    highPair = mostCommonRanks[2];
                }
                lowPair = mostCommonRanks[1];
            } else {
                var highPair = mostCommonRanks[1];
                var lowPair = mostCommonRanks[0];
            }
            hand = highPair.concat(lowPair);
            var remainder = difference(cards, hand);
            var kicker = getHighestCard(remainder)
            hand.push(kicker);
            score = 2 * Math.pow(14, 5) + highPair[0].rankNumber() * Math.pow(14, 2) + lowPair[0].rankNumber() * Math.pow(14, 1) + kicker.rankNumber();
            return {
                hand: hand,
                score: score,
                type: HandCombinations.TWO_PAIR
            };
        } else if (mostCommonRanks[0].length === 2) { // One pair
            var pair = mostCommonRanks[0];
            var kickers = getNHighestCards(difference(cards, pair), 3);
            hand = pair.concat(kickers);
            score = Math.pow(14, 5) + pair[0].rankNumber() * Math.pow(14, 3) + getScore(kickers);
            return {
                hand: hand,
                score: score,
                type: HandCombinations.ONE_PAIR
            };
        } else { // High card
            hand = getNHighestCards(cards, 5);
            score = getScore(hand);
            return {
                hand: hand,
                score: score,
                type: HandCombinations.HIGH_CARD
            };
        }

    }

    return {
        bestHand: bestHand,
        getScore: getScore,
        Types: Types,
        difference: difference
    };

})();