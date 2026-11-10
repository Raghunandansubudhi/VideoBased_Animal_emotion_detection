import tensorflow as tf
import numpy as np
import cv2
from ultralytics import YOLO
from collections import deque, Counter
import warnings
import base64
import time
warnings.filterwarnings("ignore")

# ── CONFIG ─────────────────────────────────────────
IMG_SIZE = 224
CLASSES = ['alert', 'angry', 'frown', 'happy', 'relax']

# ── LOAD MODEL ─────────────────────────────────────
model = tf.keras.models.load_model("model/dog_emotion_best_model.keras")

# ── YOLO (lazy load) ───────────────────────────────
YOLO_MODEL = None

def get_yolo():
    global YOLO_MODEL
    if YOLO_MODEL is None:
        YOLO_MODEL = YOLO("yolov8n.pt")
    return YOLO_MODEL


# ── DETECT DOG ─────────────────────────────────────
def detect_and_crop_dog(frame_bgr):
    yolo = get_yolo()
    results = yolo(frame_bgr, classes=[16], verbose=False)

    boxes = []
    for r in results:
        for box in r.boxes:
            if int(box.cls[0]) == 16:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                boxes.append((x1, y1, x2, y2))

    if not boxes:
        return None

    x1, y1, x2, y2 = max(boxes, key=lambda b: (b[2]-b[0])*(b[3]-b[1]))
    return frame_bgr[y1:y2, x1:x2]


def preprocess_bgr_crop(crop_bgr):
    """Reproduce the existing inference transform; training-time equivalence is unverified."""
    if crop_bgr is None or crop_bgr.size == 0:
        raise ValueError("Cannot preprocess an empty image crop")
    resized = cv2.resize(crop_bgr, (IMG_SIZE, IMG_SIZE))
    return np.expand_dims(resized.astype(np.float32) / 255.0, axis=0)


# ── TEMPORAL SMOOTHING ─────────────────────────────
class TemporalSmoother:
    def __init__(self, window=5):
        self.buffer = deque(maxlen=window)

    def update(self, probs):
        self.buffer.append(probs)
        return np.mean(self.buffer, axis=0)


# ── KNOWLEDGE BASE ─────────────────────────────────
EMOTION_KB = {
    'angry': {
        'cues': ["Ears pinned back or flat", "Wrinkled muzzle / exposed teeth",
                 "Hard, fixed stare", "Tense facial muscles", "Body leaning forward"],
        'body': "Stiff, forward-leaning posture signals threat readiness.",
        'advice': "Give the dog space. Remove the stressor. Avoid direct eye contact.",
        'emoji': "😤",
    },
    'frown': {
        'cues': ["Furrowed brow", "Ears slightly pulled back",
                 "Downcast eyes", "Drooping mouth"],
        'body': "Subtle signs of discomfort or stress.",
        'advice': "Check for discomfort and provide reassurance.",
        'emoji': "😟",
    },
    'alert': {
        'cues': ["Ears forward", "Eyes wide open",
                 "Head raised", "Sniffing"],
        'body': "Dog is attentive and focused.",
        'advice': "Allow safe exploration.",
        'emoji': "👀",
    },
    'happy': {
        'cues': ["Soft eyes", "Relaxed mouth",
                 "Loose body", "Natural ears"],
        'body': "Dog is relaxed and content.",
        'advice': "Great time for bonding.",
        'emoji': "😄",
    },
    'relax': {
        'cues': ["Half-closed eyes", "Loose ears",
                 "Soft mouth", "Low tension"],
        'body': "Dog feels safe and calm.",
        'advice': "Maintain this calm environment.",
        'emoji': "😌",
    },
}


