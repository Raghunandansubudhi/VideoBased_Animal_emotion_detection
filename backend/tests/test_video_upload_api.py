import io
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from starlette.datastructures import Headers, UploadFile

import main


class VideoUploadApiTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.pipeline_loaded = patch.object(main, "_ensure_dog_pipeline_loaded", return_value=None)
        self.pipeline_loaded.start()
        self.addCleanup(self.pipeline_loaded.stop)

    @staticmethod
    def upload(filename, contents, mime_type):
        return UploadFile(
            filename=filename,
            file=io.BytesIO(contents),
            headers=Headers({"content-type": mime_type}),
        )

    async def test_rejects_unsupported_extension(self):
        with self.assertRaises(HTTPException) as raised:
            await main.predict_video_api(self.upload("clip.mkv", b"video", "video/x-matroska"))
        self.assertEqual(raised.exception.status_code, 415)
        self.assertIn("Unsupported video format", raised.exception.detail)

    async def test_rejects_non_video_mime_type(self):
        with self.assertRaises(HTTPException) as raised:
            await main.predict_video_api(self.upload("clip.mp4", b"data", "application/pdf"))
        self.assertEqual(raised.exception.status_code, 415)
        self.assertIn("MIME type", raised.exception.detail)

    async def test_rejects_empty_video(self):
        with self.assertRaises(HTTPException) as raised:
            await main.predict_video_api(self.upload("clip.mp4", b"", "video/mp4"))
        self.assertEqual(raised.exception.status_code, 400)
        self.assertIn("empty", raised.exception.detail)

    async def test_corrupt_or_no_dog_pipeline_errors_are_client_errors(self):
        for message in ("Could not open video", "No dog was detected"):
            with self.subTest(message=message), patch.object(main, "predict_video", return_value={"error": message}):
                with self.assertRaises(HTTPException) as raised:
                    await main.predict_video_api(self.upload("clip.avi", b"not-a-video", "video/x-msvideo"))
                self.assertEqual(raised.exception.status_code, 422)
                self.assertEqual(raised.exception.detail, message)

    async def test_valid_upload_returns_video_analysis_schema(self):
        expected = {
            "emotion": "relax",
            "confidence": 0.4,
            "label_mapping_verified": False,
            "sample_count": 1,
            "timestamped_predictions": [{"timestamp_seconds": 0.0, "emotion": "relax", "confidence": 0.4}],
            "emotion_distribution": {"relax": 1.0},
            "uncertainty_normalized_entropy": 0.5,
        }
        with patch.object(main, "predict_video", return_value=expected) as predictor:
            result = await main.predict_video_api(self.upload("clip.webm", b"webm-data", "video/webm"))
        self.assertEqual(result, expected)
        predictor.assert_called_once()


if __name__ == "__main__":
    unittest.main()
