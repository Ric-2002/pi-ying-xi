// src/data/grading.ts
import type { Grade } from "@/types/puppet";

export const GRADE_THRESHOLDS: { min: number; grade: Grade }[] = [
  { min: 0.85, grade: "神品" },
  { min: 0.65, grade: "上乘" },
  { min: 0.4, grade: "中乘" },
  { min: 0.0, grade: "下乘" },
];

export function qualityToGrade(quality: number): Grade {
  const q = Math.max(0, Math.min(1, quality));
  for (const t of GRADE_THRESHOLDS) {
    if (q >= t.min) return t.grade;
  }
  return "下乘";
}

export const GRADE_META: Record<
  Grade,
  { color: string; label: string; flavor: string }
> = {
  神品: {
    color: "#D99A2B",
    label: "神品",
    flavor: "刀刀入纸,光透成戏。",
  },
  上乘: {
    color: "#E5CF95",
    label: "上乘",
    flavor: "线条干净,可登台演。",
  },
  中乘: {
    color: "#A8813A",
    label: "中乘",
    flavor: "尚有毛刺,演出无碍。",
  },
  下乘: {
    color: "#7A2E18",
    label: "下乘",
    flavor: "未尽工艺,影暗刀粗。",
  },
};

/** 是否触发"再来一次?"询问 — grade 低于中乘时为 true */
export function shouldOfferRetry(grade: Grade): boolean {
  return grade === "下乘";
}
