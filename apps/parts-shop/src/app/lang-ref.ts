import type { Lang } from '../types';

/** The app's language as the router reads it: set at start-up (main.tsx), changed on Start. */
export const langRef: { current: Lang } = { current: 'tr' };
