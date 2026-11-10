# Windows Installation and Colab Instructions

## Windows application (PowerShell)

The repository is in the `AWARE` subfolder. The baseline checkpoint is already downloaded at `backend\model\dog_emotion_best_model.keras`. Its SHA-256 is in `BASELINE_REPORT.md`.

Open PowerShell in the workspace parent folder and run these exact dog-app setup commands:

```powershell
Set-Location "C:\Users\ASUS\OneDrive\Documents\ChatGPT\videobased_emotion_detaction\AWARE\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install "tensorflow>=2.20" opencv-python ultralytics fastapi "uvicorn[standard]" python-multipart numpy
python -c "import tensorflow as tf; print('TensorFlow',tf.__version__,'GPUs',tf.config.list_physical_devices('GPU'))"
python -c "import zipfile; z=zipfile.ZipFile('model/dog_emotion_best_model.keras'); print('Checkpoint archive OK:',z.testzip())"
```

To smoke-test the provided local image and generated AVI fixture after installation:

```powershell
python -c "from modules.dog_emotion.ai_pipeline import predict_photo; print(predict_photo('..\\samples\\baseline_dog.jpg'))"
python -c "from modules.dog_emotion.ai_pipeline import predict_video; print(predict_video('..\\samples\\baseline_dog_clip.avi'))"
python -m unittest discover -s tests -p "test_*.py" -v
```

The included AVI is a repeated still image for API plumbing only; use your own natural dog footage for a meaningful demo.

The minimal command avoids unrelated AniMind modules. `backend\requirements.txt` includes substantial dependencies for the project's other pipelines; install those separately if you need them. Native Windows TensorFlow is CPU-only after TensorFlow 2.10; use WSL2 for supported NVIDIA GPU inference. [TensorFlow’s install guide](https://www.tensorflow.org/install/pip) documents the Windows/WSL2 support boundary.

Run backend from `backend` so the existing relative model path resolves:

```powershell
uvicorn main:app --reload --port 8000
```

In a second PowerShell window, run:

```powershell
Set-Location "C:\Users\ASUS\OneDrive\Documents\ChatGPT\videobased_emotion_detaction\AWARE\frontend"
npm ci
npm run dev
```

The frontend dependencies are installed. `npm install` repaired the lockfile by adding the missing optional `@emnapi` package graph and reconciling compatible package versions; `package.json` was unchanged. `npm audit fix` applied non-forced compatible security fixes. A clean `npm ci` now succeeds, `npm audit` reports zero vulnerabilities, and `npm run build` and `npm run lint` pass.

Open the Vite URL printed in the terminal (normally `http://localhost:5173`) and navigate to **Analyze My Animal → Dog Emotion**, or directly open `http://localhost:5173/modules/dog-emotion`. The frontend defaults to the local backend at `http://127.0.0.1:8000`. To use another endpoint, set `VITE_API_BASE_URL` before starting Vite.

The video endpoint accepts MP4, AVI, MOV and WebM, validates extension and MIME type, rejects files above 200 MB, and returns a clear error for invalid or dog-free video. Webcam recording uses `MediaRecorder` and submits WebM or MP4 to that same endpoint. On Windows, use localhost for camera APIs; the browser must grant camera permission. The interface displays a recording timer/status and provides preview and retake controls. The physical webcam flow still needs a manual browser check; see `TEST_REPORT.md`.

For an end-to-end local API sample, use the included real-motion clip `samples\dog_gopro.webm` (creator Pablo Fuentes, CC BY 3.0; attribution in `samples\README.md`). It was successfully analyzed by the local API. The result only demonstrates that the pipeline runs, not that the model's class predictions are correct.

The backend lazily loads the model and Ultralytics YOLOv8n. First inference may fetch `yolov8n.pt` if it is not cached. The model and detector must load successfully before prediction. AWARE responses for videos are frame-level predictions aggregated over sampled timestamps; they do not represent temporal neural network inference. Labels and training preprocessing remain unverified, and outputs are not validated emotional states.

## Google Colab notebook

1. Open `notebooks/AWARE_Dog_Emotion_Training.ipynb` in Google Colab (upload the notebook or place it in Drive and open with Colab).
2. Select **Runtime → Change runtime type → T4 GPU** if available; the notebook checks the actual device and works without assuming a T4.
3. The audited Kaggle archive is available locally at `%TEMP%\aware-dog-emotion-v1.zip` and contains `Dog Emotion/<class>/` image folders plus `labels.csv`. If you later use it in Colab, upload the archive privately to Drive and extract it there. Kaggle lists the archive under CC0; this project has not started training.
4. Use the notebook's private archive audit cells to check the image files, folder labels, exact and perceptual duplicates, and grouped stratified splits. The notebook's rights, label, user-approval, and training flags are all `False`; training stops at the gate unless all are explicitly approved.
5. The notebook uses a separate four-class MobileNetV2 model and checks the declared AWARE preprocessing contract. It does not replace or fine-tune the existing AniMind checkpoint. A dedicated Windows adapter is required before that artifact can be integrated.
6. Report only measured held-out results. Never upload dataset images or derived weights publicly without a separate explicit request.

## Runtime status

Backend health, frontend serving, production build, lint, npm advisory audit, and a real dog-video API analysis have passed. Browser file-upload result rendering and physical webcam capture remain for manual verification. See `TEST_REPORT.md`.
