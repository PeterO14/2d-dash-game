import Phaser from "phaser";
import { Player } from '../objects/Player';
import { TEST_WORLD_SIZE } from "./constants";

export class PlayerTestScene extends Phaser.Scene {
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private player!: Player;

    constructor() {
        super("PlayerTestScene");
    }
    
    preload() {
        // Load any assets needed for the player and platforms
        // this.load.image('player', 'assets/player.png');
        const p = this.make.graphics({ x: 0, y: 0 });
        p.fillStyle(0xf26419);
        p.fillCircle(64 / 2, 64 / 2, 64 / 2);
        p.generateTexture("player", 64, 64);

        // this.load.image('platform', 'assets/platform.png');
        // Ground texture
        const g = this.make.graphics({ x: 0, y: 0 });
        g.fillStyle(0x8a8e91);
        g.fillRect(0, 0, 100, 100);
        g.generateTexture("platform", 100, 50);
    }

    create() {
        this.physics.world.setBounds(0, 0, TEST_WORLD_SIZE, TEST_WORLD_SIZE);

        // Background
        this.add.rectangle(0, 0, TEST_WORLD_SIZE, TEST_WORLD_SIZE, 0x33658a).setOrigin(0);

        this.platforms = this.physics.add.staticGroup();
        const p1 = this.platforms.create(100, TEST_WORLD_SIZE - 50, 'platform') as Phaser.Physics.Arcade.Image;
        p1.refreshBody();
        const p2 = this.platforms.create(550, 300, 'platform') as Phaser.Physics.Arcade.Image;
        p2.refreshBody();

        this.player = new Player(this, 100, 200, 'player', {
            speed: 240,
            jumpSpeed: 440, 
            coyoteTimeMs: 120,
            jumpBufferMs: 150,
            fallSquishMinVy: 350,
            glowColor: 0x00ffcc,
            glowThickness: 4
        });

        this.physics.add.collider(this.player, this.platforms);
        
        this.cameras.main.setBounds(0, 0, TEST_WORLD_SIZE, TEST_WORLD_SIZE);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(100, 100);
    }

    update(time: number, delta: number) {
        this.player.update(time, delta);
    }
}


// import Phaser from "phaser";
// import {
//     TEST_WORLD_SIZE,
//     PLAYER_SIZE,
//     GROUND_HEIGHT,
//     PLAYER_JUMP,
//     PLAYER_GRAVITY,
//     PLAYER_SPEED,
// } from "./constants";

// export default class PlayerTestScene extends Phaser.Scene {
//     private player!: Phaser.Physics.Arcade.Sprite;
//     private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

//     // Movement smoothing
//     private readonly ACCEL = 2000;
//     private readonly DRAG = 2600;
//     private readonly MAX_SPEED = PLAYER_SPEED;
    
//     // Jumping / coyote / buffer    
//     private readonly COYOTE_TIME = 120; // ms
//     private coyoteTimer = 0;
//     private readonly JUMP_BUFFER_TIME = 120; // ms
//     private jumpBufferTimer = 0;
//     private readonly VARIABLE_JUMP_CUT = 0.45; // early release lowers jump

//     constructor() {
//         super("PlayerTestScene");
//     }

//     preload() {
//         // Player texture (dust: 0x855a5c)
//         const p = this.make.graphics({ x: 0, y: 0 });
//         p.fillStyle(0x2f4858);
//         p.fillCircle(PLAYER_SIZE / 2, PLAYER_SIZE / 2, PLAYER_SIZE / 2);
//         p.generateTexture("playerSolid", PLAYER_SIZE, PLAYER_SIZE);

//         // Ground texture
//         const g = this.make.graphics({ x: 0, y: 0 });
//         g.fillStyle(0x8a8e91);
//         g.fillRect(0, 0, 100, 100);
//         g.generateTexture("wallSolid", 100, 100);
//     }

//     create() {
        
//         this.cursors = this.input.keyboard!.createCursorKeys();

//         // Background
//         this.add.rectangle(0, 0, TEST_WORLD_SIZE, TEST_WORLD_SIZE, 0xb8d4e3).setOrigin(0);

//         // Ground
//         const ground = this.physics.add.staticImage(0, TEST_WORLD_SIZE - GROUND_HEIGHT, "wallSolid")
//             .setOrigin(0, 0)
//             .setDisplaySize(TEST_WORLD_SIZE, GROUND_HEIGHT)
//             .refreshBody()


