# Multiple product images with gallery view

**Type**: Feature Request
**Priority**: Medium
**Reported by**: Priya Patel, Product Manager
**Date**: 2026-02-01

## Description
Currently each product only supports a single image_url. This is a significant limitation — customers want to see products from multiple angles, see detail shots, and see the product in context. Our return rate is 18% and customer feedback consistently mentions "product didn't look like the photo" as a reason.

We need to support multiple images per product:
- Database: New ProductImage table (or JSON array on Product) to store multiple image URLs with sort order
- Admin: Ability to upload/manage multiple images per product
- Product detail page: Thumbnail carousel or gallery with a main image that changes on click/hover
- Product cards: Could show second image on hover (nice to have)

Competitors typically show 4-6 images per product. Our merchandising team already has additional product photos ready to upload once the feature is built.

## Expected Behavior
Each product can have multiple images displayed in a gallery with thumbnails on the product detail page.

## Impact
Medium — expected to reduce return rate and increase conversion. Merchandising team is blocked on uploading additional product photography.
