export const positionLabels = {
  VOCAL: "보컬",
  GUITAR: "기타",
  BASS: "베이스",
  DRUMS: "드럼",
  KEYBOARD: "키보드",
} as const;

export type PositionCode = keyof typeof positionLabels;

export function positionCodeFromLabel(label: unknown): PositionCode | null {
  const entry = Object.entries(positionLabels).find(([, value]) => value === label);
  return entry ? (entry[0] as PositionCode) : null;
}
