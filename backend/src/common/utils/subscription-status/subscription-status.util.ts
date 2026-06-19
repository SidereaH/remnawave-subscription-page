export type TSubscriptionStatus =
    | 'HWID'
    | 'EXPIRED'
    | 'DISABLED'
    | 'HWID_NOT_SUPPORTED'
    | 'LIMITED'
    | 'DEFAULT';

export const STATUS_ORDER: TSubscriptionStatus[] = [
    'HWID',
    'EXPIRED',
    'DISABLED',
    'HWID_NOT_SUPPORTED',
    'LIMITED',
    'DEFAULT',
];

export type TDetectableStatus = Exclude<TSubscriptionStatus, 'DEFAULT'>;

// Headers proxied as-is from Remnawave (public-subscription-controller).
export const SUBSCRIPTION_USERINFO_HEADER = 'subscription-userinfo';
export const HWID_LIMIT_HEADER = 'x-hwid-limit';
export const HWID_NOT_SUPPORTED_HEADER = 'x-hwid-not-supported';

export type TSubscriptionHeaders = Record<string, unknown>;

export interface ISubscriptionUserInfo {
    upload: number;
    download: number;
    total: number;
    expire: number;
}

export function readHeaderValue(headers: TSubscriptionHeaders, name: string): string | undefined {
    const value = headers[name] ?? headers[name.toLowerCase()];

    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : undefined;
    }

    if (value === undefined || value === null) {
        return undefined;
    }

    return String(value);
}

export function readHeaderFlag(headers: TSubscriptionHeaders, name: string): boolean {
    return readHeaderValue(headers, name)?.trim().toLowerCase() === 'true';
}

/**
 * Parses the XTLS/Remnawave `subscription-userinfo` header:
 *   `upload=0; download=11016307284; total=429496729600; expire=1790621473`
 * Missing fields default to 0 (== unlimited / never expires).
 */
export function parseSubscriptionUserInfo(value: string | undefined): ISubscriptionUserInfo | null {
    if (!value) return null;

    const parsed: Record<string, number> = {};

    for (const part of value.split(';')) {
        const separatorIndex = part.indexOf('=');
        if (separatorIndex === -1) continue;

        const key = part.slice(0, separatorIndex).trim();
        const num = Number(part.slice(separatorIndex + 1).trim());

        if (key.length === 0 || !Number.isFinite(num)) continue;

        parsed[key] = num;
    }

    return {
        upload: parsed.upload ?? 0,
        download: parsed.download ?? 0,
        total: parsed.total ?? 0,
        expire: parsed.expire ?? 0,
    };
}

export function isSubscriptionExpired(info: ISubscriptionUserInfo | null): boolean {
    if (!info) return false;
    // expire == 0 means no expiry
    return info.expire > 0 && info.expire * 1000 <= Date.now();
}

export function isSubscriptionLimited(info: ISubscriptionUserInfo | null): boolean {
    if (!info) return false;
    // total == 0 means unlimited
    return info.total > 0 && info.upload + info.download >= info.total;
}

/**
 * Maps the proxied Remnawave headers to the set of statuses that currently
 * hold for the subscription.
 *
 * EXPIRED / LIMITED are derived from the `subscription-userinfo` header and are
 * confirmed reliable.
 *
 * HWID / HWID_NOT_SUPPORTED / DISABLED are intentionally NOT derived from
 * `x-hwid-limit` / `x-hwid-not-supported`: a fully active subscription is served
 * with `x-hwid-limit: true` and `x-hwid-not-supported: true`, which proves those
 * headers are client capability flags (next to `hide-settings`, `subscription-pin`,
 * `dont-use-filter`, …), not "the limit is reached right now". Until the real
 * state-signal is confirmed they stay `false` so they never mis-fire. To enable
 * a confirmed mapping, replace the `false` below with e.g.
 * `readHeaderFlag(headers, HWID_LIMIT_HEADER)`.
 */
export function detectStatusFlags(
    headers: TSubscriptionHeaders,
): Record<TDetectableStatus, boolean> {
    const userInfo = parseSubscriptionUserInfo(
        readHeaderValue(headers, SUBSCRIPTION_USERINFO_HEADER),
    );

    return {
        EXPIRED: isSubscriptionExpired(userInfo),
        LIMITED: isSubscriptionLimited(userInfo),
        HWID: false,
        HWID_NOT_SUPPORTED: false,
        DISABLED: false,
    };
}
