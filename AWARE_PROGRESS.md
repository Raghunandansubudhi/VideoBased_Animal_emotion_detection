# AWARE Progress

Updated 2026-11-09.

- [x] Inspected AniMind README/setup, inference source, checkpoint config, class index, frontend, and upstream history.
- [x] Confirmed class order in code, but could not verify that it matches checkpoint training labels; API/UI now mark predictions unverified.
- [x] Factored and tested the exact current BGR preprocessing; training-time transform remains unknown because upstream training code is absent.
- [x] Loaded checkpoint with TensorFlow 2.20 and smoke-tested on sample image, generated static AVI, and no-dog clip.
- [x] Audited Kaggle dataset via public metadata and archive: 4,000 images, four balanced classes, CSV/path validation, image decode/dimensions, exact and perceptual duplicate scan.
- [x] Verified Kaggle record declares CC0: Public Domain; per-image source-rights chain remains unresolved.
- [x] Reworked and syntax-checked the Colab notebook for the four-class Kaggle image archive with private integrity/label/duplicate audit, grouped stratified splits, separate MobileNetV2 transfer-learning pipeline, test evaluation, export contract, and closed rights/training gates.
- [ ] Training not started while image-source provenance remains unresolved; notebook cells were syntax-checked but not run in Colab.
- [x] Repaired frontend lockfile, resolved compatible npm advisories (0 reported), and passed production build and ESLint.
- [x] Started FastAPI and Vite locally; health endpoint and frontend page returned HTTP 200.
- [x] Ran real-motion Wikimedia dog video through `/predict-video`; timestamped frame-level response, distribution, entropy, and representative frames returned.
- [x] Added video upload API validation tests; all 7 backend tests pass.
- [ ] Browser-selected video upload/result rendering and physical webcam flow still require manual verification.
- [ ] Robustness matrix (oversize, low-light, multiple codecs/resolutions, unavailable model/backend) remains incomplete.
- [x] Reports updated: baseline, dataset, training strategy, test, installation, and progress.

See `BASELINE_REPORT.md`, `DATASET_AUDIT.md`, `TRAINING_REPORT.md`, `TEST_REPORT.md`, `INSTALLATION.md`, and `LIMITATIONS.md`.
