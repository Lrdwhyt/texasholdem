export class LocalTableView {

    constructor() {
        this.init();
    }

    init(): void {
        document.getElementById("container").innerHTML = `<div id="players">
            <div id="players-left"></div>
            <div id="center-column">
                <div id="players-top"></div>
                <div id="center-board">
                    <div id="board"></div>
                    <div id="pots"></div>
                </div>
                <div id="user">
                    <div id="user-stuff">
                        <div id="user-cards"></div>
                        <div id="user-info"></div>
                    </div>
                    <div id="bet-controls">
                        <span id="actions">
                            <div>
                                <button id="check" class="bet-control">Check</button>
                            </div>
                            <div>
                                <button id="call" class="bet-control">Call</button>
                            </div>
                            <div>
                                <button id="all-in" class="bet-control">All-in</button><button id="raise" class="bet-control">Raise</button>
                            </div>
                            <div>
                                <button id="decrease-bet">-</button><input type="text" id="bet"><button id="increase-bet">+</button>
                            </div>
                            <div>
                                <button id="fold" class="bet-control">Fold</button>
                            </div>
                        </span>
                    </div>
                </div>
            </div>
            <div id="players-right"></div>`;
    }

}