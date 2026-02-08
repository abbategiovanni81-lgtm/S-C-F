/**
 * Smart Engine Routing
 * Selects optimal AI model based on tier, availability, and cost
 */

interface EngineConfig {
  name: string;
  taskType: string;
  tierAvailability: string[];
  costPerUnit: number;
  qualityScore: number;
  speedScore: number;
  isActive: boolean;
  priority: number;
}

interface TaskRequirements {
  taskType: string;
  userTier: string;
  prioritizeQuality?: boolean;
  prioritizeSpeed?: boolean;
  prioritizeCost?: boolean;
  maxCost?: number;
}

interface RoutingDecision {
  selectedEngine: string;
  reason: string;
  estimatedCost: number;
  estimatedQuality: number;
  estimatedSpeed: number;
  alternatives: Array<{
    engine: string;
    score: number;
  }>;
}

export class SmartEngineRouter {
  private engineConfigs: Map<string, EngineConfig> = new Map();

  constructor() {
    // Initialize default engine configurations
    this.initializeDefaultConfigs();
  }

  /**
   * Initialize default engine configurations
   */
  private initializeDefaultConfigs(): void {
    const defaults: EngineConfig[] = [
      // Video Generation
      {
        name: "sora",
        taskType: "video_generation",
        tierAvailability: ["premium", "pro", "studio"],
        costPerUnit: 500, // $5.00 per video
        qualityScore: 95,
        speedScore: 60,
        isActive: true,
        priority: 90,
      },
      {
        name: "steveai",
        taskType: "video_generation",
        tierAvailability: ["studio"],
        costPerUnit: 300,
        qualityScore: 85,
        speedScore: 70,
        isActive: true,
        priority: 80,
      },
      {
        name: "a2e_avatar",
        taskType: "video_generation",
        tierAvailability: ["premium", "pro", "studio"],
        costPerUnit: 200,
        qualityScore: 80,
        speedScore: 75,
        isActive: true,
        priority: 75,
      },
      // Image Generation
      {
        name: "dalle",
        taskType: "image_generation",
        tierAvailability: ["premium", "pro", "studio"],
        costPerUnit: 40, // $0.40 per image
        qualityScore: 90,
        speedScore: 85,
        isActive: true,
        priority: 90,
      },
      {
        name: "fal",
        taskType: "image_generation",
        tierAvailability: ["core", "premium", "pro", "studio"],
        costPerUnit: 20,
        qualityScore: 75,
        speedScore: 90,
        isActive: true,
        priority: 70,
      },
      // Transcription
      {
        name: "whisper",
        taskType: "transcription",
        tierAvailability: ["core", "premium", "pro", "studio"],
        costPerUnit: 6, // $0.06 per minute
        qualityScore: 95,
        speedScore: 85,
        isActive: true,
        priority: 95,
      },
      // Text-to-Speech
      {
        name: "elevenlabs",
        taskType: "text_to_speech",
        tierAvailability: ["premium", "pro", "studio"],
        costPerUnit: 10,
        qualityScore: 95,
        speedScore: 80,
        isActive: true,
        priority: 90,
      },
      {
        name: "openai_tts",
        taskType: "text_to_speech",
        tierAvailability: ["core", "premium", "pro", "studio"],
        costPerUnit: 5,
        qualityScore: 85,
        speedScore: 90,
        isActive: true,
        priority: 80,
      },
      // LLM Text Generation
      {
        name: "gpt4",
        taskType: "text_generation",
        tierAvailability: ["premium", "pro", "studio"],
        costPerUnit: 3,
        qualityScore: 95,
        speedScore: 75,
        isActive: true,
        priority: 90,
      },
      {
        name: "claude",
        taskType: "text_generation",
        tierAvailability: ["pro", "studio"],
        costPerUnit: 3,
        qualityScore: 93,
        speedScore: 80,
        isActive: true,
        priority: 85,
      },
    ];

    defaults.forEach(config => {
      this.engineConfigs.set(`${config.name}_${config.taskType}`, config);
    });
  }

