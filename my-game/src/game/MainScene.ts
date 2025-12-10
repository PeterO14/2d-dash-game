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

interface MovingWallData {
    axis: "x" | "y";
    speed: number;
    range: number;
    start: number;
}

const MINIMAP_SIZE = 150;
const MINIMAP_PADDING = 10;

export default class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private staticWalls: Phaser.Physics.Arcade.StaticImage[] = [];
    private movingWalls: Phaser.Physics.Arcade.Image[] = [];
    private movingWallData: MovingWallData[] = [];

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
    private wallJumpCooldown = 0;
    private readonly WALL_JUMP_COOLDOWN_TIME = 150; // ms

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

        // --- Background ---
        this.add.rectangle(0, 0, WORLD_SIZE, WORLD_SIZE, 0x87ceeb).setOrigin(0);

        // --- Static Walls ---
        STATIC_WALLS.forEach(w => {
            const wall = this.physics.add.staticImage(w.x, w.y, "wallSolid")
                .setOrigin(0, 0)
                .setDisplaySize(w.width, w.height)
                .refreshBody();
            this.staticWalls.push(wall);
        });

        // --- Moving Walls ---
        MOVING_WALLS.forEach((w, i) => {
            const wall = this.physics.add.image(w.x, w.y, "wallSolid")
                .setOrigin(0, 0)
                .setDisplaySize(w.width, w.height);

            wall.setImmovable(true);
            wall.body.allowGravity = false;
            wall.body.pushable = false;

            // store movement data in parallel array
            this.movingWallData[i] = {
                axis: w.axis as "x" | "y",
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

        // --- Player ---
        const spawnY = WORLD_SIZE - GROUND_HEIGHT - PLAYER_SIZE;
        this.player = this.physics.add.sprite(150, spawnY, "playerSolid");
        this.player.setOrigin(0.5, 1);
        this.player.setCollideWorldBounds(true);

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setGravityY(PLAYER_GRAVITY);
        body.setMaxVelocity(this.MAX_SPEED, 650);
        body.setDragX(this.DRAG);
        
        // --- Colliders ---
        this.staticWalls.forEach(w => this.physics.add.collider(this.player, w));
        this.movingWalls.forEach(w => this.physics.add.collider(this.player, w));

        // --- Camera ---
        this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        this.cameras.main.setDeadzone(200, 200);

        // --- Minimap ---
        this.minimapCamera = this.cameras.add(
            MINIMAP_PADDING,
            MINIMAP_PADDING,
            MINIMAP_SIZE,
            MINIMAP_SIZE
        )
            .setZoom(MINIMAP_SIZE / WORLD_SIZE)
            .setScroll(0, 0)
            .setBackgroundColor(0x000000)
            .startFollow(this.player);
        
        // --- Logging ---
        console.log("GameScene created. Player spawned at:", this.player.x, this.player.y);
    }

    update(time: number, delta: number) {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const dt = delta / 1000;

        this.updateTimers(delta, body);
        this.updateWallSlide(delta, body);
        this.updateMovement(body);
        this.updateJumping(body);
        this.updateMovingWalls(dt);

        // --- Debug Logging ---
        if (time % 1000 < 20) { // Log every ~1s
            console.log(`Player: (${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)}) v=(${body.velocity.x.toFixed(1)}, ${body.velocity.y.toFixed(1)})`);
        }
    }

    // --- TIMERS ---
    private updateTimers(delta: number, body: Phaser.Physics.Arcade.Body) {
        // Coyote time: grace period after leaving ground
        if (body.blocked.down) {
            this.coyoteTimer = this.COYOTE_TIME;
            this.jumpCount = 0;
        } else {
            this.coyoteTimer -= delta;
        }

        // Jump buffer: grace period before landing
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.jumpBufferTimer = this.JUMP_BUFFER_TIME;
        } else {
            this.jumpBufferTimer -= delta;
        }

        // Wall jump cooldown
        if (this.wallJumpCooldown > 0) {
            this.wallJumpCooldown -= delta;
        }
    }

    // --- WALL SLIDE DETECTION ---
    private updateWallSlide(delta: number, body: Phaser.Physics.Arcade.Body) {
        // Use Arcade Physics blocked flags for wall detection
        this.isTouchingWallLeft = body.blocked.left;
        this.isTouchingWallRight = body.blocked.right;
        const touchingWall = this.isTouchingWallLeft || this.isTouchingWallRight;

        // Wall slide: slow downward movement when sliding on wall
        if (!body.blocked.down && touchingWall && body.velocity.y > this.WALL_SLIDE_SPEED) {
            body.setVelocityY(this.WALL_SLIDE_SPEED);
        }
    }

    // --- MOVEMENT ---
    private updateMovement(body: Phaser.Physics.Arcade.Body) {
        // Horizontal movement with acceleration and drag
        if (this.cursors.left?.isDown) {
            body.setAccelerationX(-this.ACCEL);
        } else if (this.cursors.right?.isDown) {
            body.setAccelerationX(this.ACCEL);
        } else {
            body.setAccelerationX(0);
        }
    }

    // --- JUMPING ---
    private updateJumping(body: Phaser.Physics.Arcade.Body) {
        const canNormalJump = this.coyoteTimer > 0 && this.jumpCount < this.MAX_JUMPS;
        const wantsToJump = this.jumpBufferTimer > 0;
        const touchingWall = this.isTouchingWallLeft || this.isTouchingWallRight;

        // --- Wall Jump ---
        if (
            touchingWall && 
            wantsToJump && 
            !body.blocked.down &&
            this.wallJumpCooldown <= 0
        ) {
            this.jumpBufferTimer = 0;
            // this.wallJumpCooldown = this.WALL_JUMP_COOLDOWN_TIME;

            const dir = this.isTouchingWallLeft ? 1 : -1;

            body.setVelocityY(this.WALL_JUMP_FORCE_Y);
            body.setVelocityX(dir * this.WALL_JUMP_FORCE_X);

            this.jumpCount++;
            // Logging
            console.log("Wall jump:", dir > 0 ? "right" : "left");
            return;
        }

        // --- Normal Jump ---
        if (wantsToJump) {
            this.jumpBufferTimer = 0;
            body.setVelocityY(PLAYER_JUMP);
            this.jumpCount++;
            // Logging
            console.log("Normal jump");
        }

        // --- Variable Jump Height ---
        if (body.velocity.y < 0 && !this.cursors.up?.isDown) {
            body.setVelocityY(body.velocity.y * this.VARIABLE_JUMP_CUT);
        }
    }

    // --- MOVING WALLS ---
    private updateMovingWalls(dt: number) {
        this.movingWalls.forEach((w, i) => {
            const data = this.movingWallData[i];
            const axis = data.axis;
            const body = w.body as Phaser.Physics.Arcade.Body;

            // Store previous position for player carry logic
            const prevX = w.x;
            const prevY = w.y;

            // Move using velocity for proper collision
            if (axis === "x") {
                body.setVelocityX(data.speed);
                w.x += data.speed * dt;
            } else {
                body.setVelocityY(data.speed);
                w.y += data.speed * dt;
            }

            // Range check + reversal
            const dist = Math.abs((axis === "x" ? w.x : w.y) - data.start);
            if (dist >= data.range) {
                data.speed *= -1;
                const overshoot = dist - data.range;
                if (axis === "x") {
                    w.x += overshoot * Math.sign(data.speed);
                } else {
                    w.y += overshoot * Math.sign(data.speed);
                }
                // Logging
                console.log(`Platform ${i} reversed direction`);
            }

            // Update the physics body to match new position
            body.updateFromGameObject();

            // --- Player Carry Logic ---
            const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
            const standingOn =
                playerBody.blocked.down &&
                playerBody.touching.down &&
                w.body?.touching.up;

            // Calculate platform movement delta
            const dx = w.x - prevX;
            const dy = w.y - prevY;

            // Carry player with platform (industry standard: use velocity, not direct position)
            if (standingOn) {
                // If platform moves up, prevent bounce
                if (dy < 0) {
                    playerBody.setVelocityY(0);
                    playerBody.blocked.down = false;
                    playerBody.touching.down = false;
                    this.player.y += dy;
                    playerBody.y += dy;
                } else if (dy > 0) {
                    this.player.y += dy;
                    playerBody.y += dy;
                }
                // Carry horizontally if needed
                if (dx !== 0) {
                    this.player.x += dx;
                    playerBody.x += dx;
                }
            }
        });
    }
}