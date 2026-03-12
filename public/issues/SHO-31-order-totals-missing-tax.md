# SHO-31: Order Totals Don't Match Expected Amounts — Tax Not Included

## Priority: Critical
## Labels: bug, orders, payments, data-integrity

## Description

Finance team flagged that order totals in the database are consistently lower than expected. The stored `total` on orders does not include the `tax_amount`, even though tax is being calculated and stored in its own column correctly.

## How it was noticed

- Finance reconciliation script flagged discrepancies: `total != subtotal - discount + tax_amount + shipping_cost` for all recent orders
- DataDog APM traces show the order creation endpoint returning totals that are ~8% lower than expected
- Customers are being charged less than they should be (the `total` field is what gets sent to payment processing)

## Steps to reproduce

1. Create an order via `POST /api/orders` with a cart containing items
2. Query the created order: `SELECT id, subtotal, tax_amount, shipping_cost, total, (subtotal + tax_amount + shipping_cost) as expected_total FROM "Order" ORDER BY created_at DESC LIMIT 5;`
3. Notice that `total` != `expected_total` — the difference is exactly the `tax_amount`

## Expected behavior

`total = (subtotal - discount) + tax_amount + shipping_cost`

## Actual behavior

`total = (subtotal - discount) + shipping_cost` (tax is missing from the total)

## Impact

Every order placed is being undercharged by 8% (the tax rate). This is a revenue leak and a tax compliance issue.

## Investigation hints

- Look at the order total calculation in the order creation route
- The `tax_amount` field is stored correctly — it's just not being added to the `total`
- Run: `SELECT COUNT(*), SUM(tax_amount) as lost_tax_revenue FROM "Order" WHERE total != subtotal + tax_amount + shipping_cost;`
