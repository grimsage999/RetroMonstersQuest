export type EnemyType = 'cia' | 'army' | 'rat' | 'zombie' | 'boss';

export class Enemy {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private speedX: number;
  private speedY: number;
  private type: EnemyType;
  private animationFrame: number = 0;
  private animationTimer: number = 0;
  private active: boolean = true;

  constructor(x: number, y: number, type: EnemyType) {
    this.x = x;
    this.y = y;
    this.type = type;
    
    switch (type) {
      case 'cia':
        this.width = 48; // 16 * 3 scale for visibility
        this.height = 48;
        this.speedX = (Math.random() - 0.5) * 4;
        this.speedY = (Math.random() - 0.5) * 4;
        break;
      case 'army':
        this.width = 48; // 16 * 3 scale for visibility
        this.height = 48;
        this.speedX = (Math.random() - 0.5) * 3;
        this.speedY = (Math.random() - 0.5) * 3;
        break;
      case 'rat':
        this.width = 36; // 12 * 3 scale for visibility
        this.height = 36;
        this.speedX = (Math.random() - 0.5) * 5;
        this.speedY = (Math.random() - 0.5) * 5;
        break;
      case 'zombie':
        this.width = 48; // 16 * 3 scale for visibility
        this.height = 48;
        this.speedX = (Math.random() - 0.5) * 2.5;
        this.speedY = (Math.random() - 0.5) * 2.5;
        break;
    }
  }

