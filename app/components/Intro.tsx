'use client';

import { useState, useEffect } from 'react';

export default function CreativeIntro3() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  if (!showIntro) return null;

  const text = 'CITYRING';
  const letters = text.split('');

  return (
    <div
      className="fixed inset-0 z-50 bg-gradient-to-br from-black via-blue-900 to-black flex items-center justify-center cursor-pointer"
      onClick={() => setShowIntro(false)}
    >
      <style>{`
        @keyframes letterSlideIn {
          0% {
            opacity: 0;
            transform: translateX(-30px) rotateZ(-10deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) rotateZ(0deg);
          }
        }

        @keyframes letterSlideOut {
          0% {
            opacity: 1;
            transform: translateX(0) rotateZ(0deg);
          }
          100% {
            opacity: 0;
            transform: translateX(30px) rotateZ(10deg);
          }
        }

        @keyframes underlineGrow {
          0% {
            width: 0;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes subtitleFadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 0.7;
          }
        }

        @keyframes fadeOutScreen {
          0%, 85% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        .letter-container {
          display: flex;
          gap: 0.2em;
          font-size: clamp(2.5rem, 12vw, 5rem);
          font-weight: 900;
          letter-spacing: 2px;
          justify-content: center;
          align-items: center;
          height: auto;
        }

        .letter {
          display: inline-block;
          color: white;
          text-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
          filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.4));
        }

        .letter-1 { animation: letterSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.0s both, letterSlideOut 0.4s ease-in 3s both; }
        .letter-2 { animation: letterSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both, letterSlideOut 0.4s ease-in 3.1s both; }
        .letter-3 { animation: letterSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both, letterSlideOut 0.4s ease-in 3.2s both; }
        .letter-4 { animation: letterSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both, letterSlideOut 0.4s ease-in 3.3s both; }
        .letter-5 { animation: letterSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both, letterSlideOut 0.4s ease-in 3.4s both; }
        .letter-6 { animation: letterSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both, letterSlideOut 0.4s ease-in 3.5s both; }
        .letter-7 { animation: letterSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both, letterSlideOut 0.4s ease-in 3.6s both; }
        .letter-8 { animation: letterSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s both, letterSlideOut 0.4s ease-in 3.7s both; }

        .underline {
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          margin-top: 15px;
          animation: underlineGrow 1.2s ease-out 1.2s forwards;
          width: 0;
        }

        .subtitle {
          font-size: clamp(0.8rem, 3vw, 1rem);
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-top: 20px;
          animation: subtitleFadeIn 0.8s ease-out 2s both, fadeOutScreen 0.5s ease-out 3s forwards;
        }

        .intro-content {
          text-align: center;
          animation: fadeOutScreen 0.5s ease-out 3.5s forwards;
        }

        .skip-text {
          position: absolute;
          bottom: 30px;
          color: rgba(255, 255, 255, 0.3);
          font-size: 11px;
          letter-spacing: 1px;
          animation: fadeOutScreen 0.5s ease-out 3.5s forwards;
        }
      `}</style>

      <div className="intro-content">
        <div className="letter-container">
          {letters.map((letter, index) => (
            <span key={index} className={`letter letter-${index + 1}`}>
              {letter}
            </span>
          ))}
        </div>
        <div className="underline"></div>
        <div className="subtitle">Join the Ring</div>
      </div>

      <div className="skip-text">Click to skip</div>
    </div>
  );
}