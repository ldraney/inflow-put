/**
 * Customer entity PUT operations
 */

import { put } from 'inflow-client';
import { CustomerPUT, CustomerConstraints } from 'inflow-api-types';
import type { z } from 'zod';
import { buildPayload, type EntityConstraints } from '../utils/payload.js';

export type CustomerInput = z.input<typeof CustomerPUT>;

/**
 * Create or update a customer
 *
 * @param data - Customer data (validated against CustomerPUT schema)
 * @param mode - 'create' for new customer, 'update' for existing
 * @returns API response (customer data) or undefined for 204 responses
 */
export async function putCustomer(
  data: CustomerInput,
  mode: 'create' | 'update' = 'update'
): Promise<unknown> {
  // Validate against Zod schema first
  const validated = CustomerPUT.parse(data);

  // Build payload respecting constraints
  const payload = buildPayload(
    validated as Record<string, unknown>,
    CustomerConstraints as EntityConstraints,
    mode
  );

  // Send to API
  return put('/customers', payload);
}
