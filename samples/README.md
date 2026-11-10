# Local smoke-test samples

- `baseline_dog.jpg` is a public sample fetched from `https://raw.githubusercontent.com/pjreddie/darknet/master/data/dog.jpg` for local-only model smoke testing.
- `baseline_dog_clip.avi` is a 3-second, 2 fps AVI created by repeating that still image. It tests video decoding and timestamps, not natural dog motion.
- `no_dog.avi` is a six-frame black clip created locally to check no-dog handling.
- `corrupt.avi` contains invalid bytes and was used to confirm the video pipeline returns an open/format error.
- `dog_gopro.webm` is a real 43.32-second dog-in-motion test video by Pablo Fuentes, downloaded from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Dog_seen_from_a_GoPro.webm), licensed CC BY 3.0. It is included only for local application testing; no model correctness is implied.

These samples are not dataset training data and are not ground-truth-labelled examples. Do not interpret their predicted categories as correctness results.
