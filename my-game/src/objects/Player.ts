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

        // Add glow effect
        const glow = this.preFX?.addGlow(this.cfg.glowColor, this.cfg.glowThickness, 0, false);
        glow.outerStrength = 2;
        glow.innerStrength = 1;

        // Add a particle emitter for movement and jump effects
        this.particles = scene.add.particles(0, 0, 'particleTexture', {
            speed: 100,
            scale: { start: 0.5, end: 0 },
            lifespan: 300,
            alpha: { start: 1, end: 0 },
            quantity: 5,
            emitting: false
        });
        this.particles.startFollow(this);
    }

    public update(time: number, delta: number) {
        let accelX = 0;
        if (this.cursors?.left?.isDown) accelX = -this.ACCEL;
        else if (this.cursors?.right?.isDown) accelX = this.ACCEL;

        this.setAccelerationX(accelX);

        if (this.body!.velocity.x !== 0) this.setFlipX(this.body!.velocity.x < 0);
        
        // Emit particles periodically while moving horizontally
        this.particleTimer += delta;
        if (Math.abs(this.body!.velocity.x) > 50 && this.particleTimer > 100) {
            this.particles?.emitParticle(2);
            this.particleTimer = 0;
        }

        if (Phaser.Input.Keyboard.JustDown(this.jumpKey!)) {
            this.setVelocityY(-this.cfg.jumpSpeed);
            this.particles?.emitParticle(5);
        }
    }
}