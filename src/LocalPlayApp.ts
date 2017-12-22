import { LocalTable } from "./LocalTable";
import { OfflineMatchView } from "./OfflineMatchView";
import { Player } from "./Player";
import { AIController, Strategy } from "./AIController";
import { UserController } from "./UserController";

export class LocalPlayApp {

    private table: LocalTable;
    private view: OfflineMatchView;

    init() {
        this.view = new OfflineMatchView();
        this.newTable();
        document.getElementById("next-match").addEventListener("click", () => {
            this.newTable();
        });
    }

    newTable() {
        if (this.table !== undefined) {
            this.table.finish();
        }
        this.table = new LocalTable();
        let k = document.getElementById("next-game").cloneNode(true);
        document.getElementById("next-game").parentNode.replaceChild(k, document.getElementById("next-game"));
        document.getElementById("next-game").addEventListener("click", () => {
            this.table.startGame();
        });

        let p1 = new Player("Human", 3000);
        p1.setController(new UserController(p1));
        this.table.addPlayer(p1);

        let p2 = new Player("Aardvark", 12125);
        p2.setController(new AIController(p2, Strategy.Normal));
        this.table.addPlayer(p2);

        let p3 = new Player("Coyote", 12125);
        p3.setController(new AIController(p3, Strategy.Aggressive));
        this.table.addPlayer(p3);

        let p4 = new Player("Elephant", 12125);
        p4.setController(new AIController(p4, Strategy.Passive));
        this.table.addPlayer(p4);

        let p5 = new Player("Kangaroo", 12125);
        p5.setController(new AIController(p5, Strategy.Tricky));
        this.table.addPlayer(p5);

        let p6 = new Player("Leopard", 12125);
        p6.setController(new AIController(p6, Strategy.Aggressive));
        this.table.addPlayer(p6);

        let p7 = new Player("Panda", 12125);
        p7.setController(new AIController(p7, Strategy.Passive));
        this.table.addPlayer(p7);

        let p8 = new Player("Squirrel", 12125);
        p8.setController(new AIController(p8, Strategy.Tricky));
        this.table.addPlayer(p8);

        let p9 = new Player("Zebra", 12125);
        p9.setController(new AIController(p9, Strategy.Normal));
        this.table.addPlayer(p9);

        this.table.startGame();
    }

}