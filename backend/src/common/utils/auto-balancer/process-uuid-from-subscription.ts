

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function getFirstUserIdFromVnext(firstItem: unknown): string | undefined {
  if (!isRecord(firstItem)) return;

  const outbounds = firstItem["outbounds"];
  if (!Array.isArray(outbounds)) return;

  for (const ob of outbounds) {
    if (!isRecord(ob)) continue;

    const settings = ob["settings"];
    if (!isRecord(settings)) continue;

    const vnext = settings["vnext"];
    if (!Array.isArray(vnext) || vnext.length === 0) continue;

    const v0 = vnext[0];
    if (!isRecord(v0)) continue;

    const users = v0["users"];
    if (!Array.isArray(users) || users.length === 0) continue;

    const u0 = users[0];
    if (!isRecord(u0)) continue;

    const id = u0["id"];
    if (typeof id === "string") return id;
  }

  return;
}

export function replaceUuidPlaceholder<T>(value: T, uuid: string): T {
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return v === "<UUID>" ? uuid : v;
    if (Array.isArray(v)) return v.map(walk);
    if (isRecord(v)) {
      const out: Record<string, unknown> = {};
      for (const [k, vv] of Object.entries(v)) out[k] = walk(vv);
      return out;
    }
    return v;
  };

  return walk(value) as T;
}
