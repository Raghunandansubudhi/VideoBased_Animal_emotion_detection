# AWARE Baseline Report

## Status: loaded and smoke-tested; semantics unresolved

Repository: [molka-mallek/animind](https://github.com/molka-mallek/animind), cloned as a Git working tree in this directory. The README and `SETUP_GUIDE.md` identify the dog checkpoint as `backend/model/dog_emotion_best_model.keras` and point to the public Drive file supplied in the project brief.

### Checkpoint integrity and architecture

- Downloaded from the documented Drive link on 2026-11-09; size **31,370,051 bytes (30 MiB)**.
- SHA-256: `621476eaf807f5403963996c32b245baf694d683657ba021844c9d89558b6779`.
- The archive is a readable Keras v3 `.keras` ZIP containing `config.json`, `metadata.json`, and `model.weights.h5`; metadata reports Keras 3.10.0.
- Static config inspection shows input `(None, 224, 224, 3)`, a nested MobileNetV2, and a five-unit softmax output.
- Runtime check: isolated Python 3.10 environment with TensorFlow 2.20.0 loaded the checkpoint successfully. Runtime shapes are `(None, 224, 224, 3)` and `(None, 5)`; a finite dummy-input softmax summed to 1.0.
- A local-only public sample dog photo produced a model output (`angry`, score 0.5248). This is a smoke-test output, not a correctness or accuracy result.
- The frame pipeline processed a generated 3-second AVI made by repeating the same sample photo six times at 2 fps. It emitted three timestamps (0, 1, 2 seconds), distribution, consistency, normalized entropy, and representative frames. It is a plumbing fixture, not natural-motion video validation.
- A generated black-frame AVI returned `No dog was detected in the sampled frames.`

### Preprocessing and class-order discrepancy

The upstream checkout contains no dog-model training script/configuration, data loader, or saved label-encoder artifact. The tracked dog-related files are the inference module and `backend/model/class_index.json`; the upstream history for the dog module is its single initial-code commit. README label prose is not training evidence.

The inference source and `class_index.json` both declare index order `alert, angry, frown, happy, relax` ([pipeline](backend/modules/dog_emotion/ai_pipeline.py:13), [class index](backend/model/class_index.json)). README dog-emotion prose instead says `happy, sad, angry, relaxed, fearful` ([README](README.md:42), [README](README.md:354)). The checkpoint config contains a five-way softmax and architecture only; Keras metadata gives Keras version/save date, no class names or preprocessing. Therefore the **code mapping** is known, but whether it is the checkpoint’s original training mapping is not established. All prediction responses now set `label_mapping_verified: false`, and the results UI warns users.

The reproducible transform used at inference is factored as `preprocess_bgr_crop` ([pipeline](backend/modules/dog_emotion/ai_pipeline.py:47)): OpenCV BGR crop → resize 224×224 using `cv2.resize` default interpolation → `float32` → divide by 255 → add batch dimension. No BGR→RGB conversion or other normalization occurs. [The unit test](backend/tests/test_dog_preprocessing.py) verifies this exact implementation with a synthetic color image, including BGR channel order, output shape, dtype, and [0,1] range. The test verifies current behavior only; it cannot establish training-time equivalence. The original trainer/preprocessing pipeline is absent, so changing to RGB or MobileNetV2 `preprocess_input` would be speculation. Responses also set `preprocessing_verified: false`.

### Video endpoint findings

Original `/predict-video` writes every upload using an `.mp4` suffix, then the pipeline samples every 8 decoded frames. It returns only a majority class and vote fraction; it did not return timestamps, class distribution, per-frame uncertainty, or representatives. It falls back to whole-frame inference if YOLO does not find a dog. The YOLOv8n detector is lazily loaded by Ultralytics and may need a separate network download on first inference.

The AWARE changes in this checkout add controlled one-second frame sampling (maximum 120), timestamps, per-frame class scores, distribution, normalized entropy, consistency, representative crops, and MP4/AVI/MOV/WebM extension/MIME validation with a 200 MiB limit. The live `/predict-video` endpoint has now processed a real-motion 43.32-second Wikimedia sample and returned 15 timestamped predictions. It also returned a no-dog error for the black fixture. These runs verify execution and response plumbing only; they do not establish model correctness, calibrated confidence, or semantic validity. Browser webcam capture remains unverified.

## Baseline decision

Use the current AniMind model only as an explicitly unverified baseline (option C). Keep its checkpoint unchanged. Before trusting its semantic predictions, obtain the original training class mapping and preprocessing or a training artifact from the maintainer. The new Kaggle dataset has four labels and cannot validate the five-class model’s mapping.
