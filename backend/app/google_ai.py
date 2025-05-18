import os
from google import genai
from dotenv import load_dotenv


load_dotenv()

API_KEY: str = os.getenv("GEMINI_API_KEY", default="")

client = genai.Client(api_key=API_KEY)

def get_completion(prompt: str) -> str:
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash', contents=prompt
        )
        return str(response.text)
    except Exception as e:
        print(e)
        return ""

