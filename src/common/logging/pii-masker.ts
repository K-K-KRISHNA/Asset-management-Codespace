const SENSITIVE_FIELDS = new Set([
  'password',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'apikey',
  'secret',
  'email',
  'phone',
  'mobile',
]);

const REDACTED_VALUE = '[REDACTED]';

export function maskPii(
  value: unknown,
  enabled: boolean,
): unknown {
  if (!enabled) {
    return value;
  }

  return maskValue(value);
}

function maskValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => maskValue(item));
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  const result: Record<string, unknown> = {};

  for (const [key, currentValue] of Object.entries(value)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      result[key] = REDACTED_VALUE;
      continue;
    }

    result[key] = maskValue(currentValue);
  }

  return result;
}