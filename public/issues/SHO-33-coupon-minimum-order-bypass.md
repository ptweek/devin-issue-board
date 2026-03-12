# SHO-33: Coupons With Minimum Order Threshold Can Be Applied to Small Orders

## Priority: High
## Labels: bug, coupons, cart, revenue-loss

## Description

Coupons that have a `minimum_order` requirement (e.g., FLAT20 requires $100 minimum) are being successfully applied to carts well below the minimum threshold. The validation check appears to be comparing against the wrong value.

## How it was noticed

- DataDog logs show successful coupon validation responses for the `FLAT20` coupon (min $100) on carts with totals of $25-$50
- Marketing team noticed coupon redemption rates for FLAT20 were 4x higher than projected
- Database query shows orders with `FLAT20` discount applied where subtotal < $100:
  ```sql
  SELECT o.id, o.subtotal, o.total
  FROM "Order" o
  WHERE o.notes LIKE '%FLAT20%' AND o.subtotal < 100;
  ```

## Steps to reproduce

1. Add items to cart totaling $25 (above $20 discount value, but well below $100 minimum)
2. Apply coupon code `FLAT20` via `POST /api/cart/coupon` with `{ "code": "FLAT20", "cartTotal": 25 }`
3. The coupon is accepted and a $20 discount is returned
4. It should have been rejected with "Minimum order of $100 required"

## Expected behavior

Coupon validation should reject coupons when `cartTotal < minimum_order`.

## Actual behavior

The validation compares `cartTotal` against the coupon's `discount_value` instead of `minimum_order`. Since FLAT20 has a discount_value of $20, any cart over $20 passes the check.

## Impact

Revenue loss from discounts being applied to orders that don't meet the minimum threshold. Particularly impactful for high-value fixed-amount coupons.

## Investigation hints

- Check the coupon validation endpoint's minimum order comparison
- The bug is in what value is being compared against `cartTotal`
- Query: `SELECT code, discount_value, minimum_order FROM "Coupon" WHERE minimum_order IS NOT NULL;`
