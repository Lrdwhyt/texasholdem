(function () {
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
                            <div>
                                <button id="fold">Fold</button>
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
        p2.setController(new AIController(p2, Strategy.Normal));
        m.addPlayer(p2);

        var p3 = new Player("Coyote", 12125);
        p3.setController(new AIController(p3, Strategy.Aggressive));
        m.addPlayer(p3);

        var p4 = new Player("Elephant", 12125);
        p4.setController(new AIController(p4, Strategy.Passive));
        m.addPlayer(p4);

        var p5 = new Player("Kangaroo", 12125);
        p5.setController(new AIController(p5, Strategy.Tricky));
        m.addPlayer(p5);

        var p6 = new Player("Leopard", 12125);
        p6.setController(new AIController(p6, Strategy.Aggressive));
        m.addPlayer(p6);

        var p7 = new Player("Panda", 12125);
        p7.setController(new AIController(p7, Strategy.Passive));
        m.addPlayer(p7);

        var p8 = new Player("Squirrel", 12125);
        p8.setController(new AIController(p8, Strategy.Tricky));
        m.addPlayer(p8);

        var p9 = new Player("Zebra", 12125);
        p9.setController(new AIController(p9, Strategy.Normal));
        m.addPlayer(p9);

        m.startGame();
    };

    var getActiveMatches = function (): void {
        let activeMatches: XMLHttpRequest = new XMLHttpRequest();
        activeMatches.open("GET", "tables/all");
        activeMatches.addEventListener("load", function (e) {
            console.log(this.responseText);
            fillActiveMatches(JSON.parse(this.responseText));
        });
        activeMatches.send();
    }

    var joinTable = function (id: number) {
        let connection = new WebSocket("ws://" + location.host + "/tables/match/" + id);
    }

    var fillActiveMatches = function (matches): void {
        let container = document.getElementById("tables-container");
        container.innerHTML = "";
        for (let table of matches) {
            console.log(table);
            let div = document.createElement("div");
            div.innerHTML = table.Name;
            div.className = "table";
            div.addEventListener("click", () => {
                joinTable(table.Id);
            })
            container.appendChild(div);
        }
    }

    var createNewTable = function (tableName: string): void {
        let createTable: XMLHttpRequest = new XMLHttpRequest();
        createTable.open("GET", "tables/new/" + encodeURI(tableName));
        createTable.send();
    }

    var startOnlineMatch = function (): void {
        document.getElementById("container").innerHTML = `
        <button id="refresh-tables">Refresh</button>
        <button id="create-table">Create table</button>
        <div id="tables-container"></div>
        `;
        getActiveMatches();
        document.getElementById("create-table").addEventListener("click", function () {
            let tableName: string = prompt("Name of table", "New table");
            if (tableName !== null) {
                createNewTable(tableName);
            }
        });
        document.getElementById("refresh-tables").addEventListener("click", function () {
            getActiveMatches();
        });
    };

    window.onload = function () {
        startMatch();
        document.getElementById("play-online").addEventListener("click", function () {
            startOnlineMatch();
        });
        document.getElementById("play-offline").addEventListener("click", function () {
            startMatch();
        });
        document.getElementById("next-match").addEventListener("click", function () {
            startMatch();
        });
    }
})();