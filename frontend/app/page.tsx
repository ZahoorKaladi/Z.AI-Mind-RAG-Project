"use client";

import { useState, useEffect, useRef } from "react";

// --- Smooth Typing Effect ---
const TypewriterEffect = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayedText(""); 
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 15); 
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayedText}</span>;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [question, setQuestion] = useState<string>("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // --- Auto-Scroll Reference ---
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // --- Dynamic Placeholders ---
  const placeholders = [
    "Summarize the key findings...",
    "What are the main arguments?",
    "Extract the statistical data...",
    "Explain the methodology...",
    "Ask a question about this document..."
  ];
  const [placeholderText, setPlaceholderText] = useState(placeholders[0]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % placeholders.length;
      setPlaceholderText(placeholders[i]);
    }, 3500); 
    return () => clearInterval(interval);
  }, []);

  // --- NEW: Handle Document Removal ---
  const handleRemove = async () => {
    try {
      await fetch("http://127.0.0.1:8080/api/clear", { method: "DELETE" });
    } catch (e) {
      console.error("Failed to clear backend memory");
    }
    setFile(null);
    setUploadStatus("");
    setMessages([]); // Instantly clear the chat history
  };

  // --- UPGRADED: Handle Upload & Proactive Overview ---
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("Processing document...");
    setMessages([]); // Clear any old chat before starting a new one

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8080/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      
      if (response.ok) {
        setUploadStatus(`Success! Active document loaded.`);
        
        // --- Proactive Auto-Overview ---
        setIsTyping(true);
        try {
          const overviewResponse = await fetch("http://127.0.0.1:8080/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: "Please provide a concise, professional, 3-sentence overview of what this document is about." }),
          });
          const overviewData = await overviewResponse.json();
          if (overviewResponse.ok) {
            setMessages([{ role: "ai", content: `Document Overview:\n\n${overviewData.answer}` }]);
          }
        } catch (error) {
          console.error("Failed to generate overview");
        } finally {
          setIsTyping(false);
        }

      } else {
        setUploadStatus(`Error: ${data.error}`);
        setFile(null);
      }
    } catch (error) {
      setUploadStatus("Failed to connect to the AI engine.");
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setIsTyping(true);

    try {
      const response = await fetch("http://127.0.0.1:8080/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage.content }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => [...prev, { role: "ai", content: data.answer }]);
      } else {
        setMessages((prev) => [...prev, { role: "error", content: data.error }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "error", content: "Failed to connect to the AI engine." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-blue-50 to-indigo-50 text-slate-800 p-4 md:p-8 font-sans selection:bg-indigo-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Ultra-Premium SaaS Header */}
        <header className="relative text-center pt-8 pb-12 z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[150px] bg-indigo-500/20 blur-[80px] -z-10 rounded-full pointer-events-none"></div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-indigo-100 shadow-sm mb-8 backdrop-blur-md transition-transform hover:scale-105 cursor-default">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
            </span>
            <span className="text-xs font-bold tracking-widest text-indigo-800 uppercase">
              Local Llama 3.1 Engine Live
            </span>
          </div>

          <h1 className="font-[family-name:var(--font-outfit)] text-6xl md:text-7xl font-extrabold tracking-tight mb-6">
            <span className="text-slate-800 drop-shadow-sm">Z.AI</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-cyan-400 to-blue-600 drop-shadow-sm animate-pulse">
              Mind
            </span>
          </h1>

          <p className="text-slate-500 font-medium tracking-wide max-w-2xl mx-auto leading-relaxed text-lg md:text-xl">
            Your personal document intelligence engine. Upload research papers, legal contracts, or complex study materials to <span className="text-indigo-600 font-semibold">instantly extract insights</span> and chat securely.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Glassmorphism Upload Panel */}
          <div className="lg:col-span-1 bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-indigo-900/5 border border-white h-fit">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
              <span className="bg-indigo-100 text-indigo-700 w-8 h-8 flex items-center justify-center rounded-full text-sm">1</span> 
              Knowledge Base
            </h2>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="relative border-2 border-dashed border-indigo-200 rounded-2xl p-6 bg-indigo-50/30 transition-colors hover:bg-indigo-50/80 text-center group">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    {file ? file.name : "Click or drag PDF to upload"}
                  </p>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!file || isUploading || uploadStatus.includes("Success")}
                className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3.5 px-4 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : uploadStatus.includes("Success") ? (
                  "Database Active"
                ) : (
                  "Initialize Database"
                )}
              </button>

              {/* NEW: Remove Document Button */}
              {uploadStatus.includes("Success") && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="w-full mt-3 py-3 px-4 rounded-xl font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors flex justify-center items-center gap-2 shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  Remove Document
                </button>
              )}
            </form>
            
            {uploadStatus && !uploadStatus.includes("Success") && (
              <div className="mt-6 text-sm font-medium p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
                {uploadStatus}
              </div>
            )}
          </div>

          {/* Premium Chat Interface */}
          <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-900/5 border border-white flex flex-col h-[700px] overflow-hidden">
            <div className="p-6 border-b border-slate-100/50 bg-white/40">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                <span className="bg-indigo-100 text-indigo-700 w-8 h-8 flex items-center justify-center rounded-full text-sm">2</span>
                Intelligence Console
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center rotate-12 shadow-sm border border-indigo-100">
                     <span className="text-3xl">📄</span>
                  </div>
                  <div className="text-center mt-2">
                    <p className="font-semibold text-slate-600 mb-1 text-lg">Ready to analyze your document</p>
                    <p className="text-sm">Upload a PDF to activate the AI engine.</p>
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] p-5 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-3xl rounded-br-sm"
                        : msg.role === "error"
                        ? "bg-red-50 text-red-700 rounded-3xl rounded-bl-sm border border-red-100"
                        : "bg-white text-slate-700 rounded-3xl rounded-bl-sm border border-slate-100"
                    }`}
                  >
                    {msg.role === "ai" ? <TypewriterEffect text={msg.content} /> : msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-400 p-5 rounded-3xl rounded-bl-sm border border-slate-100 shadow-sm flex items-center gap-2 w-24 justify-center">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleChat} className="p-5 bg-white/50 border-t border-slate-100/50">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={placeholderText}
                  className="flex-1 bg-white pl-6 pr-16 py-4 rounded-2xl border border-slate-200 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all text-slate-700 placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={!question.trim() || isTyping}
                  className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 transition-all shadow-md disabled:shadow-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </main>
  );
}