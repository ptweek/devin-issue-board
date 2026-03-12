# Cart still shows items after completing checkout

**Type**: Bug
**Priority**: High
**Reported by**: Customer support ticket #4892
**Date**: 2026-02-18

## Description
Multiple customers are reporting that after they place an order, their cart still shows the items they just purchased. The cart icon in the navbar still shows a badge with the item count, and clicking on it shows the same items. If they navigate to /checkout again, they see another checkout form with the same items and could theoretically place the same order twice.

One customer (ticket #4892) actually did place the same order twice because they thought the first one didn't go through when they saw items still in their cart. We had to refund the duplicate order.

## Steps to Reproduce
1. Add items to cart
2. Proceed to checkout
3. Complete the order successfully
4. Notice the cart icon still shows items
5. Navigate to /cart — same items are there
6. Refresh the page — items are still in the cart

## Expected Behavior
After a successful order, the cart should be completely empty. The cart badge should show 0 and navigating to /cart should show "Your cart is empty."

## Actual Behavior
Cart retains all items from the just-completed order. Items persist even after page refresh. Customer can navigate to checkout and create a duplicate order.

## Impact
High — causing duplicate orders, customer confusion, and increased support ticket volume. We've processed 8 duplicate order refunds in the past two weeks.
