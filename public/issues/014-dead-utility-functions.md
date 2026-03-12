# Remove unused legacy integration functions

**Type**: Tech Debt
**Priority**: Low
**Reported by**: James Liu, Senior Developer
**Date**: 2026-02-05

## Description
There's a `legacy.ts` file in the lib directory containing utility functions for integrations we never shipped: ShipStation order formatting, Shopify inventory sync, Mailchimp email payloads, QuickBooks invoice conversion, packing slip generation, and shipping weight calculation.

These were written during the initial build when we planned to integrate with these services, but we ended up going a different direction. The functions are exported but none of them are actually called anywhere in the application. I think one file might import a couple of them but never uses them.

We should delete this file entirely or at least remove the unused functions. They add to bundle size and create a false impression that we have these integrations.

## Impact
Low — unused code that increases bundle size and confuses new developers who think these integrations exist.
