from ddgs import DDGS

def web_search(query):
    try:
        print("Searching web:", query)
        results = DDGS(timeout=4).text(query, region="in-en", safesearch="moderate", timelimit="m", max_results=3, backend="auto")
        if not results: return ""
        return "\n".join(f"SOURCE {i}\nTitle: {r.get('title', '')}\nInformation: {r.get('body', '')}\nURL: {r.get('href', '')}\n-------------------------" for i, r in enumerate(results, 1))
    except Exception as error:
        print("Web search error:", error)
        return ""
