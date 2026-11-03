import fitz
from pathlib import Path


def extract_pdf_slides(pdf_path, output_dir):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    slide_images = []

    with fitz.open(pdf_path) as pdf:
        for index, page in enumerate(pdf):
            image_path = output_dir / f"slide_{index + 1}.png"

            pixmap = page.get_pixmap(
                matrix=fitz.Matrix(1.5, 1.5),
                alpha=False
            )

            pixmap.save(str(image_path))
            slide_images.append(str(image_path))

    return slide_images
import cv2


def extract_video_frames(video_path):
    output_dir = Path("extracted_frames")
    output_dir.mkdir(exist_ok=True)

    capture = cv2.VideoCapture(str(video_path))

    if not capture.isOpened():
        raise ValueError("Unable to open lecture video.")

    fps = capture.get(cv2.CAP_PROP_FPS)

    if fps <= 0:
        capture.release()
        raise ValueError("Unable to determine video frame rate.")

    interval = 2
    frame_number = 0
    extracted_frames = []

    while True:
        capture.set(
            cv2.CAP_PROP_POS_MSEC,
            frame_number * interval * 1000
        )

        success, frame = capture.read()

        if not success:
            break

        timestamp = frame_number * interval
        image_path = output_dir / f"frame_{timestamp}.jpg"

        cv2.imwrite(str(image_path), frame)

        extracted_frames.append({
            "timestamp": timestamp,
            "image_path": str(image_path)
        })

        frame_number += 1

    capture.release()

    return extracted_frames
from PIL import Image
import imagehash


def match_frame_to_slide(frame_path, slide_images):
    frame_hash = imagehash.phash(Image.open(frame_path))

    best_slide = None
    best_distance = float("inf")

    for index, slide_path in enumerate(slide_images):
        slide_hash = imagehash.phash(Image.open(slide_path))

        distance = frame_hash - slide_hash

        if distance < best_distance:
            best_distance = distance
            best_slide = index + 1

    return {
        "slide_number": best_slide,
        "distance": best_distance
    }