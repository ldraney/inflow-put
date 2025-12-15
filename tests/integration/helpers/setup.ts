/**
 * Test setup and utilities for integration tests
 */

import { randomUUID } from 'crypto';
import { put, get } from 'inflow-client';

/**
 * Generate a new UUID for entity creation
 */
export function generateId(): string {
  return randomUUID();
}

/**
 * Generate a unique name with timestamp prefix for test entities
 * Makes it easy to identify test data created by integration tests
 */
export function testName(base: string): string {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
  return `TEST_${timestamp}_${base}`;
}

/**
 * Deactivate an entity by setting isActive = false
 * Inflow doesn't support deletion, so we deactivate for cleanup
 */
export async function deactivate(
  endpoint: string,
  idField: string,
  id: string
): Promise<void> {
  await put(endpoint, {
    [idField]: id,
    isActive: false,
  });
}

/**
 * Check if an entity exists by trying to fetch it
 */
export async function entityExists(
  endpoint: string,
  id: string
): Promise<boolean> {
  try {
    await get(`${endpoint}/${id}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Re-export client functions for convenience
 */
export { put, get } from 'inflow-client';
