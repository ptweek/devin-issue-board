# Bulk inventory update via CSV upload

**Type**: Feature Request
**Priority**: High
**Reported by**: Marcus Webb, Warehouse Manager
**Date**: 2026-02-08

## Description
Right now, to update inventory counts, I have to go into the admin panel, find each product individually, click edit, change the count, and save. When we get a shipment of 50+ SKUs, this takes me over an hour of clicking through the admin interface one product at a time.

I need a CSV upload tool in the admin panel where I can:
1. Download a CSV template with current inventory (columns: SKU, Product Name, Current Count, New Count)
2. Fill in the "New Count" column for the items that changed
3. Upload the CSV and have the system update all inventory counts at once
4. See a preview/confirmation of changes before they're applied
5. Get a summary of what was updated after it's done

Our receiving process already generates a spreadsheet of what came in. Being able to upload that directly (or a modified version) would save hours every week.

## Expected Behavior
Admin/warehouse users can upload a CSV file to update inventory counts for multiple products at once, with preview and confirmation.

## Impact
High — warehouse staff spend 5+ hours per week on manual inventory updates. This is error-prone and takes time away from actual warehouse operations.
