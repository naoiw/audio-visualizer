import { useCallback, useEffect, useRef, useState } from "react";
import { FFT_SIZE, SMOOTHING } from "../audio/visualizer";

export type CaptureStatus = "idle" | "requesting" | "active";

type Session = {
  stream: MediaStream;
  context: AudioContext;
  analyser: AnalyserNode;
};

export function useAudioCapture() {
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [sampleRate, setSampleRate] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const statusRef = useRef<CaptureStatus>("idle");

  const setCaptureStatus = useCallback((next: CaptureStatus) => {
    statusRef.current = next;
    if (mountedRef.current) setStatus(next);
  }, []);

  const stopCapture = useCallback(() => {
    // Invalidate a still-pending getDisplayMedia dialog as well.
    requestIdRef.current += 1;
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) {
      session.stream.getTracks().forEach((track) => track.stop());
      void session.context.close().catch(() => {});
    }
    if (mountedRef.current) {
      setAnalyser(null);
      setSampleRate(0);
    }
    setCaptureStatus("idle");
  }, [setCaptureStatus]);

  const startCapture = useCallback(async () => {
    if (statusRef.current !== "idle") return;
    const requestId = ++requestIdRef.current;
    setCaptureStatus("requesting");
    setError(null);

    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error("このブラウザは画面・音声共有に対応していません。");
      }
      // Initialize AudioContext during the button gesture to satisfy autoplay policies.
      context = new AudioContext();
      if (context.state === "suspended") void context.resume().catch(() => {});
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      if (requestIdRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      if (stream.getAudioTracks().length === 0) {
        throw new Error("音声が共有されていません。共有画面で音声共有を有効にしてください。");
      }

      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = FFT_SIZE;
      analyserNode.smoothingTimeConstant = SMOOTHING;
      analyserNode.minDecibels = -100;
      analyserNode.maxDecibels = -30;
      context.createMediaStreamSource(stream).connect(analyserNode);
      // Deliberately do not connect to context.destination: it would replay shared audio.
      if (requestIdRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop());
        void context.close().catch(() => {});
        return;
      }
      sessionRef.current = { stream, context, analyser: analyserNode };
      stream.getTracks().forEach((track) => track.addEventListener("ended", stopCapture, { once: true }));
      if (mountedRef.current) {
        setAnalyser(analyserNode);
        setSampleRate(context.sampleRate);
      }
      setCaptureStatus("active");
    } catch (cause) {
      stream?.getTracks().forEach((track) => track.stop());
      if (context) void context.close().catch(() => {});
      if (requestIdRef.current === requestId && mountedRef.current) {
        setError(cause instanceof Error ? cause.message : "音声共有を開始できませんでした。");
        setCaptureStatus("idle");
      }
    }
  }, [setCaptureStatus, stopCapture]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCapture();
    };
  }, [stopCapture]);

  return { status, analyser, sampleRate, error, startCapture, stopCapture };
}
