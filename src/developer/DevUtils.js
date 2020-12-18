export function reportError(e, msg) {
  console.error(`----> ${e}`);
  window.confirm(msg);
}