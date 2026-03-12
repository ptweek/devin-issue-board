# Cancelled orders don't restore inventory

**Type**: Bug
**Priority**: High
**Reported by**: Marcus Webb, Warehouse Manager
**Date**: 2026-02-10

## Description
When we cancel an order — whether the customer cancels it themselves or we cancel it from the admin panel — the inventory for those products is not being added back. We've had several situations where a customer cancelled a large order and the items remained "unavailable" even though we physically have them on the shelf.

Last week we had a customer cancel an order with 5 units of SKU WH-2847. Those 5 units are sitting in our warehouse but the system still shows them as sold. I had to manually go into the admin panel and update the inventory count for that product.

This is getting worse now that we've fixed... well, I'm told there's another inventory tracking issue being worked on. But even once that's resolved, cancellations will still leak inventory.

## Steps to Reproduce
1. Note inventory count for a product (e.g., 20 units)
2. Place an order containing 3 of that product
3. Cancel the order
4. Check the inventory count — still shows the decremented amount (or unchanged, depending on the other inventory bug)

## Expected Behavior
When an order is cancelled, the inventory should be restored to its pre-order level.

## Actual Behavior
Inventory count does not change when an order is cancelled, regardless of who cancels it.

## Impact
High — leads to phantom out-of-stock situations. Products show as unavailable when we actually have them. Lost sales from customers who can't order items we physically have in stock.
