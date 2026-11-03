from faster_whisper import WhisperModel


def transcribe_audio(video_path):
    model = WhisperModel(
        "base",
        device="cpu",
        compute_type="int8"
    )

    segments, info = model.transcribe(
        str(video_path),
        beam_size=5
    )

    transcript = []

    for segment in segments:
        transcript.append({
            "start": round(segment.start, 2),
            "end": round(segment.end, 2),
            "text": segment.text.strip()
        })

    return {
        "language": info.language,
        "segments": transcript
    }