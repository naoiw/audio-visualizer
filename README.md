# Audio Visualizer

ブラウザの画面共有機能で取得した音声を、時間波形または周波数スペクトラムとして表示するWebアプリです。

## 主な機能

- **時間波形** — Web Audio APIの時間領域サンプルをCanvasに描画（初期表示）
- **周波数スペクトラム** — FFTの解析結果を最大16 kHzまで100列以内のバーとして表示
- **音声共有** — タブ・ウィンドウ・画面の音声をブラウザの許可ダイアログから取得
- **共有状態の管理** — 共有停止・ブラウザ側からの共有終了・エラーを画面に反映
- **レスポンシブ表示** — PC・スマートフォン幅に対応

**制限:** WebブラウザがOSの音声出力を自由に読み取れるわけではありません。PC全体の出力音声を共有できるかはOS・ブラウザ・画面共有の設定に依存します。共有中の音声はブラウザ内で解析し、サーバーへ送信しません。

## 公開先

| 環境 | ブランチ | URL |
| --- | --- | --- |
| 本番 | `main` | https://naoiw.github.io/audio-visualizer/ |
| 開発プレビュー | `develop` | https://naoiw.github.io/audio-visualizer/develop/ |

本番と開発プレビューは、1つのGitHub Pagesサイト内の異なるパスとして公開します。

## 使い方

1. 対応ブラウザでアプリを開き、「音声共有を開始」を選択します。
2. 共有ダイアログでタブ・ウィンドウ・画面のいずれかを選びます。
3. **音声の共有を有効**にして、共有を開始します。
4. 「波形」「周波数」を切り替えて表示します。停止するときは「共有を停止」かブラウザ標準の共有停止を使用します。

音声共有がサポートされない場合や音声トラックを取得できなかった場合は、画面にエラーを表示します。HTTPSまたはlocalhostで開いてください。

## 技術スタック

- **React 18 / TypeScript** — UI・音声取得状態の管理
- **Web Audio API / Canvas 2D** — `AnalyserNode`による時間波形・FFT解析と描画
- **Vite / CSS** — 開発サーバー・ビルド・レスポンシブ表示
- **Node.js 20 / pnpm 9** — 開発・テスト・ビルド
- **GitHub Actions / GitHub Pages** — CIと公開

## ローカル開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev     # 開発サーバー
pnpm test    # 描画計算の回帰テスト
pnpm build   # 型チェック・本番ビルド
```

`pnpm dev` の画面は通常 `http://localhost:5173` で開けます。生成物は `dist/` に出力され、Gitには登録しません。

## ブランチ運用

1. 通常の変更は `develop` に実装し、pushで自動検証・プレビューを更新します。
2. `main` への反映は **`develop` → `main` のPull Request** で行います。PRでは検証のみ実施します。
3. PRマージ後も `develop` は残して `main` と同期します。
4. 公開処理は `main` 上のワークフローで行い、`github-pages` 環境は1つだけ使用します。

## ディレクトリ構成

- `src/App.tsx` — ページと表示切り替え
- `src/components/` — Canvasの描画ライフサイクル
- `src/hooks/` — 画面・音声共有の取得と終了処理
- `src/audio/` — 描画・サンプリング計算
- `src/index.css` — 共通スタイル・レスポンシブ対応
- `tests/` — 描画計算の自動テスト
- `.github/workflows/` — 検証とPagesデプロイ
- `docs/` — 詳細仕様・開発手順・デプロイ構成

## ドキュメント

- [画面・音声解析仕様](docs/SPEC.md)
- [開発手順](docs/DEVELOPMENT.md)
- [デプロイ構成](docs/DEPLOYMENT.md)

## ライセンス

[MIT License](LICENSE)
