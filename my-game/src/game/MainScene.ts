import Phaser from "phaser";
import {
    WORLD_SIZE,
    PLAYER_SIZE,
    GROUND_HEIGHT,
    PLAYER_JUMP,
    PLAYER_GRAVITY,
    PLAYER_SPEED,
} from "./constants";

import { STATIC_WALLS, MOVING_WALLS } from "./walls";

export default class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private staticWalls: Phaser.Physics.Arcade.StaticImage[] = [];
    private movingWalls: Phaser.Physics.Arcade.Image[] = [];

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

    // Wall jump/movement
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
        const w = this.make.graphics({ x: 0, y: 0 });
        w.fillStyle(0x444444);
        w.fillRect(0, 0, 100, 100);
        w.generateTexture("wallSolid", 100, 100);
    }

    create() {
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Background
        this.add.rectangle(0, 0, WORLD_SIZE, WORLD_SIZE, 0x87ceeb).setOrigin(0);

        STATIC_WALLS.forEach(w => {
            const wall = this.physics.add.staticImage(w.x, w.y, "wallSolid")
                .setOrigin(0, 0)
                .setDisplaySize(w.width, w.height)
                .refreshBody();

            this.staticWalls.push(wall);
        });

        MOVING_WALLS.forEach(w => {
            const wall = this.physics.add.image(w.x, w.y, "wallSolid")
                .setOrigin(0, 0)
                .setDisplaySize(w.width, w.height);

            wall.setImmovable(true);
            wall.body.allowGravity = false;
            wall.body.pushable = false;

            // store movement data
            (wall as any).moveData = {
                axis: w.axis,
                speed: w.speed,
                range: w.range,
                start: w.axis === "x" ? w.x : w.y
            };

            this.movingWalls.push(wall);

            wall.body.checkCollision.up = true;
            wall.body.checkCollision.down = true;
            wall.body.checkCollision.left = true;
            wall.body.checkCollision.right = true;
        });

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
        this.staticWalls.forEach(w => this.physics.add.collider(this.player, w));
        this.movingWalls.forEach(w => this.physics.add.collider(this.player, w));

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

        this.updateTimers(delta, body);
        this.updateWallSlide(body);
        this.updateMovement(body);
        this.updateJumping(body);
        this.updateMovingWalls(dt);
    }

    // TIMERS
    private updateTimers(delta: number, body: Phaser.Physics.Arcade.Body) {
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

    }

    // WALL SLIDE DETECTION
    private updateWallSlide(body: Phaser.Physics.Arcade.Body) {
        this.isTouchingWallLeft = body.blocked.left;
        this.isTouchingWallRight = body.blocked.right;
        const touchingWall = this.isTouchingWallLeft || this.isTouchingWallRight;

        if (!body.blocked.down && touchingWall && body.velocity.y > this.WALL_SLIDE_SPEED) {
            body.setVelocityY(this.WALL_SLIDE_SPEED);
        }
    }

    // MOVEMENT
    private updateMovement(body: Phaser.Physics.Arcade.Body) {
        if (this.cursors.left?.isDown) {
            body.setAccelerationX(-this.ACCEL);
        } else if (this.cursors.right?.isDown) {
            body.setAccelerationX(this.ACCEL);
        } else {
            body.setAccelerationX(0);
        }
    }

    // JUMPING
    private updateJumping(body: Phaser.Physics.Arcade.Body) {
        const canNormalJump = this.coyoteTimer > 0 || this.jumpCount < this.MAX_JUMPS;
        const wantsToJump = this.jumpBufferTimer > 0;
        const touchingWall = this.isTouchingWallLeft || this.isTouchingWallRight;

        // Wall jump
        if (touchingWall && wantsToJump && !body.blocked.down) {
            this.jumpBufferTimer = 0;

            const dir = this.isTouchingWallLeft ? 1 : -1;

            body.setVelocityY(this.WALL_JUMP_FORCE_Y);
            body.setVelocityX(dir * this.WALL_JUMP_FORCE_X);

            this.jumpCount++;
            return;
        }

        // Normal jump
        if (wantsToJump && canNormalJump) {
            this.jumpBufferTimer = 0;
            body.setVelocityY(PLAYER_JUMP);
            this.jumpCount++;
        }

        // Variable jump
        if (body.velocity.y < 0 && !this.cursors.up?.isDown) {
            body.setVelocityY(body.velocity.y * this.VARIABLE_JUMP_CUT);
        }
    }

    // MOVING WALL
    private updateMovingWalls(dt: number) {
        this.movingWalls.forEach(w => {
            const data = (w as any).moveData;
            const axis = data.axis;
            const body = w.body as Phaser.Physics.Arcade.Body;

            // Store previous position
            const prevY = w.y;

            // Move
            if (axis === "x") {
                w.x += data.speed * dt;
            } else {
                w.y += data.speed * dt;
            }

            // Range check + reversal
            const dist = Math.abs((axis=== "x" ? w.x : w.y) - data.start);
            if (dist >= data.range) {
                data.speed *= -1;

                const overshoot = dist - data.range;
                if (axis === "x") {
                    w.x += overshoot * Math.sign(data.speed);
                } else {
                    w.y += overshoot * Math.sign(data.speed);
                }
            }

            // Update the physics body
            body.updateFromGameObject();

            // Assign body velocity so collisiions work correctly
            if (axis === "x") {
                body.setVelocityX(data.speed);
            } else {
                body.setVelocityY(data.speed);
            }

            // Player riding logic
            const playerBody = this.player.body as Phaser.Physics.Arcade.Body;

            const playerStandingOn = 
                playerBody.blocked.down &&
                playerBody.touching.down &&
                w.body?.touching.up;

            if (playerStandingOn) {
                // Carry player the same amount the paltform moved
                const dy = w.y - prevY;
                this.player.y += dy;
                playerBody.y += dy;
            }
        });
    }
}
