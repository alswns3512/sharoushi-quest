# ⚖️ 社労士クエスト

> 社労士試験を楽しく攻略するゲーム型学習アプリ

**和モダン × ゲーミング**デザインで、社会保険労務士試験の学習をRPG感覚で楽しめるPWA（Progressive Web App）です。

---

## ✨ 主な機能

| 機能 | 説明 |
|---|---|
| 📖 **ステージ学習** | Level 1〜30の段階別コンテンツ（超入門→社労士基礎→労働基準法） |
| 🎯 **クイズ** | 択一式クイズ＋解説メモ機能 |
| 🃏 **フラッシュカード** | 理解度ボタン付き（完璧 / 少し迷った / もう一度）|
| ⚔️ **クエスト** | デイリー・ウィークリー・ストーリークエスト |
| 🏅 **バッジ実績** | 10種類のバッジコレクション |
| 📊 **学習統計** | ヒートマップ・科目別進捗・合格タイムライン |
| 🎉 **ゲーミフィケーション** | XP・レベルアップ演出・出席ボーナス・ストリーク |
| 💡 **今日の豆知識** | 毎日変わる社労士トリビア（30日分）|

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 14（App Router）+ TypeScript
- **スタイル**: Tailwind CSS + Framer Motion
- **状態管理**: Zustand（localStorage永続化）
- **PWA**: next-pwa（Service Worker + manifest）
- **データ**: 完全ローカル（外部API・環境変数なし）

---

## 🚀 Vercelへのデプロイ手順

### ① ビルドを実行する

```bash
npm run build
```

> `public/icon-192.png` と `public/icon-512.png` がない場合は先にアイコンを生成してください：
> ```bash
> node scripts/generate-icons.mjs
> ```

### ② Vercel にデプロイする（3ステップ）

1. **[vercel.com](https://vercel.com) にアクセス**してアカウントでログイン（GitHubアカウントで可）

2. **「Add New Project」→「Import Git Repository」** を選択
   - または **「Upload」** から `.next` フォルダをドラッグ＆ドロップ

3. **設定はそのままで「Deploy」をクリック**
   - Framework: `Next.js`（自動検出）
   - 環境変数: **不要**（全データはlocalStorage）
   - Build Command: `npm run build`（デフォルト）

### ③ GitHubから直接デプロイする方法（推奨）

```bash
# 1. GitHubにpush
git push origin main

# 2. vercel.com でリポジトリをインポート
# → 以降はpushのたびに自動デプロイ
```

### ④ iPhoneのホーム画面に追加する方法

1. Safariで生成されたVercelのURLを開く
2. 共有ボタン（□↑）をタップ
3. 「ホーム画面に追加」を選択
4. 「追加」をタップ → アプリアイコンが表示される

---

## 💻 ローカル開発

```bash
# 依存関係のインストール
npm install

# アイコン生成（初回のみ）
node scripts/generate-icons.mjs

# 開発サーバー起動
npm run dev
# → http://localhost:3000

# ビルド確認
npm run build
```

---

## 📁 プロジェクト構造

```
src/
├── app/
│   ├── page.tsx          # ホーム画面
│   ├── study/            # ステージ学習
│   ├── quiz/             # クイズ
│   ├── flashcard/        # フラッシュカード
│   ├── quest/            # クエスト一覧
│   ├── collection/       # バッジ実績・統計
│   └── progress/         # 学習進捗・合格タイムライン
├── components/
│   ├── game/             # ゲームUI（レベルアップ演出等）
│   └── layout/           # BottomNav
├── data/                 # 静的データ（レベル・クエスト・バッジ等）
├── hooks/                # XP・ストリーク・サウンド
├── lib/                  # ゲームロジック・XP計算
├── store/                # Zustand ストア
└── types/                # 型定義
```

---

## 📝 注意事項

- データは **localStorage** に保存されます（ブラウザのデータを消去するとリセットされます）
- 環境変数・外部APIは **一切不要** です
- PWA機能はHTTPS環境（Vercel等）でのみ有効です
- 動作確認済み環境: iPhone Safari / Chrome / Edge

---

*社労士クエストで、楽しく合格を目指そう！⚖️✨*
