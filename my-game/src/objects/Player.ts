import Phaser from 'phaser';

export interface PlayerConfig {
    speed: number; 
    jumpSpeed: number;
    glowColor: number;
    glowThickness: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private jumpKey?: Phaser.Input.Keyboard.Key;

    private readonly ACCEL = 2000;
    private readonly DRAG = 2600;

    private particles?: Phaser.GameObjects.Particles.ParticleEmitter;
    private particleTimer:number = 0;
    private glowSprite?: Phaser.GameObjects.Sprite;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, private cfg: PlayerConfig) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setGravityY(1200);
        this.setMaxVelocity(400, 1200);
        this.setBounce(0);
        this.setFriction(1, 0);
        const radius = Math.floor(this.width / 2);
        this.body?.setCircle(radius);
        this.body?.setDragX(this.DRAG);

        this.cursors = scene.input.keyboard?.createCursorKeys();
        this.jumpKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Replace preFX glow with a separate glow sprite to avoid clipping
        this.glowSprite = scene.add.sprite(x, y, texture);
        this.glowSprite.setTint(this.cfg.glowColor);
        this.glowSprite.setAlpha(1);
        this.glowSprite.setScale(1.5); // Make it larger to extend beyond the player
        this.glowSprite.setDepth(this.depth - 1); // Behind the player

        // Animate the glow
        scene.tweens.add({
            targets: this.glowSprite,
            scale: { from: 1.4, to: 1.6 },
            alpha: { from: 0.2, to: 0.4 },
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        /// Update particle emitter for bubble effects
        this.particles = scene.add.particles(0, 0, 'bubbleParticle', {
            speed: { min: 20, max: 50 }, // Slower, varied speed
            scale: { start: 0.5, end: 0 }, // Start small, shrink to nothing
            lifespan: 1000, // Longer life for floating effect
            alpha: { start: 0.8, end: 0 }, // Fade out
            quantity: 1, // Emit one at a time for subtle effect
            emitting: false,
            gravityY: -50 // Slight upward drift like bubbles rising
        });
        // Remove startFollow to manually position for aerodynamic flow
    }

    public update(time: number, delta: number) {
        let accelX = 0;
        if (this.cursors?.left?.isDown) accelX = -this.ACCEL;
        else if (this.cursors?.right?.isDown) accelX = this.ACCEL;

        this.setAccelerationX(accelX);

        if (this.body!.velocity.x !== 0) this.setFlipX(this.body!.velocity.x < 0);
        
        // Update glow sprite position to follow player
        this.glowSprite?.setPosition(this.x, this.y);
        this.glowSprite?.setFlipX(this.flipX);

        // Emit bubbles periodically while moving (reduced frequency for subtlety)
        this.particleTimer += delta;
        if (Math.abs(this.body!.velocity.x) > 50 && this.particleTimer > 200) { // Every 200ms
            this.particles?.emitParticle(1);
            this.particleTimer = 0;
        }

        if (Phaser.Input.Keyboard.JustDown(this.jumpKey!)) {
            this.setVelocityY(-this.cfg.jumpSpeed);
            this.particles?.emitParticle(3);
        }
    }
}