class AppController {

}

(function () {

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
                                <button id="check">Check</button>
                            </div>
                            <div>
                                <button id="call">Call</button>
                            </div>
                            <div>
                                <button id="all-in">All-in</button><button id="raise">Raise</button>
                            </div>
                            <div>
                                <button id="decrease-bet">-</button><input type="text" id="bet"><button id="increase-bet">+</button>
                            </div>
                            <div>
                                <button id="fold">Fold</button>
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

        let p1 = new Player("Human", 3000);
        p1.setController(new UserController(p1, document.getElementById("user")));
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

    var getActiveMatches = function (): void {
        let activeMatches: XMLHttpRequest = new XMLHttpRequest();
        activeMatches.open("GET", "tables/all");
        activeMatches.addEventListener("load", () => {
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
        document.getElementById("next-match").addEventListener("click", () => {
            match.finish();
            startMatch();
        });
    }
})();