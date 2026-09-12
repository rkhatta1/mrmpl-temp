# Bulk import authoring contract

Bulk imports create new products from an official template generated for the supported workbook format. Existing catalog part codes are blocking conflicts before confirmation; updating existing products remains a separate workflow. Missing categories and subcategories are created from the workbook as part of the import, allowing administrators to expand the catalog without first preparing its hierarchy manually.

The template includes an optional, reference-only Examples sheet with up to three current products and their dimensions. Products and Dimensions remain empty for authoring. Example photo codes illustrate filename syntax and are explicitly labeled as illustrative. The Examples sheet never contributes import rows; workbooks without it remain supported.

Administrators reference images using photo codes in the workbook's photos column and supply files named for those codes. This preserves the client's explicit workbook-to-file mapping. Product-code folders with numbered filenames are not the agreed input contract.

Photo codes have catalog-wide identity across imports. Reusing a code requires identical source-file contents; different contents require a new code. Bulk imports never change images on existing products. This makes reuse predictable without introducing shared-image replacement semantics.

A product and any newly required category/subcategory records commit atomically. A later failure does not roll back products already committed. Retrying server-side processing resumes unfinished rows in the same import, without recreating successful rows. This provides safe partial progress without requiring one transaction for the entire workbook.

## Simplified operation

The administrator describes this as roughly an annual operation and explicitly prefers simplicity. Keep the tab open until image preparation/uploads finish; interrupted uploads restart as a fresh attempt. Omit browser file persistence, an upload-resume interface, and import-history UI. Once uploads finish, bounded server-side processing can continue independently, with progress and a retry for unfinished rows. Cleanup of unlinked uploads and actionable row results remain correctness requirements.

The complete scope was confirmed in the 2026-09-12 design interview, including simplified operation. These decisions supersede conflicting requirements in GitHub issue #1.
