import json
import time
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from audio_processor import transcribe_audio
from slide_processor import extract_pdf_slides, extract_video_frames
from timeline_builder import build_slide_timeline
from synchronizer import align_transcript_with_slides
from notes_generator import generate_notes, generate_learning_material, ask_lecture_question
from database import (
    initialize_database,
    save_lecture,
    get_lectures,
    get_lecture_by_id,
    delete_lecture,
    delete_all_lectures
)
app = FastAPI(title="AI Lecture Companion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
SLIDE_DIR = UPLOAD_DIR / "slides"
SLIDE_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/slides", StaticFiles(directory=str(SLIDE_DIR)), name="slides")

initialize_database()


@app.get("/api/health")
def health_check():
    return {
        "status": "running",
        "message": "AI Lecture Companion API is ready"
    }


@app.post("/api/process")
async def process_lecture(
    video: UploadFile = File(...),
    slides: UploadFile = File(...)
):
    video_ext = Path(video.filename or "").suffix.lower()
    slides_ext = Path(slides.filename or "").suffix.lower()

    if video_ext not in {".mp4", ".mov", ".mkv"}:
        raise HTTPException(
            status_code=400,
            detail="Please upload an MP4, MOV, or MKV video."
        )

    if slides_ext != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file."
        )

    job_id = uuid.uuid4().hex
    video_path = UPLOAD_DIR / f"{job_id}{video_ext}"
    pdf_path = UPLOAD_DIR / f"{job_id}.pdf"

    try:
        video_path.write_bytes(await video.read())
        pdf_path.write_bytes(await slides.read())

        start_time = time.time()

        # Step 1: Transcribe lecture audio
        transcription = transcribe_audio(video_path)
        transcript = transcription["segments"]

        # Step 2: Extract PDF slides
        lecture_slide_dir = SLIDE_DIR / job_id
        lecture_slide_dir.mkdir(parents=True, exist_ok=True)

        slide_images = extract_pdf_slides(
           pdf_path,
          lecture_slide_dir
)
        # Step 3: Extract video frames
        extracted_frames = extract_video_frames(video_path)

        # Step 4: Match transcript with slides
        slide_timeline = build_slide_timeline(
            extracted_frames,
            slide_images
        )

        aligned_transcript = align_transcript_with_slides(
            transcript,
            slide_timeline
        )

        # Step 5: Generate AI notes
        notes = generate_notes(transcript)

        if notes.startswith(
            ("Could not generate AI notes:", "Gemini API key not found")
        ):
            raise HTTPException(status_code=502, detail=notes)

        # Save lecture to SQLite
        lecture_id = save_lecture(
            video.filename or "Lecture",
            json.dumps(aligned_transcript),
            notes
        )

        return {
            "lecture_id": lecture_id,
            "title": video.filename or "Lecture",
            "language": transcription.get("language", "Unknown"),
            "transcript": aligned_transcript,
            "slide_count": len(slide_images),
            "slides": [
    {
        "slide_number": index + 1,
        "image_url": f"/slides/{job_id}/slide_{index + 1}.png"
    }
    for index in range(len(slide_images))
],
            "detected_slide_changes": len(slide_timeline),
            "notes": notes,
            "processing_time": round(time.time() - start_time, 2)
        }

    except HTTPException:
        raise

    except Exception as error:
        print(f"Lecture processing error: {error}")

        raise HTTPException(
            status_code=500,
            detail=f"Lecture processing failed: {error}"
        )

    finally:
        await video.close()
        await slides.close()


@app.get("/api/lectures")
def lecture_history():
    try:
        lectures = get_lectures()

        return {
            "lectures": [
                {
                    "id": item[0],
                    "title": item[1],
                    "created_at": item[3] if len(item) > 3 else item[2]
                }
                for item in lectures
            ]
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not load lecture history: {error}"
        )
@app.get("/api/lectures/{lecture_id}")
def view_lecture(lecture_id: int):
    if lecture_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid lecture ID."
        )

    lecture = get_lecture_by_id(lecture_id)

    if not lecture:
        raise HTTPException(
            status_code=404,
            detail="Lecture not found."
        )

    return {
        "id": lecture[0],
        "title": lecture[1],
        "transcript": lecture[2] or "",
        "notes": lecture[3] or "",
        "created_at": lecture[4]
    }
from pydantic import BaseModel


class LearningMaterialRequest(BaseModel):
    transcript: str
    material_type: str


@app.post("/api/generate")
def generate_learning_content(request: LearningMaterialRequest):
    allowed_types = {
        "flashcards",
        "quiz",
        "study-guide",
        "key-terms"
    }

    if request.material_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported learning material type."
        )

    if not request.transcript.strip():
        raise HTTPException(
            status_code=400,
            detail="Please process a lecture first."
        )

    result = generate_learning_material(
        request.transcript,
        request.material_type
    )

    if result.startswith(
        (
            "Could not generate learning material:",
            "Gemini API key not found",
            "Unsupported learning material type."
        )
    ):
        raise HTTPException(status_code=502, detail=result)

    return {
        "material_type": request.material_type,
        "content": result
    }

class LectureChatRequest(BaseModel):
    transcript: str
    question: str


@app.post("/api/chat")
def lecture_chat(request: LectureChatRequest):
    if not request.transcript.strip():
        raise HTTPException(
            status_code=400,
            detail="Please process a lecture first."
        )

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Please enter a question."
        )

    answer = ask_lecture_question(
        request.transcript,
        request.question
    )

    if answer.startswith((
        "Could not answer your question:",
        "Gemini API key not found"
    )):
        raise HTTPException(
            status_code=502,
            detail=answer
        )

    return {"answer": answer}

@app.delete("/api/lectures/{lecture_id}")
def remove_lecture(lecture_id: int):
    if lecture_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid lecture ID."
        )

    deleted = delete_lecture(lecture_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Lecture not found."
        )

    return {
        "message": "Lecture deleted successfully.",
        "lecture_id": lecture_id
    }

@app.delete("/api/lectures")
def remove_all_lectures():
    deleted_count = delete_all_lectures()

    return {
        "message": "All lectures deleted successfully.",
        "deleted_count": deleted_count
    }

