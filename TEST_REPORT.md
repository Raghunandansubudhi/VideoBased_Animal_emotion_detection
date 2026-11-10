# AWARE Test Report

Updated 2026-11-09. This report records checks actually run in the Windows environment.

## PASS

- `npm install` repaired the inconsistent lockfile; `package.json` was not changed. `npm audit fix` applied non-forced compatible dependency updates, and `npm ci` then completed cleanly from the repaired lockfile.
- `npm audit` after the fix: **0 vulnerabilities** across 157 audited packages. The initial audit reported 13; the compatible fixes resolved them.
- `npm ls --depth=0`: all declared direct frontend dependencies are installed.
- `npm run build`: production bundle generated successfully with Vite 8.3.7.
- `npm run lint`: ESLint completed with no findings.
- FastAPI started on `127.0.0.1:8000`; `/healthz` returned `{"status":"ok"}`. Vite started on `127.0.0.1:5173` and served HTTP 200. The Dog Emotion route rendered in the browser.
- Posted a real 43.32-second dog-in-motion WebM from Wikimedia Commons to `/predict-video`. The API decoded it and returned HTTP 200 with 15 sampled frame predictions, timestamps, class distribution, uncertainty, and four representative frames. Processing time was 11.6 seconds on the final run. Output: `relax` dominated 7/15 frames (46.7%); prediction consistency was 46.7%, normalized entropy 88.8%. These are model outputs, not correctness measurements.
- Posted the black `no_dog.avi` fixture to the live API; it returned HTTP 422 as expected.
- Live API validation: unsupported `.mkv` and `.mp4` with PDF MIME type each returned HTTP 415.
- `python -m unittest discover -s tests -p "test_*.py" -v`: **7 tests passed**. Coverage includes inference preprocessing, empty crops, upload extension/MIME/empty validation, corrupt/no-dog error conversion, and response schema.
- `py_compile` passed for the edited backend modules. `git diff --check` passed.
- The 26-cell Colab notebook is valid JSON; all 13 Python code cells parse after excluding the Colab `%pip` magic, and the training/export gates are false by default. It was not executed in a Colab runtime.

## PARTIAL / BLOCKED

- The real video was exercised through the running API endpoint, and the frontend dog-analysis screen was inspected in a browser. A browser-selected file was not submitted through the UI, so rendering of the live API response in-browser remains **NOT TESTED**.
- Webcam functionality is implemented with `getUserMedia` and `MediaRecorder`, including recording timer/status, WebM/MP4 filename handling, empty/error handling, camera permission messaging, preview, retake, track release, and recording upload. Physical camera permission/capture was **NOT TESTED** in this session.
- Browser-to-backend upload/CORS integration was not exercised through the upload control. Both services were reachable locally, the frontend defaults to `http://127.0.0.1:8000`, and the backend CORS middleware allows the local app origin.

## NOT TESTED

- 200 MB boundary/oversize uploads; MP4/AVI/MOV codec matrix; malformed uploads through the visual UI; low-light and resolution robustness; model-unavailable and backend-unavailable display states.
- Webcam denied permission, missing camera, empty recording, retake, and actual analysis in a physical browser.
- Any model accuracy, calibrated confidence, or semantic correctness. Class order and training preprocessing remain unverified.
- Training. It remains disabled because image source provenance and the intended use rights are not fully established.

## Manual browser checklist

1. Run the Windows commands in `INSTALLATION.md` and open `http://localhost:5173/modules/dog-emotion`.
2. Select **Video**, choose `samples/dog_gopro.webm`, click **Analyze Emotion**, and confirm the distribution, timestamps, sample count, uncertainty, and representative frames appear with the unverified-label disclaimer.
3. Select **Webcam**, choose **Start camera**, grant the browser permission, record for several seconds, stop, preview, retake once, then analyze.
4. Repeat with a denied camera permission, a corrupted video, a non-video file renamed `.mp4`, and a video with no dog; confirm actionable errors are shown.

No fabricated metrics or training outcomes are reported.
