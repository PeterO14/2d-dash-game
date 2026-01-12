import Phaser from "phaser";
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from "./constants";

const FONT_STACK = "Arial, Helvetica, sans-serif";

const TITLE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT_STACK,
  fontSize: "64px",
  color: "#0b0f17",
  fontStyle: "bold",
}

const SUBTITLE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT_STACK,
  fontSize: "18px",
  color: "#0b0f17",
}

const BUTTON_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT_STACK,
  fontSize: "36px",
  color: "#0b0f17",
  fontStyle: "bold",
}

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {

    // Prefer using the configured viewport size for a fixed-size game.
    // If you later make the game resizable, swap these for this.scale.width/height.
    const width = VIEWPORT_WIDTH;
    const height = VIEWPORT_HEIGHT;
    const centerX = width / 2;
    const centerY = height / 2;

    // Background
    this.add.rectangle(0, 0, width, height, 0x87ceeb).setOrigin(0);        
      
    // Title + intro copy
    this.add.text(centerX, centerY - 170, "2D Dash", TITLE_STYLE).setOrigin(0.5);

    this.add
      .text(
        centerX,
        centerY - 115,
        "Dash through the maze and avoid obstacles to reach the finish line!",
        SUBTITLE_STYLE
      )
      .setOrigin(0.5);

    this.add
      .text(
        centerX,
        centerY - 60,
        "Controls: Move (Arrow Keys / A-D) ~ Jump (Space) ~ Dash (Shift)",
        SUBTITLE_STYLE
      )
      .setOrigin(0.5);

    // Start Button
    const startButton = this.createButton(centerX, centerY + 40, 260, 84, "START", () => {
      this.scene.start("GameScene");
    });

    // Keyboard start (best-practice: match pointer behavior)
    const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    enterKey?.once("down", () => startButton.activate());
    spaceKey?.once("down", () => startButton.activate());
    
    // Tiny hint text
    this.add
      .text(centerX, centerY + 110, "Press Enter / Space to start", SUBTITLE_STYLE)
      .setOrigin(0.5)
      .setAlpha(0.9);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onActivate: () => void
  ) {
    const radius = 18;

    // Container so visuals + hit-area move together (important for tweening)
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    container.add(bg);

    const text = this.add.text(0, 0, label, BUTTON_TEXT_STYLE).setOrigin(0.5);
    container.add(text);

    // Hit area centered on container origin (0,0)
    const hit = this.add
      .zone(0, 0, width, height)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    container.add(hit);

    const draw = (fill: number, textColor: string) => {
      bg.clear();
      bg.fillStyle(fill, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);

      bg.lineStyle(2, 0x0b0f17, 0.25);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
      
      text.setColor(textColor);
    };

    // Hover + click
    hit.on("pointerover", () => draw(0xdddddd, "#0b0f17"));
    hit.on("pointerout", () => draw(0xffffff, "#0b0f17"));
    hit.on("pointerdown", onActivate);

    // Initial draw
    draw(0xffffff, "#0b0f17");

    // Bob tween (subtle and professional)
    const bobTween = this.tweens.add({
      targets: container,
      y: y - 6,          // bob up by 6px
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    return {
      container,
      activate: onActivate,
      destroy: () => {
        bobTween.stop();
        container.destroy(true);
      },
    };
  }
}