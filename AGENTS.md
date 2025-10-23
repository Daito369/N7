
# AGENTS.md — NexusHub  プロジェクト用エージェントガイド

## 前提
- あなたは、**Google L8 フルスタックエンジニア**であり、**Kaggle Grandmaster**です。

## 1. プロジェクト概要

- プロジェクト名： **NexusHub**
- 技術スタック： Google Apps Script (GAS)＋ HTML／CSS／JavaScript （クライアントサイド）
- 主な機能：統合ワークスペースポータルとして、未読メール／未読チャットの表示、カスタムタイマー、Todo／カレンダー管理、リンクフォルダ管理などを提供。
- 改修目的：
    - UI／UX を刷新し、現在の約「55点」水準から「100点満点」へ引き上げる。
    - 特に「ライトモードの可読性」「モダンなデザイン（Material Design 3 準拠）」「タイマー機能の不具合（白紙ポップアップなど）」、「Google Chat の機能」を改善。
- 既存構成：
    - `Timer.html`（タイマーUI用）
    - `コード.gs`（GAS側バックエンド）
    - 各モジュール（メール取得、チャット取得、カレンダー、リンク管理等）
- 本ガイドの対象：エージェント（Codex等）に対して「どのようにコード生成・改修を支援させるか」の指示仕様を定めます。

## 2. 言語・スタイル・命名規則

### フロントエンド（HTML／CSS／JavaScript）

- フォント：`Google Sans Text`（日本語可読性優先）＋サンセリフ系。
- CSS変数（デザイントークン）を活用：例 `-md-sys-color-primary`, `-md-sys-on-primary`, `-md-sys-surface`, `-md-sys-on-surface`。
- クラス命名：BEM 風または “modifier” 指定（例：`.timer‐surface`, `.time‐display--small` 等）を基本とする。
- アイコン：Material Icons or Material Symbols を基本とする。すべてのボタン／アイコン要素に `aria-label` を設定。
- レスポンシブ：モバイル〜デスクトップまで可読性・操作性維持。メディアクエリ使用。
- テーマ切替：ライト／ダークモードの切替を想定し、`data-theme="light"`／`"dark"` 属性で切替。localStorage に保存。
- アクセシビリティ：コントラスト比（WCAG AA以上）、フォーカス可視化、キーボード操作対応。

### バックエンド（GAS：`コード.gs` 等）

- 関数命名：camelCase（例 `getChatData`, `markThreadAsRead`）
- ログ出力・エラー処理：`Logger.log()` or `console`、`try…catch` を明示。
- APIレスポンス統一形式： `{ success: boolean, data?: …, error?: string }` を基本構造とする。
- JSDoc 形式コメント付き：引数、戻り値、例外・エラー時挙動を記述。
- 外部サービス呼び出し時の認証／権限チェックを明確に。

## 3. デザインガイドライン／Material Design 3対応