  /**
   * Route task to optimal engine
   */
  selectEngine(requirements: TaskRequirements): RoutingDecision {
    // Get all available engines for this task type and tier
    const availableEngines = this.getAvailableEngines(
      requirements.taskType,
      requirements.userTier
    );

    if (availableEngines.length === 0) {
      throw new Error(`No available engines for ${requirements.taskType} at tier ${requirements.userTier}`);
    }

    // Score each engine based on requirements
    const scoredEngines = availableEngines.map(engine => ({
      engine: engine.name,
      score: this.calculateEngineScore(engine, requirements),
      config: engine,
    }));

    // Sort by score (descending)
    scoredEngines.sort((a, b) => b.score - a.score);

    const selected = scoredEngines[0];
    const alternatives = scoredEngines.slice(1, 4);

    return {
      selectedEngine: selected.engine,
      reason: this.generateReason(selected.config, requirements),
      estimatedCost: selected.config.costPerUnit,
      estimatedQuality: selected.config.qualityScore,
      estimatedSpeed: selected.config.speedScore,
      alternatives: alternatives.map(a => ({
        engine: a.engine,
        score: a.score,
      })),
    };
  }

  /**
   * Get available engines for task type and tier
   */
  private getAvailableEngines(taskType: string, userTier: string): EngineConfig[] {
    const engines: EngineConfig[] = [];
    
    this.engineConfigs.forEach(config => {
      if (
        config.taskType === taskType &&
        config.isActive &&
        config.tierAvailability.includes(userTier)
      ) {
        engines.push(config);
      }
    });

    return engines;
  }

  /**
   * Calculate score for engine based on requirements
   */
  private calculateEngineScore(engine: EngineConfig, requirements: TaskRequirements): number {
    let score = engine.priority; // Base score from priority

    // Cost filtering
    if (requirements.maxCost && engine.costPerUnit > requirements.maxCost) {
      return 0; // Exclude if over budget
    }

    // Weight factors based on requirements
    const qualityWeight = requirements.prioritizeQuality ? 0.5 : 0.3;
    const speedWeight = requirements.prioritizeSpeed ? 0.5 : 0.3;
    const costWeight = requirements.prioritizeCost ? 0.5 : 0.4;

    // Calculate weighted score
    score += engine.qualityScore * qualityWeight;
    score += engine.speedScore * speedWeight;
    
    // Invert cost for scoring (lower cost = higher score)
    // Divide by 10 to normalize cost values to 0-100 range
    const COST_NORMALIZATION_FACTOR = 10;
    const costScore = Math.max(0, 100 - engine.costPerUnit / COST_NORMALIZATION_FACTOR);
    score += costScore * costWeight;

    return score;
  }

  /**
   * Generate reason for engine selection
   */
  private generateReason(engine: EngineConfig, requirements: TaskRequirements): string {
    const reasons: string[] = [];

    if (requirements.prioritizeQuality) {
      reasons.push(`Best quality for ${requirements.taskType}`);
    } else if (requirements.prioritizeSpeed) {
      reasons.push(`Fastest processing time`);
    } else if (requirements.prioritizeCost) {
      reasons.push(`Most cost-effective option`);
    } else {
      reasons.push(`Optimal balance of quality, speed, and cost`);
    }

    if (engine.priority >= 90) {
      reasons.push("Premium tier engine");
    }

    return reasons.join(". ");
  }

  /**
   * Add or update engine configuration
   */
  updateEngineConfig(config: EngineConfig): void {
    const key = `${config.name}_${config.taskType}`;
    this.engineConfigs.set(key, config);
  }

  /**
   * Get all engine configurations
   */
  getAllConfigs(): EngineConfig[] {
    return Array.from(this.engineConfigs.values());
  }

  /**
   * Get engine config by name and task type
   */
  getEngineConfig(name: string, taskType: string): EngineConfig | undefined {
    return this.engineConfigs.get(`${name}_${taskType}`);
  }

  /**
   * Disable engine
   */
  disableEngine(name: string, taskType: string): void {
    const key = `${name}_${taskType}`;
    const config = this.engineConfigs.get(key);
    if (config) {
      config.isActive = false;
      this.engineConfigs.set(key, config);
    }
  }

  /**
   * Enable engine
   */
  enableEngine(name: string, taskType: string): void {
    const key = `${name}_${taskType}`;
    const config = this.engineConfigs.get(key);
    if (config) {
      config.isActive = true;
      this.engineConfigs.set(key, config);
    }
  }
}

export const smartEngineRouter = new SmartEngineRouter();
