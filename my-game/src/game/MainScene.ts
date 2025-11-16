import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    preload() {

    }

    create() {
        this.add.text(100, 100, "Hello, Peter!", {
            font: "24px Arial",
            color: "#ffffff",
        });
    }

    update() {
        
    }
}