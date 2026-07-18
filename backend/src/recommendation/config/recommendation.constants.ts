// config/recommendation.constants.ts
export const RECOMMENDATION_ENGINE_VERSION: 'v1' | 'v2' =
  (process.env.RECOMMENDATION_ENGINE_VERSION as 'v1' | 'v2') ?? 'v1';
