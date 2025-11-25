import Phaser from "phaser";
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from "./constants";


const BUTTON_STYLE = {
    fontFamily: "Arial",
    fontSize: "40px",
    color: "#000000",
}

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super("TitleScene");
    }

    create() {
        // Background
        this.add.rectangle(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 0x87ceeb).setOrigin(0);        
        
        // Button dimensions
        const btnWidth = 240;
        const btnHeight = 80;
        const btnRadius = 20;
        const btnX = VIEWPORT_WIDTH / 2 - btnWidth / 2;
        const btnY = VIEWPORT_HEIGHT / 2 - btnHeight / 2;

        // Button background
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0xffffff, 1);
        buttonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, btnRadius);

        // Interactive zone over button
        const buttonZone = this.add.zone(btnX, btnY, btnWidth, btnHeight)
            .setOrigin(0)
            .setInteractive({ useHandCursor: true });

        // Button text
        const buttonText = this.add.text(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2, "START", BUTTON_STYLE)
            .setOrigin(0.5)

        // Hover logic
        buttonZone.on("pointerover", () => {
            buttonBg.clear();
            buttonBg.fillStyle(0xdddddd, 1);
            buttonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, btnRadius);
            buttonText.setColor("#0000ff");
        });
        buttonZone.on("pointerout", () => {
            buttonBg.clear();
            buttonBg.fillStyle(0xffffff, 1);
            buttonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, btnRadius);
            buttonText.setColor("#000000");
        });

        buttonZone.on("pointerdown", () => {
            this.scene.start("GameScene");
        });
    }
}