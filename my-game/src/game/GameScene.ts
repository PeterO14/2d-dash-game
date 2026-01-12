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
    start: number;    
    rangeUp?: number;
    rangeDown?: number;
    rangeLeft?: number;
    rangeRight?: number;
    state: "goingPositive" | "returningFromPositive" | "goingNegative" | "returningFromNegative";
    traveled: number;
}

const MINIMAP_SIZE = 150;
const MINIMAP_PADDING = 10;
const DASH_SPEED = 500;
const DASH_TIME = 180;

export default class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private staticWalls: Phaser.Physics.Arcade.StaticImage[] = [];
    private movingWalls: Phaser.Physics.Arcade.Image[] = [];
    private movingWallData: MovingWallData[] = [];

    private minimapCamera?: Phaser.Cameras.Scene2D.Camera;

    // Movement smoothing
    private readonly ACCEL = 2000;
    private readonly DRAG = 2600;
    private readonly MAX_SPEED = PLAYER_SPEED;
    
    // Jumping
    private jumpCount = 0;
    private readonly MAX_JUMPS = Infinity;
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

    // Celeste-style state
    private canJump = false;
    private canDash = true;
    private isDashing = false;
    private dashTimer = 0;
    private dashDir = new Phaser.Math.Vector2(0, 0);


    constructor() {
        super("GameScene");
    }

    preload() {
        // Player texture
        const p = this.make.graphics({ x: 0, y: 0 });
        p.fillStyle(0xf26419);
        p.fillRect(PLAYER_SIZE / 2, PLAYER_SIZE / 2, PLAYER_SIZE / 2, PLAYER_SIZE / 2);
        p.generateTexture("playerSolid", PLAYER_SIZE, PLAYER_SIZE);

        // Static wall texture
        const sw = this.make.graphics({ x: 0, y: 0 });
        sw.fillStyle(0x2f4858);
        sw.fillRect(0, 0, 100, 100);
        sw.generateTexture("staticWallSolid", 100, 100);

        // Moving wall texture
        const mw = this.make.graphics({ x: 0, y: 0 });
        mw.fillStyle(0x33658a);
        mw.fillRect(0, 0, 100, 100);
        mw.generateTexture("movingWallSolid", 100, 100);
    }

    create() {
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Background
        this.add.rectangle(0, 0, WORLD_SIZE, WORLD_SIZE, 0x55dde0).setOrigin(0);

        // Static Walls
        STATIC_WALLS.forEach(w => {
            const wall = this.physics.add.staticImage(w.x, w.y, "staticWallSolid")
                .setOrigin(0, 0)
                .setDisplaySize(w.width, w.height)
                .refreshBody();
            this.staticWalls.push(wall);
        });

        // Moving Walls
        MOVING_WALLS.forEach((w, i) => {
            const wall = this.physics.add.image(w.x, w.y, "movingWallSolid")
                .setOrigin(0, 0)
                .setDisplaySize(w.width, w.height);
            wall.setImmovable(true);
            wall.body.allowGravity = false;
            wall.body.pushable = false;

            this.movingWallData[i] = {
                axis: w.axis as "x" | "y",
                speed: w.speed,
                start: w.axis === "x" ? w.x : w.y,
                rangeUp: w.rangeUp,
                rangeDown: w.rangeDown,
                rangeLeft: w.rangeLeft,
                rangeRight: w.rangeRight,
                state: "goingPositive",
                traveled: 0,
            };
            this.movingWalls.push(wall);
            wall.body.checkCollision.up = true;
            wall.body.checkCollision.down = true;
            wall.body.checkCollision.left = true;
            wall.body.checkCollision.right = true;
        });

        // Player
        const spawnY = WORLD_SIZE - GROUND_HEIGHT - PLAYER_SIZE / 2;
        this.player = this.physics.add.sprite(150, spawnY, "playerSolid");
        this.player.setOrigin(0.5, 0.5);
        this.player.setCollideWorldBounds(true);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setGravityY(PLAYER_GRAVITY);
        body.setMaxVelocity(this.MAX_SPEED, 650);
        body.setDragX(this.DRAG);
        body.setCircle(Math.floor(PLAYER_SIZE / 2), 0, 0);

        // Colliders
        this.staticWalls.forEach(w => this.physics.add.collider(this.player, w));
        this.movingWalls.forEach(w => this.physics.add.collider(this.player, w));

        // Camera
        this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        this.cameras.main.setDeadzone(200, 200);

        // Minimap
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
}

    update(time: number, delta: number) {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const dt = delta / 1000;

        this.updateTimers(delta, body);
        this.updateWallSlide(body);
        this.updateDash(body, delta);
        if (!this.isDashing) {
            this.updateMovement(body);
            this.updateJumping(body);
        }
        this.updateMovingWalls(dt);

        // Velocity transfer from moving platform
        if (body.blocked.down) {
            for (let i = 0; i < this.movingWalls.length; i++) {
                const wall = this.movingWalls[i];
                const wallBody = wall.body as Phaser.Physics.Arcade.Body;
                const playerBottom = this.player.getBounds().bottom;
                const wallTop = wall.getBounds().top;
                const overlapX =
                    this.player.getBounds().right > wall.getBounds().left &&
                    this.player.getBounds().left < wall.getBounds().right;
                const onTop = Math.abs(playerBottom - wallTop) < 2 && overlapX;
                if (onTop) {
                    body.velocity.x += wallBody.velocity.x;
                    break;
                }
            }
        }
    }

    private updateTimers(delta: number, body: Phaser.Physics.Arcade.Body) {
        // Coyote time
        if (body.blocked.down) {
            this.coyoteTimer = this.COYOTE_TIME;
            this.canJump = true;
            this.canDash = true;
            this.jumpCount = 0;
        } else if (body.blocked.left || body.blocked.right) {
            this.canDash = true;
            this.jumpCount = 0;
        } else {
            this.coyoteTimer -= delta;
        }

        // Jump buffer
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

    private updateWallSlide(body: Phaser.Physics.Arcade.Body) {
        this.isTouchingWallLeft = body.blocked.left;
        this.isTouchingWallRight = body.blocked.right;
        const touchingWall = this.isTouchingWallLeft || this.isTouchingWallRight;

        // Wall slide (slow fall when holding toward wall)
        if (
            !body.blocked.down && 
            touchingWall && 
            ((this.isTouchingWallLeft && this.cursors.left?.isDown) ||
                (this.isTouchingWallRight && this.cursors.right?.isDown)) &&
            body.velocity.y > this.WALL_SLIDE_SPEED
        ) {
            body.setVelocityY(this.WALL_SLIDE_SPEED);
            this.canDash = true;
        }
    }

    private updateMovement(body: Phaser.Physics.Arcade.Body) {
        // Full air control, but lower accelaeration in air
        const accel = body.blocked.down ? this.ACCEL : this.ACCEL * 0.7;
        const drag = body.blocked.down ? this.DRAG : this.DRAG * 0.5;
        body.setDragX(drag);

        if (this.cursors.left?.isDown) {
            body.setAccelerationX(-accel);
        } else if (this.cursors.right?.isDown) {
            body.setAccelerationX(accel);
        } else {
            body.setAccelerationX(0);
        }
    }

    private updateJumping(body: Phaser.Physics.Arcade.Body) {
        const wantsToJump = this.jumpBufferTimer > 0;
        const canCoyote = this.coyoteTimer > 0 && this.canJump;
        const touchingWall = this.isTouchingWallLeft || this.isTouchingWallRight;

        // Wall Jump
        if (touchingWall && wantsToJump && !body.blocked.down && this.wallJumpCooldown <= 0) {
            this.jumpBufferTimer = 0;
            this.wallJumpCooldown = this.WALL_JUMP_COOLDOWN_TIME;
            this.canJump = false;
            const dir = this.isTouchingWallLeft ? 1 : -1;
            body.setVelocityY(this.WALL_JUMP_FORCE_Y);
            body.setVelocityX(dir * this.WALL_JUMP_FORCE_X);
            this.canDash = true;
            this.jumpCount = 0;
            return;
        }

        // Normal Jump
        if (wantsToJump && (canCoyote || this.jumpCount < this.MAX_JUMPS)) {
            this.jumpBufferTimer = 0;
            body.setVelocityY(PLAYER_JUMP);
            this.canJump = false;
            this.jumpCount++;
        }

        // Variable Jump Height
        if (body.velocity.y < 0 && !this.cursors.up?.isDown) {
            body.setVelocityY(body.velocity.y * this.VARIABLE_JUMP_CUT);
        }
    }

    private updateDash(body: Phaser.Physics.Arcade.Body, delta: number) {
        // Start dash
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space!) && this.canDash && !this.isDashing) {
            let dx = 0, dy = 0;
            if (this.cursors.left?.isDown) dx = -1;
            if (this.cursors.right?.isDown) dx = 1;
            if (this.cursors.up?.isDown) dy = -1;
            if (this.cursors.down?.isDown) dy = 1;
            if (dx === 0 && dy === 0) dx = this.player.flipX ? -1 : 1; // Default forward
        
            this.dashDir.set(dx, dy).normalize();
            this.isDashing = true;
            this.dashTimer = DASH_TIME;
            this.canDash = false;

            body.setAllowGravity(false);
            body.setVelocity(
                this.dashDir.x * DASH_SPEED,
                this.dashDir.y * DASH_SPEED
            );
        }

        // Dash movement
        if (this.isDashing) {
            this.dashTimer -= delta;
            body.setVelocity(this.dashDir.x * DASH_SPEED, this.dashDir.y * DASH_SPEED);
            
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                body.setAllowGravity(true);
            }
        }
    }

    private updateMovingWalls(dt: number) {
        this.movingWalls.forEach((w, i) => {
            const data = this.movingWallData[i];
            const axis = data.axis;
            const body = w.body as Phaser.Physics.Arcade.Body;
            
            let direction = 0;
            let targetRange = 0;

            // Determine movement direction and target range
            if (axis === "x") {
                if (data.state === "goingPositive") {
                    direction = 1;
                    targetRange = data.rangeRight ?? 0;
                } else if (data.state === "returningFromPositive") {
                    direction = -1;
                    targetRange = data.start ?? 0;
                } else if (data.state === "goingNegative") {
                    direction = -1;
                    targetRange = data.rangeLeft ?? 0;
                } else if (data.state === "returningFromNegative") {
                    direction = 1;
                    targetRange = data.start ?? 0;
                }
            } else {
                if (data.state === "goingPositive") {
                    direction = 1;
                    targetRange = data.rangeDown ?? 0;
                } else if (data.state === "returningFromPositive") {
                    direction = -1;
                    targetRange = data.start ?? 0;
                } else if (data.state === "goingNegative") {
                    direction = -1;
                    targetRange = data.rangeUp ?? 0;
                } else if (data.state === "returningFromNegative") {
                    direction = 1;
                    targetRange = data.start ?? 0;
                }
            }

            const moveAmount = data.speed * direction * dt;
            data.traveled += Math.abs(moveAmount);

            if (axis === "x") {
                w.x += moveAmount;
            } else {
                w.y += moveAmount;
            }

            // Check if reached target range
            if (data.traveled >= targetRange && targetRange > 0) {
                data.traveled = 0;

                // Transition to next state
                if (data.state === "goingPositive") {
                    data.state = "returningFromPositive";
                } else if (data.state === "returningFromPositive") {
                    data.state = "goingNegative";
                } else if (data.state === "goingNegative") {
                    data.state = "returningFromNegative";
                } else if (data.state === "returningFromNegative") {
                    data.state = "goingPositive";
                }
            }

            body.updateFromGameObject();    
        });
    }
}