# GitHub Pages デプロイ

## 公開先

| ソース | URL |
| --- | --- |
| `main` | https://naoiw.github.io/audio-visualizer/ |
| `develop` | https://naoiw.github.io/audio-visualizer/develop/ |

公開先は1つのGitHub Pagesサイト（`github-pages`環境）です。公開アーティファクトに本番のルートと開発用の `develop/` を同梱します。

## ワークフロー

1. `.github/workflows/validate-develop.yml` は `develop` push、`main` / `develop` 宛PRでテスト・ビルドを実行します。PRではデプロイしません。
2. `develop` pushの検証成功時に、`main` 上の `.github/workflows/deploy-pages.yml` を `workflow_run` で起動します。失敗・キャンセルした検証やPRはデプロイしません。
3. `main` pushでも `deploy-pages.yml` が実行されます。手動起動は `main` からのみ可能です。
4. デプロイは `main` と `develop` の2つの作業ツリーをcheckoutし、それぞれ依存関係をインストールして再ビルドします。開発版は成功した検証ジョブのコミットSHAをcheckoutします。
5. `production/dist/` を公開ルート、`preview/dist/` を `develop/` に配置してまとめて公開します。

開発版の静的ファイル参照には `vite build --base=/audio-visualizer/develop/` を指定します。本番は `vite.config.ts` の `/audio-visualizer/` を使用します。

## 設定と権限

- GitHub Settings → Pages → Build and deployment → Source は **GitHub Actions** とする。
- `github-pages`環境は1つのみ。本番のデプロイ処理はデフォルトブランチ `main` で実行するため、環境にmainのみ許可する保護ルールがあっても動作する。
- ビルドジョブは `contents: read` のみを使用。デプロイジョブだけに `pages: write` と `id-token: write` を付与。
- `workflow_run` はデフォルトブランチにあるワークフロー定義を必要とする。初回有効化では `deploy-pages.yml` を先に `main` に配置する。
- `Validate develop` の表示名を変えるときは、デプロイ側の `workflow_run.workflows` も修正する。
- Pagesのデプロイは同時実行せず順番に処理する（`concurrency.group: pages`）。

## 確認方法と注意点

- [Actions](https://github.com/naoiw/audio-visualizer/actions) で検証とデプロイジョブが成功していることを確認する。
- 初回公開後は本番と `/develop/` の両URLを直接開き、両者のアセット読み込みを確認する。
- 検証に失敗した新しい `develop` のコミットは公開されず、最後に公開できたプレビューが残る。
- 開発プレビューも一般公開されるので、秘密情報やローカル専用設定をコミットしない。
- `main` 更新後の公開では現在の `develop` を使うため、PRマージ後は `develop` を `main` と同期する。
