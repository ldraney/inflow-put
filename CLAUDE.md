# inflow-put

Write local changes back to the Inflow Inventory API. The write counterpart to [inflow-get](https://github.com/ldraney/inflow-get).

## Architecture

```
inflow-client        (HTTP client for Inflow API)
       |
       v
inflow-api-types     (Zod schemas - both GET and PUT)
       |
       v
+------+------+
|             |
v             v
inflow-get    inflow-put
(read/sync)   (write-back)
API -> SQLite SQLite -> API
```

## Purpose

**Dual Goals:**

1. **Working Library**: For every PUT schema in `inflow-api-types`, provide a tested write-back implementation
2. **Living Documentation**: Integration tests serve as canonical examples of what fields each Inflow endpoint accepts

This repo answers: *"How do I write to Inflow's API?"* — both as importable code and as reference examples.

### Why This Matters

- `inflow-api-types`: Provides `{Entity}PUT` Zod schemas and `{Entity}Constraints`
- `inflow-client`: Shared HTTP client for Inflow API (used by both inflow-get and inflow-put)
- `inflow-get`: Reads from API, stores in SQLite
- `inflow-put`: Reads from SQLite, writes back to API — **and proves it works via integration tests**

### Value to Consumers

The library exports typed, tested functions. Consuming apps (and AIs writing code) get:

```typescript
import { putProduct } from 'inflow-put'

// Requires INFLOW_API_KEY and INFLOW_COMPANY_ID env vars
await putProduct({
  productId: '...',
  name: 'Widget',
  itemType: 'stockedProduct',
  // ^ TypeScript autocomplete shows valid fields
  // ^ Runtime validation before API call
  // ^ Errors are meaningful
}, 'create')
```

**What this provides:**
- **Confidence** — if it compiles and passes Zod, it will work
- **Discovery** — types show what's possible without reading docs
- **No guessing** — constraints are built-in, not documented somewhere else
- **Tested contract** — integration tests prove the library matches reality

## Testing Philosophy

**Integration tests are the priority.** Once an API contract is validated, it stays stable for a long time.

- Tests run against the real Inflow API (existing company is our test environment)
- Each entity's test file demonstrates exactly what payloads work
- Cleanup via deactivation (Inflow doesn't support deletion)
- Tests are run intentionally during development, not necessarily on every CI run

## Key Concepts

### PUT Schemas

Each entity with write support has in `inflow-api-types`:

```javascript
// products/put.js
export const ProductPUT = z.object({...});

export const ProductConstraints = {
  readOnly: ['lastModifiedDateTime', 'lastModifiedById', ...],
  immutable: ['itemType', 'trackSerials'],
  required: {
    create: ['productId', 'name', 'itemType'],
    update: ['productId'],
  },
  nestedWithIds: ['prices', 'vendorItems', 'itemBoms', 'reorderSettings'],
};
```

### Constraints

- **readOnly**: Fields that cannot be sent in PUT requests (server-managed)
- **immutable**: Fields that can only be set on create, not updated
- **required.create**: Fields required when creating a new entity
- **required.update**: Fields required when updating an existing entity
- **nestedWithIds**: Arrays that use ID-based upsert/delete logic

## Structure

```
inflow-put/
├── package.json
├── tsconfig.json
├── CLAUDE.md
├── src/                           # Source (TypeScript)
│   ├── index.ts                   # Library exports
│   ├── entities/
│   │   ├── customers.ts           # putCustomer function
│   │   ├── ...                    # One file per entity (added as implemented)
│   │   └── index.ts               # Entity exports
│   └── utils/
│       ├── payload.ts             # Build payloads respecting constraints
│       └── index.ts               # Utils exports
├── dist/                          # Compiled output (generated, published)
│   ├── index.js                   # JavaScript
│   └── index.d.ts                 # Type declarations
└── tests/
    └── integration/
        ├── customers.test.ts      # Real API tests - also serves as examples
        ├── ...                    # One test file per entity (added as implemented)
        └── helpers/
            └── setup.ts           # API client setup, cleanup utilities
```

Note: API client functionality is provided by `inflow-client` package, not built into this repo.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `INFLOW_API_KEY` | Yes | Inflow API key |
| `INFLOW_COMPANY_ID` | Yes | Inflow company GUID |

## Dependencies

| Package | Purpose |
|---------|---------|
| `inflow-api-types` | PUT Zod schemas and constraints |
| `inflow-client` | HTTP client for Inflow API |
| `typescript` | Type checking (dev) |
| `tsx` | Run TypeScript directly (dev) |
| `vitest` | Test runner (dev) |

## Development Workflow

**Two modes:** `tsx` for development speed, `dist/` for publishing.

```bash
# Development - run TypeScript directly (no build step)
npx tsx src/index.ts
npx vitest                    # run tests

# Publishing - compile to dist/
npm run build                 # tsc -> dist/
npm publish                   # ships dist/, not src/
```

**What gets published:**

| File | Purpose |
|------|---------|
| `dist/*.js` | Compiled JavaScript (what runs) |
| `dist/*.d.ts` | Type declarations (what editors see) |

Consumers install the package and get full TypeScript support without needing `tsx`.

## Definition of Done

**Per Entity (16 total):**
- `put{Entity}` function exists and is exported
- Integration test covers: create → update → deactivate
- Test passes against real Inflow API

**For the Repo:**
- All 16 entity functions exported from `src/index.ts`
- All integration tests pass
- `npm run build` succeeds (dist/ generated)
- Published to npm

**Completion = a published npm package where consumers can:**
```typescript
import { putProduct, putVendor, putCustomer, ... } from 'inflow-put'
```
...for all 16 entities, with confidence it works because integration tests prove it.

## Roadmap

All 16 entities from `inflow-api-types` organized by complexity and dependency.

### Phase 1: Infrastructure
- [x] API client for PUT requests (via `inflow-client` package)
- [x] Payload builder (respects readOnly, immutable, required constraints)
- [x] Test harness setup (vitest)

### Phase 2: Core Master Data (3 entities)
Simple entities, foundational for orders.

| Entity | Nested Arrays | Status |
|--------|---------------|--------|
| Customers | `addresses` | [x] |
| Vendors | `addresses`, `vendorItems` | [x] |
| Products | `prices`, `productBarcodes`, `vendorItems`, `itemBoms`, `productOperations`, `reorderSettings`, `taxCodes` | [x] |

### Phase 3: Inventory Operations (5 entities)
Stock movement and counting.

| Entity | Nested Arrays | Status |
|--------|---------------|--------|
| Stock Adjustments | `lines` | [ ] |
| Stock Transfers | `lines` | [ ] |
| Product Cost Adjustments | (none) | [ ] |
| Count Sheets | `lines` | [ ] |
| Stock Counts | `sheets` → `lines` (nested) | [ ] |

### Phase 4: Order Management (3 entities)
Complex entities with multiple line types.

| Entity | Nested Arrays | Status |
|--------|---------------|--------|
| Purchase Orders | `lines`, `receiveLines`, `unstockLines` | [ ] |
| Sales Orders | `lines`, `pickLines`, `packLines`, `shipLines`, `restockLines` | [ ] |
| Manufacturing Orders | `lines` → `manufacturingOrderOperations`, `pickLines`, `putLines`, `pickMatchings` | [ ] |

### Phase 5: Configuration & Specialty (5 entities)
System configuration and specialized endpoints.

| Entity | Notes | Status |
|--------|-------|--------|
| Custom Field Definitions | Define custom fields | [ ] |
| Custom Field Dropdown Options | Dropdown values for custom fields | [ ] |
| Custom Fields | Print label settings | [ ] |
| Webhooks | Event subscriptions | [ ] |
| Stockroom Scans | Mobile app scans (ObjectSubset format) | [ ] |

### Phase 6: Advanced Features (Optional)
- [ ] Diff engine (detect local vs remote changes)
- [ ] Batch operations
- [ ] Conflict resolution strategies
