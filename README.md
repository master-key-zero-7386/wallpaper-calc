# 壁紙・CF数量計算アプリ

現場で採寸して、その場で発注数量(壁紙・クッションフロア)を出すためのWebアプリ。
スマホからアクセスできる。保存済み物件データはPostgresに保存される。

## 構成

- Next.js (App Router) — フロントエンド + API
- Prisma — DBアクセス
- Postgres (Neon想定) — 物件データの保存先
- Vercel — デプロイ先

## 1. Neonでデータベースを用意する

1. https://neon.tech でアカウント作成(GitHubアカウントでもOK)
2. 新しいプロジェクトを作成(名前は `wallpaper-calc` など)
3. ダッシュボードの「Connection string」を開くと、2種類のURLが表示される
   - **Pooled connection**(`-pooler` が付いているホスト名) → `.env` の `DATABASE_URL` に入れる
   - **Direct connection**(`-pooler` が付いていないホスト名) → `.env` の `DIRECT_URL` に入れる
4. `.env.example` を `.env` にコピーして、上記の値を貼り付ける

```bash
cp .env.example .env
```

## 2. pgAdminから接続する(ZSSSと同じ管理方法)

pgAdminの「サーバーを新規登録」で、Neonダッシュボードに表示されている以下の情報を入力する。

- Host: Neonの接続情報にあるホスト名
- Port: 5432
- Database: Neonで作ったデータベース名
- Username / Password: Neonの接続情報にある値
- SSL Mode: `Require`

これでZSSSのDBを見るのと同じ感覚で、pgAdminから壁紙アプリのテーブル・データを確認できる。

## 3. ローカルで動かす

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

ブラウザで http://localhost:3000 を開く。スマホから確認する場合は、同じWi-Fiに繋いだ状態で `http://<このPCのIPアドレス>:3000` にアクセスする。

## 4. Vercelにデプロイする

1. このフォルダをGitHubリポジトリにpushする
2. https://vercel.com でアカウント作成 → 「Add New Project」→ 上記リポジトリを選択
3. Environment Variablesに `DATABASE_URL` と `DIRECT_URL` を設定(Neonの値と同じ)
4. Deployをクリック

デプロイ後に表示されるURLに、スマホからそのままアクセスできる。

## データの持ち方

`Project` テーブル1つに、物件ごとの入力内容(部屋・壁・床・開口部など)をJSONでまとめて保存している。
元のArtifact版の `window.storage.set/get/list/delete` を、それぞれ以下のAPIに置き換えた。

| 元の処理 | 新しいAPI |
| --- | --- |
| `window.storage.set` | `POST /api/projects` |
| `window.storage.list` | `GET /api/projects` |
| `window.storage.get` | `GET /api/projects/:key` |
| `window.storage.delete` | `DELETE /api/projects/:key` |

## 元ファイル

`reference/wallpaper-calc.original.jsx` に、変換前のClaude Artifact用オリジナルコードを残してある。
