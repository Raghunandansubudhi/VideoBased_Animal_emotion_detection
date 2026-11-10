# Limitations

- Model labels are inconsistent across README and inference source. The code/class_index map is known, but checkpoint training semantics are unverified; API and UI mark predictions accordingly.
- Inference uses OpenCV BGR, resize to 224×224, float32/255. The reproducible test checks this implementation, not whether the absent trainer used the same transform.
- Video output aggregates sampled frame-level scores. No temporal neural network is used.
- Visual categories do not establish a dog’s internal emotional state; clustering-derived dataset labels are not validated affect ground truth.
- Dog detection relies on YOLOv8 COCO class 16, downloaded lazily if not cached. Image inference still falls back to full-frame classification when detection misses; video inference reports no dog if none is detected.
- Confidence and normalized entropy are model-score summaries, not calibrated probabilities or clinical measures.
- A single sample per second can miss brief behavior; partial occlusion, camera angle, lighting, breed, and context can change predictions.
- No validated accuracy, generalization, fairness, or robustness results are available.
- Kaggle lists the image archive as CC0: Public Domain, but its creator says images came from various online sources without per-image provenance. No training has started; verify the creator’s authority to dedicate all images before use.
