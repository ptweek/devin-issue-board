# Inventory not decremented when order is placed

**Type**: Bug
**Priority**: Critical
**Reported by**: Marcus Webb, Warehouse Manager
**Date**: 2026-01-14

## Description
We're seeing a major discrepancy between our physical inventory counts and what the system shows. After the last two weeks of fulfilling orders, almost none of the product quantities in the admin panel have changed. I did a manual count of our top 20 SKUs and the system is showing significantly higher inventory than what we actually have on the shelves. We've already had three cases this week where customers ordered items we physically don't have.

## Steps to Reproduce
1. Note the inventory count for any product
2. Place an order that includes that product
3. Check the inventory count for the product after the order is confirmed

## Expected Behavior
The inventory count should decrease by the quantity ordered when a customer successfully places an order.

## Actual Behavior
The inventory count remains unchanged after an order is placed. Products continue to show as "in stock" even after all physical inventory has been sold.

## Impact
Critical — customers are ordering out-of-stock items, leading to fulfillment delays, backorders, and customer complaints. We've had to manually cancel 12 orders this week alone due to inventory we don't actually have. This is damaging customer trust and costing us in refund processing time.
