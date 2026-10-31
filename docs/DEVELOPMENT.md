# 開発手順

## 環境と起動

Node.js 20、pnpm 9を使用します。

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
```

`pnpm test` は描画の純粋関数だけを `tests/dist/` に一時コンパイルし、Node.js標準テストランナーで検証します。生成物（`dist/`、`tests/dist/`、`*.tsbuildinfo`）はGit管理対象外です。

## ブランチ運用

- 通常の実装・修正は `develop`、本番公開は `main`。
- `develop` pushでValidate developを実行し、成功したコミットを開発プレビューに公開。
- `main` への反映は必ず **base: `main` / compare: `develop`** のPRを作り、テスト・ビルド結果を確認する。
- マージ後も `develop` を削除せず、`main` と同期する。

```bash
git switch develop
git pull origin develop
# 変更・テスト
pnpm test && pnpm build
git add .
git commit -m "refactor: explain change"
git push origin develop

# 本番マージ後に同期
git fetch origin
git switch develop
git merge origin/main
git push origin develop
```

## コード構成

- `src/App.tsx` — UI、波形／周波数の切り替えと操作ボタン
- `src/hooks/useAudioCapture.ts` — 共有要求の競合防止、ストリーム・AudioContextの生成・停止
- `src/components/AudioCanvas.tsx` — requestAnimationFrame、ResizeObserver、データ読み取り
- `src/audio/visualizer.ts` — FFT表示範囲、時間波形の座標変換、Canvas描画
- `src/index.css` — ヘッダー・コンテンツ・フッター、PC／モバイル表示
- `tests/visualizer.test.cjs` — FFTビン計算・サンプル座標変換の回帰テスト

Reactの副作用（音声共有、Canvasのライフサイクル）と、描画計算を分離しています。共有終了時はすべてのMediaStreamTrackを停止し、AudioContextをcloseします。停止通知が重複しても安全であることを意識してください。

## 手動確認

1. Chrome/Edge等の対応ブラウザでタブ音声共有を開始し、波形が動くこと。
2. 周波数表示に切り替えると棒グラフに変わり、入力音声に反応すること。
3. アプリの停止ボタンと、ブラウザの共有停止ボタンの双方で停止状態に戻ること。
4. 音声なし共有の場合、エラーを表示し、共有が残らないこと。
5. デスクトップ幅とモバイル幅でグラフ・ボタン・フッターの表示が崩れないこと。

音声共有そのものはCI上のヘッドレス環境では正常に確認できません。通常のブラウザで別途検証が必要です。

## CI

`validate-develop.yml` はpushとPRのテスト・ビルド、`deploy-pages.yml` は本番・プレビューのビルドおよび単一Pages公開を行います。詳細は[DEPLOYMENT.md](DEPLOYMENT.md)を参照してください。
