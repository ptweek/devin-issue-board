# Remove orphaned OldCheckoutForm and ProductQuickView components

**Type**: Tech Debt
**Priority**: Low
**Reported by**: James Liu, Senior Developer
**Date**: 2026-02-12

## Description
We have two components that are fully built out but never rendered anywhere:

1. `OldCheckoutForm` — This was the original multi-step checkout form before we switched to the current single-page layout. It includes a 3-step wizard (Information, Shipping, Payment) and even has credit card fields that we don't use since we handle payment differently. It's a complete component sitting in the components directory unused.

2. `ProductQuickView` — A modal-based quick view for products that was planned for the product listing page. It fetches product details and shows them in a modal with an add-to-cart button. The feature was deprioritized and the component was never integrated. There's an unused import of it in the products listing page that should also be removed.

Both should be deleted to reduce codebase clutter.

## Impact
Low — dead code that adds confusion. The unused import may trigger linting warnings.
