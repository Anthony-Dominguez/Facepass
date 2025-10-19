"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Mode = "register" | "login";
type StatusTone = "success" | "error" | "info";

interface StatusMessage {
  tone: StatusTone;
  message: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const TOKEN_STORAGE_KEY = "facepass-token";

const STATUS_TONE_STYLES: Record<StatusTone, string> = {
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  error: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-200",
};

export default function AuthPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<Mode>("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const disableInputs = useMemo(
    () => authLoading || !cameraReady,
    [authLoading, cameraReady],
  );

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      router.replace("/vault");
      return;
    }

    let cancelled = false;
    const enableCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is not supported in this browser.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 720 }, height: { ideal: 540 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraReady(true);
        setCameraError(null);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to access the camera. Please check permissions.";
        setCameraError(message);
        setStatus({ tone: "error", message: `Camera error: ${message}` });
      }
    };

    void enableCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [router, stopCamera]);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return null;
    }
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }
    context.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg");
  }, []);

  const parseErrorMessage = useCallback(
    async (response: Response, body?: unknown) => {
      let data = body;
      if (typeof data === "undefined") {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      }
      const payload = data as
        | {
            detail?:
              | string
              | Array<Record<string, unknown>>
              | Record<string, unknown>;
            message?: string;
          }
        | null;
      if (payload?.detail) {
        if (typeof payload.detail === "string") return payload.detail;
        if (Array.isArray(payload.detail)) {
          return payload.detail
            .map(
              (item) =>
                (item.msg as string | undefined) ??
                (item.message as string | undefined) ??
                JSON.stringify(item),
            )
            .join(", ");
        }
        if (typeof payload.detail === "object") {
          return (
            (payload.detail.message as string | undefined) ??
            (payload.detail.detail as string | undefined) ??
            JSON.stringify(payload.detail)
          );
        }
      }
      return (
        payload?.message ??
        response.statusText ??
        "Request failed"
      );
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    setStatus(null);
    if (mode === "register" && username.trim().length === 0) {
      setStatus({
        tone: "error",
        message: "Username is required to register.",
      });
      return;
    }
    if (!password) {
      setStatus({ tone: "error", message: "Password cannot be empty." });
      return;
    }
    if (!cameraReady) {
      setStatus({
        tone: "error",
        message: "Camera is not ready yet. Please wait a moment.",
      });
      return;
    }

    const imageBase64 = captureFrame();
    if (!imageBase64) {
      setStatus({
        tone: "error",
        message: "Unable to capture an image from the camera.",
      });
      return;
    }

    setAuthLoading(true);
    try {
      const endpoint = mode === "register" ? "/register" : "/login";
      const payload =
        mode === "register"
          ? {
              username: username.trim(),
              password,
              image_base64: imageBase64,
            }
          : {
              password,
              image_base64: imageBase64,
            };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const errorMessage =
          (await parseErrorMessage(response, data)) || "Authentication failed.";
        throw new Error(errorMessage);
      }

      if (mode === "register") {
        setStatus({
          tone: "success",
          message:
            (data?.message as string | undefined) ??
            "Registration successful. You can log in now.",
        });
        setMode("login");
        setPassword("");
      } else if (data?.access_token) {
        window.localStorage.setItem(
          TOKEN_STORAGE_KEY,
          data.access_token as string,
        );
        stopCamera();
        setStatus({
          tone: "success",
          message: "Login successful! Redirecting to your vault…",
        });
        setTimeout(() => router.replace("/vault"), 600);
      } else {
        setStatus({
          tone: "success",
          message: "Authentication successful.",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed.";
      setStatus({ tone: "error", message });
    } finally {
      setAuthLoading(false);
    }
  }, [
    mode,
    username,
    password,
    cameraReady,
    captureFrame,
    parseErrorMessage,
    router,
    stopCamera,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm uppercase tracking-[0.35em] text-slate-400 transition hover:text-white"
          >
            FacePass
          </Link>
          <Link
            href="/"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm transition hover:border-slate-500 hover:text-white"
          >
            Back to home
          </Link>
        </header>

        {status && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm sm:text-base ${STATUS_TONE_STYLES[status.tone]}`}
          >
            {status.message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
          <section className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 shadow-xl backdrop-blur">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-[420px] w-full object-cover"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 text-center text-sm text-slate-300 sm:text-base">
                  {cameraError
                    ? cameraError
                    : "Initializing camera… ensure access is granted."}
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-semibold sm:text-xl">
                  {mode === "register"
                    ? "Create your face-secured account"
                    : "Log in with face + password"}
                </h1>
                <p className="text-sm text-slate-400">
                  Capture a live frame every time to prove it’s you.
                </p>
              </div>
              <div className="flex rounded-full border border-slate-700 bg-slate-800 p-1 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setStatus(null);
                  }}
                  className={`rounded-full px-4 py-2 transition ${
                    mode === "register"
                      ? "bg-sky-500 text-white shadow"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setStatus(null);
                  }}
                  className={`rounded-full px-4 py-2 transition ${
                    mode === "login"
                      ? "bg-sky-500 text-white shadow"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Log in
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {mode === "register" && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">
                    Username
                  </span>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="jane.doe"
                    autoComplete="username"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 disabled:cursor-not-allowed"
                    disabled={disableInputs}
                  />
                </label>
              )}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  placeholder="••••••••"
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 disabled:cursor-not-allowed"
                  disabled={disableInputs}
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={disableInputs}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {authLoading
                ? "Capturing & verifying…"
                : mode === "register"
                  ? "Capture & register"
                  : "Capture & log in"}
            </button>
            <canvas ref={canvasRef} className="hidden" />

            <p className="mt-6 text-xs text-slate-500">
              By continuing you agree to let FacePass capture a single frame for
              the purpose of biometric verification. Frames are discarded after
              the facial embedding is calculated.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
