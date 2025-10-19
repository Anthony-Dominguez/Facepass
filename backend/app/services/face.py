import base64
import os
from typing import List, Optional

import cv2
import numpy as np
from deepface import DeepFace


def encode_image(image_base64: str) -> np.ndarray:
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]
    image_bytes = base64.b64decode(image_base64)
    np_image = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_image, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Unable to decode the provided image data.")
    return image


def _load_cascade(filename: str) -> Optional[cv2.CascadeClassifier]:
    path = os.path.join(cv2.data.haarcascades, filename)
    if not os.path.exists(path):
        return None
    cascade = cv2.CascadeClassifier(path)
    if cascade.empty():
        return None
    return cascade


def _load_first_available(options: List[str]) -> Optional[cv2.CascadeClassifier]:
    for option in options:
        cascade = _load_cascade(option)
        if cascade is not None:
            return cascade
    return None


FACE_CASCADE = _load_first_available(
    ["haarcascade_frontalface_default.xml", "haarcascade_frontalface_alt2.xml", "haarcascade_frontalface_alt.xml"]
)
EYE_CASCADE = _load_first_available(["haarcascade_eye_tree_eyeglasses.xml", "haarcascade_eye.xml"])
NOSE_CASCADE = _load_first_available(["haarcascade_mcs_nose.xml", "Nariz.xml"])
MOUTH_CASCADE = _load_first_available(["haarcascade_mcs_mouth.xml", "haarcascade_smile.xml"])

if FACE_CASCADE is None or EYE_CASCADE is None:
    raise RuntimeError("Required Haar cascades not found; ensure OpenCV data files are installed.")


def ensure_face_is_clear(image: np.ndarray) -> None:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = FACE_CASCADE.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
    if len(faces) == 0:
        raise ValueError("No face detected. Make sure your whole face is visible.")
    if len(faces) > 1:
        raise ValueError("Multiple faces detected. Only one person should be in the frame.")

    x, y, w, h = faces[0]
    face_roi_gray = gray[y : y + h, x : x + w]

    eyes = EYE_CASCADE.detectMultiScale(face_roi_gray, scaleFactor=1.1, minNeighbors=12)
    valid_eyes = [
        eye for eye in eyes if eye[2] >= w * 0.15 and eye[3] >= h * 0.15 and eye[1] < h * 0.55
    ]
    if len(valid_eyes) == 0:
        raise ValueError("Keep at least one eye fully visible when capturing your face.")


def compute_embedding(image_base64: str, enforce_clear_face: bool = False) -> List[float]:
    image = encode_image(image_base64)
    if enforce_clear_face:
        ensure_face_is_clear(image)
    representations = DeepFace.represent(
        img_path=image,
        enforce_detection=True,
        detector_backend="opencv",
    )
    if not representations:
        raise ValueError("No face detected.")
    return representations[0]["embedding"]


def embeddings_match(embedding_a: List[float], embedding_b: List[float], threshold: float = 0.7) -> bool:
    vec_a = np.array(embedding_a)
    vec_b = np.array(embedding_b)
    distance = np.linalg.norm(vec_a - vec_b)
    return distance <= threshold
