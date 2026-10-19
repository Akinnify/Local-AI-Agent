# agent.py
import pandas as pd
from langchain_core.tools import tool
from langchain_ollama import ChatOllama
from langchain.agents import create_agent
from vector import vector_store

df = pd.read_csv("realistic_restaurant_reviews.csv")

@tool
def search_reviews(query: str, min_rating: int = 1, max_rating: int = 5) -> str:
    """Semantic search over restaurant reviews. Use for questions about topics
    like food quality, service, or vegan options. Can filter by star rating."""
    docs = vector_store.similarity_search(
        query, k=5,
        filter={"$and": [{"rating": {"$gte": min_rating}},
                         {"rating": {"$lte": max_rating}}]},
    )
    return "\n".join(
        f"[{d.metadata['rating']} stars, {d.metadata['date']}] {d.page_content}"
        for d in docs
    ) or "No matching reviews."

@tool
def review_stats() -> str:
    """Get total review count, average rating, and count per star rating.
    Use for any numeric or aggregate question."""
    counts = df["Rating"].value_counts().sort_index().to_dict()
    return f"Total: {len(df)}, average: {df['Rating'].mean():.2f}, per rating: {counts}"

agent = create_agent(
    model=ChatOllama(model="llama3.1:8b", temperature=0),
    tools=[search_reviews, review_stats],
    system_prompt=(
        "You answer questions about a pizza restaurant using ONLY tool results. "
        "If the tools don't return enough information, say so. "
        "Mention how many reviews support your answer."
    ),
)