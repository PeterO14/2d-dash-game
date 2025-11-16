import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
    player!: Phaser.Physics.Arcade.Sprite;
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    gameStarted = false;

    constructor() {
        super("MainScene");
    }

    preload() {}

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();

        this.add.rectangle(0, 0, 2000, 600, 0x87ceeb).setOrigin(0, 0);;
        const ground = this.add.rectangle(400, 580, 1600, 40, 0x44aa44);
        this.physics.add.existing(ground, true);

        const titleText = this.add.text(400, 200, "2D Dash", {
            font: "48px Arial",
            color: "#ffffff"
        }).setOrigin(0.5);

        const startButton = this.add.text(400, 200, "START", {
            font: "32px Arial",
            color: "#000000",
            backgroundColor: "#ffffff",
            padding: { x: 20, y: 10 },
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        startButton.on("pointerdown", () => {
            this.gameStarted = true;

            titleText.destroy();
            startButton.destroy();

            this.player.setVisible(true);
            this.player.body.enable = true;
        });

        this.player = this.physics.add
            .sprite(200, 450, "")
            .setDisplaySize(50, 50)
            .setTint(0xff0000);

        this.player.setVisible(false);
        this.player.body.enable = false;

        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);

        this.player.body?.setGravityY(800);

        this.physics.add.collider(this.player, ground);

        this.cameras.main.startFollow(this.player, true, 0.3, 0.3);

        this.cameras.main.setBounds(0, 0, 2000, 600);
        this.physics.world.setBounds(0, 0, 2000, 600);
    }

    update() {
        if (!this.gameStarted) return;

        if (!this.player) return;

        const speed = 250;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed * 2);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed * 2);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body?.blocked.down) {
            this.player.setVelocityY(-450);
        }
    }
}