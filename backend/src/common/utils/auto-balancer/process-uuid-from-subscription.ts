

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
    if (!Array.isArray(vnext)) continue;

    for (const v of vnext) {
      if (!isRecord(v)) continue;

      const users = v["users"];
      if (!Array.isArray(users)) continue;

      for (const u of users) {
        if (!isRecord(u)) continue;

        const id = u["id"];
        if (typeof id === "string" && id !== "<UUID>") return id;
      }
    }
  }

  return;
}

export function containsPlaceHolderFromVnext(firstItem: unknown): boolean {
  if (!isRecord(firstItem)) return false;

  const outbounds = firstItem["outbounds"];
  if (!Array.isArray(outbounds)) return false;

  for (const ob of outbounds) {
    if (!isRecord(ob)) continue;

    const settings = ob["settings"];
    if (!isRecord(settings)) continue;

    const vnext = settings["vnext"];
    if (!Array.isArray(vnext)) continue;

    for (const v of vnext) {
      if (!isRecord(v)) continue;

      const users = v["users"];
      if (!Array.isArray(users)) continue;

      for (const u of users) {
        if (!isRecord(u)) continue;

        const id = u["id"];
        if (id === "<UUID>") return true; // тут typeof не обязателен, но можно оставить
      }
    }
  }

  return false;
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
