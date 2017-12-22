import { OfflineMatch } from "./OfflineMatch";
import { Player } from "./Player";
import { AIController, Strategy } from "./AIController";
import { UserController } from "./UserController";

class AppController {

}


let match: OfflineMatch;
var startMatch = function () {

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

    match = new OfflineMatch();
    let k = document.getElementById("next-game").cloneNode(true);
    document.getElementById("next-game").parentNode.replaceChild(k, document.getElementById("next-game"));
    document.getElementById("next-game").addEventListener("click", () => {
        match.startGame();
    });

    let p1 = new Player("Human", 13000);
    p1.setController(new UserController(p1));
    match.addPlayer(p1);

    let p2 = new Player("Aardvark", 12125);
    p2.setController(new AIController(p2, Strategy.Normal));
    match.addPlayer(p2);

    let p3 = new Player("Coyote", 12125);
    p3.setController(new AIController(p3, Strategy.Aggressive));
    match.addPlayer(p3);

    let p4 = new Player("Elephant", 12125);
    p4.setController(new AIController(p4, Strategy.Passive));
    match.addPlayer(p4);

    let p5 = new Player("Kangaroo", 12125);
    p5.setController(new AIController(p5, Strategy.Tricky));
    match.addPlayer(p5);

    let p6 = new Player("Leopard", 12125);
    p6.setController(new AIController(p6, Strategy.Aggressive));
    match.addPlayer(p6);

    let p7 = new Player("Panda", 12125);
    p7.setController(new AIController(p7, Strategy.Passive));
    match.addPlayer(p7);

    let p8 = new Player("Squirrel", 12125);
    p8.setController(new AIController(p8, Strategy.Tricky));
    match.addPlayer(p8);

    let p9 = new Player("Zebra", 12125);
    p9.setController(new AIController(p9, Strategy.Normal));
    match.addPlayer(p9);

    match.startGame();
};

window.onload = function () {
    startMatch();
    document.getElementById("next-match").addEventListener("click", () => {
        match.finish();
        startMatch();
    });
}