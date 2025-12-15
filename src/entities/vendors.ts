/**
 * Vendor entity PUT operations
 */

import { put } from 'inflow-client';
import { VendorPUT, VendorConstraints } from 'inflow-api-types';
import type { z } from 'zod';
import { buildPayload, type EntityConstraints } from '../utils/payload.js';

export type VendorInput = z.input<typeof VendorPUT>;

/**
 * Create or update a vendor
 *
 * @param data - Vendor data (validated against VendorPUT schema)
 * @param mode - 'create' for new vendor, 'update' for existing
 * @returns API response (vendor data) or undefined for 204 responses
 */
export async function putVendor(
  data: VendorInput,
  mode: 'create' | 'update' = 'update'
): Promise<unknown> {
  // Validate against Zod schema first
  const validated = VendorPUT.parse(data);

  // Build payload respecting constraints
  const payload = buildPayload(
    validated as Record<string, unknown>,
    VendorConstraints as EntityConstraints,
    mode
  );

  // Send to API
  return put('/vendors', payload);
}
