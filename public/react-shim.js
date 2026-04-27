// react-shim.js — Re-exports window.React (loaded via UMD <script>) as ES module
// named exports so that ES modules in the importmap (motion@12, etc.) resolve
// `import 'react'` to the SAME React instance that Babel's React.createElement
// uses. Without this, esm.sh ships its own /es2022/react.mjs and the page ends
// up with two Reacts → useContext returns null → render crashes.
//
// Loaded only via importmap ("react": "/react-shim.js"), never via <script>.
// window.React must be present before any module imports `react`.

const R = window.React;
if (!R) {
  throw new Error('[kervanheat] react-shim.js: window.React is not defined. Load React UMD before any module that imports "react".');
}

export default R;
// Full React 18.3.1 named-export surface. Adding a hook here is cheap; missing
// one is a runtime crash for any module that imports it from the importmap.
export const {
  Children, Component, Fragment, PureComponent, StrictMode, Suspense,
  cloneElement, createContext, createElement, createFactory, createRef,
  forwardRef, isValidElement, lazy, memo, startTransition,
  useCallback, useContext, useDebugValue, useDeferredValue, useEffect,
  useId, useImperativeHandle, useInsertionEffect, useLayoutEffect,
  useMemo, useReducer, useRef, useState, useSyncExternalStore,
  useTransition, version,
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
} = R;
