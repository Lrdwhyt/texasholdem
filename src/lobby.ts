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
    startOnlineMatch();
}