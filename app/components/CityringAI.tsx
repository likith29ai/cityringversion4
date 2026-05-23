"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "ai";
  text: string;
};

export default function CityringAI() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Hey 👋 Need help finding your people?",
    },
  ]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Handle Escape key to close chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Handle click outside to close chat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        chatWindowRef.current &&
        !chatWindowRef.current.contains(e.target as Node)
      ) {
        const button = document.querySelector(
          'button[class*="fixed"][class*="z-50"]'
        );
        if (!button?.contains(e.target as Node)) {
          setOpen(false);
        }
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userMessage,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            data.reply ||
            "Couldn't find anything right now 👀",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            "Something went wrong. Try again.",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <>
      {/* Floating Button - Fully Responsive */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="
        fixed
        z-50

        /* Responsive positioning with safe areas */
        bottom-4 sm:bottom-6 md:bottom-8 lg:bottom-10
        right-4 sm:right-6 md:right-8 lg:right-10

        /* Responsive button size */
        w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18

        rounded-full

        bg-gradient-to-br
        from-fuchsia-600
        via-pink-500
        to-rose-500

        /* Responsive text size */
        text-xl sm:text-2xl md:text-3xl

        text-white

        shadow-[0_0_40px_rgba(236,72,153,0.45)]

        hover:scale-110
        active:scale-95

        transition-all duration-300
        
        /* Better touch target on mobile */
        touch-manipulation
        "
      >
        {open ? "✕" : "✦"}
      </button>

      {/* Chat Window - Fully Responsive */}
      {open && (
        <div
          ref={chatWindowRef}
          className="
          fixed z-50

          /* Responsive positioning for mobile, tablet, desktop */
          /* Mobile: centered with safe margins */
          bottom-4 left-4 right-4
          sm:bottom-6 sm:right-6 sm:left-auto
          md:bottom-8 md:right-8
          lg:bottom-10 lg:right-10

          /* Responsive dimensions */
          /* Mobile: 94% width, flexible height */
          w-[calc(100vw-2rem)] sm:w-96 md:w-[420px] lg:w-[500px]

          /* Height: responsive based on screen size */
          /* Accounts for safe areas and keyboard */
          h-[calc(100dvh-8rem)] 
          sm:h-[calc(100dvh-7rem)]
          md:h-[600px]
          lg:h-[700px]

          /* Responsive rounding */
          rounded-2xl sm:rounded-3xl

          border border-white/10

          bg-black/45
          backdrop-blur-2xl

          overflow-hidden

          flex flex-col

          shadow-[0_0_80px_rgba(236,72,153,0.18)]

          animate-in fade-in zoom-in-95
          duration-300
          "
        >
          {/* Background Glow */}
          <div
            className="
            absolute inset-0
            bg-gradient-to-br
            from-fuchsia-500/10
            via-transparent
            to-pink-500/10
            pointer-events-none
            "
          />

          {/* Header - Responsive Padding with Close Button */}
          <div
            className="
            relative
            px-4 sm:px-5 md:px-6
            py-3 sm:py-4 md:py-5

            border-b border-white/10

            bg-gradient-to-r
            from-fuchsia-500/10
            to-purple-500/5

            backdrop-blur-xl
            flex-shrink-0
            
            flex items-center justify-between
            "
          >
            <div>
              <h2
                className="
                text-white
                text-base sm:text-lg md:text-xl
                font-semibold
                tracking-wide
                "
              >
                Cityring AI
              </h2>

              <p
                className="
                text-white/50
                text-xs sm:text-sm md:text-base
                mt-1
                "
              >
                Discover your circle
              </p>
            </div>

            {/* Close Button - X */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="
              flex-shrink-0
              ml-2
              
              /* Responsive size */
              w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10

              rounded-full

              hover:bg-white/10
              active:bg-white/20

              text-white/70
              hover:text-white

              /* Responsive text size */
              text-lg sm:text-xl md:text-2xl

              transition-all duration-200

              flex items-center justify-center

              touch-manipulation
              "
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Messages Container - Responsive Padding */}
          <div
            className="
            relative
            flex-1
            overflow-y-auto

            px-3 sm:px-4 md:px-5
            py-3 sm:py-4 md:py-5

            space-y-3 sm:space-y-4

            scrollbar-thin
            scrollbar-thumb-white/10
            "
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`w-full flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`
                  /* Responsive max-width */
                  max-w-[85%] sm:max-w-[80%] md:max-w-[75%]

                  /* Responsive font size */
                  text-sm sm:text-base md:text-[15px]
                  leading-relaxed

                  whitespace-pre-wrap
                  break-words

                  /* Responsive padding */
                  px-3 sm:px-4 md:px-5
                  py-2 sm:py-3 md:py-3

                  transition-all duration-300

                  ${
                    msg.role === "user"
                      ? `
                      bg-gradient-to-br
                      from-fuchsia-600
                      via-pink-500
                      to-rose-500

                      text-white

                      rounded-2xl rounded-br-md

                      shadow-[0_0_25px_rgba(236,72,153,0.35)]
                      `
                      : `
                      bg-white/[0.06]

                      border border-white/10

                      backdrop-blur-xl

                      text-white/90

                      rounded-2xl rounded-tl-md

                      shadow-lg
                      `
                  }
                  `}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div
                className="
                w-fit

                bg-white/[0.06]

                border border-white/10

                text-white/60

                px-3 sm:px-4 md:px-5
                py-2 sm:py-3 md:py-3

                rounded-2xl

                text-sm sm:text-base

                animate-pulse
                "
              >
                Thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Section - Responsive & Safe Area Aware */}
          <div
            className="
            relative

            px-3 sm:px-4 md:px-5
            py-3 sm:py-4 md:py-5
            pb-[calc(theme(spacing.3)_+_max(theme(spacing.0),_env(safe-area-inset-bottom)))]
            sm:pb-[calc(theme(spacing.4)_+_max(theme(spacing.0),_env(safe-area-inset-bottom)))]
            md:pb-[calc(theme(spacing.5)_+_max(theme(spacing.0),_env(safe-area-inset-bottom)))]

            border-t border-white/10

            bg-black/20
            backdrop-blur-xl

            flex items-center gap-2 sm:gap-3

            flex-shrink-0
            "
          >
            <input
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about Cityring..."
              className="
              flex-1

              /* Responsive height */
              h-10 sm:h-11 md:h-12

              bg-white/[0.05]

              border border-white/10

              text-white
              text-sm sm:text-base

              placeholder:text-white/30

              rounded-xl sm:rounded-2xl

              /* Responsive padding */
              px-3 sm:px-4 md:px-4

              outline-none

              focus:border-fuchsia-500/40
              focus:bg-white/[0.08]

              transition-all
              
              /* Better touch target */
              touch-manipulation
              "
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="
              /* Responsive height & padding */
              h-10 sm:h-11 md:h-12

              px-3 sm:px-4 md:px-5

              rounded-xl sm:rounded-2xl

              bg-gradient-to-r
              from-fuchsia-600
              via-pink-500
              to-rose-500

              text-white
              text-xs sm:text-sm md:text-base
              font-medium

              shadow-[0_0_20px_rgba(236,72,153,0.35)]

              hover:scale-105
              active:scale-95

              disabled:opacity-50

              transition-all duration-300
              
              /* Better touch target */
              touch-manipulation
              whitespace-nowrap
              flex-shrink-0
              "
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Backdrop for better UX */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="
          fixed inset-0 z-40
          bg-black/20
          backdrop-blur-sm
          animate-in fade-in duration-200
          "
          aria-label="Close chat by clicking outside"
        />
      )}
    </>
  );
}