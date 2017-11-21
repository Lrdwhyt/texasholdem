(function () {
    window.onload = function () {
        var m = new OfflineMatch();


        var p1 = new Player("Deirdre", 100);
        p1.setController(new UserController(p1, document.getElementById("user")));
        m.addPlayer(p1);

        var p2 = new Player("Xenos", 100);
        p2.setController(new AIController(p2));
        m.addPlayer(p2);

        var p3 = new Player("Yotta", 100);
        p3.setController(new AIController(p3));
        m.addPlayer(p3);

        var p4 = new Player("Zephyr", 100);
        p4.setController(new AIController(p4));
        m.addPlayer(p4);
        
        m.startGame();
    }
})();