import Phaser from "phaser";
import MainScene  from "./MainScene";

export const createGame = (parentId: string) => {
    return new Phaser.Game ({
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: "#1e1e1e",
        parent: parentId,
        scene: [MainScene],
        physics: {
            default: "arcade",
            arcade: {
                gravity: { y: 500 },
            },
        },
    });
};