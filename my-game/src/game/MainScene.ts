import Phaser from "phaser";
import {
    WORLD_SIZE,
    PLAYER_SIZE,
    GROUND_HEIGHT,
    PLAYER_JUMP,
    PLAYER_GRAVITY,
    PLAYER_SPEED,
} from "./constants";

// Staircase example to allow climbing
const LEVEL_OBSTACLES = [
    { x: 50, y: 0, width: 950, height: 50 }, // Top wall (base)
    { x: 950, y: 50, width: 50, height: 950 }, // Right wall (base)
    { x: 0, y: 950, width: 950, height: 50 }, // Bottom wall (base)
    { x: 0, y: 0, width: 50, height: 950 }, // Left wall (base)


    { x: 250, y: 200, width: 550, height: 50 }, // Top wall (level 1)
    { x: 750, y: 250, width: 50, height: 550 }, // Right wall (level 1)
    { x: 200, y: 750, width: 550, height: 50 }, // Bottom wall (level 1)
    { x: 200, y: 200, width: 50, height: 550 }, // Left wall (level 1)

    { x: 300, y: 600, width: 200, height: 30 }, // 
];

// const LEVEL_1_WALLS = [

// ]

export default class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private platforms: Phaser.Physics.Arcade.StaticBody[] = []; // store platform bodies

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

        // Obstacle texture (square tile will be stretched)
        const o = this.make.graphics({ x: 0, y: 0 });
        o.fillStyle(0x444444, 1);
        o.fillRect(0, 0, 100, 100);
        o.generateTexture("platformSolid", 100, 100);
    }

    create() {
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Sky
        this.add.rectangle(0, 0, WORLD_SIZE, WORLD_SIZE, 0x87ceeb).setOrigin(0);

        // Ground visual
        // this.add.image(0, WORLD_SIZE - GROUND_HEIGHT, "groundSolid").setOrigin(0);

        // Ground physics (top-left aligned and body refreshed)
        // const ground = this.physics.add.staticSprite(0, 0, null)
        //     .setOrigin(0, 0)
        //     .setPosition(0, WORLD_SIZE - GROUND_HEIGHT)
        //     .setDisplaySize(WORLD_SIZE, GROUND_HEIGHT)
        //     .refreshBody();

        // --- Create obstacles (physics bodies) BEFORE the player is created,
        // but DO NOT add colliders to this.player yet. Store them. ---
        const platformSprites: Phaser.Physics.Arcade.StaticImage[] = [];

        LEVEL_OBSTACLES.forEach(ob => {
            const platform = this.physics.add.staticSprite(0, 0, "platformSolid")
                .setOrigin(0, 0)
                .setPosition(ob.x, ob.y)
                .setDisplaySize(ob.width, ob.height)
                .refreshBody();

            platformSprites.push(platform);
            // do NOT call this.physics.add.collider(this.player, platform) here
        });

        // --- Now create the player AFTER obstacles exist ---
        const groundTop = WORLD_SIZE - GROUND_HEIGHT;

        this.player = this.physics.add
            .sprite(100, groundTop - PLAYER_SIZE, "playerSolid")
            .setOrigin(0.5, 1)
            .setCollideWorldBounds(true);

        // Ensure physics body = sprite size and add gravity
        this.player.setSize(PLAYER_SIZE, PLAYER_SIZE).setOffset(0, 0);
        (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(PLAYER_GRAVITY);

        // --- Colliders: now it's safe to add player <-> ground and player <-> platforms ---
        // this.physics.add.collider(this.player, ground);

        platformSprites.forEach(platform => {
            this.physics.add.collider(this.player, platform);
        });

        // Keep reference to platform bodies if you need them later
        this.platforms = platformSprites.map(s => s.body as Phaser.Physics.Arcade.StaticBody);

        // Camera + bounds
        this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.cameras.main.startFollow(this.player, true, 0.25, 0.25);
    }

    update() {
        if (!this.player) return;

        // If PLAYER_SPEED is 0, movement will appear disabled.
        // Use a small fallback to test keyboard movement if needed:
        const speed = PLAYER_SPEED || 150;

        // Left / right movement
        if (this.cursors.left?.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.cursors.right?.isDown) {
            this.player.setVelocityX(speed);
        } else {
            this.player.setVelocityX(0);
        }

        // Jump
        if (this.cursors.up?.isDown && this.player.body?.blocked.down) {
            this.player.setVelocityY(PLAYER_JUMP);
        }
    }
}