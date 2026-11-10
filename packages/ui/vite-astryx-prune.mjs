// Astryx ships one stylesheet with every component's atomic classes (42 KB gz), and it blocks the
// first paint. This drops, at build time, the Astryx rules whose classes appear in no JS chunk.
// Astryx writes its classes as plain strings, so the JS is a complete list of what can be used.

const CLASS_IN_CSS = /\.(x[a-z0-9]{4,})(?![a-z0-9_-])/g;
const CLASS_IN_JS = /\bx[a-z0-9]{4,}\b/g;
const RECURSE = /^@(media|supports|container|layer)\b/;

/** Index just past the `}` closing the block opened at `open`, ignoring strings. */
function blockEnd(css, open) {
  let depth = 0;
  let quote = '';
  for (let i = open; i < css.length; i++) {
    const c = css[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i + 1;
  }
  return css.length;
}

/** Selector list split on commas that are not inside parentheses. */
function splitSelectors(prelude) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < prelude.length; i++) {
    const c = prelude[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) {
      out.push(prelude.slice(start, i));
      start = i + 1;
    }
  }
  out.push(prelude.slice(start));
  return out;
}

function selectorIsLive(selector, used) {
  // An absent class inside :not() does not stop the selector from matching.
  const positive = selector.replace(/:not\([^()]*\)/g, '');
  for (const m of positive.matchAll(CLASS_IN_CSS)) if (!used.has(m[1])) return false;
  return true;
}

function pruneBlock(css, used) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    let j = i;
    let quote = '';
    for (; j < css.length; j++) {
      const c = css[j];
      if (quote) {
        if (c === '\\') j++;
        else if (c === quote) quote = '';
      } else if (c === '"' || c === "'") quote = c;
      else if (c === '{' || c === ';') break;
    }
    if (j >= css.length) return out + css.slice(i);
    if (css[j] === ';') {
      out += css.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    const prelude = css.slice(i, j);
    const end = blockEnd(css, j);
    const body = css.slice(j + 1, end - 1);
    if (RECURSE.test(prelude)) {
      const inner = pruneBlock(body, used);
      if (inner) out += `${prelude}{${inner}}`;
    } else if (prelude.startsWith('@')) {
      out += css.slice(i, end); // @keyframes, @property, @font-face…
    } else {
      const live = splitSelectors(prelude).filter((s) => selectorIsLive(s, used));
      if (live.length) out += `${live.join(',')}{${body}}`;
    }
    i = end;
  }
  return out;
}

/** The whole stylesheet with only Astryx's two layers pruned. */
export function pruneAstryxCss(css, used) {
  let out = '';
  let i = 0;
  const open = /@layer astryx-(?:base|theme)\{/g;
  for (let m = open.exec(css); m; m = open.exec(css)) {
    const brace = m.index + m[0].length - 1;
    const end = blockEnd(css, brace);
    out += css.slice(i, m.index);
    const inner = pruneBlock(css.slice(brace + 1, end - 1), used);
    if (inner) out += `${m[0]}${inner}}`;
    i = end;
    open.lastIndex = end;
  }
  return out + css.slice(i);
}

export function classesInJs(code) {
  return new Set(code.match(CLASS_IN_JS) ?? []);
}

/** Vite plugin: client builds only (the SSR build emits no CSS that is served). */
export function astryxPrune() {
  return {
    name: 'kervan-astryx-prune',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const files = Object.values(bundle);
      const used = new Set();
      for (const f of files)
        if (f.type === 'chunk') for (const c of classesInJs(f.code)) used.add(c);
      for (const f of files)
        if (f.type === 'asset' && f.fileName.endsWith('.css'))
          f.source = pruneAstryxCss(String(f.source), used);
    },
  };
}
