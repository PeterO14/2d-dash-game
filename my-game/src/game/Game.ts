import Phaser from "phaser";
import TitleScene from "./TitleScene";
import GameScene  from "./GameScene";
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from "./constants";

export function createGame(parent: string | HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    parent,
    backgroundColor: "#ff0000ff",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      },
    },
    scene: [TitleScene, GameScene],
  };

  return new Phaser.Game(config);
};