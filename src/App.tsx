import { useCallback, useEffect, useRef, useState } from "react";

const FFT_SIZE = 2048;
const SMOOTHING = 0.7;
/** 横軸の表示上限（Hz）。この周波数までをキャンバス幅いっぱいに表示する */
const DISPLAY_MAX_FREQ = 16000;

function App() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!canvas || !analyser || !dataArray) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyser.frequencyBinCount;
    const sampleRate = audioContextRef.current?.sampleRate ?? 44100;
    const nyquist = sampleRate / 2;
    const barCount = Math.min(
      bufferLength,
      Math.floor((DISPLAY_MAX_FREQ / nyquist) * bufferLength)
    );
    const barWidth = width / barCount;

    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = "rgb(15, 15, 20)";
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < barCount; i++) {
      const magnitude = dataArray[i];
      const barHeight = (magnitude / 255) * height * 0.9;
      const x = i * barWidth;
      const y = height - barHeight;

      const hue = (i / barCount) * 280 + 200;
      ctx.fillStyle = `hsla(${hue}, 70%, 55%, 0.85)`;
      ctx.fillRect(x, y, Math.max(1, barWidth - 0.5), barHeight);
    }

    animationRef.current = requestAnimationFrame(draw);
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    try {
      // タブ・ウィンドウの共有で「音声を共有」を選ぶとPCの出力音（YouTube等）が取れる
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setError(
          "音声が共有されていません。共有ダイアログで「タブの音声を共有」にチェックを入れてください。"
        );
        return;
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = SMOOTHING;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      dataArrayRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));

      draw();
      setIsListening(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "タブの共有を開始できませんでした";
      setError(msg);
    }
  }, [draw]);

  const stopListening = useCallback(() => {
    if (animationRef.current != null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    dataArrayRef.current = null;
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const binCount = FFT_SIZE / 2;

  return (
    <div
      style={{
        padding: "1rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: 900,
        margin: "0 auto",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f0f14 0%, #1a1a24 100%)",
        color: "#e0e0e0",
      }}
    >
      <h1 style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Audio Visualizer</h1>
      <p style={{ marginBottom: "0.5rem", color: "#888", fontSize: "0.9rem" }}>
        横軸: 周波数 (Hz) / 縦軸: 信号強度
      </p>

      <div style={{ marginBottom: "1rem" }}>
        {!isListening ? (
          <button
            onClick={startListening}
            style={{
              padding: "0.6rem 1.2rem",
              fontSize: "1rem",
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            タブの音声をキャプチャ
          </button>
        ) : (
          <button
            onClick={stopListening}
            style={{
              padding: "0.6rem 1.2rem",
              fontSize: "1rem",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            停止
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: "#f87171", marginBottom: "1rem" }}>{error}</p>
      )}

      <div
        style={{
          background: "rgb(15, 15, 20)",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid #2a2a35",
        }}
      >
        <canvas
          ref={canvasRef}
          width={860}
          height={320}
          style={{
            display: "block",
            width: "100%",
            maxWidth: 860,
            height: "auto",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0.5rem 0.75rem",
            fontSize: "0.75rem",
            color: "#666",
          }}
        >
          <span>0 Hz</span>
          <span>約 {DISPLAY_MAX_FREQ} Hz</span>
        </div>
      </div>

      <p style={{ marginTop: "0.75rem", color: "#666", fontSize: "0.8rem" }}>
        FFT size: {FFT_SIZE} / 周波数ビン数: {binCount}
      </p>
    </div>
  );
}

export default App;
