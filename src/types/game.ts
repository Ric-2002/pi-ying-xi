export type RoleId = "wukong" | "tangseng" | "baigujing" | "bajie" | "shaseng";

export type WorkshopStep = "leather" | "carving" | "coloring" | "jointing";

export type Difficulty = "easy" | "medium" | "hard";

export interface RoleData {
  id: RoleId;
  name: string;
  title: string;
  difficulty: Difficulty;
  color: string;
  accent: string;
  description: string;
  culturalNote: string;
  requiredActions: string[];
}

export interface WorkshopStepData {
  id: WorkshopStep;
  name: string;
  actionLabel: string;
  craftNote: string;
  gameGoal: string;
}

export interface PuppetPoseData {
  body: { x: number; y: number; rotation: number };
  leftArm: { rotation: number };
  rightArm: { rotation: number };
  head: { rotation: number };
  prop: { rotation: number };
}

export interface ScriptActionData {
  id: string;
  roleId: RoleId;
  startMs: number;
  endMs: number;
  scene: string;
  cueText: string;
  instruction: string;
  lyric: string;
  smoke: boolean;
  targetPose: PuppetPoseData;
  tolerance: number;
}

export interface PerformanceFrameData {
  t: number;
  pose: PuppetPoseData;
  cueId: string;
}

export interface PerformanceData {
  id: string;
  roleId: RoleId;
  createdAt: string;
  score: number;
  frames: PerformanceFrameData[];
}
