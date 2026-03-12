# Expired coupon codes still being accepted

**Type**: Bug
**Priority**: Medium
**Reported by**: Angela Torres, Marketing Manager
**Date**: 2026-03-03

## Description
We ran a promotional campaign with coupon code "WINTER25" that was supposed to expire on February 28th. I set the expiration date to 2/28 in the admin panel. However, we received orders on March 1st that still used this coupon successfully. It seems like the coupon continued working for several hours past its expiration date.

This has happened before with our "NEWYEAR15" campaign too — it was supposed to expire at midnight on January 31st but customers were able to use it into the morning of February 1st.

It's not a huge financial loss per incident, but it undermines our ability to run time-limited promotions. If customers know codes work past the deadline, it reduces the urgency we're trying to create.

## Steps to Reproduce
1. Create a coupon with an expiration date of today
2. Wait until after midnight (the next day)
3. Try to apply the coupon — it still works for some hours after it should have expired

## Expected Behavior
A coupon should stop working immediately at midnight on its expiration date.

## Actual Behavior
Expired coupons continue to be accepted for several hours past their expiration date. The extra window seems to vary but is typically a few hours.

## Impact
Medium — undermines time-limited promotions and causes small but recurring financial losses on expired discounts. Also creates inconsistency in how customers perceive our promotions.