# ── IMAGE PREDICTION ───────────────────────────────
def predict_photo(image_path):

    bgr = cv2.imread(image_path)
    if bgr is None:
        return {"error": "Failed to read image"}

    crop = detect_and_crop_dog(bgr)
    if crop is None:
        crop = bgr

    img = preprocess_bgr_crop(crop)

    probs = model.predict(img)[0]
    pred_idx = int(np.argmax(probs))

    emotion = CLASSES[pred_idx]
    confidence = float(probs[pred_idx])
    kb = EMOTION_KB.get(emotion)

    return {
        "emotion": emotion,
        "confidence": confidence,
        "label_mapping_verified": False,
        "preprocessing_verified": False,
        "emoji": kb["emoji"],
        "cues": kb["cues"],
        "body": kb["body"],
        "advice": kb["advice"]
    }


# ── VIDEO PREDICTION (FINAL CLEAN) ─────────────────
def predict_video(video_path, sample_interval_seconds=1.0, max_samples=120):
    """Frame-based inference with timestamped, explicitly aggregated results."""
    started = time.perf_counter()
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"error": "Could not open video. Use a valid MP4, AVI, or MOV file."}

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    duration = frame_count / fps if fps and fps > 0 else 0.0
    interval = max(1, int(round((fps if fps and fps > 0 else 1) * sample_interval_seconds)))
    records, representatives = [], []
    frame_index = 0
    try:
        while len(records) < max_samples:
            ok, frame = cap.read()
            if not ok:
                break
            if frame_index % interval == 0:
                crop = detect_and_crop_dog(frame)
                if crop is not None and crop.size:
                    img = preprocess_bgr_crop(crop)
                    probs = np.asarray(model.predict(img, verbose=0)[0], dtype=float)
                    if len(probs) != len(CLASSES):
                        return {"error": f"Model output has {len(probs)} classes; expected {len(CLASSES)}."}
                    idx = int(np.argmax(probs))
                    timestamp = frame_index / fps if fps and fps > 0 else float(frame_index)
                    records.append({"timestamp_seconds": round(timestamp, 3), "emotion": CLASSES[idx], "confidence": float(probs[idx]), "probabilities": {c: float(probs[i]) for i, c in enumerate(CLASSES)}})
                    if len(representatives) < 4:
                        thumb = cv2.resize(crop, (160, 160))
                        encoded, buffer = cv2.imencode(".jpg", thumb, [cv2.IMWRITE_JPEG_QUALITY, 70])
                        if encoded:
                            representatives.append({"timestamp_seconds": round(timestamp, 3), "emotion": CLASSES[idx], "image_jpeg_base64": base64.b64encode(buffer).decode("ascii")})
            frame_index += 1
    finally:
        cap.release()

    if not records:
        return {"error": "No dog was detected in the sampled frames."}

    distribution = {c: sum(r["emotion"] == c for r in records) / len(records) for c in CLASSES}
    dominant = max(distribution, key=distribution.get)
    mean_probs = np.mean([list(r["probabilities"].values()) for r in records], axis=0)
    entropy = float(-np.sum(mean_probs * np.log(np.clip(mean_probs, 1e-12, 1.0))) / np.log(len(CLASSES)))
    counts = Counter(r["emotion"] for r in records)
    kb = EMOTION_KB.get(dominant, {})
    return {
        "emotion": dominant, "confidence": float(mean_probs[CLASSES.index(dominant)]),
        "label_mapping_verified": False, "preprocessing_verified": False,
        "emoji": kb.get("emoji", "🐶"), "cues": kb.get("cues", []), "body": kb.get("body", ""),
        "advice": kb.get("advice", ""), "evolution": "Frame-level predictions aggregated across the sampled video; this is not temporal-model inference.",
        "duration_seconds": round(duration, 3), "processing_seconds": round(time.perf_counter() - started, 3),
        "sample_count": len(records), "sampling_interval_seconds": sample_interval_seconds,
        "emotion_distribution": distribution, "prediction_consistency": max(counts.values()) / len(records),
        "uncertainty_normalized_entropy": entropy, "timestamped_predictions": records,
        "representative_frames": representatives,
        "limitations": "These visual class predictions are not verified measurements of an internal emotional state. The labels and class order need confirmation from the original model author."
    }