  public update(deltaTime: number, canvasWidth: number, canvasHeight: number) {
    if (!this.active) return;
    
    // Move enemy
    this.x += this.speedX;
    this.y += this.speedY;
    
    // Bounce off walls
    if (this.x <= 0 || this.x + this.width >= canvasWidth) {
      this.speedX = -this.speedX;
    }
    if (this.y <= 0 || this.y + this.height >= canvasHeight) {
      this.speedY = -this.speedY;
    }
    
    // Keep within bounds
    this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
    this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
    
    // Update animation - smoother timing to match player
    this.animationTimer += deltaTime;
    if (this.animationTimer > 400) { // Slower, cleaner animation
      this.animationFrame = (this.animationFrame + 1) % 2; // Simple 2-frame walk cycle
      this.animationTimer = 0;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;
    
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    switch (this.type) {
      case 'cia':
        this.renderCIAAgent(ctx);
        break;
      case 'army':
        this.renderArmyMan(ctx);
        break;
      case 'rat':
        this.renderRadioactiveRat(ctx);
        break;
      case 'zombie':
        this.renderZombie(ctx);
        break;
    }
    
    ctx.restore();
  }

  private renderCIAAgent(ctx: CanvasRenderingContext2D) {
    // CIA Agent with walk cycle animation
    let agentPixels;
    if (this.animationFrame === 0) {
      agentPixels = this.getCIAWalkFrame1();
    } else {
      agentPixels = this.getCIAWalkFrame2();
    }

    const colors = [
      'transparent', // 0
      '#000000',     // 1 - black hair/suit
      '#fdbcb4',     // 2 - skin
      '#333333',     // 3 - sunglasses
      '#ffffff',     // 4 - collar
      '#1a1a1a',     // 5 - dark suit
      '#ff0000',     // 6 - red tie
    ];

    const scale = 3; // 3x scale for better visibility
    for (let row = 0; row < agentPixels.length; row++) {
      for (let col = 0; col < agentPixels[row].length; col++) {
        const colorIndex = agentPixels[row][col];
        if (colorIndex > 0) {
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(this.x + col * scale, this.y + row * scale, scale, scale);
        }
      }
    }
  }

  private getCIAWalkFrame1() {
    // CIA Agent walk frame 1 - left leg forward
    return [
      [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0], // Row 0 - hair
      [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0], // Row 1 - head
      [0,1,2,2,2,2,2,2,2,2,1,0,0,0,0,0], // Row 2 - forehead
      [0,1,2,3,2,2,2,2,3,2,1,0,0,0,0,0], // Row 3 - sunglasses
      [0,1,2,3,3,2,2,3,3,2,1,0,0,0,0,0], // Row 4 - sunglasses
      [0,1,2,2,1,2,2,1,2,2,1,0,0,0,0,0], // Row 5 - nose/mouth
      [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0], // Row 6 - chin
      [0,0,0,1,4,4,4,4,1,0,0,0,0,0,0,0], // Row 7 - collar
      [0,0,1,1,5,6,6,5,1,1,0,0,0,0,0,0], // Row 8 - suit/tie
      [0,1,1,1,5,6,6,5,1,1,1,0,0,0,0,0], // Row 9 - suit
      [0,1,1,1,1,6,6,1,1,1,1,0,0,0,0,0], // Row 10 - suit
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0], // Row 11 - suit
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0], // Row 12 - suit bottom
      [0,0,1,1,1,0,0,1,1,0,0,0,0,0,0,0], // Row 13 - left leg forward
      [0,1,1,1,1,0,0,1,1,0,0,0,0,0,0,0], // Row 14 - walking stance
      [0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0], // Row 15 - shoes
    ];
  }

  private getCIAWalkFrame2() {
    // CIA Agent walk frame 2 - right leg forward
    return [
      [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0], // Row 0 - hair
      [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0], // Row 1 - head
      [0,1,2,2,2,2,2,2,2,2,1,0,0,0,0,0], // Row 2 - forehead
      [0,1,2,3,2,2,2,2,3,2,1,0,0,0,0,0], // Row 3 - sunglasses
      [0,1,2,3,3,2,2,3,3,2,1,0,0,0,0,0], // Row 4 - sunglasses
      [0,1,2,2,1,2,2,1,2,2,1,0,0,0,0,0], // Row 5 - nose/mouth
      [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0], // Row 6 - chin
      [0,0,0,1,4,4,4,4,1,0,0,0,0,0,0,0], // Row 7 - collar
      [0,0,1,1,5,6,6,5,1,1,0,0,0,0,0,0], // Row 8 - suit/tie
      [0,1,1,1,5,6,6,5,1,1,1,0,0,0,0,0], // Row 9 - suit
      [0,1,1,1,1,6,6,1,1,1,1,0,0,0,0,0], // Row 10 - suit
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0], // Row 11 - suit
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0], // Row 12 - suit bottom
      [0,0,0,1,1,0,0,1,1,1,0,0,0,0,0,0], // Row 13 - right leg forward
      [0,0,0,1,1,0,0,1,1,1,1,0,0,0,0,0], // Row 14 - walking stance
      [0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0], // Row 15 - shoes
    ];
  }

  private renderArmyMan(ctx: CanvasRenderingContext2D) {
    // Army Man with walk cycle animation
    let armyPixels;
    if (this.animationFrame === 0) {
      armyPixels = this.getArmyWalkFrame1();
    } else {
      armyPixels = this.getArmyWalkFrame2();
    }

    const colors = [
      'transparent', // 0
      '#228b22',     // 1 - green uniform/helmet
      '#fdbcb4',     // 2 - skin
      '#000000',     // 3 - eyes/details
      '#1f5f1f',     // 4 - dark green camo
    ];

    const scale = 3; // 3x scale for better visibility
    for (let row = 0; row < armyPixels.length; row++) {
      for (let col = 0; col < armyPixels[row].length; col++) {
        const colorIndex = armyPixels[row][col];
        if (colorIndex > 0) {
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(this.x + col * scale, this.y + row * scale, scale, scale);
        }
      }
    }
  }

  private getArmyWalkFrame1() {
    // Army Man walk frame 1 - left leg forward, rifle position
    return [
      [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0], // Row 0 - helmet
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0], // Row 1 - helmet
      [0,1,1,2,2,2,2,2,2,1,1,0,0,0,0,0], // Row 2 - face
      [0,1,2,3,2,2,2,2,3,2,1,0,0,0,0,0], // Row 3 - eyes
      [0,1,2,2,2,3,3,2,2,2,1,0,0,0,0,0], // Row 4 - nose
      [0,1,2,2,3,2,2,3,2,2,1,0,0,0,0,0], // Row 5 - mouth
      [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0], // Row 6 - chin
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0], // Row 7 - neck
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0], // Row 8 - uniform
      [0,1,1,4,1,1,1,1,4,1,1,0,0,0,0,0], // Row 9 - camo pattern
      [0,1,1,1,1,4,4,1,1,1,1,0,0,0,0,0], // Row 10 - camo pattern
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0], // Row 11 - uniform
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0], // Row 12 - uniform bottom
      [0,0,1,1,1,0,0,1,1,0,0,0,0,0,0,0], // Row 13 - left leg forward
      [0,1,1,1,1,0,0,1,1,0,0,0,0,0,0,0], // Row 14 - marching stance
      [0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0], // Row 15 - boots
    ];
  }

  private getArmyWalkFrame2() {
    // Army Man walk frame 2 - right leg forward, rifle position
    return [
      [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0], // Row 0 - helmet
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0], // Row 1 - helmet
      [0,1,1,2,2,2,2,2,2,1,1,0,0,0,0,0], // Row 2 - face
      [0,1,2,3,2,2,2,2,3,2,1,0,0,0,0,0], // Row 3 - eyes
      [0,1,2,2,2,3,3,2,2,2,1,0,0,0,0,0], // Row 4 - nose
      [0,1,2,2,3,2,2,3,2,2,1,0,0,0,0,0], // Row 5 - mouth
      [0,0,1,2,2,2,2,2,2,1,0,0,0,0,0,0], // Row 6 - chin
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0], // Row 7 - neck
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0], // Row 8 - uniform
      [0,1,1,4,1,1,1,1,4,1,1,0,0,0,0,0], // Row 9 - camo pattern
      [0,1,1,1,1,4,4,1,1,1,1,0,0,0,0,0], // Row 10 - camo pattern
      [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0], // Row 11 - uniform
      [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0], // Row 12 - uniform bottom
      [0,0,0,1,1,0,0,1,1,1,0,0,0,0,0,0], // Row 13 - right leg forward
      [0,0,0,1,1,0,0,1,1,1,1,0,0,0,0,0], // Row 14 - marching stance
      [0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0], // Row 15 - boots
    ];
  }

  private renderRadioactiveRat(ctx: CanvasRenderingContext2D) {
    // Radioactive Rat with simple walk cycle animation
    let ratPixels;
    if (this.animationFrame === 0) {
      ratPixels = this.getRatWalkFrame1();
    } else {
      ratPixels = this.getRatWalkFrame2();
    }

    const colors = [
      'transparent', // 0
      '#1a5f1a',     // 1 - dark green outline
      '#39ff14',     // 2 - bright radioactive green
      '#ff0000',     // 3 - red eyes
      '#ffffff',     // 4 - white eye highlights
      '#000000',     // 5 - nose/mouth
      '#32cd32',     // 6 - tail
    ];

    // Add pulsing glowing effect
    const glowIntensity = Math.sin(Date.now() * 0.01) * 2 + 3;
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = glowIntensity;

    const scale = 3; // 3x scale for better visibility
    for (let row = 0; row < ratPixels.length; row++) {
      for (let col = 0; col < ratPixels[row].length; col++) {
        const colorIndex = ratPixels[row][col];
        if (colorIndex > 0) {
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(this.x + col * scale, this.y + row * scale, scale, scale);
        }
      }
    }
  }

  private getRatWalkFrame1() {
    // Rat walk frame 1 - normal stance
    return [
      [0,0,1,1,0,0,0,0,1,1,0,0], // Row 0 - ears
      [0,1,2,2,1,0,0,1,2,2,1,0], // Row 1 - ears detail
      [1,2,2,3,2,1,1,2,3,2,2,1], // Row 2 - head
      [1,2,3,4,3,2,2,3,4,3,2,1], // Row 3 - eyes
      [1,2,2,2,2,2,2,2,2,2,2,1], // Row 4 - face
      [0,1,2,5,5,2,2,5,5,2,1,0], // Row 5 - nose/mouth
      [0,0,1,2,2,2,2,2,2,1,0,0], // Row 6 - snout
      [0,0,1,1,2,2,2,2,1,1,0,0], // Row 7 - body
      [0,1,2,2,2,2,2,2,2,2,1,0], // Row 8 - body
      [0,1,2,2,2,2,2,2,2,2,1,0], // Row 9 - body
      [0,0,1,1,0,0,0,0,1,1,0,0], // Row 10 - legs
      [0,0,0,0,0,0,0,0,0,6,6,6], // Row 11 - tail
    ];
  }

  private getRatWalkFrame2() {
    // Rat walk frame 2 - scurrying
    return [
      [0,0,1,1,0,0,0,0,1,1,0,0], // Row 0 - ears
      [0,1,2,2,1,0,0,1,2,2,1,0], // Row 1 - ears detail
      [1,2,2,3,2,1,1,2,3,2,2,1], // Row 2 - head
      [1,2,3,4,3,2,2,3,4,3,2,1], // Row 3 - eyes
      [1,2,2,2,2,2,2,2,2,2,2,1], // Row 4 - face
      [0,1,2,5,5,2,2,5,5,2,1,0], // Row 5 - nose/mouth
      [0,0,1,2,2,2,2,2,2,1,0,0], // Row 6 - snout
      [0,1,1,2,2,2,2,2,1,1,0,0], // Row 7 - body (crouched)
      [1,2,2,2,2,2,2,2,2,2,1,0], // Row 8 - body (extended)
      [0,2,2,2,2,2,2,2,2,2,0,0], // Row 9 - body
      [1,1,0,0,0,0,0,0,1,1,0,0], // Row 10 - legs spread
      [0,0,0,0,0,0,0,6,6,6,6,0], // Row 11 - tail curled
    ];
  }

  private getRatWalkFrame3() {
    // Rat walk frame 3 - twitchy/alert
    return [
      [0,1,1,1,0,0,0,1,1,1,0,0], // Row 0 - ears perked
      [1,2,2,2,1,0,0,1,2,2,2,1], // Row 1 - ears alert
      [1,2,2,3,2,1,1,2,3,2,2,1], // Row 2 - head
      [1,2,3,4,3,2,2,3,4,3,2,1], // Row 3 - eyes wide
      [1,2,2,2,2,2,2,2,2,2,2,1], // Row 4 - face
      [0,1,2,5,5,2,2,5,5,2,1,0], // Row 5 - nose/mouth
      [0,0,1,2,2,2,2,2,2,1,0,0], // Row 6 - snout
      [0,0,1,2,2,2,2,2,2,1,0,0], // Row 7 - body raised
      [0,1,2,2,2,2,2,2,2,2,1,0], // Row 8 - body
      [0,1,2,2,2,2,2,2,2,2,1,0], // Row 9 - body
      [0,1,1,0,0,0,0,1,1,0,0,0], // Row 10 - legs ready to pounce
      [0,0,0,0,0,0,6,6,6,6,0,0], // Row 11 - tail arched
    ];
  }

  public getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  public isActive(): boolean {
    return this.active;
  }

  private renderZombie(ctx: CanvasRenderingContext2D) {
    // Zombie with walk cycle animation
    let zombiePixels;
    if (this.animationFrame === 0) {
      zombiePixels = this.getZombieWalkFrame1();
    } else {
      zombiePixels = this.getZombieWalkFrame2();
    }

    const colors = [
      'transparent', // 0
      '#2F4F2F',     // 1 - dark green skin
      '#228B22',     // 2 - lighter green
      '#8B0000',     // 3 - dark red blood
      '#FF0000',     // 4 - bright red
      '#654321',     // 5 - brown clothes
      '#1C1C1C',     // 6 - black shadows
      '#FFFFFF'      // 7 - white teeth/eyes
    ];

    // Render 16x16 sprite scaled 3x
    for (let row = 0; row < zombiePixels.length; row++) {
      for (let col = 0; col < zombiePixels[row].length; col++) {
        const colorIndex = zombiePixels[row][col];
        if (colorIndex !== 0) {
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(this.x + col * 3, this.y + row * 3, 3, 3);
        }
      }
    }
  }

  private getZombieWalkFrame1() {
    return [
      [0,0,0,2,2,2,2,0,0,2,2,2,2,0,0,0], // Row 0 - head outline
      [0,0,2,1,1,1,1,2,2,1,1,1,1,2,0,0], // Row 1
      [0,2,1,7,1,1,1,1,1,1,1,7,1,1,2,0], // Row 2 - eyes
      [0,2,1,1,1,3,1,1,1,1,3,1,1,1,2,0], // Row 3 - wounds
      [0,2,1,1,7,7,7,1,1,7,7,7,1,1,2,0], // Row 4 - teeth
      [0,2,1,1,1,1,1,1,1,1,1,1,1,1,2,0], // Row 5
      [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0], // Row 6 - neck
      [0,0,5,5,5,5,5,5,5,5,5,5,5,5,0,0], // Row 7 - shirt
      [0,0,5,1,5,5,5,5,5,5,5,1,5,5,0,0], // Row 8 - torn shirt
      [0,0,5,5,1,1,1,1,1,1,1,1,5,5,0,0], // Row 9 - body
      [0,0,5,5,1,1,1,1,1,1,1,1,5,5,0,0], // Row 10
      [0,0,1,1,1,1,1,0,0,1,1,1,1,1,0,0], // Row 11 - arms
      [0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0], // Row 12
      [0,0,0,1,1,1,0,0,0,0,1,1,1,0,0,0], // Row 13 - legs
      [0,0,0,6,6,6,0,0,0,0,6,6,6,0,0,0], // Row 14 - feet
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]  // Row 15
    ];
  }

  private getZombieWalkFrame2() {
    return [
      [0,0,0,2,2,2,2,0,0,2,2,2,2,0,0,0], // Row 0 - head outline
      [0,0,2,1,1,1,1,2,2,1,1,1,1,2,0,0], // Row 1
      [0,2,1,7,1,1,1,1,1,1,1,7,1,1,2,0], // Row 2 - eyes
      [0,2,1,1,1,3,1,1,1,1,3,1,1,1,2,0], // Row 3 - wounds
      [0,2,1,1,7,7,7,1,1,7,7,7,1,1,2,0], // Row 4 - teeth
      [0,2,1,1,1,1,1,1,1,1,1,1,1,1,2,0], // Row 5
      [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0], // Row 6 - neck
      [0,0,5,5,5,5,5,5,5,5,5,5,5,5,0,0], // Row 7 - shirt
      [0,0,5,1,5,5,5,5,5,5,5,1,5,5,0,0], // Row 8 - torn shirt
      [0,0,5,5,1,1,1,1,1,1,1,1,5,5,0,0], // Row 9 - body
      [0,0,5,5,1,1,1,1,1,1,1,1,5,5,0,0], // Row 10
      [0,0,0,1,1,1,1,0,0,1,1,1,1,0,0,0], // Row 11 - arms (different position)
      [0,0,1,1,1,1,1,0,0,1,1,1,1,1,0,0], // Row 12
      [0,0,1,1,1,0,0,0,0,0,1,1,1,1,0,0], // Row 13 - legs (walking)
      [0,0,6,6,6,0,0,0,0,0,6,6,6,0,0,0], // Row 14 - feet
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]  // Row 15
    ];
  }

  public destroy() {
    this.active = false;
  }
}
