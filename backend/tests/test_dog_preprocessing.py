import unittest

import cv2
import numpy as np

from modules.dog_emotion.ai_pipeline import IMG_SIZE, preprocess_bgr_crop


class DogPreprocessingTest(unittest.TestCase):
    def test_current_inference_transform_is_bgr_float32_zero_to_one(self):
        # A constant BGR input makes resize behavior deterministic.
        source = np.empty((31, 47, 3), dtype=np.uint8)
        source[:] = (0, 127, 255)

        actual = preprocess_bgr_crop(source)
        expected = cv2.resize(source, (IMG_SIZE, IMG_SIZE)).astype(np.float32) / 255.0
        expected = np.expand_dims(expected, axis=0)

        self.assertEqual(actual.shape, (1, IMG_SIZE, IMG_SIZE, 3))
        self.assertEqual(actual.dtype, np.float32)
        self.assertTrue(np.allclose(actual, expected))
        self.assertTrue(np.allclose(actual[0, 100, 100], (0.0, 127 / 255.0, 1.0)))
        self.assertGreaterEqual(float(actual.min()), 0.0)
        self.assertLessEqual(float(actual.max()), 1.0)

    def test_empty_crop_is_rejected(self):
        with self.assertRaises(ValueError):
            preprocess_bgr_crop(np.empty((0, 0, 3), dtype=np.uint8))


if __name__ == "__main__":
    unittest.main()
