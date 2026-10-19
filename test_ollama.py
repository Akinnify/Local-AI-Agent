from langchain_ollama import ChatOllama, OllamaEmbeddings

print("Testing embeddings...")
try:
    emb = OllamaEmbeddings(model="mxbai-embed-large")
    print("OK, vector length:", len(emb.embed_query("test")))
except Exception as e:
    print("EMBEDDINGS FAILED:", e)

print("Testing chat model...")
try:
    llm = ChatOllama(model="llama3.1:8b")  # use the same name as in agent.py
    print("OK:", llm.invoke("say hi").content)
except Exception as e:
    print("CHAT FAILED:", e)