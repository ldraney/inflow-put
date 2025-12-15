/**
 * Payload utilities for building PUT request bodies
 * Respects constraints from inflow-api-types
 */

export interface EntityConstraints {
  readOnly: string[];
  immutable: string[];
  required: {
    create: string[];
    update: string[];
  };
  nestedWithIds?: Array<{ field: string; idField: string }>;
  defaults?: Record<string, unknown>;
}

/**
 * Strip read-only fields from data before sending to API
 */
export function stripReadOnlyFields<T extends Record<string, unknown>>(
  data: T,
  readOnlyFields: string[]
): Partial<T> {
  const result = { ...data };
  for (const field of readOnlyFields) {
    delete result[field];
  }
  return result;
}

/**
 * Check if required fields are present
 * Returns array of missing field names (empty if all present)
 */
export function checkRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[]
): string[] {
  return requiredFields.filter(
    (field) => data[field] === undefined || data[field] === null
  );
}

/**
 * Build a payload for PUT request
 * - Strips readOnly fields
 * - Validates required fields (throws if missing)
 * - Applies defaults for create operations
 */
export function buildPayload<T extends Record<string, unknown>>(
  data: T,
  constraints: EntityConstraints,
  mode: 'create' | 'update'
): Partial<T> {
  // Strip read-only fields
  let payload = stripReadOnlyFields(data, constraints.readOnly);

  // Apply defaults for create
  if (mode === 'create' && constraints.defaults) {
    payload = { ...constraints.defaults, ...payload };
  }

  // Check required fields
  const requiredFields = constraints.required[mode];
  const missing = checkRequiredFields(payload, requiredFields);
  if (missing.length > 0) {
    throw new Error(
      `Missing required fields for ${mode}: ${missing.join(', ')}`
    );
  }

  return payload;
}
