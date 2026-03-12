# Order status jumps from "processing" to "delivered" skipping "shipped"

**Type**: Bug
**Priority**: Medium
**Reported by**: Marcus Webb, Warehouse Manager
**Date**: 2026-02-25

## Description
We've had a few cases where an order's status jumped directly from "processing" to "delivered" without ever going through "shipped." This happened when multiple warehouse staff were working on the same batch of orders.

Here's what I think happened: Lisa was looking at order #SF-8847 and was about to mark it as "shipped." At the same time, I had the same order open on my screen from a few minutes earlier (still showing "processing"). Lisa updated it to "shipped." Then I updated it to "delivered" from my stale view — but my screen still showed "processing" when I clicked the button. The order went straight from "processing" to "delivered" in the system because my update overwrote Lisa's.

The customer for that order received a "delivered" notification but no shipping notification, which caused confusion.

## Steps to Reproduce
1. Open the same order on two different browsers/tabs
2. On Browser A, update the order status from "processing" to "shipped"
3. Without refreshing Browser B (which still shows "processing"), update the status to "delivered"
4. The order is now "delivered" without ever being "shipped" in the audit trail

## Expected Behavior
The system should prevent status updates that skip required steps. If someone tries to update an order from a stale state, they should get an error telling them to refresh.

## Actual Behavior
Any status update succeeds regardless of the current state, allowing out-of-sequence transitions when multiple users are working simultaneously.

## Impact
Medium — causes confusion in order tracking, incorrect customer notifications, and makes it harder to trace fulfillment issues. Has happened 4 times in the past month.
