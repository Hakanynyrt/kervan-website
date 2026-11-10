import type { Plugin } from 'vite';

export function pruneAstryxCss(css: string, used: Set<string>): string;
export function classesInJs(code: string): Set<string>;
export function astryxPrune(): Plugin;
