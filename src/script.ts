(function () {
    var startMatch = function() {


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
                                <button id="fold">Fold</button>
                            </div>
                            <div>
                                <button id="all-in">All-in</button>
                            </div>
                            <div>
                                <button id="decrease-bet">-</button><input type="text" id="bet"><button id="increase-bet">+</button><button id="raise">Raise</button>
                            </div>
                            <div>
                                <button id="call">Call</button>
                            </div>
                            <div>
                                <button id="check">Check</button>
                            </div>
                        </span>
                    </div>
                </div>
            </div>
            <div id="players-right"></div>`;

        var m = new OfflineMatch();
        var mc = new MatchController(m);


        var p1 = new Player("Human", 3000);
        p1.setController(new UserController(p1, document.getElementById("user")));
        m.addPlayer(p1);

        var p2 = new Player("Aardvark", 12125);
        p2.setController(new AIController(p2, Strategy.NORMAL));
        m.addPlayer(p2);

        var p3 = new Player("Coyote", 12125);
        p3.setController(new AIController(p3, Strategy.AGGRESSIVE));
        m.addPlayer(p3);

        var p4 = new Player("Elephant", 12125);
        p4.setController(new AIController(p4, Strategy.PASSIVE));
        m.addPlayer(p4);

        var p5 = new Player("Kangaroo", 12125);
        p5.setController(new AIController(p5, Strategy.TRICKY));
        m.addPlayer(p5);

        var p6 = new Player("Leopard", 12125);
        p6.setController(new AIController(p6, Strategy.AGGRESSIVE));
        m.addPlayer(p6);

        var p7 = new Player("Panda", 12125);
        p7.setController(new AIController(p7, Strategy.PASSIVE));
        m.addPlayer(p7);

        var p8 = new Player("Squirrel", 12125);
        p8.setController(new AIController(p8, Strategy.TRICKY));
        m.addPlayer(p8);

        var p9 = new Player("Zebra", 12125);
        p9.setController(new AIController(p9, Strategy.NORMAL));
        m.addPlayer(p9);

        m.startGame();
    };

    window.onload = function () {
        startMatch();
        document.getElementById("next-match").addEventListener("click", function() {
            startMatch();
        });
    }
})();