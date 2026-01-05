import Phaser from "phaser";
// import TitleScene from "./TitleScene";
// import GameScene  from "./MainScene";
import { PlayerTestScene } from "./PlayerTestScene";
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from "./constants";

export const createGame = (parentId: string) => {
    return new Phaser.Game ({
        type: Phaser.AUTO,
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT,
        parent: parentId,
        backgroundColor: "#ff0000ff",
        physics: {
            default: "arcade",
            arcade: {
                gravity: { y: 0 },
                debug: false
            },
        },
        // scene: [TitleScene, GameScene],
        scene: [PlayerTestScene],
    });
};