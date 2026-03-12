# Implement wishlist / save for later

**Type**: Feature Request
**Priority**: Medium
**Reported by**: Customer support ticket #4756 (aggregated from 23 requests)
**Date**: 2026-01-08

## Description
We've had 23 customer support requests in the past two months asking about a "save for later" or "wishlist" feature. Customers want to bookmark products they're interested in but not ready to buy yet.

The WISHLIST feature flag exists in our configuration but the feature has not been implemented at all. There's no database table, no API endpoints, and no UI for it.

Customers are currently working around this by adding items to their cart and just not checking out, which inflates our cart metrics and causes confusion when items go out of stock while sitting in someone's cart.

Requested functionality:
- Heart/bookmark icon on product cards and product detail page
- Dedicated "My Wishlist" page accessible from the navbar
- Ability to move items from wishlist to cart
- Persist wishlist across sessions (requires login)

## Expected Behavior
Logged-in customers can save products to a wishlist and view/manage them from a dedicated page.

## Impact
Medium — improves customer experience and engagement. Reduces cart abandonment from users using the cart as a wishlist. Enables future features like "price drop" notifications.
