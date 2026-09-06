import json

from groq import Groq

from config.enviroments import eviroment


client = Groq(
    api_key=eviroment.GROQ_API_KEY
)


MODEL = "openai/gpt-oss-120b"


def score_language(conversation: list[dict]) -> dict:

    conversation_text = "\n\n".join(
        (
            f"User: {item['stt_text']}\n"
            f"AI: {item['llm_text']}"
        )
        for item in conversation
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "あなたは日本語会話練習の評価者です。"
                    "学習者の会話全体を評価してください。"
                    "一つ一つの発言を個別に採点するのではなく、"
                    "会話全体の文脈を考慮して総合的に評価してください。"
                    "\n\n"
                    "Grammar:"
                    " 学習者の文法の正確さを0から100点で評価してください。"
                    "\n"
                    "Vocabulary:"
                    " 学習者の語彙の適切さ、豊富さ、"
                    "会話での使い方を0から100点で評価してください。"
                    "\n"
                    "Relevance:"
                    " AIと学習者の会話の流れを考慮して、"
                    "学習者の回答が質問や会話の内容に"
                    "どの程度適切だったかを0から100点で評価してください。"
                    "\n\n"
                    "必ず会話全体を読んでから評価してください。"
                    "必ずJSON形式だけで回答してください。"
                    "説明やMarkdownは不要です。"
                    "\n\n"
                    '回答形式: '
                    '{"grammar": 0, "vocabulary": 0, "relevance": 0}'
                ),
            },
            {
                "role": "user",
                "content": conversation_text,
            },
        ],
        temperature=0,
        max_completion_tokens=500,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content

    print("LANGUAGE RAW RESPONSE:", repr(content))

    if not content:
        raise ValueError("Groq returned empty response")

    content = content.strip()

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        print("INVALID JSON FROM GROQ:", repr(content))
        raise

    return result