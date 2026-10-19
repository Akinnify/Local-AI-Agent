A local, tool-calling AI agent that answers questions about restaurant reviews. It runs on Ollama, LangChain, ChromaDB, FastAPI, and React

## Screenshots

<img width="1913" height="903" alt="Screenshot 2026-10-19 120558" src="https://github.com/user-attachments/assets/4ca12ebe-960e-483c-a33c-8c6d1deace06" />
<img width="1918" height="903" alt="Screenshot 2026-10-19 121644" src="https://github.com/user-attachments/assets/6ad15d15-09e5-4886-9a05-7b07a47104e0" />

## How it works

```
React (Vite)  →  FastAPI /chat  →  Agent (LangChain + Ollama)
                                      ├─ search_reviews → ChromaDB vector search
                                      └─ review_stats   → pandas aggregates
```

The agent decides which tool to call for each question. Topic questions like "what do people say about the crust?" use semantic search over the reviews, optionally filtered by star rating. Numeric questions like "what's the average rating?" use pandas, so the numbers are computed instead of guessed. The frontend keeps the conversation history and sends it with each request, so the API stays stateless.

## Tech stack

- **Models:** Ollama (`llama3.1:8b` for chat, `mxbai-embed-large` for embeddings)
- **Agent and retrieval:** LangChain, ChromaDB, pandas
- **Backend:** FastAPI
- **Frontend:** React, Vite

## Run it locally

1. Install [Ollama](https://ollama.com) and pull the models:
```bash
   ollama pull llama3.1:8b
   ollama pull mxbai-embed-large
```
2. Set up the backend:
```bash
   python -m venv venv
   source venv/Scripts/activate   # Mac/Linux: source venv/bin/activate
   pip install -r requirements.txt
   uvicorn api:app --reload
```
   The first run builds the vector database from the CSV, which takes a moment.
3. In a second terminal, start the frontend:
```bash
   cd frontend
   npm install
   npm run dev
```
4. Open http://localhost:5173

## Known limitations

- Runs on local hardware, so replies are slow on laptops without a GPU
- Retrieval returns only the top 5 reviews, so broad "overall" questions rely on the stats tool
- Smaller local models can be inconsistent at choosing tools
- No streaming yet, so answers appear all at once
- Built on a single restaurant dataset of sample reviews

## Roadmap

- [ ] Streaming responses
- [ ] "Sources used" panel showing the tool calls and reviews behind each answer
- [ ] Evaluation set to measure retrieval quality
- [ ] Deployment with a hosted model option
