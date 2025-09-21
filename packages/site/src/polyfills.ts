// src/polyfills.ts
// Fix "global is not defined" when libs expect Node's global in the browser
if (typeof window !== 'undefined' && !(window as any).global) {
  (window as any).global = window as any;
}
