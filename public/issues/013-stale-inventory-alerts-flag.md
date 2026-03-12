# Clean up INVENTORY_ALERTS feature flag dead code

**Type**: Tech Debt
**Priority**: Low
**Reported by**: James Liu, Senior Developer
**Date**: 2026-01-28

## Description
The INVENTORY_ALERTS feature flag has been enabled for months. The product detail page has an else branch that shows a basic "unavailable" message when inventory alerts are disabled. Since the flag is always on, this branch is unreachable.

The ProductCard component also checks this flag for its low-stock warning. Should clean up both locations and either remove the flag check or remove the dead else branches.

## Impact
Low — dead code path. No user-facing impact.
