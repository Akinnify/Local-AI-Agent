import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const STARTERS = [
  "What's the average rating?",
  "What do 1-star reviews complain about?",
  "Are there vegan options?",
  "What do people say about the crust?",
];

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // grow the textarea with its content, up to a limit
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [input]);

  async function send(textOverride) {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    const history = messages;
    setMessages([...history, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          // don't send error bubbles back to the model
          history: history
            .filter((m) => !m.error)
            .map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          error: true,
          content:
            "Couldn't reach the agent. Check that the API and Ollama are running, then try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="app">
      <header>
        <div className="brand">
          <svg className="logo" viewBox="0 0 80 80" aria-hidden="true">
            {/* speech-bubble tail */}
            <path d="M12 58 L30 70 L5 79 Z" fill="#f8f8f4" />
            {/* bubble / plate */}
            <circle cx="40" cy="38" r="34" fill="#f8f8f4" />
            {/* crust, cheese */}
            <circle cx="40" cy="38" r="28" fill="#e0a63b" />
            <circle cx="40" cy="38" r="23" fill="#f4d47c" />
            {/* pepperoni */}
            <circle cx="30" cy="30" r="5" fill="#b3261e" />
            <circle cx="49" cy="28" r="5" fill="#b3261e" />
            <circle cx="39" cy="46" r="5" fill="#b3261e" />
            <circle cx="53" cy="44" r="3.5" fill="#b3261e" />
            <circle cx="26" cy="46" r="3.5" fill="#b3261e" />
          </svg>
          <div>
            <h1>Pizza Reviews</h1>
            <p>Ask anything about what customers are saying.</p>
          </div>
        </div>
        <button
          className="ghost"
          onClick={() => setMessages([])}
          disabled={loading || !messages.length}
        >
          New chat
        </button>
      </header>
      <div className="awning" aria-hidden="true">
        <div className="awning-edge" />
      </div>

      <main className="chat">
        {messages.length === 0 && (
          <section className="empty">
            <h2>What do you want to know?</h2>
            <div className="chips">
              {STARTERS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </section>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="msg user">{m.content}</div>
          ) : (
            <div key={i} className={`msg agent md ${m.error ? "error" : ""}`}>
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          )
        )}

        {loading && (
          <div className="msg agent" aria-label="The agent is thinking">
            <span className="dots"><i /><i /><i /></span>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <footer>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about the reviews…"
          aria-label="Your question"
          disabled={loading}
        />
        <button className="send" onClick={() => send()} disabled={loading || !input.trim()}>
          Send
        </button>
      </footer>
    </div>
  );
}