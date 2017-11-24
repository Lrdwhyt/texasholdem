(function () {
    var startMatch = function() {
        var m = new OfflineMatch();
        var mc = new MatchController(m);


        var p1 = new Player("Human", 3000);
        p1.setController(new UserController(p1, document.getElementById("user")));
        m.addPlayer(p1);

        var p2 = new Player("Aardvark", 12125);
        p2.setController(new AIController(p2));
        m.addPlayer(p2);

        var p3 = new Player("Coyote", 12125);
        p3.setController(new AIController(p3));
        m.addPlayer(p3);

        var p4 = new Player("Elephant", 12125);
        p4.setController(new AIController(p4));
        m.addPlayer(p4);

        var p5 = new Player("Kangaroo", 12125);
        p5.setController(new AIController(p5));
        m.addPlayer(p5);

        var p6 = new Player("Leopard", 12125);
        p6.setController(new AIController(p6));
        m.addPlayer(p6);

        var p7 = new Player("Panda", 12125);
        p7.setController(new AIController(p7));
        m.addPlayer(p7);

        var p8 = new Player("Squirrel", 12125);
        p8.setController(new AIController(p8));
        m.addPlayer(p8);

        var p9 = new Player("Zebra", 12125);
        p9.setController(new AIController(p9));
        m.addPlayer(p9);

        m.startGame();
    };

    window.onload = function () {
        startMatch();
    }
})();