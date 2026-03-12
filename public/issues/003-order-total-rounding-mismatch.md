# Order total off by a penny on some orders

**Type**: Bug
**Priority**: Medium
**Reported by**: Customer support ticket #4821
**Date**: 2026-02-03

## Description
We've received several customer emails pointing out that their order total doesn't exactly match the sum of the line items shown in their order confirmation. The discrepancy is always 1-2 cents. It's not happening on every order — seems to depend on the specific dollar amounts involved.

Example from ticket #4821: Customer ordered items totaling $47.93 subtotal, tax showed as $3.83, shipping $5.99. That should be $57.75 but the total charged was $57.76.

Another example from ticket #4835: Subtotal $124.50, tax $9.96, free shipping. Total should be $134.46 but confirmation shows $134.47.

## Steps to Reproduce
Not consistently reproducible — seems to depend on specific order amounts. Happens more often with certain price combinations.

## Expected Behavior
The order total should always exactly equal subtotal + tax + shipping - discount, down to the penny.

## Actual Behavior
On some orders, the total is off by $0.01 or $0.02 compared to the sum of the individual components.

## Impact
Low per-incident but affects customer trust. We've had about 15 support tickets about this in the past month. Some customers suspect we're overcharging them.
