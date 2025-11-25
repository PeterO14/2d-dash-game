import Phaser from "phaser";
import {
    WORLD_SIZE,
    PLAYER_SIZE,
    GROUND_HEIGHT,
    PLAYER_JUMP,
    PLAYER_GRAVITY,
    PLAYER_SPEED,
} from "./constants";

const LEVEL_OBSTACLES = [
    { x: 600, y: 700, width: 100, height: 30 }
];

export default class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private groundPhysics!: Phaser.Physics.Arcade.StaticBody;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() {
        super("GameScene");
    }

    preload() {
        // Player texture
        const p = this.make.graphics({ x: 0, y: 0 });
        p.fillStyle(0xff4444, 1);
        p.fillRect(0, 0, PLAYER_SIZE, PLAYER_SIZE);
        p.generateTexture("playerSolid", PLAYER_SIZE, PLAYER_SIZE);

        // Ground texture
        const g = this.make.graphics({ x: 0, y: 0 });
        g.fillStyle(0x228B22, 1);
        g.fillRect(0, 0, WORLD_SIZE, GROUND_HEIGHT);
        g.generateTexture("groundSolid", WORLD_SIZE, GROUND_HEIGHT);
    }

    create() {
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Sky background
        this.add.rectangle(0, 0, WORLD_SIZE, WORLD_SIZE, 0x87ceeb).setOrigin(0);

        // Ground visual
        this.add.image(0, WORLD_SIZE - GROUND_HEIGHT, "groundSolid").setOrigin(0);

        // Ground physics
        const ground = this.physics.add
            .staticSprite(0, 0, "groundSolid")
            .setOrigin(0, 0);

        this.groundPhysics = ground.body as Phaser.Physics.Arcade.StaticBody;

        // Player
        this.player = this.physics.add
            .sprite(100, 0, "playerSolid")
            .setOrigin(0, 0)
            .setCollideWorldBounds(true);

        // Ensure physics body = sprite size
        this.player.setSize(PLAYER_SIZE, PLAYER_SIZE).setOffset(0, 0);
        (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(PLAYER_GRAVITY);

        // Fix spawn overlap with a delayed position reset
        this.time.delayedCall(0, () => {
            const groundTop = WORLD_SIZE - GROUND_HEIGHT;
            this.player.setY(groundTop - PLAYER_SIZE);
        });

        // Collider: player + ground
        this.physics.add.collider(this.player, ground);

        // Obstacles
        LEVEL_OBSTACLES.forEach(ob => {
            const platform = this.physics.add.staticImage(ob.x, ob.y, null)
                .setDisplaySize(ob.width, ob.height)
                .setOrigin(0, 0);
            
            platform.refreshBody();

            this.physics.add.collider(this.player, platform);
        });

        // Camera
        this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);

        this.cameras.main.startFollow(this.player, true, 0.25, 0.25);
    }

    update() {
        if (!this.player) return;

        // Left / right
        if (this.cursors.left?.isDown) {
            this.player.setVelocityX(-PLAYER_SPEED);
        } else if (this.cursors.right?.isDown) {
            this.player.setVelocityX(PLAYER_SPEED);
        } else {
            this.player.setVelocityX(0);
        }

        // Jump
        if (this.cursors.up?.isDown && this.player.body?.blocked.down) {
            this.player.setVelocityY(PLAYER_JUMP);
        }
    }
}