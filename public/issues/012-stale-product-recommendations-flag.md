# Clean up PRODUCT_RECOMMENDATIONS feature flag dead code

**Type**: Tech Debt
**Priority**: Low
**Reported by**: James Liu, Senior Developer
**Date**: 2026-01-28

## Description
The PRODUCT_RECOMMENDATIONS flag has been enabled since launch. The product detail page still has a fallback branch that calls a `getRandomProducts()` function when the flag is disabled. Since the flag is always enabled, this code path is dead and the random products function is never actually called.

The related products feature based on category has been working well and we have no plans to disable it. We should remove the else branch and the unused `getRandomProducts` function to simplify the code.

## Impact
Low — dead code that clutters the product detail page implementation.
