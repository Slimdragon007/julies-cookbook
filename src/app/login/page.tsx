"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";

function SplashCanvas({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Warm particles
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
    }[] = [];

    const colors = ["#C4952E", "#8B7355", "#D4A853", "#B8956A", "#E5C87A"];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Spawn particles from edges
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.max(canvas.width, canvas.height) * 0.6;
      particles.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        size: Math.random() * 4 + 2,
        alpha: Math.random() * 0.6 + 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let frame = 0;
    const totalFrames = 90; // ~1.5s at 60fps

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const progress = Math.min(frame / totalFrames, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      particles.forEach((p) => {
        // Pull toward center
        const dx = cx - p.x;
        const dy = cy - p.y;
        p.vx += dx * 0.02;
        p.vy += dy * 0.02;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;

        // Fade based on progress
        const drawAlpha = p.alpha * (progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + ease * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = drawAlpha;
        ctx.fill();
      });

      // Warm glow at center grows with convergence
      const glowSize = ease * 120;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
      gradient.addColorStop(0, "rgba(196, 149, 46, 0.3)");
      gradient.addColorStop(0.5, "rgba(139, 115, 85, 0.1)");
      gradient.addColorStop(1, "rgba(139, 115, 85, 0)");
      ctx.globalAlpha = ease;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, glowSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      frame++;
      if (frame <= totalFrames + 30) {
        requestAnimationFrame(animate);
      }
    }

    animate();

    // Trigger done after animation
    const timer = setTimeout(onDone, 2800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      style={{ pointerEvents: "none" }}
    />
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"splash" | "reveal" | "form">("splash");
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  // Check if splash was already seen this session
  useEffect(() => {
    if (sessionStorage.getItem("splash_seen")) {
      setPhase("form");
    }
  }, []);

  function handleSplashDone() {
    setPhase("reveal");
    sessionStorage.setItem("splash_seen", "1");
    setTimeout(() => setPhase("form"), 800);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 overflow-hidden relative">
      {/* Particle canvas */}
      {phase === "splash" && <SplashCanvas onDone={handleSplashDone} />}

      {/* Splash text overlay */}
      {(phase === "splash" || phase === "reveal") && (
        <div
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center transition-all duration-700 ${
            phase === "reveal" ? "opacity-0 scale-95" : "opacity-100"
          }`}
        >
          <h1
            className="font-display text-5xl md:text-7xl text-warm-dark tracking-tight opacity-0"
            style={{
              animation: "fadeUp 0.8s ease-out 0.4s forwards",
            }}
          >
            Julie&apos;s
          </h1>
          <h1
            className="font-display text-5xl md:text-7xl text-gold tracking-tight opacity-0"
            style={{
              animation: "fadeUp 0.8s ease-out 0.8s forwards",
            }}
          >
            Cookbook
          </h1>
          <p
            className="font-body text-sm text-warm-light mt-4 opacity-0"
            style={{
              animation: "fadeUp 0.6s ease-out 1.4s forwards",
            }}
          >
            Simple recipes, made with love
          </p>
        </div>
      )}

      {/* Login form */}
      <div
        className={`w-full max-w-sm z-20 transition-all duration-700 ${
          phase === "form"
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-warm-dark mb-2">
            Julie&apos;s Cookbook
          </h1>
          <p className="font-body text-sm text-warm-light">
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block font-body text-sm text-warm-dark mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-white font-body text-base text-warm-dark placeholder:text-warm-light/50 focus:outline-none focus:ring-2 focus:ring-warm/30 focus:border-warm"
              placeholder="julie@example.com"
              required
              autoFocus={phase === "form"}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-body text-sm text-warm-dark mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-white font-body text-base text-warm-dark placeholder:text-warm-light/50 focus:outline-none focus:ring-2 focus:ring-warm/30 focus:border-warm"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-body">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || phase !== "form"}
            className="w-full font-display text-sm px-6 py-3 rounded-full bg-warm text-white hover:bg-warm-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-6 font-body text-sm text-warm-light">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-gold hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
