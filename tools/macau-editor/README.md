# マカオ原稿のスマホ校正

本人専用のTJ Apps `/manuscripts/macau/` で写真付きの記事本文を直接編集する。保存は下書き保存であり、tojimasaya.comへの公開ではない。

- `build.py [出力先]`: 現在の5ページから編集可能な写しを作る。公開サイトの元HTMLは変更しない。既定の出力先は `/private/tmp/macau-editor-bundle`。
- `worker.mjs`: Accessの本人メールとJWTヘッダーを必須とする専用ルート。POSTは同一originのJSONに限定する。既存機能やアセット配信は変更しない。
- `editor.js` / `editor.css`: 本文・見出し・写真説明の編集と明示的な下書き保存。未保存分は端末内にも退避する。
- `pull.py`: 既存SCAN_SECRETで保存履歴を読み、元HTMLのハッシュと照合する。既定は照合だけ。`--apply` でバックアップ・保存・読み直しを行う。公開はしない。
- `deploy.py`: 現在の配信コードの追加だけを行い、既存の静的アセットと設定を保持する。事前取得した本番コードが変わっていれば中止する。

`manuscript_edit:v1:macau:<UUID>` は、親版と修正差分を1保存1キーで保持する。古い画面からの保存は拒否し、同時保存の分岐は両方を残して照合待ちとする。GETは履歴を消費しない。

`manuscript_bundle:v1:macau` と `manuscript_asset:v1:<SHA-256>` は、この下書きだけの配信素材。新しい定期同期やポーリングは追加しない。未取り込みの保存履歴がある状態では別の元原稿で素材を差し替えない。

Macへの読み取り用GET `/api/scan/manuscripts/macau` は既存SCAN_SECRETで認証する。既存スキャナはこの原稿を変更しない。本人がスマホで保存した修正の取り込みと、公開サイトへの反映は別に行う。
