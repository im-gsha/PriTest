# PriTest

Python でページを生成し、GitHub Actions 経由で GitHub Pages に自動公開するテストプロジェクトです。

## 使い方

```bash
python generate.py
```

`dist/index.html` が生成されます。

## 自動デプロイ

`main` ブランチに push すると `.github/workflows/deploy.yml` が実行され、
`generate.py` の生成結果が GitHub Pages に公開されます。

初回のみ、GitHub リポジトリの Settings > Pages で
Source を **GitHub Actions** に設定してください。
