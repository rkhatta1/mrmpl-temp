# Bulk-upload naming examples

Open [template-with-examples.xlsx](template-with-examples.xlsx) and look at Examples. These three current products each have two illustrative photo codes. The [images/](images/) directory contains exactly those six PNG filenames. The drawings are placeholders, not photographs or engineering specifications.

| Example product | Photo codes, in workbook order | Matching files |
| --- | --- | --- |
| 01-001-001 | EXAMPLE-01-001-001-1<br>EXAMPLE-01-001-001-2 | images/EXAMPLE-01-001-001-1.png<br>images/EXAMPLE-01-001-001-2.png |
| 01-001-002 | EXAMPLE-01-001-002-1<br>EXAMPLE-01-001-002-2 | images/EXAMPLE-01-001-002-1.png<br>images/EXAMPLE-01-001-002-2.png |
| 01-001-003 | EXAMPLE-01-001-003-1<br>EXAMPLE-01-001-003-2 | images/EXAMPLE-01-001-003-1.png<br>images/EXAMPLE-01-001-003-2.png |

In photo_codes, write one code per line, without the file extension. Name each uploaded file exactly CODE.png (or CODE.jpg, CODE.webp, CODE.avif). The first listed code is the first displayed image. Select the image files directly; folder names and ZIP files are not part of the upload contract.

For real imports, fill Products and Dimensions with new products and unused part codes. Examples is reference-only: its current catalog part codes cannot be imported again. Replace illustrative photo codes and placeholders with your own filenames and photos. A photo code becomes bound to the uploaded bytes; use a new code for a different photo.

CSV has no sheets; [products-template.csv](products-template.csv) is the blank column template and [product-examples.csv](product-examples.csv) contains the corresponding reference rows. Upload uses XLSX. The importer accepts the optional Examples sheet and never imports its rows. If using an older app version that rejects Examples, remove that sheet before uploading.

This workbook captures the catalog references on 12 September 2026. Download a fresh template from the admin dashboard for current references. The ZIP beside this directory is a download bundle; extract it and select the XLSX and image files separately in the importer.
