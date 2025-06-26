export type EnemyType = 'cia' | 'army' | 'rat';

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
        this.width = 25;
        this.height = 25;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        break;
      case 'army':
        this.width = 25;
        this.height = 25;
        this.speedX = (Math.random() - 0.5) * 1.5;
        this.speedY = (Math.random() - 0.5) * 1.5;
        break;
      case 'rat':
        this.width = 20;
        this.height = 20;
        this.speedX = (Math.random() - 0.5) * 3;
        this.speedY = (Math.random() - 0.5) * 3;
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
    
    // Update animation
    this.animationTimer += deltaTime;
    if (this.animationTimer > 200) {
      this.animationFrame = (this.animationFrame + 1) % 4;
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
    }
    
    ctx.restore();
  }

  private renderCIAAgent(ctx: CanvasRenderingContext2D) {
    // CIA Agent with walk cycle animation
    let agentPixels;
    if (this.animationFrame < 15) {
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

    for (let row = 0; row < agentPixels.length; row++) {
      for (let col = 0; col < agentPixels[row].length; col++) {
        const colorIndex = agentPixels[row][col];
        if (colorIndex > 0) {
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(this.x + col, this.y + row, 1, 1);
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
    if (this.animationFrame < 15) {
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

    for (let row = 0; row < armyPixels.length; row++) {
      for (let col = 0; col < armyPixels[row].length; col++) {
        const colorIndex = armyPixels[row][col];
        if (colorIndex > 0) {
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(this.x + col, this.y + row, 1, 1);
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
    // Radioactive Rat with twitchy walk cycle animation
    let ratPixels;
    if (this.animationFrame < 10) {
      ratPixels = this.getRatWalkFrame1();
    } else if (this.animationFrame < 20) {
      ratPixels = this.getRatWalkFrame2();
    } else {
      ratPixels = this.getRatWalkFrame3(); // Extra twitchy frame
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

    for (let row = 0; row < ratPixels.length; row++) {
      for (let col = 0; col < ratPixels[row].length; col++) {
        const colorIndex = ratPixels[row][col];
        if (colorIndex > 0) {
          ctx.fillStyle = colors[colorIndex];
          ctx.fillRect(this.x + col, this.y + row, 1, 1);
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

  public destroy() {
    this.active = false;
  }
}
