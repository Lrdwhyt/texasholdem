import { Controller } from "./UserController";
import { Player } from "./Player";
import { Bet, BetType } from "./Bet";
import { GameEvent, DealtHandEvent, GameStartEvent, BetAwaitEvent, BetMadeEvent, DealtFlopEvent, DealtTurnEvent, DealtRiverEvent } from "./events";
import { Deck } from "./Deck";
import { Card } from "./Card";
import { HandUtils } from "./Hands";

export enum Strategy {
    Passive,
    Normal,
    Tricky,
    Aggressive
}

export class AIController implements Controller {
    private player: Player;
    private hand: Card[];
    private board: Card[];
    private strategy: Strategy;
    private unfoldedPlayers: Player[];

    constructor(player: Player, strategy: Strategy) {
        this.player = player;
        this.strategy = strategy;
        this.hand = [];
        this.board = [];
        this.unfoldedPlayers = [];
    }

    calculateBet(cards: Card[], board: Card[], currentBet: number, amountCommitted: number, minRaise: number, playerMoney: number, potCheck: (player: Player, amount: number) => number): Bet {

        let deck: Deck = new Deck();

        let totalLosses: number = 0;
        let totalWins: number = 0;
        let totalDraws: number = 0;

        let trials: number = 100;

        for (let i = 0; i < trials; ++i) {
            deck.shuffle();
            let possibleDraws: Card[] = HandUtils.difference(deck.getCards(), cards.concat(board));
            let possibleBoard: Card[] = board;
            while (possibleBoard.length < 5) {
                possibleBoard.push(possibleDraws.pop());
            }

            let bestScore = 0;
            for (let j = 0; j < this.unfoldedPlayers.length; ++j) { // Separate hand for each other player
                let hypotheticalHand = [possibleDraws.pop(), possibleDraws.pop()];
                let hypotheticalResult = HandUtils.bestHand(hypotheticalHand, possibleBoard);
                if (hypotheticalResult.score > bestScore) {
                    bestScore = hypotheticalResult.score;
                }
            }
            let bestHand = HandUtils.bestHand(cards, possibleBoard);
            if (bestHand.score > bestScore) {
                ++totalWins;
            } else if (bestHand.score === bestScore) {
                ++totalDraws;
            } else {
                ++totalLosses;
            }
        }

        let winRatio = totalWins / trials;
        let lossRatio = totalLosses / trials;

        let amountToCall = currentBet - amountCommitted;
        let amountToRaise = currentBet - amountCommitted + minRaise;
        if (amountToRaise > playerMoney && playerMoney > amountToCall) {
            amountToRaise = playerMoney;
        }

        let potOdds = amountToCall / potCheck(this.player, amountToCall);
        console.log("[AIDecision] " + this.player.getName() + "/ Pot odds: " + potOdds + ", win ratio: " + winRatio);

        if (winRatio === 1) {
            if (playerMoney > amountToCall) {
                return new Bet(BetType.Raise, playerMoney);
            } else {
                return new Bet(BetType.Call);
            }
        }

        switch (this.strategy) {
            case Strategy.Aggressive:
                if (amountToCall === 0) {
                    if (winRatio <= 0.5) {
                        return new Bet(BetType.Check);
                    } else {
                        if (playerMoney >= amountToRaise) {
                            for (let raise = amountToRaise * 8; raise >= amountToRaise; raise -= amountToRaise) {
                                if (playerMoney >= raise * 2 && raise / potCheck(this.player, raise) * 3 <= winRatio) {
                                    return new Bet(BetType.Raise, raise);
                                }
                            }
                            return new Bet(BetType.Raise, amountToRaise);
                        } else {
                            return new Bet(BetType.Check);
                        }
                    }
                } else {
                    if (winRatio <= 0.5) {
                        if (potOdds * 2 <= winRatio) {
                            return new Bet(BetType.Call);
                        } else {
                            return new Bet(BetType.Fold);
                        }
                    } else if (winRatio <= 0.8) {
                        if (potOdds * 1.0 <= winRatio) {
                            if (playerMoney >= amountToRaise) {
                                for (let raise = amountToRaise * 8; raise >= amountToRaise; raise -= amountToRaise) {
                                    if (playerMoney >= raise * 2 && raise / potCheck(this.player, raise) * 2 <= winRatio) {
                                        return new Bet(BetType.Raise, raise);
                                    }
                                }
                                return new Bet(BetType.Raise, amountToRaise);
                            } else {
                                return new Bet(BetType.Call);
                            }
                        } else {
                            return new Bet(BetType.Fold);
                        }
                    } else {
                        if (potOdds * 1.0 <= winRatio) {
                            if (playerMoney >= amountToRaise) {
                                for (let raise = amountToRaise * 12; raise >= amountToRaise; raise -= amountToRaise) {
                                    if (playerMoney >= raise && raise / potCheck(this.player, raise) * 1.5 <= winRatio) {
                                        return new Bet(BetType.Raise, raise);
                                    }
                                }
                                return new Bet(BetType.Raise, amountToRaise);
                            } else {
                                return new Bet(BetType.Call);
                            }
                        } else {
                            return new Bet(BetType.Call);
                        }
                    }
                }

            case Strategy.Normal:
                if (amountToCall === 0) {
                    if (winRatio <= 0.6) {
                        return new Bet(BetType.Check);
                    } else {
                        if (playerMoney >= amountToRaise) {
                            for (let raise = amountToRaise * 4; raise >= amountToRaise; raise -= amountToRaise) {
                                if (playerMoney >= raise * 4 && raise / potCheck(this.player, raise) * 3 <= winRatio) {
                                    return new Bet(BetType.Raise, raise);
                                }
                            }
                            return new Bet(BetType.Raise, amountToRaise);
                        } else {
                            return new Bet(BetType.Check);
                        }
                    }
                } else {
                    if (winRatio <= 0.5) {
                        if (potOdds * 2 <= winRatio) {
                            return new Bet(BetType.Call);
                        } else {
                            return new Bet(BetType.Fold);
                        }
                    } else if (winRatio <= 0.8) {
                        if (potOdds * 2 <= winRatio) {
                            return new Bet(BetType.Call);
                        } else {
                            return new Bet(BetType.Fold);
                        }
                    } else {
                        if (potOdds * 1.5 <= winRatio) {
                            if (playerMoney >= amountToRaise) {
                                for (let raise = amountToRaise * 8; raise >= amountToRaise; raise -= amountToRaise) {
                                    if (playerMoney >= raise * 2 && raise / potCheck(this.player, raise) * 1.5 <= winRatio) {
                                        return new Bet(BetType.Raise, raise);
                                    }
                                }
                                return new Bet(BetType.Raise, amountToRaise);
                            } else {
                                return new Bet(BetType.Call);
                            }
                        } else {
                            return new Bet(BetType.Call);
                        }
                    }
                }

            case Strategy.Passive:
                if (amountToCall === 0) {
                    if (winRatio <= 0.7) {
                        return new Bet(BetType.Check);
                    } else {
                        if (playerMoney >= amountToRaise) {
                            for (let raise = amountToRaise * 4; raise >= amountToRaise; raise -= amountToRaise) {
                                if (playerMoney >= raise * 4 && raise / potCheck(this.player, raise) * 3 <= winRatio) {
                                    return new Bet(BetType.Raise, raise);
                                }
                            }
                            return new Bet(BetType.Raise, amountToRaise);
                        } else {
                            return new Bet(BetType.Check);
                        }
                    }
                } else {
                    if (winRatio <= 0.5) {
                        if (potOdds * 2 <= winRatio) {
                            return new Bet(BetType.Call);
                        } else {
                            return new Bet(BetType.Fold);
                        }
                    } else if (winRatio <= 0.8) {
                        if (potOdds * 2 <= winRatio) {
                            return new Bet(BetType.Call);
                        } else {
                            return new Bet(BetType.Fold);
                        }
                    } else {
                        if (potOdds * 1.5 <= winRatio) {
                            if (playerMoney >= amountToRaise) {
                                for (let raise = amountToRaise * 8; raise >= amountToRaise; raise -= amountToRaise) {
                                    if (playerMoney >= raise * 2 && raise / potCheck(this.player, raise) * 2 <= winRatio) {
                                        return new Bet(BetType.Raise, raise);
                                    }
                                }
                                return new Bet(BetType.Raise, amountToRaise);
                            } else {
                                return new Bet(BetType.Call);
                            }
                        } else {
                            return new Bet(BetType.Call);
                        }
                    }
                }

            case Strategy.Tricky:
                if (amountToCall === 0) {
                    if (winRatio <= 0.5) {
                        return new Bet(BetType.Check);
                    } else {
                        if (playerMoney >= amountToRaise) {
                            for (let raise = amountToRaise * 8; raise >= amountToRaise; raise -= amountToRaise) {
                                if (playerMoney >= raise * 3 && raise / potCheck(this.player, raise) * 3 <= winRatio) {
                                    return new Bet(BetType.Raise, raise);
                                }
                            }
                            return new Bet(BetType.Raise, amountToRaise);
                        } else {
                            return new Bet(BetType.Check);
                        }
                    }
                } else {
                    if (winRatio <= 0.5) {
                        if (potOdds * 1.5 <= winRatio) {
                            return new Bet(BetType.Call);
                        } else {
                            return new Bet(BetType.Fold);
                        }
                    } else if (winRatio <= 0.8) {
                        if (potOdds * 2 <= winRatio) {
                            return new Bet(BetType.Call);
                        } else {
                            return new Bet(BetType.Fold);
                        }
                    } else {
                        if (potOdds * 1.5 <= winRatio) {
                            if (playerMoney >= amountToRaise) {
                                for (let raise = amountToRaise * 8; raise >= amountToRaise; raise -= amountToRaise) {
                                    if (playerMoney >= raise && raise / potCheck(this.player, raise) * 2 <= winRatio) {
                                        return new Bet(BetType.Raise, raise);
                                    }
                                }
                                return new Bet(BetType.Raise, amountToRaise);
                            } else {
                                return new Bet(BetType.Call);
                            }
                        } else {
                            return new Bet(BetType.Call);
                        }
                    }
                }
        }


    }

    //Allows game to notify player of events
    dispatchEvent(e: GameEvent): void {
        if (e instanceof GameStartEvent) {
            this.board = [];
            this.unfoldedPlayers = e.players.slice(0);
            this.unfoldedPlayers.splice(this.unfoldedPlayers.indexOf(this.player), 1);
        } else if (e instanceof DealtHandEvent) {
            this.hand = e.hand;
        } else if (e instanceof DealtFlopEvent || e instanceof DealtTurnEvent || e instanceof DealtRiverEvent) {
            this.board = this.board.concat(e.cards);
        } else if (e instanceof BetAwaitEvent) {

            if (e.player === this.player) {
                let bet = this.calculateBet(this.hand, this.board, e.current, e.committed, e.minRaise, this.player.getMoney(), e.potCheck);
                if (e.canRaise === false && bet.type === BetType.Raise) {
                    bet = new Bet(BetType.Call);
                }
                setTimeout(() => e.callback(this.player, bet), 700); // delay AI moves to make game more realistic
            }

        } else if (e instanceof BetMadeEvent) {
            if (e.bet.type === BetType.Fold) {
                this.unfoldedPlayers.splice(this.unfoldedPlayers.indexOf(e.player), 1);
            }
        }

    }
}