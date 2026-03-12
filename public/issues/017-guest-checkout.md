# Allow guest checkout without account creation

**Type**: Feature Request
**Priority**: High
**Reported by**: Priya Patel, Product Manager
**Date**: 2025-12-15

## Description
We're seeing a significant drop-off at the checkout step. Analytics show that 34% of users who add items to their cart abandon when they're redirected to the login page. Many of these are first-time visitors who don't want to create an account just to make a purchase.

I know the GUEST_CHECKOUT feature flag already exists in our config, but nothing is actually wired up behind it. When we enable the flag, nothing changes — unauthenticated users are still redirected away from /checkout by the middleware.

We need to implement a full guest checkout flow:
- Allow unauthenticated users to access the checkout page
- Collect email address as part of the checkout form for order confirmation
- Associate the order with the session rather than a user account
- Optionally offer "create an account" after purchase with a pre-filled form

This is our most requested feature from customer feedback surveys and the #1 thing our competitors offer that we don't.

## Expected Behavior
Customers should be able to purchase items without creating an account. They enter their email, shipping info, and complete the purchase as a guest.

## Impact
High — estimated 15-20% increase in conversion rate based on industry benchmarks. Currently losing ~34% of potential customers at the authentication wall.
