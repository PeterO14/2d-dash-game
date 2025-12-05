import Phaser from "phaser";
import {
    WORLD_SIZE,
    PLAYER_SIZE,
    GROUND_HEIGHT,
    PLAYER_JUMP,
    PLAYER_GRAVITY,
    PLAYER_SPEED,
} from "./constants";

import { LEVEL_OBSTACLES } from "./levelObstacles";

export default class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private platforms: Phaser.Physics.Arcade.StaticBody[] = [];

    // Mini-map camera
    private minimapCamera?: Phaser.Cameras.Scene2D.Camera;

    // Movement smoothing
    private readonly ACCEL = 2200;
    private readonly DRAG = 1800;
    private readonly MAX_SPEED = PLAYER_SPEED || 250;
    
    // Jumping
    private jumpCount = 0;
    private readonly MAX_JUMPS = 4000;
    
    private readonly COYOTE_TIME = 120; // ms grace after leaving ground
    private coyoteTimer = 0;

    private readonly JUMP_BUFFER_TIME = 120; // ms grace before touching ground
    private jumpBufferTimer = 0;

    private readonly VARIABLE_JUMP_CUT = 0.45; // early release lowers jump

    // WALL MOVEMENT
    private readonly WALL_SLIDE_SPEED = 70;
    private readonly WALL_JUMP_FORCE_X = 320;
    private readonly WALL_JUMP_FORCE_Y = PLAYER_JUMP;

    private isTouchingWallLeft = false;
    private isTouchingWallRight = false;

    constructor() {
        super("GameScene");
    }

    preload() {
        // Player texture
        const p = this.make.graphics({ x: 0, y: 0 });
        p.fillStyle(0xff4444);
        p.fillRect(0, 0, PLAYER_SIZE, PLAYER_SIZE);
        p.generateTexture("playerSolid", PLAYER_SIZE, PLAYER_SIZE);

        // Platform texture
        const o = this.make.graphics({ x: 0, y: 0 });
        o.fillStyle(0x444444);
        o.fillRect(0, 0, 100, 100);
        o.generateTexture("platformSolid", 100, 100);
    }

    create() {
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Background
        this.add.rectangle(0, 0, WORLD_SIZE, WORLD_SIZE, 0x87ceeb).setOrigin(0);

        // Create all platforms BEFORE the player
        const platformSprites: Phaser.Physics.Arcade.StaticImage[] = [];

        LEVEL_OBSTACLES.forEach(ob => {
            const platform = this.physics.add.staticImage(ob.x, ob.y, "platformSolid")
                .setOrigin(0, 0)
                .setDisplaySize(ob.width, ob.height)
                .refreshBody();
            platformSprites.push(platform);
        });

        this.platforms = platformSprites.map(p => p.body as Phaser.Physics.Arcade.StaticBody);

        // Player
        const spawnY = WORLD_SIZE - GROUND_HEIGHT - PLAYER_SIZE;
        this.player = this.physics.add.sprite(150, spawnY, "playerSolid");
        this.player.setOrigin(0.5, 1);
        this.player.setCollideWorldBounds(true);

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setGravityY(PLAYER_GRAVITY);
        body.setMaxVelocity(this.MAX_SPEED, 650);
        body.setDragX(this.DRAG);
        
        // Colliders
        platformSprites.forEach(p => this.physics.add.collider(this.player, p));

        // Camera
        this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        this.cameras.main.setDeadzone(200, 200);

        // Minimap
        this.minimapCamera = this.cameras.add(10, 10, 150, 150)
            .setZoom(150 / WORLD_SIZE)
            .setScroll(0, 0)
            .setBackgroundColor(0x000000)
            .startFollow(this.player);
    }

    update(time: number, delta: number) {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const dt = delta / 1000;

        // Update timers
        if (body.blocked.down) {
            this.coyoteTimer = this.COYOTE_TIME;
            this.jumpCount = 0;
        } else {
            this.coyoteTimer -= delta;
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.jumpBufferTimer = this.JUMP_BUFFER_TIME;
        } else {
            this.jumpBufferTimer -= delta;
        }

        // Wall detection
        this.isTouchingWallLeft = body.blocked.left;
        this.isTouchingWallRight = body.blocked.right;
        const touchingWall = this.isTouchingWallLeft || this.isTouchingWallRight;

        // Wall slide
        if (!body.blocked.down && touchingWall && body.velocity.y > this.WALL_SLIDE_SPEED) {
            body.setVelocityY(this.WALL_SLIDE_SPEED);
        }

        // Horizontal movement - acceleration based
        if (this.cursors.left?.isDown) {
            body.setAccelerationX(-this.ACCEL);
        } else if (this.cursors.right?.isDown) {
            body.setAccelerationX(this.ACCEL);
        } else {
            body.setAccelerationX(0);
        }

        // Jumping
        const canNormalJump = this.coyoteTimer > 0 || this.jumpCount < this.MAX_JUMPS;

        const wantsToJump = this.jumpBufferTimer > 0;

        // Wall jumping
        if (touchingWall && wantsToJump && !body.blocked.down) {
            this.jumpBufferTimer = 0;

            const dir = this.isTouchingWallLeft ? 1 : -1;

            body.setVelocityY(this.WALL_JUMP_FORCE_Y);
            body.setVelocityX(dir * this.WALL_JUMP_FORCE_X);

            this.jumpCount++;
            return;
        }

        // Normal jumping
        if (wantsToJump && canNormalJump) {
            this.jumpBufferTimer = 0;
            body.setVelocityY(PLAYER_JUMP);
            this.jumpCount++;
        }

        // Variable jump height
        if (body.velocity.y < 0 && !this.cursors.up?.isDown) {
            body.setVelocityY(body.velocity.y * this.VARIABLE_JUMP_CUT);
        }
    }
}