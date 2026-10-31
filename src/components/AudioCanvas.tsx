import { useEffect, useRef } from "react";
import {
  MAX_DISPLAY_FREQUENCY,
  renderVisualization,
  type VisualizationMode,
} from "../audio/visualizer";

type Props = {
  analyser: AnalyserNode | null;
  sampleRate: number;
  mode: VisualizationMode;
};

export function AudioCanvas({ analyser, sampleRate, mode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    resize();

    const frequencySamples = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    const waveformSamples = analyser ? new Uint8Array(analyser.fftSize) : null;

    const frame = () => {
      const samples = mode === "waveform" ? waveformSamples : frequencySamples;
      if (analyser && samples) {
        if (mode === "waveform") analyser.getByteTimeDomainData(samples);
        else analyser.getByteFrequencyData(samples);
        renderVisualization(ctx, canvas.width, canvas.height, mode, samples, sampleRate);
      } else {
        renderVisualization(ctx, canvas.width, canvas.height, mode, new Uint8Array(), sampleRate);
      }
      if (analyser) animationId = requestAnimationFrame(frame);
    };

    frame();
    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [analyser, sampleRate, mode]);

  const highestFrequency = Math.min(MAX_DISPLAY_FREQUENCY, sampleRate / 2);
  return (
    <div className="visualizer-plot">
      <canvas
        ref={canvasRef}
        className="visualizer-canvas"
        aria-label={mode === "waveform" ? "入力音声の時間波形" : "入力音声の周波数スペクトラム"}
        role="img"
      />
      <div className="plot-scale" aria-hidden="true">
        {mode === "waveform" ? (
          <><span>時間 →</span><span>振幅</span></>
        ) : (
          <><span>0 Hz</span><span>{highestFrequency > 0 ? highestFrequency.toLocaleString("ja-JP") : "—"} Hz</span></>
        )}
      </div>
    </div>
  );
}
