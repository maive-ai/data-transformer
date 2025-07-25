export const FEATURE_FLAGS = {
  ENABLE_GEMINI_API: true,
  ENABLE_PULSE_API: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS; 