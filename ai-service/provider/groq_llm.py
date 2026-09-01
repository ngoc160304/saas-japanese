from groq import Groq

from config.enviroments import eviroment


client = Groq(
    api_key=eviroment.GROQ_API_KEY
)


MODEL = "openai/gpt-oss-120b"


def generate_response(text: str) -> str:

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "あなたは日本語会話練習のAIアシスタントです。"
                    "ユーザーと自然な日本語で会話してください。"
                    "回答は簡潔にしてください。"
                    "難しい表現は避けて、学習者に分かりやすい日本語を使ってください。"
                ),
            },
            {
                "role": "user",
                "content": text,
            },
        ],
        temperature=0.7,
        max_completion_tokens=300,
        include_reasoning=False,
    )

    return response.choices[0].message.content.strip()