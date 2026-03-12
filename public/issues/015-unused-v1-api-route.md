# Remove orphaned /api/v1/products endpoint

**Type**: Tech Debt
**Priority**: Low
**Reported by**: Sarah Chen, QA Lead
**Date**: 2026-02-12

## Description
While doing an audit of our API endpoints, I found a `/api/v1/products` route that returns product data in a different format than our main `/api/products` endpoint. It wraps results in a `{ data: [], meta: {} }` structure instead of the flat structure used by the main endpoint.

No page or component in the frontend references this v1 endpoint. It appears to be a leftover from an earlier API design that was abandoned. It's publicly accessible and returns real product data, but nothing uses it.

We should remove it to reduce our API surface area and avoid confusion about which endpoint is the "real" one.

## Impact
Low — unused endpoint that could cause confusion. Minor security concern of having an undocumented public API returning data.
