export type Lang = 'tr' | 'en';

/** Tips product-group card: build-time counts and the render shown (null without renders). */
export interface TipGroupStats {
  models: number;
  makes: number;
  image: string | null;
}
