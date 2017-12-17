enum Strategy {
    Passive,
    Normal,
    Tricky,
    Aggressive
}

class AIController implements Controller {
    private player: Player;
    private callbackFunction;
    private hand: Card[];
    private board: Card[];
    private strategy: Strategy;

    constructor(player: Player, strategy: Strategy) {
        this.player = player;
        this.strategy = strategy;
        this.hand = [];
        this.board = [];
    }

    calculateBet(cards, board, currentBet, committed, minRaise, money, potCheck) {

        let deck: Deck = new Deck();

        let totalLosses: number = 0;
        let totalWins: number = 0;
        let totalDraws: number = 0;

        let trials: number = 50;

        for (let i = 0; i < trials; ++i) {
            deck.shuffle();
            let possibleDraws = Hands.difference(deck.getCards(), cards.concat(board));
            let possibleBoard = board;
            while (possibleBoard.length < 5) {
                possibleBoard.push(possibleDraws.pop());
            }

            let possibleCards = cards.concat(possibleBoard);

            let hypotheticalHand = [possibleDraws.pop(), possibleDraws.pop()];
            // TODO: make X hypothetical hands for X-1 players

            let hypotheticalResult = Hands.bestHand(hypotheticalHand.concat(possibleBoard));
            let bestHand = Hands.bestHand(possibleCards);

            if (bestHand.score > hypotheticalResult.score) {
                ++totalWins;
            } else if (bestHand.score === hypotheticalResult.score) {
                ++totalDraws;
            } else {
                ++totalLosses;
            }
        }

        let winRatio = totalWins / trials;
        let lossRatio = totalLosses / trials;

        let toCall = currentBet - committed;
        let toRaise = currentBet - committed + minRaise;

        let potOdds = toCall / potCheck(this.player, toCall);

        if (winRatio === 1) {
            if (money > toCall) {
                return new Bet(BetType.Raise, money);
            } else {
                return new Bet(BetType.Call);
            }
        }

        switch (this.strategy) {
            case Strategy.Aggressive:
                if (toCall === 0) {
                    if (winRatio <= 0.5) {
                        return new Bet(BetType.Check);
                    } else {
                        if (money >= toRaise) {
                            let raise = toRaise * 8;
                            while (raise >= toRaise) {
                                if (money >= raise * 2 && raise / potCheck(this.player, raise) * 3 <= winRatio) {
                                    return new Bet(BetType.Raise, raise);
                                }
                                raise /= 2;
                            }
                            return new Bet(BetType.Raise, toRaise);
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
                            if (money >= toRaise) {
                                let raise = toRaise * 8;
                                while (raise >= toRaise) {
                                    if (money >= raise * 2 && raise / potCheck(this.player, raise) * 2 <= winRatio) {
                                        return new Bet(BetType.Raise, raise);
                                    }
                                    raise /= 2;
                                }
                                return new Bet(BetType.Raise, toRaise);
                            } else {
                                return new Bet(BetType.Call);
                            }
                        } else {
                            return new Bet(BetType.Fold);
                        }
                    } else {
                        if (potOdds * 2 <= winRatio) {
                            if (money >= toRaise) {
                                let raise = toRaise * 16;
                                while (raise >= toRaise) {
                                    if (money >= raise && raise / potCheck(this.player, raise) * 1.5 <= winRatio) {
                                        return new Bet(BetType.Raise, raise);
                                    }
                                    raise /= 2;
                                }
                                return new Bet(BetType.Raise, toRaise);
                            } else {
                                return new Bet(BetType.Call);
                            }
                        } else {
                            return new Bet(BetType.Call);
                        }
                    }
                }

            case Strategy.Normal:
                if (toCall === 0) {
                    if (winRatio <= 0.6) {
                        return new Bet(BetType.Check);
                    } else {
                        if (money >= toRaise) {
                            let raise = toRaise * 4;
                            while (raise >= toRaise) {
                                if (money >= raise * 4 && raise / potCheck(this.player, raise) * 3 <= winRatio) {
                                    return new Bet(BetType.Raise, raise);
                                }
                                raise /= 2;
                            }
                            return new Bet(BetType.Raise, toRaise);
                        } else {
                            return new Bet(BetType.Check);
                        }
                    }
                } else {
                    if (winRatio <= 0.5) {
                        if (potOdds * 3 <= winRatio) {
                            return new Bet(BetType.Call);
                        } else {
                            return new Bet(BetType.Fold);
                        }
                    } else if (winRatio <= 0.8) {
                        if (potOdds * 2.5 <= winRatio) {
                            return new Bet(BetType.Call);
                        } else {
                            return new Bet(BetType.Fold);
                        }
                    } else {
                        if (potOdds * 2 <= winRatio) {
                            if (money >= toRaise) {
                                let raise = toRaise * 8;
                                while (raise >= toRaise) {
                                    if (money >= raise * 2 && raise / potCheck(this.player, raise) * 1.5 <= winRatio) {
                                        return new Bet(BetType.Raise, raise);
                                    }
                                    raise /= 2;
                                }
                                return new Bet(BetType.Raise, toRaise);
                            } else {
                                return new Bet(BetType.Call);
                            }
                        } else {
                            return new Bet(BetType.Call);
                        }
                    }
                }

            case Strategy.Passive:
                if (toCall === 0) {
                    if (winRatio <= 0.7) {
                        return new Bet(BetType.Check);
                    } else {
                        if (money >= toRaise) {
                            let raise = toRaise * 4;
                            while (raise >= toRaise) {
                                if (money >= raise * 4 && raise / potCheck(this.player, raise) * 3 <= winRatio) {
                                    return new Bet(BetType.Raise, raise);
                                }
                                raise /= 2;
                            }
                            return new Bet(BetType.Raise, toRaise);
                        } else {
                            return new Bet(BetType.Check);
                        }
                    }
                } else {
                    if (winRatio <= 0.5) {
                        if (potOdds * 3 <= winRatio) {
                            return new Bet(BetType.Call);
                        } else {
                            return new Bet(BetType.Fold);
                        }
                    } else if (winRatio <= 0.8) {
                        if (potOdds * 3 <= winRatio) {
                            return new Bet(BetType.Call);
                        } else {
                            return new Bet(BetType.Fold);
                        }
                    } else {
                        if (potOdds * 2.5 <= winRatio) {
                            if (money >= toRaise) {
                                let raise = toRaise * 8;
                                while (raise >= toRaise) {
                                    if (money >= raise * 2 && raise / potCheck(this.player, raise) * 2 <= winRatio) {
                                        return new Bet(BetType.Raise, raise);
                                    }
                                    raise /= 2;
                                }
                                return new Bet(BetType.Raise, toRaise);
                            } else {
                                return new Bet(BetType.Call);
                            }
                        } else {
                            return new Bet(BetType.Call);
                        }
                    }
                }

            case Strategy.Tricky:
                if (toCall === 0) {
                    if (winRatio <= 0.5) {
                        return new Bet(BetType.Check);
                    } else {
                        if (money >= toRaise) {
                            let raise = toRaise * 8;
                            while (raise >= toRaise) {
                                if (money >= raise * 3 && raise / potCheck(this.player, raise) * 3 <= winRatio) {
                                    return new Bet(BetType.Raise, raise);
                                }
                                raise /= 2;
                            }
                            return new Bet(BetType.Raise, toRaise);
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
                        if (potOdds * 2 <= winRatio) {
                            if (money >= toRaise) {
                                let raise = toRaise * 8;
                                while (raise >= toRaise) {
                                    if (money >= raise && raise / potCheck(this.player, raise) * 2 <= winRatio) {
                                        return new Bet(BetType.Raise, raise);
                                    }
                                    raise /= 2;
                                }
                                return new Bet(BetType.Raise, toRaise);
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
        } else if (e instanceof DealtHandEvent) {
            this.hand = e.hand;
        } else if (e instanceof DealtFlopEvent || e instanceof DealtTurnEvent || e instanceof DealtRiverEvent) {
            this.board = this.board.concat(e.cards);
        } else if (e instanceof BetAwaitEvent) {

            if (e.player === this.player) {
                
                let bet = this.calculateBet(this.hand, this.board, e.current, e.committed, e.minRaise, this.player.getMoney(), e.potCheck);

                setTimeout(() => e.callback(this.player, bet), 700); // delay AI moves to make game more realistic

            }

        }

    }
}