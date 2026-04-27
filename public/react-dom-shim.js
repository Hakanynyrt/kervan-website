// react-dom-shim.js — Re-exports window.ReactDOM as ES module so importmap-resolved
// modules (motion@12, etc.) share the SAME ReactDOM instance the page already
// uses. Pairs with react-shim.js. See that file for the rationale.

const RD = window.ReactDOM;
if (!RD) {
  throw new Error('[kervanheat] react-dom-shim.js: window.ReactDOM is not defined. Load ReactDOM UMD before any module that imports "react-dom".');
}

export default RD;
export const {
  findDOMNode, createPortal, unstable_batchedUpdates,
  flushSync, version, createRoot, hydrateRoot,
} = RD;
