def align_transcript_with_slides(transcript, slide_timeline):
    slide_timeline = sorted(
        slide_timeline,
        key=lambda item: item["timestamp"]
    )

    aligned_transcript = []

    for segment in transcript:
        active_slide = None

        for slide in slide_timeline:
            if slide["timestamp"] <= segment["start"]:
                active_slide = slide["slide_number"]
            else:
                break

        aligned_transcript.append({
            **segment,
            "slide_number": active_slide
        })

    return aligned_transcript