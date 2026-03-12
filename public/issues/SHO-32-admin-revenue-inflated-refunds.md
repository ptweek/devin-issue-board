# SHO-32: Admin Dashboard Revenue Includes Refunded Orders

## Priority: High
## Labels: bug, admin, reporting, data-integrity

## Description

The admin dashboard's total revenue figure is inflated because it includes refunded orders in the revenue calculation. This gives leadership an inaccurate picture of actual revenue.

## How it was noticed

- Product manager noticed the dashboard revenue didn't match the finance team's numbers
- DataDog custom metric for `shopflow.revenue.total` (sourced from the stats endpoint) is consistently higher than the payment processor's net revenue
- Querying the database confirms refunded orders are being summed into the total

## Steps to reproduce

1. Log in as admin and visit the dashboard, note the total revenue
2. Query actual revenue excluding refunds:
   ```sql
   SELECT
     SUM(total) FILTER (WHERE status IN ('delivered', 'shipped', 'processing')) as actual_revenue,
     SUM(total) FILTER (WHERE status = 'refunded') as refunded_amount,
     SUM(total) FILTER (WHERE status IN ('delivered', 'shipped', 'processing', 'refunded')) as displayed_revenue
   FROM "Order";
   ```
3. The dashboard shows `displayed_revenue`, not `actual_revenue`

## Expected behavior

Revenue calculation should only include orders with status: `delivered`, `shipped`, `processing`.

## Actual behavior

Revenue calculation also includes `refunded` orders, inflating the total.

## Investigation hints

- Check the admin stats API route's revenue aggregation query
- Look at what order statuses are included in the `where` filter
- Compare the API response total against a manual DB query excluding refunded orders
