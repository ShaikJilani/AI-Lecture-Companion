import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
def generate_notes(transcript, slide_content=None):
    """Generate lecture notes using Gemini."""

    if not transcript:
        return "No lecture transcript available."

    if isinstance(transcript, str):
        text = transcript
    else:
        text = " ".join(
            str(segment.get("text", ""))
            if isinstance(segment, dict)
            else str(segment)
            for segment in transcript
        )

    text = text.strip()

    if not text:
        return "No lecture transcript text available."

    slides = slide_content or "No slide content available."

    prompt = f"""
You are an AI lecture assistant.

Create clear, well-organized lecture notes using simple English.

Include:
1. Lecture Overview
2. Main Topics
3. Important Definitions
4. Key Points
5. Revision Summary
6. Five Questions and Answers

Use the transcript and slide content provided.
Do not invent information.

LECTURE TRANSCRIPT:
{text[:8000]}

SLIDE CONTENT:
{str(slides)[:3000]}
"""

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return "Gemini API key not found. Check your .env file."

    try:
        client = genai.Client(
            api_key=api_key,
            http_options={"timeout": 60000}
        )

        response = client.interactions.create(
            model="gemini-3.5-flash-lite",
            input=prompt,
            generation_config={
                "thinking_level": "minimal",
                "max_output_tokens": 1500
            },
            timeout=60
        )

        if response.output_text:
            return response.output_text

        return "Gemini returned no content. Please try again."

    except Exception as error:
        print(f"Notes generation error: {error}")
        return f"Could not generate notes: {error}"
def generate_learning_material(transcript, material_type):
    """Generate flashcards, quizzes, study guides, or key terms."""

    if not transcript:
        return "No lecture transcript available."

    if isinstance(transcript, str):
        text = transcript
    else:
        text = " ".join(
            str(segment.get("text", ""))
            if isinstance(segment, dict)
            else str(segment)
            for segment in transcript
        )

    text = text.strip()

    if not text:
        return "No lecture transcript text available."

    prompts = {
        "flashcards": """
Create 10 flashcards from the lecture.

For each flashcard, provide:
Question: A short question
Answer: A clear, short answer

Focus on important concepts, definitions, and exam topics.
""",
        "quiz": """
Create 10 multiple-choice questions from the lecture.

For each question, provide:
1. The question
2. Four options labelled A, B, C, and D
3. The correct answer
4. A short explanation

Ensure each question has exactly one correct answer.
""",
        "study-guide": """
Create an organized exam preparation study guide.

Include:
1. Lecture overview
2. Main topics
3. Important concepts
4. Definitions and explanations
5. Key points to remember
6. Important questions for exam preparation
7. Quick revision summary

Use simple English and clear headings.
""",
        "key-terms": """
Identify up to 15 important technical terms or concepts
from the lecture.

For each term, provide:
1. Term
2. Simple English definition
3. Explanation or example based on the lecture

Prioritize concepts important for exams.
"""
    }

    if material_type not in prompts:
        return "Unsupported learning material type."

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return "Gemini API key not found. Check your .env file."

    text = text[:8000]

    prompt = f"""
You are an educational assistant helping a student understand
lecture content.

Rules:
- Use simple English.
- Use only information supported by the lecture.
- Do not invent facts.
- Make the output clear and well organized.
- Avoid unnecessary repetition.

TASK:
{prompts[material_type]}

LECTURE TRANSCRIPT:
{text}
"""

    try:
        client = genai.Client(
            api_key=api_key,
            http_options={"timeout": 60000}
        )

        response = client.interactions.create(
            model="gemini-3.5-flash-lite",
            input=prompt,
            generation_config={
                "thinking_level": "minimal",
                "max_output_tokens": 2000
            },
            timeout=60
        )

        if response.output_text:
            return response.output_text

        return "Gemini returned no content. Please try again."

    except Exception as error:
        print(f"Learning material generation error: {error}")
        return f"Could not generate learning material: {error}"


def ask_lecture_question(transcript, question):
    try:
        import os
        from google import genai

        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            return "Gemini API key not found. Please check your .env file."

        client = genai.Client(api_key=api_key)

        prompt = f"""
You are an AI Lecture Companion. Your job is to answer questions
using the lecture transcript provided below.

LECTURE TRANSCRIPT:
{transcript}

USER QUESTION:
{question}

INSTRUCTIONS:
1. Understand the user's question carefully.
2. Answer using information from the lecture transcript.
3. Explain the answer in simple, clear English.
4. Organize longer answers using headings and bullet points.
5. Include relevant examples mentioned by the speaker.
6. Do not invent facts or claim the speaker said something that
   is not supported by the transcript.
7. If the transcript contains only limited information about the
   topic, explain only what it supports.
8. If the answer is not available in the transcript, clearly say:
   "The lecture transcript does not provide enough information
   to answer this question."
9. If the user asks about a topic mentioned briefly in the lecture,
   explain the available details without adding unrelated information.
10. Do not simply repeat the question.

Write a helpful answer based on the transcript.
"""

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt
        )

        answer = response.text

        if not answer:
            return "Could not answer your question: Gemini returned an empty response."

        return answer.strip()

    except Exception as e:
        return f"Could not answer your question: {str(e)}"
