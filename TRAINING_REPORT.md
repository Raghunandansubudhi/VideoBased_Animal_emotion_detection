# Training Report and Model Strategy

## Status

**No training started.** Dataset image-source rights remain unresolved and the training gate is closed. The AniMind checkpoint remains unchanged; no new weights or model package were exported.

## Strategy comparison

- **A. Fine-tune the existing model — not recommended as-is.** Its five-output mapping is undocumented and conflicts with the README. The Kaggle data has four classes. The final head would need replacement and the training-time input transform is unknown. Reusing its feature backbone is only a future experiment after preprocessing compatibility is established.
- **B. Train a separate four-class model — recommended after rights provenance review.** The Kaggle archive has four balanced, documented folder/CSV labels (1,000 each) and matches a standard transfer-learning head. Use an ImageNet-pretrained backbone and a fresh four-class head; describe results as predicting the dataset’s manually assigned categories, not validated internal dog emotion. Keep evaluation split by duplicate/source clusters where possible.
- **C. Keep the existing model as an unverified baseline — current MVP decision.** This is the only safe deployment/benchmark posture until the mapping and preprocessing are established. UI/API now mark its outputs as unverified.
- **D. Find another open dataset — fallback if the uploader cannot substantiate rights to the copied source images.** The current Kaggle record declares CC0, but lists the image sources only as “various online sources” without per-image provenance.

**Recommended path:** C now; B only after confirming the uploader has authority to dedicate all images to CC0 and after documenting the label review. If that cannot be confirmed, choose D. The new notebook defines a separate RGB [0,1] MobileNetV2 transfer-learning model and does not reuse the legacy five-class head.

## Training gate

The Kaggle record’s CC0 designation permits reuse and derivative works, including weights, under its stated terms. That is a platform-declared licence, not independent proof that upstream image rights were clear. The user instructed that training remain disabled while this uncertainty persists. The Colab notebook now audits the image archive, checks file integrity, exact/perceptual duplicates, labels, and grouped stratified splits, then blocks before training unless all approval flags are explicitly enabled. It includes augmentation, ImageNet MobileNetV2 transfer learning, early stopping, learning-rate reduction, held-out evaluation, and a private model package export path. It was syntax-checked only; Colab execution and model results are not claimed.
