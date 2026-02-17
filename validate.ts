function string(x: unknown) {
  if (typeof x !== "string" || x.trim().length === 0) return undefined;
  return x;
}

function number(x: unknown) {
  if (typeof x === "number") return Number.isFinite(x) ? x : undefined;
}

function boolean(x: unknown) {
  if (x === true || x === "true" || x === 1 || x === "1" || x === "on")
    return true;
  if (x === false || x === "false" || x === 0 || x === "0" || x === "off")
    return false;
  return undefined;
}
