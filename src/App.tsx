import { useState } from "react";
import { AudioCanvas } from "./components/AudioCanvas";
import { useAudioCapture } from "./hooks/useAudioCapture";
import { FFT_SIZE, type VisualizationMode } from "./audio/visualizer";

export default function App() {
  const [mode, setMode] = useState<VisualizationMode>("waveform");
  const { status, analyser, sampleRate, error, startCapture, stopCapture } = useAudioCapture();

  return (
    <div className="site-shell">
      <main className="dashboard">
        <header className="page-header">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true"><i /><i /><i /><i /></span>
            <span>AUDIO <strong>VISUALIZER</strong></span>
          </div>
          <span className="header-caption">WEB AUDIO API</span>
        </header>

        <section className="hero" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">AUDIO CAPTURE</p>
            <h1 id="page-title">音声ビジュアライザー</h1>
            <p className="hero__description">共有したタブや画面の音声をリアルタイムで表示します。</p>
          </div>
          <div className="capture-state" aria-live="polite">
            <span className={`state-dot state-dot--${status}`} />
            {status === "active" ? "取得中" : status === "requesting" ? "共有を選択中" : "停止中"}
          </div>
        </section>

        <section className="visualizer-panel" aria-label="音声の可視化">
          <div className="panel-toolbar">
            <div>
              <p className="eyebrow">VISUALIZATION</p>
              <h2>{mode === "waveform" ? "時間波形" : "周波数スペクトラム"}</h2>
            </div>
            <div className="mode-switch" role="group" aria-label="表示モード">
              <button
                type="button"
                className={mode === "waveform" ? "mode-button is-active" : "mode-button"}
                onClick={() => setMode("waveform")}
                aria-pressed={mode === "waveform"}
              >波形</button>
              <button
                type="button"
                className={mode === "spectrum" ? "mode-button is-active" : "mode-button"}
                onClick={() => setMode("spectrum")}
                aria-pressed={mode === "spectrum"}
              >周波数</button>
            </div>
          </div>
          <AudioCanvas analyser={analyser} sampleRate={sampleRate} mode={mode} />
          <div className="panel-meta">
            <span>FFT {FFT_SIZE.toLocaleString("ja-JP")}</span>
            <span>{sampleRate > 0 ? `${sampleRate.toLocaleString("ja-JP")} Hz` : "音声未接続"}</span>
          </div>
        </section>

        <section className="capture-controls" aria-label="音声共有の操作">
          {status === "active" ? (
            <button className="primary-button primary-button--stop" type="button" onClick={stopCapture}>
              共有を停止
            </button>
          ) : (
            <button className="primary-button" type="button" onClick={() => void startCapture()} disabled={status === "requesting"}>
              {status === "requesting" ? "共有を選択中…" : "音声共有を開始"}
            </button>
          )}
          <p className="control-note">
            ブラウザの共有ダイアログでタブ・画面を選び、音声共有を有効にしてください。
            PC全体の音声共有はブラウザ・OSに依存します。
          </p>
          {error && <p className="error-message" role="alert">{error}</p>}
        </section>

        <footer className="page-footer">
          <span>AUDIO VISUALIZER</span>
          <a href="https://github.com/naoiw/audio-visualizer" target="_blank" rel="noopener noreferrer">
            GitHub ↗
          </a>
        </footer>
      </main>
    </div>
  );
}
