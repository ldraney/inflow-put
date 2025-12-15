/**
 * Product entity PUT operations
 */

import { put } from 'inflow-client';
import { ProductPUT, ProductConstraints } from 'inflow-api-types';
import type { z } from 'zod';
import { buildPayload, type EntityConstraints } from '../utils/payload.js';

export type ProductInput = z.input<typeof ProductPUT>;

/**
 * Create or update a product
 *
 * @param data - Product data (validated against ProductPUT schema)
 * @param mode - 'create' for new product, 'update' for existing
 * @returns API response (product data) or undefined for 204 responses
 */
export async function putProduct(
  data: ProductInput,
  mode: 'create' | 'update' = 'update'
): Promise<unknown> {
  // Validate against Zod schema first
  const validated = ProductPUT.parse(data);

  // Build payload respecting constraints
  const payload = buildPayload(
    validated as Record<string, unknown>,
    ProductConstraints as EntityConstraints,
    mode
  );

  // Send to API
  return put('/products', payload);
}
