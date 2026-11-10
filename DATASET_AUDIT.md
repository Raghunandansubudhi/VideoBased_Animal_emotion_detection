# Dataset Audit — Kaggle Dog Emotion

## Record and access

- Dataset: [Daniel Shan Balico, Dog Emotion](https://www.kaggle.com/datasets/danielshanbalico/dog-emotion), version 1, last updated 2023-02-09.
- Audit used Kaggle’s public, unauthenticated dataset metadata and paginated file-list endpoints, plus the public archive. No account or access restriction was bypassed.
- Kaggle’s metadata explicitly reports `licenseName: "CC0: Public Domain"`. The API metadata does not embed a separate licence file or spell out the version number. The standard CC0 1.0 deed allows commercial and research reuse, modification, and derivative works, including model weights, with no attribution condition, subject to the dedication being valid for the material. See the [CC0 1.0 deed](https://creativecommons.org/publicdomain/zero/1.0/).
- **Licence verdict:** CC0 is explicitly declared by the Kaggle dataset record; it is not merely inferred from a third-party search result. The creator’s right to relicense every image is not independently established. The record says the pictures were gathered from “various online sources” but provides no per-image source URLs or rights evidence. Treat the licence as platform-declared CC0, with underlying image provenance still unresolved.

## Archive audit

- Archive: 162,237,964 bytes; SHA-256 `e65efe510e7d1baf99f5998e7074a97126be6813a530154693c84090cc6ae3b3`.
- ZIP integrity check passed. It contains 4,001 entries: 4,000 images and `Dog Emotion/labels.csv`.
- Image formats: 3,975 JPEG and 25 JPG/alternate JPEG-extension images. All 4,000 decoded successfully with OpenCV; no corrupt image files were found.
- Folder and CSV class counts both show 1,000 `angry`, 1,000 `happy`, 1,000 `relaxed`, and 1,000 `sad` images.
- `labels.csv` has 4,000 unique filenames; no missing image paths and no disagreement between CSV labels and class folders.
- Image dimensions vary: 918 distinct sizes, from 100×72 to 3355×3072; the most common size is 384×384 (1,494 images), followed by 500×375 (411).
- Exact duplicate scan (SHA-256): 4 duplicate pairs (8 files), all within the same class.
- Near-duplicate scan: 50 candidate pairs at 64-bit DCT perceptual-hash Hamming distance ≤4; all candidates are within one class. This heuristic includes the exact duplicates and is not a count of 50 confirmed duplicate images. Manual pair review is needed before removing any.
- A 16-image contact sheet was visually spot-checked. It showed mixed breeds, contexts, lighting, scale, and poses. The dataset is not a uniform facial-expression capture set. A simple 32×32 Laplacian statistic marked 0 images at or below variance 10, but this is only a crude blur flag and not a quality score.

## Labels and provenance

The Kaggle description says the images came from various online sources and were manually labelled by the uploader. The included CSV supplies the image-to-label assignments and matches the folders. The annotation process, labeler agreement, and original image sources are not documented. Therefore the labels are file-level annotations but are not independently verified behavioural ground truth or proof of a dog’s internal affective state.

## Training and weight-use decision

Under the dataset record’s declared CC0 terms, training/research/commercial reuse and derived model weights are permitted. The unverified source-image rights chain is a material provenance limitation, so obtain uploader confirmation that the CC0 dedication covers all constituent images before using the dataset for this project. **No training was started**, per the current task instructions. No dataset media or derived weights were added to the repository or published.

## Audit artifacts

- `dataset_manifest.csv`: per-file paths, byte sizes, SHA-256, class, decode status, dimensions, brightness/blur proxies, and pHash.
- `dataset_summary.json`: record licence/source, exact file and class counts, label verification, integrity, image-quality, and duplicate summary.
- `dataset_content_audit.json`: detailed image dimensions and duplicate candidates.
- The downloaded archive was kept in the Windows temporary directory for this audit, not in the AWARE repository.
