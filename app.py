import json
import time
import streamlit as st
from pathlib import Path

from audio_processor import transcribe_audio
from slide_processor import extract_pdf_slides, extract_video_frames
from timeline_builder import build_slide_timeline
from synchronizer import align_transcript_with_slides
from notes_generator import generate_notes
from database import initialize_database, save_lecture, get_lectures


# --------------------------------------------------
# APPLICATION CONFIGURATION
# --------------------------------------------------

st.set_page_config(
    page_title="AI Lecture Companion",
    page_icon="🎓",
    layout="wide"
)

initialize_database()

st.title("🎓 AI Lecture Companion")

st.write(
    "Upload a lecture video and its PDF slides to generate "
    "a synchronized transcript and AI-powered study notes."
)


# --------------------------------------------------
# FILE UPLOAD
# --------------------------------------------------

video = st.file_uploader(
    "Upload Lecture Video",
    type=["mp4", "mov", "mkv"]
)

slides = st.file_uploader(
    "Upload PDF Slides",
    type=["pdf"]
)


# --------------------------------------------------
# PROCESS LECTURE
# --------------------------------------------------

if st.button("Process Lecture", type="primary"):

    if video is None or slides is None:
        st.error("Please upload both the lecture video and PDF slides.")

    else:
        upload_dir = Path("uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)

        video_path = (
            upload_dir / f"lecture{Path(video.name).suffix.lower()}"
        )

        slides_path = upload_dir / Path(slides.name).name

        total_start = time.time()

        try:
            # Save uploaded files
            video_path.write_bytes(video.getvalue())
            slides_path.write_bytes(slides.getvalue())

            # ------------------------------------------
            # STEP 1: TRANSCRIBE AUDIO
            # ------------------------------------------

            step_start = time.time()

            with st.spinner(
                "Step 1/5: Transcribing lecture audio..."
            ):
                result = transcribe_audio(video_path)
                transcript = result["segments"]

            st.success(
                f"Step 1 completed in "
                f"{time.time() - step_start:.1f} seconds."
            )

            # ------------------------------------------
            # STEP 2: EXTRACT PDF SLIDES
            # ------------------------------------------

            step_start = time.time()

            with st.spinner(
                "Step 2/5: Extracting PDF slides..."
            ):
                slide_images = extract_pdf_slides(slides_path)

            st.success(
                f"Step 2 completed: {len(slide_images)} slides "
                f"extracted in {time.time() - step_start:.1f} seconds."
            )

            # ------------------------------------------
            # STEP 3: EXTRACT VIDEO FRAMES
            # ------------------------------------------

            step_start = time.time()

            with st.spinner(
                "Step 3/5: Extracting video frames..."
            ):
                extracted_frames = extract_video_frames(video_path)

            st.success(
                f"Step 3 completed: {len(extracted_frames)} frames "
                f"extracted in {time.time() - step_start:.1f} seconds."
            )

            # ------------------------------------------
            # STEP 4: MATCH FRAMES WITH SLIDES
            # ------------------------------------------

            step_start = time.time()

            with st.spinner(
                "Step 4/5: Synchronizing transcript with slides..."
            ):
                slide_timeline = build_slide_timeline(
                    extracted_frames,
                    slide_images
                )

                aligned_transcript = align_transcript_with_slides(
                    transcript,
                    slide_timeline
                )

            st.success(
                f"Step 4 completed in "
                f"{time.time() - step_start:.1f} seconds."
            )

            # ------------------------------------------
            # STEP 5: GENERATE AI NOTES
            # ------------------------------------------

            step_start = time.time()

            with st.spinner(
                "Step 5/5: Generating AI lecture notes..."
            ):
                notes = generate_notes(transcript)

            notes_time = time.time() - step_start

            if notes.startswith("Could not generate AI notes:"):
                st.error(notes)
                st.warning(
                    "AI note generation failed. "
                    "Check your API key, model access, and connection."
                )

                # Do not save an API error as successful notes.
                st.stop()

            if notes.startswith("Gemini API key not found"):
                st.error(notes)
                st.stop()

            st.success(
                f"Step 5 completed: AI notes generated in "
                f"{notes_time:.1f} seconds."
            )

            # ------------------------------------------
            # SAVE LECTURE
            # ------------------------------------------

            lecture_id = save_lecture(
                video.name,
                json.dumps(aligned_transcript),
                notes
            )

            total_time = time.time() - total_start

            st.success(
                f"Lecture processed successfully! "
                f"Lecture ID: {lecture_id}"
            )

            st.info(
                f"Total processing time: {total_time:.1f} seconds."
            )

            # ------------------------------------------
            # LECTURE INFORMATION
            # ------------------------------------------

            st.subheader("📊 Lecture Information")

            col1, col2, col3, col4 = st.columns(4)

            col1.metric(
                "Language",
                result.get("language", "Unknown")
            )

            col2.metric(
                "Transcript Segments",
                len(transcript)
            )

            col3.metric(
                "PDF Slides",
                len(slide_images)
            )

            col4.metric(
                "Detected Slide Changes",
                len(slide_timeline)
            )

            # ------------------------------------------
            # DISPLAY RESULTS
            # ------------------------------------------

            tab1, tab2, tab3 = st.tabs(
                [
                    "📝 Synchronized Transcript",
                    "🖼️ Slides",
                    "🤖 AI Lecture Notes"
                ]
            )

            # ------------------------------------------
            # TRANSCRIPT TAB
            # ------------------------------------------

            with tab1:

                if not aligned_transcript:
                    st.info("No transcript segments were generated.")

                for segment in aligned_transcript:

                    st.markdown(
                        f"**{segment['start']:.2f}s – "
                        f"{segment['end']:.2f}s**"
                    )

                    st.write(segment["text"])

                    slide_number = segment.get("slide_number")

                    if slide_number is not None:
                        st.caption(
                            f"Associated slide: {slide_number}"
                        )
                    else:
                        st.caption("No matching slide detected.")

                    st.divider()

            # ------------------------------------------
            # SLIDES TAB
            # ------------------------------------------

            with tab2:

                if not slide_images:
                    st.info("No slides were extracted.")

                for index, image_path in enumerate(
                    slide_images,
                    start=1
                ):
                    st.image(
                        str(image_path),
                        caption=f"Slide {index}",
                        use_container_width=True
                    )

            # ------------------------------------------
            # AI NOTES TAB
            # ------------------------------------------

            with tab3:

                st.markdown(notes)

                st.download_button(
                    label="⬇️ Download Lecture Notes",
                    data=notes,
                    file_name="lecture_notes.md",
                    mime="text/markdown"
                )

        except Exception as error:
            st.error(
                f"An error occurred while processing the lecture: {error}"
            )


# --------------------------------------------------
# PREVIOUSLY SAVED LECTURES
# --------------------------------------------------

with st.expander("📚 Previously Saved Lectures"):

    lectures = get_lectures()

    if lectures:
        for lecture in lectures:
            st.write(
                f"ID: {lecture[0]} | "
                f"Title: {lecture[1]} | "
                f"Created: {lecture[2]}"
            )
    else:
        st.info("No lectures have been saved yet.")
