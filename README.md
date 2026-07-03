# PriTest

Python でページを生成し、GitHub Actions 経由で GitHub Pages に自動公開するテストプロジェクトです。
ホームページから複数のミニプロジェクトを選んで遊べる構成になっています。

## 構成

```
generate.py          ビルドスクリプト（python generate.py で dist/ を生成）
site_src/             各ページの HTML と多言語文字列を組み立てる Python コード
  i18n_data.py         中文 / 日本語 / English の翻訳データ
  projects.py          ホームページに表示するミニプロジェクト一覧
  layout.py            共通レイアウト（ヘッダー・言語切替）
  index_page.py        ホームページ
  night_page.py         Night ミニゲームのページ骨格
static_src/            そのまま dist/static/ にコピーされる CSS/JS
  style.css
  i18n.template.js      i18n_data.py の内容が埋め込まれて static/i18n.js になる
  night.js              Night ミニゲームのゲームロジック（クライアントサイド）
```

## 使い方

```bash
python generate.py
```

`dist/index.html`（ホーム）と `dist/night/index.html`（Night ミニゲーム）が生成されます。

## Night ミニゲームについて

トランプ 52 枚から任意の枚数を選んで送出すると、起點・終點の間に並ぶ
3x3 のマスにランダムに裏向きで配置されます。マスをクリックすると
翻開／抽出の確認ダイアログが出て、抽出すると盤面から完全に消えて
空きマスになります。「接續開始」で残りのカードから追加選択し、
空きマスへランダムに配り直せます。すべての操作は画面下部のログに
記録され、右上の言語切替（中文 / 日本語 / English）でいつでも
表示言語を切り替えられます。

## 新しいミニプロジェクトを追加するには

1. `site_src/<name>_page.py` を追加してページを組み立てる
2. `site_src/projects.py` にエントリを追記
3. `site_src/i18n_data.py` に name_key / desc_key の翻訳を追加
4. `generate.py` の `build_pages()` に出力先を追加

## 自動デプロイ

`main` ブランチに push すると `.github/workflows/deploy.yml` が実行され、
`generate.py` の生成結果が GitHub Pages に公開されます。

初回のみ、GitHub リポジトリの Settings > Pages で
Source を **GitHub Actions** に設定してください。
