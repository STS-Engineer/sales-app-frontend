import { useMemo, useRef, useState } from "react";
import { parseRfq } from "../api";

const starterMessages = [
  {
    role: "assistant",
    content:
      "Hi! Describe your request (client, product, quantity, deadline, budget). I will fill the form for you."
  }
];

export default function ChatPanel({ onFields, currentFields, onCollapse }) {
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  const canSend = input.trim().length > 0 && !busy;

  const speechAvailable = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const handleSend = async () => {
    if (!canSend) return;
    const content = input.trim();
    setInput("");
    setAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setMessages((prev) => [...prev, { role: "user", content }]);
    setBusy(true);

    try {
      const response = await parseRfq(content, currentFields);
      if (response?.fields) {
        onFields(response.fields);
      }
      if (response?.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: response.reply }]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I couldn't analyze that request. Please try again or fill the form manually."
        }
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleStartListening = () => {
    if (!speechAvailable) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Microphone is not supported by this browser." }
      ]);
      return;
    }
    if (!recognitionRef.current) {
      const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new Speech();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognitionRef.current = recognition;
    }
    setListening(true);
    recognitionRef.current.start();
  };

  const handleAttach = (event) => {
    const files = Array.from(event.target.files || []);
    setAttachments(files);
  };

  return (
    <div className="card flex h-full min-h-0 flex-col p-6 md:p-7">
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-4">
        <div className="flex items-center gap-3">
          {onCollapse ? (
            <button
              type="button"
              onClick={onCollapse}
              className="collapse-toggle"
              aria-label="Collapse chatbot"
              title="Collapse chatbot"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : null}
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Chatbot</p>
            <h2 className="font-display text-2xl text-ink">RFQ Assistant</h2>
            <p className="mt-1 text-sm text-slate-500">Live assistant to capture RFQ details.</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/70 p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              message.role === "user"
                ? "chat-bubble-user ml-auto"
                : "chat-bubble-bot"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <div className="relative">
          <textarea
            rows={1}
            className="textarea-field h-12 w-full resize-none py-3 pl-12 pr-20"
            placeholder="Type your message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleAttach}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-tide/40 hover:text-tide"
              title="Attach files"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-8.49 8.49a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L9.88 15.38a2 2 0 1 1-2.83-2.83l8.49-8.49" />
              </svg>
            </button>
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartListening}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-tide/40 hover:text-tide"
              title={listening ? "Listening..." : "Speak"}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <path d="M12 19v4" />
                <path d="M8 23h8" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-tide/40 bg-tide/10 text-tide shadow-sm transition hover:bg-tide/20 disabled:cursor-not-allowed disabled:opacity-50"
              title={busy ? "Analyzing..." : "Send"}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
        {attachments.length ? (
          <p className="text-xs text-slate-500">{attachments.length} file(s) attached</p>
        ) : null}
      </div>
    </div>
  );
}
