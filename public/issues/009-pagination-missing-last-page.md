# Last page of products not accessible

**Type**: Bug
**Priority**: Medium
**Reported by**: Priya Patel, Product Manager
**Date**: 2026-03-01

## Description
I was going through our product catalog to verify all products are showing up correctly, and I noticed that the pagination doesn't seem right. We have 52 active products and the product listing shows 12 per page. That should be 5 pages (48 + 4), but the pagination only shows 4 pages. The last 4 products are unreachable through the normal product browsing flow.

I confirmed the products exist in the admin panel and are marked as active. They just don't appear in any page of the customer-facing product listing.

## Steps to Reproduce
1. Go to /products
2. Note total products shown (e.g., "52 products found")
3. Navigate through the pagination — only 4 pages are available
4. 4 pages x 12 products = 48 products accessible
5. The remaining 4 products have no way to be reached

## Expected Behavior
With 52 products and 12 per page, there should be 5 pages of products. The last page should show the remaining 4 products.

## Actual Behavior
Only 4 pages are available. Products that would appear on page 5 are inaccessible through browsing. The total count says 52 but only 48 are browsable.

## Impact
Medium — some products are effectively invisible to customers browsing the catalog. These products can still be found via direct link or search, but customers browsing won't see them.
