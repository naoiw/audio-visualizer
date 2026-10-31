export type VisualizationMode = "waveform" | "spectrum";

export const FFT_SIZE = 2048;
export const SMOOTHING = 0.7;
export const MAX_DISPLAY_FREQUENCY = 16_000;

export function getVisibleBinCount(
  frequencyBinCount: number,
  sampleRate: number,
  maxFrequency = MAX_DISPLAY_FREQUENCY,
): number {
  if (frequencyBinCount <= 0 || sampleRate <= 0) return 0;
  const nyquist = sampleRate / 2;
  return Math.min(
    frequencyBinCount,
    Math.max(1, Math.ceil((Math.min(maxFrequency, nyquist) / nyquist) * frequencyBinCount)),
  );
}

export function sampleToY(sample: number, height: number): number {
  return (1 - Math.max(0, Math.min(255, sample)) / 255) * height;
}

export function renderVisualization(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: VisualizationMode,
  samples: Uint8Array,
  sampleRate: number,
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0c1423";
  ctx.fillRect(0, 0, width, height);

  // Both modes use the same subtle horizontal reference lines.
  ctx.strokeStyle = "#26354b";
  ctx.lineWidth = 1;
  for (const ratio of [0.25, 0.5, 0.75]) {
    const y = Math.round(height * ratio) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (mode === "waveform") {
    if (samples.length === 0) return;
    ctx.strokeStyle = "#64d8ef";
    ctx.lineWidth = Math.max(2, width / 540);
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < samples.length; i += 1) {
      const x = (i / Math.max(1, samples.length - 1)) * width;
      const y = sampleToY(samples[i], height);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    return;
  }

  const visibleBins = getVisibleBinCount(samples.length, sampleRate);
  if (visibleBins === 0) return;
  const columns = Math.min(100, visibleBins);
  const columnWidth = width / columns;
  for (let column = 0; column < columns; column += 1) {
    const from = Math.floor((column / columns) * visibleBins);
    const to = Math.max(from + 1, Math.ceil(((column + 1) / columns) * visibleBins));
    let peak = 0;
    for (let i = from; i < to; i += 1) peak = Math.max(peak, samples[i]);
    const barHeight = (peak / 255) * height * 0.93;
    ctx.fillStyle = `hsl(${195 + (column / columns) * 90} 86% 66%)`;
    ctx.fillRect(
      column * columnWidth + columnWidth * 0.12,
      height - barHeight,
      Math.max(1, columnWidth * 0.76),
      barHeight,
    );
  }
}
