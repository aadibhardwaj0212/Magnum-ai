import ollama


def ask_ai(question, web_context):
    print("Thinking...")
    if not web_context:
        return "I couldn't access the web right now, so I can't reliably answer that."

    prompt = f"""You are Magnum, a fast web-connected AI assistant.
Answer the user's question using the web results.
Rules: use web results as the primary source; prefer recent information; do not invent facts; be concise; give the direct answer first; state uncertainty; do not mention knowledge cutoffs.

QUESTION:
{question}

WEB RESULTS:
{web_context}

Answer naturally and clearly."""
    try:
        response = ollama.chat(
            model="mistral",
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.2, "num_predict": 250},
        )
        answer = response["message"]["content"]
        print("Magnum:", answer)
        return answer
    except Exception as error:
        print("AI error:", error)
        return "Sorry, I couldn't process the information."
