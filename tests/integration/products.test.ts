/**
 * Integration tests for Product PUT operations
 *
 * These tests run against the real Inflow API.
 * Requires INFLOW_API_KEY and INFLOW_COMPANY_ID env vars.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { putProduct } from '../../src/entities/products.js';
import { generateId, testName, deactivate, get } from './helpers/setup.js';

// Track created products for cleanup
const createdIds: string[] = [];

afterAll(async () => {
  // Deactivate all test products
  for (const id of createdIds) {
    try {
      await deactivate('/products', 'productId', id);
    } catch {
      // Ignore cleanup errors
    }
  }
});

describe('putProduct', () => {
  it('creates a new product', async () => {
    const productId = generateId();
    createdIds.push(productId);

    const name = testName('Product');

    await putProduct(
      {
        productId,
        name,
        itemType: 'stockedProduct',
      },
      'create'
    );

    // Verify it was created
    const fetched = await get(`/products/${productId}`);
    expect(fetched).toBeDefined();
    expect((fetched as { name: string }).name).toBe(name);
    expect((fetched as { itemType: string }).itemType).toBe('stockedProduct');
  });

  it('updates an existing product', async () => {
    const productId = generateId();
    createdIds.push(productId);

    const originalName = testName('Original');
    const updatedName = testName('Updated');

    // Create
    await putProduct(
      {
        productId,
        name: originalName,
        itemType: 'stockedProduct',
      },
      'create'
    );

    // Update
    await putProduct(
      {
        productId,
        name: updatedName,
        description: 'Updated via integration test',
      },
      'update'
    );

    // Verify update
    const fetched = await get(`/products/${productId}`);
    expect((fetched as { name: string }).name).toBe(updatedName);
    expect((fetched as { description: string }).description).toBe(
      'Updated via integration test'
    );
  });

  it('creates product with barcode', async () => {
    const productId = generateId();
    const barcodeId = generateId();
    createdIds.push(productId);

    const name = testName('WithBarcode');

    await putProduct(
      {
        productId,
        name,
        itemType: 'stockedProduct',
        productBarcodes: [
          {
            productBarcodeId: barcodeId,
            barcode: `TEST-${Date.now()}`,
          },
        ],
      },
      'create'
    );

    // Verify barcode was created
    const fetched = await get(`/products/${productId}?include=productBarcodes`);
    const barcodes = (
      fetched as { productBarcodes: Array<{ barcode: string }> }
    ).productBarcodes;
    expect(barcodes).toBeDefined();
    expect(barcodes.length).toBe(1);
    expect(barcodes[0].barcode).toMatch(/^TEST-\d+$/);
  });

  it('creates service product', async () => {
    const productId = generateId();
    createdIds.push(productId);

    const name = testName('Service');

    await putProduct(
      {
        productId,
        name,
        itemType: 'service',
      },
      'create'
    );

    // Verify it was created
    const fetched = await get(`/products/${productId}`);
    expect((fetched as { itemType: string }).itemType).toBe('service');
  });

  it('deactivates a product', async () => {
    const productId = generateId();
    // Don't add to createdIds - we're testing deactivation directly

    const name = testName('ToDeactivate');

    // Create
    await putProduct(
      {
        productId,
        name,
        itemType: 'stockedProduct',
      },
      'create'
    );

    // Deactivate
    await putProduct(
      {
        productId,
        isActive: false,
      },
      'update'
    );

    // Verify deactivated
    const fetched = await get(`/products/${productId}`);
    expect((fetched as { isActive: boolean }).isActive).toBe(false);
  });
});
