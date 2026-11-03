import os
import time
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("ERROR: GEMINI_API_KEY not found in .env")
    raise SystemExit(1)

try:
    client = genai.Client(
        api_key=api_key,
        http_options={"timeout": 60000}
    )

    print("Testing Gemini 3.5 Flash-Lite...")
    start = time.time()

    response = client.interactions.create(
        model="gemini-3.5-flash-lite",
        input="Explain artificial intelligence in exactly two short sentences.",
        generation_config={
            "thinking_level": "minimal",
            "max_output_tokens": 150
        },
        timeout=60
    )

    print("\nGemini response:")
    print(response.output_text)

    print(f"\nTime taken: {time.time() - start:.1f} seconds")

except Exception as error:
    print(f"\nGemini test failed: {error}")