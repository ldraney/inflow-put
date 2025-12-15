/**
 * inflow-put: Write local changes back to the Inflow Inventory API
 *
 * Uses PUT schemas and constraints from inflow-api-types
 * Uses HTTP client from inflow-client
 */

// Entity operations
export {
  putCustomer,
  type CustomerInput,
  putVendor,
  type VendorInput,
  putProduct,
  type ProductInput,
} from './entities/index.js';

// Utilities (for advanced usage)
export {
  buildPayload,
  stripReadOnlyFields,
  checkRequiredFields,
  type EntityConstraints,
} from './utils/index.js';

// Re-export client for convenience
export { put, get, getAll, getOne } from 'inflow-client';
