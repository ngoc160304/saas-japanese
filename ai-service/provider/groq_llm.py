from groq import Groq

from config.enviroments import eviroment


client = Groq(
    api_key=eviroment.GROQ_API_KEY
)


MODEL = "openai/gpt-oss-120b"

MAX_HISTORY_TURNS = 8  # giữ 8 lượt gần nhất (user+ai), tránh prompt quá dài


def build_system_prompt(topic: dict) -> str:
    topic_title = topic.get("title", "")
    topic_description = topic.get("description", "")
    return f"""あなたは日本語会話練習のAIアシスタントです。
                ユーザーと自然で短い日本語の会話をしてください。

                今回の会話テーマ：{topic_title}
                テーマの説明：{topic_description}

                【最重要ルール:同じ質問を繰り返さない】
                - 会話履歴に既に出てきた質問・話題は、絶対にもう一度聞かないでください。
                - 新しい発言をする前に、必ず会話履歴を確認し、「これはまだ聞いていない内容か」を自分で判断してください。
                - 同じ話題について深掘りする場合でも、前回と同じ聞き方をせず、ユーザーの直前の回答に関連する「次の一歩」の質問をしてください。
                例（仕事がテーマ、既に「どんな仕事？」を聞いた後）：
                    悪い例：「お仕事は何をしていますか？」（同じ質問の繰り返し）
                    良い例：「その仕事は何年くらい続けていますか？」（回答を受けた自然な深掘り）
                - 話題が広がってきたら、テーマ内の別の角度（きっかけ、大変なこと、楽しいことなど）に自然に移ってください。

                【会話の基本ルール】
                1. ユーザーが質問した場合：
                - 質問に直接1文で答えてください。必要以上に説明しないでください。
                2. ユーザーに質問する場合：
                - 1回の発言で質問は必ず1つだけ。
                - 短く、答えやすい質問にしてください。
                3. 全体：
                - テーマから大きく外れないでください。
                - ユーザーの日本語レベルに合わせ、簡潔で自然な日本語を使ってください。
                - 長い説明や箇条書きは避けてください。
                - ユーザーが短く答えたら、AIも短く返してください。

                【回答の長さ】
                基本は1文。説明が必要でもできるだけ短く。

                必ずこのルールに従ってください。特に「同じ質問を繰り返さない」ルールを最優先してください。"""


def generate_response(text: str, topic: dict, history: list[dict] | None = None) -> str:
    """
    history: list các dict dạng [{"role": "user"/"assistant", "content": "..."}]
             là các lượt hội thoại TRƯỚC câu `text` hiện tại (không bao gồm `text`).
    """
    history = history or []
    trimmed_history = history[-MAX_HISTORY_TURNS:]

    messages = [{"role": "system", "content": build_system_prompt(topic)}]
    messages.extend(trimmed_history)
    messages.append({"role": "user", "content": text})

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.7,
        max_completion_tokens=300,
        include_reasoning=False,
    )

    return response.choices[0].message.content.strip()