/**
 * Integration tests for Customer PUT operations
 *
 * These tests run against the real Inflow API.
 * Requires INFLOW_API_KEY and INFLOW_COMPANY_ID env vars.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { putCustomer } from '../../src/entities/customers.js';
import { generateId, testName, deactivate, get } from './helpers/setup.js';

// Track created customers for cleanup
const createdIds: string[] = [];

afterAll(async () => {
  // Deactivate all test customers
  for (const id of createdIds) {
    try {
      await deactivate('/customers', 'customerId', id);
    } catch {
      // Ignore cleanup errors
    }
  }
});

describe('putCustomer', () => {
  it('creates a new customer', async () => {
    const customerId = generateId();
    createdIds.push(customerId);

    const name = testName('Customer');

    await putCustomer(
      {
        customerId,
        name,
      },
      'create'
    );

    // Verify it was created
    const fetched = await get(`/customers/${customerId}`);
    expect(fetched).toBeDefined();
    expect((fetched as { name: string }).name).toBe(name);
  });

  it('updates an existing customer', async () => {
    const customerId = generateId();
    createdIds.push(customerId);

    const originalName = testName('Original');
    const updatedName = testName('Updated');

    // Create
    await putCustomer(
      {
        customerId,
        name: originalName,
      },
      'create'
    );

    // Update
    await putCustomer(
      {
        customerId,
        name: updatedName,
        remarks: 'Updated via integration test',
      },
      'update'
    );

    // Verify update
    const fetched = await get(`/customers/${customerId}`);
    expect((fetched as { name: string }).name).toBe(updatedName);
    expect((fetched as { remarks: string }).remarks).toBe(
      'Updated via integration test'
    );
  });

  it('deactivates a customer', async () => {
    const customerId = generateId();
    // Don't add to createdIds - we're testing deactivation directly

    const name = testName('ToDeactivate');

    // Create
    await putCustomer(
      {
        customerId,
        name,
      },
      'create'
    );

    // Deactivate
    await putCustomer(
      {
        customerId,
        isActive: false,
      },
      'update'
    );

    // Verify deactivated
    const fetched = await get(`/customers/${customerId}`);
    expect((fetched as { isActive: boolean }).isActive).toBe(false);
  });
});
