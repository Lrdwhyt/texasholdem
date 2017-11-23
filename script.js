(function () {
    var startMatch = function() {
        var m = new OfflineMatch();
        var mc = new MatchController(m);


        var p1 = new Player("Deirdre", 100);
        p1.setController(new UserController(p1, document.getElementById("user")));
        m.addPlayer(p1);

        var p2 = new Player("Xenos", 3300);
        p2.setController(new AIController(p2));
        m.addPlayer(p2);

        var p3 = new Player("Yotta", 3300);
        p3.setController(new AIController(p3));
        m.addPlayer(p3);

        var p4 = new Player("Zephyr", 3300);
        p4.setController(new AIController(p4));
        m.addPlayer(p4);

        m.startGame();
    };

    window.onload = function () {
        startMatch();
    }
})();