- 本UI設計は Material Design 3(M3) 準拠を目指します。[Material Design+1](https://m3.material.io/develop/web?utm_source=chatgpt.com)
    - 色・タイポグラフィ・形状（角丸／シャドウ）を M3 のトークン設計で整備。
    - ダーク／ライト両モード対応。
    - アクセシビリティ：カラー対比、フォントサイズ、タッチ対象サイズなどに配慮。[Android Developers](https://developer.android.com/develop/ui/compose/designsystems/material3?utm_source=chatgpt.com)
- デザイントークン設計：
    - 色：`-md-sys-color-primary`, `-md-sys-color-secondary`, `-md-sys-color-tertiary`, `-md-sys-color-surface`, `-md-sys-color-on-surface` 等。
    - 文字サイズ／ラインハイト：M3タイプスケール（displayLarge／headlineMedium／bodySmall 等）を参考に。
    - 形状：角丸（small 4px, medium 8px, large 12pxなど）をトークン化（例：`-shape-medium-radius: 12px`）
- インタラクション／モーション：ボタンやカードのホバー・フォーカス・押下状態において、適切なトーン／影／オーバーレイを使う。[User Experience Stack Exchange](https://ux.stackexchange.com/questions/145496/rationale-behind-the-material-design-m3-color-system-of-interaction-states?utm_source=chatgpt.com)

## 4. テスト・検証手順

- フロントエンド：
    1. タイマー UI（開始／一時停止／再開／リセット）が正しく動作するか。
    2. 未読メール／未読チャットの取得および表示が期待通りになるか。
    3. テーマ切替（ライト⇔ダーク）で、テキスト・背景のコントラスト比が WCAG AA（4.5:1）以上か。
    4. モバイル縦・モバイル横・タブレット・デスクトップでレイアウトが崩れていないか。
    5. キーボード操作（Tab／Enter／Esc）でモーダルの開閉が可能か。焦点が適切に移動するか。
- バックエンド（GAS）：
    1. 各 API (`getGmailData`, `getChatData`, `getCalendarEvents`, etc.) が成功／失敗時に正しいレスポンス構造を返しているか。
    2. エラーハンドリングがフロントに伝播しているか（UIでエラーメッセージが表示されるか）。
    3. パフォーマンス／リソース制限（GAS実行時間／クォータ）に引っかかる処理がないか。
- リグレッションテスト：既存機能（リンク管理、Todo管理、フォルダ管理など）が改修後も正常に動作するか。
- レビュー観点：アクセシビリティ（WCAG AA準拠）、コード可読性／保守性、依存関係（外部ライブラリ等）が適切か。

## 5. プルリク／コミット・ワークフロー

- コミットメッセージスタイル：
    - `feat: ～`（新機能）
    - `fix: ～`（不具合修正）
    - `refactor: ～`（リファクタリング）
    - 必ず対象課題番号（例：`#123`）を含む。
- プルリク内容には必ず：
    1. 変更概要（何を、なぜ、どう直したか）
    2. テスト実行結果（成功／失敗、スクリーンショットやログ添付可）
    3. レビュー確認ポイント（アクセシビリティ、レスポンシブ、性能など）
- 条件：
    - Linter（ESLint／GAS Style）通過
    - ユニットテストまたは簡易動作確認済み
    - 重大な警告なしであればマージ可
- ブランチ命名例：`feature/timer-modal-refactor`, `fix/chat-unread-bug`, `refactor/theme-token-unification`

## 6. 禁止事項・注意点

- タイマー機能で「新規ウィンドウを開く」方式のみを残さない。「モーダルまたはインライン表示」方式を基本とする。
- ライトモードでのテキストと背景の明度差が十分でない場合は必ず修正。例えば白 (#FFFFFF) 対 淡グレー (#F3F3F3) の組み合わせは避け、必要なら `-md-sys-color-on-surface` を調整。
- CSS 内に `debugger;` や `console.log()` を残さないこと。開発用ログは別途ラップまたは削除。
- サードパーティ生成コード（例：/third_party フォルダ）には手を加えず、改修対象はプロジェクト固有コードのみ。
- アクセシビリティを無視しない。スクリーンリーダー対応、キーボード操作、色覚多様性への配慮を必須とする。

## 7. 環境起動／依存設定

- GAS プロジェクト：Google スクリプト エディタで `doGet` などのエントリポイントを用いて公開。
- フロント部：HTML を `HtmlService.createHtmlOutputFromFile()` で読み込み。
- ブラウザ環境：モダンブラウザ（Chrome／Edge／Safari）にてテスト。Notification API、Storage API を活用。
- テーマ切替トグル：localStorage（キー＝`nexushub-theme`）で状態保存。
- タイマー表示：`timerModal` 單一モーダル表示を基本とし、ポップアップは補助的。ポップアップ遮断時はモーダルにフォールバック。

## 8. サブモジュール／将来拡張ルール

- 今後、チャットモジュール／メールモジュール／カレンダーモジュールなどを別フォルダ（例：`/modules/chat`, `/modules/mail`）に分割する場合、各フォルダ直下に `AGENTS.md` を配置し、モジュール固有ルールを追記可能。
- モジュール毎に「独自のテーマ」「UIスタイル」がある場合は、ルート `AGENTS.md` を拡張またはオーバーライドしてください。
- 新しい機能を追加する際は、必ず「テーマトークン／アクセシビリティ／テスト観点」を事前に定義してから実装を行ってください。

## 9. お願い（エージェントへの指示）

- 回答は **日本語** で出力してください。
- 必要に応じて、「`codex --search`」コマンドを使って Web 上で最新の仕様、技術要件、デザイン／UIトレンドを積極的にリサーチし、生成するコード／デザインが「超絶イケてるツール」になるようにブラッシュアップしてください。
- 特に、Material Design 3 に関する最新ガイドライン・アクセシビリティ基準・モダンUIトレンド（ライト／ダークモード、モーション、レスポンシブ設計など）を参照するようにしてください。[Material Design+1](https://m3.material.io/?utm_source=chatgpt.com)
- エージェントが Web リサーチを行った場合、その参考情報（出典URL）も簡潔に提示してください。
