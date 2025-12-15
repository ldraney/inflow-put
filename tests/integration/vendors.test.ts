/**
 * Integration tests for Vendor PUT operations
 *
 * These tests run against the real Inflow API.
 * Requires INFLOW_API_KEY and INFLOW_COMPANY_ID env vars.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { putVendor } from '../../src/entities/vendors.js';
import { generateId, testName, deactivate, get } from './helpers/setup.js';

// Track created vendors for cleanup
const createdIds: string[] = [];

afterAll(async () => {
  // Deactivate all test vendors
  for (const id of createdIds) {
    try {
      await deactivate('/vendors', 'vendorId', id);
    } catch {
      // Ignore cleanup errors
    }
  }
});

describe('putVendor', () => {
  it('creates a new vendor', async () => {
    const vendorId = generateId();
    createdIds.push(vendorId);

    const name = testName('Vendor');

    await putVendor(
      {
        vendorId,
        name,
      },
      'create'
    );

    // Verify it was created
    const fetched = await get(`/vendors/${vendorId}`);
    expect(fetched).toBeDefined();
    expect((fetched as { name: string }).name).toBe(name);
  });

  it('updates an existing vendor', async () => {
    const vendorId = generateId();
    createdIds.push(vendorId);

    const originalName = testName('Original');
    const updatedName = testName('Updated');

    // Create
    await putVendor(
      {
        vendorId,
        name: originalName,
      },
      'create'
    );

    // Update
    await putVendor(
      {
        vendorId,
        name: updatedName,
        remarks: 'Updated via integration test',
      },
      'update'
    );

    // Verify update
    const fetched = await get(`/vendors/${vendorId}`);
    expect((fetched as { name: string }).name).toBe(updatedName);
    expect((fetched as { remarks: string }).remarks).toBe(
      'Updated via integration test'
    );
  });

  it('creates vendor with address', async () => {
    const vendorId = generateId();
    const addressId = generateId();
    createdIds.push(vendorId);

    const name = testName('WithAddress');

    await putVendor(
      {
        vendorId,
        name,
        addresses: [
          {
            vendorAddressId: addressId,
            name: 'Main Office',
            address: {
              address1: '123 Test Street',
              city: 'Test City',
              state: 'TS',
              postalCode: '12345',
              country: 'US',
            },
          },
        ],
      },
      'create'
    );

    // Verify address was created
    const fetched = await get(`/vendors/${vendorId}?include=addresses`);
    const addresses = (fetched as { addresses: Array<{ name: string }> })
      .addresses;
    expect(addresses).toBeDefined();
    expect(addresses.length).toBe(1);
    expect(addresses[0].name).toBe('Main Office');
  });

  it('deactivates a vendor', async () => {
    const vendorId = generateId();
    // Don't add to createdIds - we're testing deactivation directly

    const name = testName('ToDeactivate');

    // Create
    await putVendor(
      {
        vendorId,
        name,
      },
      'create'
    );

    // Deactivate
    await putVendor(
      {
        vendorId,
        isActive: false,
      },
      'update'
    );

    // Verify deactivated
    const fetched = await get(`/vendors/${vendorId}`);
    expect((fetched as { isActive: boolean }).isActive).toBe(false);
  });
});
