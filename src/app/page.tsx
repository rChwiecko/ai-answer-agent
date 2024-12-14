"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: "user" | "ai";
  content: string;
};

type Chat = {
  id: number;
  messages: Message[];
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<number | null>(null);

  // On initial mount, if there are no chats, create one with the initial AI message
  useEffect(() => {
    if (chats.length === 0) {
      const initialChat: Chat = {
        id: 1,
        messages: [{ role: "ai", content: "Hello! How can I help you today?" }],
      };
      setChats([initialChat]);
      setActiveChat(1);
    }
  }, [chats]);

  const handleSend = async (overrideMessage?: string) => {
    const msg = overrideMessage ?? message;
    if (!msg.trim()) return;

    const userMessage = { role: "user" as const, content: msg };

    if (activeChat !== null) {
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === activeChat) {
            return { ...chat, messages: [...chat.messages, userMessage] };
          }
          return chat;
        })
      );
    }

    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: msg }),
      });

      if (!response.ok) {
        throw new Error("Error processing response");
      }

      const resData = await response.json();
      const resMessage = { role: "ai" as const, content: resData.reply };

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === activeChat) {
            return { ...chat, messages: [...chat.messages, resMessage] };
          }
          return chat;
        })
      );
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to a different chat from the sidebar
  const handleSwitchChat = (chatId: number) => {
    setActiveChat(chatId);
  };

  // Create a brand new chat with the initial AI greeting
  const handleNewChat = () => {
    const newChat: Chat = {
      id: chats.length + 1,
      messages: [{ role: "ai", content: "Hello! How can I help you today?" }],
    };
    setChats((prevChats) => [...prevChats, newChat]);
    setActiveChat(newChat.id);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-700 text-white p-4 flex flex-col">
        <h2 className="text-xl font-semibold">Chats</h2>
        <nav className="mt-4 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {chats.map((chat) => (
              <li key={chat.id}>
                <button
                  onClick={() => handleSwitchChat(chat.id)}
                  className={`w-full text-left text-gray-300 hover:text-white p-2 rounded-md transition-colors ${
                    activeChat === chat.id ? "bg-gray-600" : ""
                  }`}
                >
                  Chat {chat.id}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <button
          onClick={handleNewChat}
          className="mt-4 w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          New Chat
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="w-full bg-gray-800 border-b border-gray-700 p-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-xl font-semibold text-white">Chat</h1>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto pb-32 pt-4">
          <div className="max-w-3xl mx-auto px-4">
            {activeChat !== null && (
              <>
                {chats
                  .find((chat) => chat.id === activeChat)
                  ?.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 mb-4 ${
                        msg.role === "ai"
                          ? "justify-start"
                          : "justify-end flex-row-reverse"
                      }`}
                    >
                      <div
                        className={`px-4 py-2 rounded-2xl max-w-[80%] shadow ${
                          msg.role === "ai"
                            ? "bg-gray-800 border border-gray-700 text-gray-100"
                            : "bg-cyan-600 text-white ml-auto"
                        }`}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ node, ...props }) => (
                              <p className="mb-2" {...props} />
                            ),
                            h1: ({ node, ...props }) => (
                              <h1
                                className="text-2xl font-bold mb-2"
                                {...props}
                              />
                            ),
                            h2: ({ node, ...props }) => (
                              <h2
                                className="text-xl font-semibold mb-2"
                                {...props}
                              />
                            ),
                            strong: ({ node, ...props }) => (
                              <strong className="font-bold" {...props} />
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
              </>
            )}
            {isLoading && (
              <div className="flex gap-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-400 animate-spin"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.93 8H13V5.07c2.89.47 5.19 2.77 5.93 5.93zM11 5.07V10H6.07C6.81 7.84 8.84 5.81 11 5.07zM5.07 13H10v4.93c-2.16-.74-4.19-2.77-4.93-4.93zM13 18.93V13h4.93c-.74 2.16-2.77 4.19-4.93 4.93z" />
                  </svg>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-gray-800 border border-gray-700 text-gray-100">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Input & Preset Buttons */}
        <div className="fixed bottom-0 w-full bg-gray-800 border-t border-gray-700 p-4">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            {/* Preset prompt buttons */}
            <div className="flex gap-3 mb-3 justify-center w-full">
              <button
                onClick={() => handleSend("Summarize this article")}
                className="bg-gray-700 text-gray-100 px-3 py-1 rounded hover:bg-gray-600 transition-colors"
              >
                Summarize this article
              </button>
              <button
                onClick={() => handleSend("How do I use tools with the Groq API?")}
                className="bg-gray-700 text-gray-100 px-3 py-1 rounded hover:bg-gray-600 transition-colors"
              >
                How do I use tools with the Groq API?
              </button>
              <button
                onClick={() => handleSend("Tell me about the new Gemini model")}
                className="bg-gray-700 text-gray-100 px-3 py-1 rounded hover:bg-gray-600 transition-colors"
              >
                Tell me about the new Gemini model
              </button>
            </div>
            <div className="w-full flex gap-3 items-center justify-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-400"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading}
                className="bg-cyan-600 text-white px-5 py-3 rounded-xl hover:bg-cyan-700 transition-all disabled:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