//         // Player
//         const spawnY = TEST_WORLD_SIZE - GROUND_HEIGHT - (PLAYER_SIZE / 2);
//         this.player = this.physics.add.sprite(150, spawnY, "playerSolid");
//         this.player.setOrigin(0.5, 0.5);
//         this.player.setCollideWorldBounds(true);

//         const body = this.player.body as Phaser.Physics.Arcade.Body;
//         body.setGravityY(PLAYER_GRAVITY);
//         body.setMaxVelocity(this.MAX_SPEED, 650);
//         body.setDragX(this.DRAG);
//         const radius = Math.floor(PLAYER_SIZE / 2);
//         body.setCircle(radius, 0, 0);

//         // Layered glow using preFX so the rim fades both inward and outward
//         // Bright thin inner rim (close to the player's edge)
//         const innerRim = this.player.preFX.addCircle(6, 0xffffcc, 0x000000, 1, 0.02);
//         innerRim.backgroundAlpha = 0;
//         innerRim.alpha = 1;

//         // Slightly larger outer edge (extends just outside the sprite, softens the hard white edge)
//         const outerEdge = this.player.preFX.addCircle(10, 0xffffcc, 0x000000, 1.06, 0.12);
//         outerEdge.backgroundAlpha = 0;
//         outerEdge.alpha = 0.6;

//         // Wide, faint soft halo that bleeds outward and softly inward
//         const outerSoft = this.player.preFX.addCircle(24, 0xffffcc, 0x000000, 1.2, 0.32);
//         outerSoft.backgroundAlpha = 0;
//         outerSoft.alpha = 0.25;

//         // Independent tweens for each layer to avoid a hard seam and to create a gentle breathing glow
//         this.tweens.add({
//             targets: innerRim,
//             thickness: { from: 4, to: 8 },
//             feather: { from: 0.01, to: 0.06 },
//             alpha: { from: 0.85, to: 1.0 },
//             duration: 900,
//             ease: 'Sine.easeInOut',
//             yoyo: true,
//             repeat: -1
//         });

//         this.tweens.add({
//             targets: outerEdge,
//             thickness: { from: 8, to: 14 },
//             feather: { from: 0.08, to: 0.18 },
//             alpha: { from: 0.45, to: 0.7 },
//             duration: 1100,
//             ease: 'Sine.easeInOut',
//             yoyo: true,
//             repeat: -1
//         });

//         this.tweens.add({
//             targets: outerSoft,
//             thickness: { from: 18, to: 28 },
//             feather: { from: 0.18, to: 0.42 },
//             alpha: { from: 0.12, to: 0.3 },
//             duration: 1400,
//             ease: 'Sine.easeInOut',
//             yoyo: true,
//             repeat: -1
//         });

//         this.physics.add.collider(this.player, ground);

//         // // Single camera
//         this.cameras.main.setBounds(0, 0, TEST_WORLD_SIZE, TEST_WORLD_SIZE);
//         this.physics.world.setBounds(0, 0, TEST_WORLD_SIZE, TEST_WORLD_SIZE);
//         this.cameras.main.setZoom(4);
//         this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
//     }

//     update(_time: number, delta: number) {
//         const body = this.player.body as Phaser.Physics.Arcade.Body;

//         // Update timers
//         if (body.blocked.down) {
//             this.coyoteTimer = this.COYOTE_TIME;
//         } else {
//             this.coyoteTimer -= delta;
//         }

//         if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
//             this.jumpBufferTimer = this.JUMP_BUFFER_TIME;
//         } else {
//             this.jumpBufferTimer -= delta;
//         }
        
//         // Movement
//         const accel = body.blocked.down ? this.ACCEL : this.ACCEL * 0.7;
//         const drag = body.blocked.down ? this.DRAG : this.DRAG * 0.5;
//         body.setDragX(drag);
       
//         if (this.cursors.left?.isDown) {
//             body.setAccelerationX(-accel);
//         } else if (this.cursors.right?.isDown) {
//             body.setAccelerationX(accel);
//         } else {
//             body.setAccelerationX(0);
//         }
        
//         // Jumping
//         const wantsToJump = this.jumpBufferTimer > 0;
//         if (wantsToJump && (body.blocked.down || this.coyoteTimer > 0)) {
//             this.jumpBufferTimer = 0;
//             body.setVelocityY(PLAYER_JUMP);
//             this.coyoteTimer = 0;
//         }

//         // Variable jump height
//         if (body.velocity.y < 0 && !this.cursors.up?.isDown) {
//             body.setVelocityY(body.velocity.y * this.VARIABLE_JUMP_CUT);
//         }
//     }
// }