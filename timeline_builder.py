from slide_processor import match_frame_to_slide
def build_slide_timeline(extracted_frames, slide_images):
    slide_timeline = []
    previous_slide = None

    for frame in extracted_frames:
        match = match_frame_to_slide(
            frame["image_path"],
            slide_images
        )

        slide_number = match["slide_number"]

        if slide_number is None:
            continue

        if slide_number != previous_slide:
            slide_timeline.append({
                "timestamp": frame["timestamp"],
                "slide_number": slide_number
            })

            previous_slide = slide_number

    return slide_timeline