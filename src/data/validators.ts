import { z } from "zod";

export const poseSchema = z.object({
  body: z.object({
    x: z.number(),
    y: z.number(),
    rotation: z.number(),
  }),
  leftArm: z.object({ rotation: z.number() }),
  rightArm: z.object({ rotation: z.number() }),
  head: z.object({ rotation: z.number() }),
  prop: z.object({ rotation: z.number() }),
});

export const performanceSchema = z.object({
  id: z.string().min(1),
  roleId: z.enum(["wukong", "tangseng", "baigujing", "bajie", "shaseng"]),
  createdAt: z.string().datetime(),
  score: z.number().min(0).max(100),
  frames: z.array(
    z.object({
      t: z.number().nonnegative(),
      pose: poseSchema,
      cueId: z.string().min(1),
    }),
  ),
});
