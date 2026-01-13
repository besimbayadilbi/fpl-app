"use client";

import { useState, useRef, useEffect } from "react";
import { useTeamStore } from "@/store/teamStore";
import { useFPLCore } from "@/hooks/useFPLData";
import { Bot, Send, User, ArrowLeft, Loader2, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "Who should I captain this week?",
  "What transfers should I make?",
  "Which budget midfielders are worth buying?",
  "Should I use my wildcard now?",
  "Who are the best differentials under 5% ownership?",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { players: teamPlayers, budget, teamName } = useTeamStore();
  const { teams, currentGameWeek } = useFPLCore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          teamContext: teamPlayers.length > 0 ? {
            players: teamPlayers,
            teams,
            budget,
            gameweek: currentGameWeek?.id || 1,
          } : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to get response from server");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">FPL AI Assistant</h1>
                  <p className="text-xs text-gray-500">
                    {teamPlayers.length > 0 ? `Analyzing ${teamName}` : "No team loaded"}
                  </p>
                </div>
              </div>
            </div>

            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-4xl">
        {messages.length === 0 ? (
          // Welcome Screen
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">FPL AI Assistant</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Ask me anything about Fantasy Premier League. I can help with transfers, captain picks,
              differentials, and strategy advice.
            </p>

            {/* Suggested Prompts */}
            <div className="w-full max-w-lg">
              <p className="text-sm text-gray-500 mb-3">Try asking:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(prompt)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500/50 rounded-full text-sm text-gray-300 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {teamPlayers.length === 0 && (
              <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg max-w-md">
                <p className="text-yellow-400 text-sm">
                  Tip: Load your team first for personalized advice.
                  <Link href="/" className="underline ml-1">Go to home page</Link>
                </p>
              </div>
            )}
          </div>
        ) : (
          // Messages
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-green-500" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-green-600 text-white"
                      : "bg-slate-800 text-gray-200"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-4 mb-2 text-gray-200" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-bold mt-3 mb-2 text-gray-200" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-semibold mt-3 mb-1 text-gray-300" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2 text-gray-200" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1 text-gray-200" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-200" {...props} />,
                          li: ({node, ...props}) => <li className="text-gray-200" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-gray-100" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                          code: ({node, ...props}) => <code className="bg-slate-700 px-1 py-0.5 rounded text-xs text-gray-200" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-green-500 pl-3 italic text-gray-300 my-2" {...props} />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  )}
                  <div
                    className={`text-xs mt-2 ${
                      message.role === "user" ? "text-green-200" : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-green-500" />
                </div>
                <div className="bg-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="sticky bottom-0 bg-[#0d1117] pt-4">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about transfers, captains, or strategy..."
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 focus:border-green-500 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl text-white transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-600 text-center mt-2">
            Powered by Groq AI. Responses are AI-generated and may not always be accurate.
          </p>
        </form>
      </div>
    </div>
  );
}
