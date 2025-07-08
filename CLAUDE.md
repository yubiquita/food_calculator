# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## アプリケーション概要

食事記録のための日本語食品重量計算アプリです。食事前後の皿の計量によって食品の正味重量を計算し、複数の同時食品計算と皿重量プリセット機能をサポートします。

## アーキテクチャ

モダンなVue 3 + TypeScriptアーキテクチャを採用：

- **シングルページアプリケーション**: Vue 3 + TypeScript + Vite による型安全なSPA
- **コンポーネントベースアーキテクチャ**: 単一責任の原則に基づいたVueコンポーネント分割
- **リアクティブ状態管理**: Piniaによる型安全なストア管理
- **データ永続化**: localStorageによるクライアントサイドデータストレージ
- **カードベースUI**: 各食品アイテムは`FoodCard.vue`コンポーネントとして実装
- **Composables**: 再利用可能なロジック（`useSwipe`、`useClipboard`）をComposablesで提供
- **VueUse統合**: `@vueuse/core`によるテーマ管理（`useDark`）でlocalStorage・システムテーマ検出を自動化

### 主要依存関係
- **Vue 3.5.17**: プログレッシブJavaScriptフレームワーク
- **Pinia 3.0.3**: Vue 3専用の軽量状態管理ライブラリ
- **@vueuse/core 13.5.0**: Vue Composition APIユーティリティコレクション（テーマ管理で使用）
- **TypeScript**: 型安全性とIDE支援による開発効率向上
- **Vite**: 高速な開発サーバーとビルドツール
- **Vitest**: Vite環境でのユニットテストフレームワーク

## 開発コマンド

### アプリケーション実行
```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（HMR対応）
npm run dev
# ブラウザで http://localhost:5173 にアクセス

# 本番ビルド
npm run build

# ビルド結果のプレビュー
npm run preview

# GitHub Pages デプロイ
npm run deploy
# または GitHub Actions による自動デプロイ（mainブランチプッシュ時）
```

### テスト実行
```bash
# 全テスト実行
npm test

# ウォッチモードでテスト実行（開発中の継続テスト）
npm run test:watch

# カバレッジ付きテスト実行
npm run test:coverage

# 特定のテストグループ実行
npm test -- --testNamePattern="食品ストア"
npm test -- --testNamePattern="食器ストア"
npm test -- --testNamePattern="テーマストア"
npm test -- --testNamePattern="トーストストア"

# 単一テストファイル実行
npm test src/stores/__tests__/food.test.ts
npm test src/stores/__tests__/dish.test.ts
npm test src/stores/__tests__/theme.test.ts
npm test src/stores/__tests__/toast.test.ts
```

## 主要データモデル

### 食品オブジェクト構造
```javascript
{
    id: number,           // 一意識別子
    name: string,         // ユーザー編集可能な食品名
    weight: number,       // 現在の正味重量（グラム、小数点で保存・整数で表示）
    calculation: {        // 他の食品からの計算（オプション）
        sourceId: number, // 他の食品IDへの参照
        multiplier: number // 乗算係数（例：60%の場合0.6）
    } | null,
    history: [            // 操作履歴（全件保存、スクロール表示）
        {
            type: 'add'|'subtract'|'calculation'|'auto_recalculation',
            value: number,
            timestamp: string,
            sourceName?: string,    // 計算時のみ
            multiplier?: number     // 計算時のみ
        }
    ],
    stateHistory: [       // undo用の状態履歴
        {
            weight: number,
            calculation: object | null
        }
    ]
}
```

### 食器プリセット構造
```javascript
{
    name: string,    // 食器名（例：「茶碗」、「皿」）
    weight: number   // 食器重量（グラム）
}
```

## 主要機能

### 重量操作
- **加算**: 直接重量入力と現在の合計への加算
- **減算**: 食器重量の減算（手動入力またはプリセット選択）
- **食器プルダウン自動実行**: 食器選択時に即座に重量減算を実行（Issue #6実装）
- **手動計算（加算方式）**: 他の食品からの乗算による重量導出、既存重量に計算結果を加算（Issue #8実装）
- **自動再計算（上書き方式）**: 参照元食品の重量変更時に依存する計算食品を新しい計算結果で上書き更新
- **計算結果統合**: 計算結果は通常の重量として統合、手動操作で計算関係自動クリア
- **Gmail風スワイプUndo**: 左スワイプ（80px閾値）で最後の操作を取り消し（undo時も依存食品の自動再計算実行）
- **クリップボードコピー**: 重量表示をタップして数値のみをコピー

### UI/UX機能
- **料理名編集**: `onfocus="this.select()"`で全選択、Enterキーでフォーカス解除
- **重量表示**: `formatWeight()`メソッドで統一された整数表示、クリック可能（`cursor: pointer`）
- **数値入力**: Enterキーで即座に実行、入力欄自動クリア
- **操作履歴**: 全操作履歴をスクロール表示（60px固定高でoverflow-y: auto）
- **テーマ切り替え**: ライト・ダークテーマの切り替え機能（localStorage永続化）
- **トースト通知**: 循環参照検出時の控えめな警告表示（フェード+縦移動アニメーション）

### データフロー
1. ユーザーアクションがPiniaストアのアクションを呼び出し
2. ストアが状態を更新し、リアクティブにUIが更新
3. `useAppStore.saveData()`が各変更後にlocalStorageに永続化
4. Vueのリアクティブシステムがコンポーネントの再レンダリングを自動管理

## 重要な実装パターン

### Vue状態管理
- Piniaストアによるリアクティブな状態管理
- 各コンポーネントが必要なストアのみを参照し、変更を自動追跡
- ComputedプロパティとWatcherによる効率的な再計算
- 全削除ボタンは`foodCount`が0時に`disabled`状態

### Gmail風スワイプUndo機能
- **カード構造**: `.card-container`が`.undo-background`と`.food-card`を包含
- **スワイプ検出**: タッチイベント（`touchstart`, `touchmove`, `touchend`）で左スワイプを検出
- **閾値判定**: 80px以上の左スワイプ＋500ms以内の操作でundo実行
- **方向制限**: `deltaX <= -threshold`で左スワイプのみに制限（右スワイプではundo動作しない）
- **タップ誤動作防止**: `hasMoved`フラグで実際のスワイプとタップを区別
- **状態管理**: 操作前の状態を`stateHistory`に保存し、undo時に復元
- **自動再計算連携**: undo実行時に`recalculateDependent(id)`を呼び出し、依存する計算食品も自動更新

### レイアウトシステム
- **CSS Grid**: コントロール要素の配置に3列等分割グリッド（`1fr 1fr 1fr`）を使用
- **要素の縦整列**: 入力欄とボタンが各行で縦に揃うよう設計
- **統一されたレイアウト**: 重量行・食器行・計算行すべてが同じ3列構造
- **モバイル最適化**: 3等分割により横はみ出しを防止し、確実なコンテナ内収容を実現

### 計算システム
- **手動計算（加算）**: `updateCalculation`で`food.weight += calculatedWeight`により既存重量に加算
- **自動再計算（上書き）**: `recalculateDependent`で`food.weight = newWeight`により新しい計算結果で上書き
- **依存関係追跡**: `recalculateDependent(changedFoodId)`で変更された食品を参照している食品を検出
- **再帰的更新**: 多階層の依存関係（A→B→C）も自動で連鎖更新
- **循環参照検出**: `detectCircularReference(sourceId, targetId)`で深度優先探索による循環参照防止
- **履歴管理**: 自動再計算は`auto_recalculation`タイプとして履歴に記録（🔄アイコンで表示）

### テーマシステム（VueUse useDark()ベース）
- `@vueuse/core`の`useDark()`による自動テーマ管理
- localStorage自動永続化、システムテーマ自動検出、DOM自動操作
- CSS変数（カスタムプロパティ）を使用したテーマ切り替え
- `data-theme`属性でライト/ダーク状態を管理
- アプリ固有のUI（テーマボタンのアイコン/テキスト）は独自実装で保持

### トースト通知システム
- **単一通知管理**: `currentToast`プロパティで同時表示を1個に制限
- **控えめなアニメーション**: フェードイン + 軽微な縦移動（-10px → 0px）
- **自動削除**: 3秒後にフェードアウトして自動削除
- **テーマ対応**: ライト・ダークテーマで適切な色彩変更

## テスト構造

### テストファイル
- **src/test-utils/setup.ts**: Vitestグローバル設定、DOM・localStorage・clipboard モック
- **src/stores/__tests__/food.test.ts**: 食品ストア（28テスト）- CRUD、重量操作、計算、Undo機能
- **src/stores/__tests__/dish.test.ts**: 食器ストア（24テスト）- 管理、検索、ソート、バリデーション
- **src/stores/__tests__/theme.test.ts**: テーマストア（10テスト）- VueUse useDark()ベースの簡素化実装テスト
- **src/stores/__tests__/toast.test.ts**: トーストストア（27テスト）- 通知、タイマー、重複制御

### テスト実装時の注意点
- **Piniaストアテスト**: `src/test-utils/helpers.ts`でストア作成ヘルパー関数を提供
- **モック管理**: localStorage・navigator.clipboardは個別テストでモック作成
- **データ分離**: テスト間でのデータ汚染を防ぐため、各テストで`createPinia()`と`setActivePinia()`を実行
- **DOM環境**: happy-domでブラウザ環境をシミュレート
- **TypeScript対応**: 全テストファイルがTypeScriptで型安全に実装
- **非同期テスト**: `vi.useFakeTimers()`でタイマー処理をモック、`vi.advanceTimersByTime()`で時間経過をシミュレート
- **Vue Test Utils**: コンポーネントテストで`@vue/test-utils`を使用可能

## 実装ガイドライン

### コア実装原則
- **型安全性**: データは小数点保持、表示は`formatWeight()`で統一整数化、`parseFloat() || 0`でエラー回避
- **エラーハンドリング**: サイレントフェール設計（クリップボード、localStorage等）
- **DOM安全性**: 要素存在確認後の操作、`getElementById`のnullチェック必須
- **データ永続性**: 操作後の`saveData()`呼び出し、`render()`での画面同期
- **循環参照防止**: 計算設定前に`detectCircularReference()`による検証必須
- **通知表示**: エラー時は`showToast()`による控えめな警告表示を採用

### UI/UX実装規則
- 新機能追加時は`render()`内でイベントリスナーを忘れずに設定
- モバイル対応を前提とした実装（タップイベント、クリップボード等）
- モーダル追加時は既存のCSSクラス（`.modal`, `.btn-*`）を再利用
- 数値入力にはEnterキー対応を必須実装
- **食器プルダウン自動実行**: `_handleCardChange`でchangeイベント時の自動処理を実装

### 履歴とUndo機能
- 履歴表示は全件保存・降順表示を採用（`.reverse()`使用、最新操作が上に表示）
- スワイプundo機能では操作前の状態を`stateHistory`に保存し、undo時に`history`と`stateHistory`の両方から削除
- 新規食品追加時は`stateHistory: []`の初期化を必須実装
- スワイプ機能実装時は`hasMoved`フラグでタップとスワイプを区別し、誤動作を防止

### レイアウトとテーマ
- **CSS変数システム**: 全テーマ対応要素は`var(--変数名)`を使用、`:root`と`[data-theme="dark"]`で定義
- **テーマ変数の分類**: 
  - 基本色: `--bg-color`, `--card-bg`, `--text-color`, `--header-text`
  - 成功・履歴色: `--success-color`, `--history-header-color`, `--history-text-color`
  - 補助色: `--secondary-text-color`, `--close-hover-color`
- **新UI要素**: テーマ対応の`var(--変数名)`と`transition: color 0.3s ease`を必須設定
- **レイアウト維持**: CSS Gridの3列等分割構造（`1fr 1fr 1fr`）を変更時も維持

## パフォーマンス最適化

### Vue最適化手法
- **リアクティブシステム**: Vueの効率的な差分更新によるDOM操作最小化
- **コンポーネント分割**: 単一責任の原則によるレンダリング範囲の限定
- **Computed活用**: 重い計算結果のキャッシュ化
- **メモリリーク防止**: Vueのライフサイクルによる自動クリーンアップ

### 最適化指針
- 大量データ（100+食品）でのリスト仮想化検討
- Composablesの適切な利用によるロジック再利用
- localStorage操作の効率化

## エラーハンドリング

### 実装パターン
- **サイレントフェール**: クリップボード操作の例外処理
- **入力検証**: `parseFloat() || 0`による安全な数値変換
- **DOM安全性**: `getElementById`のnullチェック
- **localStorage例外**: 容量制限時の適切な処理

## ブラウザサポート

### 対応ブラウザ
- **推奨**: モダンブラウザ（Chrome, Firefox, Safari, Edge）
- **必要機能**: 
  - CSS Grid サポート
  - CSS Variables（カスタムプロパティ）
  - Touch Events（モバイル）
  - Clipboard API（フォールバック機能付き）
  - localStorage

### モバイル対応
- **レスポンシブデザイン**: `@media (max-width: 480px)`
- **タッチ操作**: スワイプUndo機能
- **表示最適化**: モバイル専用レイアウト調整

## デプロイメント

### GitHub Pages設定
- **ソース設定**: リポジトリ設定でSourceを「GitHub Actions」に設定（legacyモード禁止）
- **自動デプロイ**: mainブランチプッシュ時にGitHub Actionsが自動実行
- **手動デプロイ**: `npm run deploy`で即座にデプロイ可能

### GitHub Actions運用
```bash
# Actions実行状況確認
gh run list --limit 5

# 失敗時のログ確認
gh run view <RUN_ID> --log-failed

# GitHub Pages設定確認・変更
gh api repos/<user>/<repo>/pages
gh api --method PUT repos/<user>/<repo>/pages -f build_type=workflow
```

### 重要な設定ファイル
- **vite.config.ts**: `base: '/food_calculator/'`でGitHub Pages対応、`dev-eruda`プラグインで開発環境専用erudaを自動注入
- **package-lock.json**: 必ずGitにコミット（GitHub Actionsキャッシュに必要）
- **.gitignore**: `dist/`は除外、`package-lock.json`は含める

## 開発時の重要な注意事項

- **TDD開発**: 新機能実装時はRED→GREEN→REFACTORサイクルを厳守
- **型安全性**: 全てのPiniaストアとVueコンポーネントでTypeScript型定義を厳密に管理
- **テスト分離**: 各テストで`createPinia()`と`setActivePinia()`によるデータ分離必須
- **モック管理**: localStorage・clipboardは個別テストで適切にモック

## トラブルシューティング

### GitHub Pages関連
**症状**: ページが真っ白で表示されない
- **原因**: GitHub Pagesが「legacy」モードで動作
- **解決**: `gh api --method PUT repos/<user>/<repo>/pages -f build_type=workflow`

**症状**: `Dependencies lock file is not found`エラー
- **原因**: package-lock.jsonがGitにコミットされていない
- **解決**: `.gitignore`からpackage-lock.jsonを削除してコミット

### GitHub Actions関連
**症状**: `crypto.hash is not a function`エラー
- **原因**: Node.js 18とVue/Viteの互換性問題
- **解決**: GitHub ActionsでNode.js v20を使用

**症状**: `Missing environment`エラー
- **原因**: GitHub Pagesデプロイに必要なenvironment設定不足
- **解決**: ワークフローにenvironment設定を追加

### ブラウザキャッシュ問題
JavaScriptの変更が反映されない場合、ブラウザのキャッシュが原因の可能性。開発時は強制再読み込み（Ctrl+F5）またはキャッシュクリアを実行。

### モバイルデバッグ
**開発環境でのeruda**: `npm run dev`実行時にerudaコンソールが自動で利用可能
- vite.config.tsの`dev-eruda`プラグインにより開発環境でのみ自動注入
- 本番ビルド（`npm run build`）には含まれない
- 開発時にモバイルデバッグコンソールとして利用可能

## GitHub CLI使用時の注意事項

### Issue操作でのコメント投稿
`gh issue close`でマルチライン・Markdownコメントを投稿する際は、HEREDOC形式を使用：

```bash
# エラーが出る方法（Bashの文字列解析問題）
gh issue close 6 --comment "**実装内容:**
- 機能追加完了"

# 推奨方法（直接HEREDOC形式）
gh issue close 2 --comment - <<EOF
## 実装完了: 自動再計算機能

### 実装内容
- recalculateDependent() メソッド実装済み
- 依存関係の自動更新機能

機能は完全に実装され、テストも全て通過しています。
EOF
```

**注意**: エラーメッセージが出てもIssueクローズ自体は成功している場合が多い。`gh issue view <number>`で状態確認を推奨。

## 最新の実装状況

### 完了済み機能
- ✅ **Issue #2**: 自動再計算機能（`recalculateDependent()`、循環参照検出）
- ✅ **Issue #3**: 計算結果を重量合計に統合（手動操作で計算関係クリア）
- ✅ **Issue #4**: Math.round()統合（`formatWeight()`メソッド、小数点精度保持）
- ✅ **Issue #8**: 手動計算加算方式（`food.weight += calculatedWeight`、自動再計算は上書き維持）

### 計算機能の動作仕様
- **手動計算**: `updateCalculation`メソッドで既存重量に計算結果を加算
- **自動再計算**: `recalculateDependent`メソッドで新しい計算結果に上書き
- **テストカバレッジ**: 89テスト全通過（食品28、食器24、テーマ10、トースト27）

### テーマ管理の最新実装
- **VueUse統合**: `@vueuse/core`の`useDark()`で139行→68行（51%削減）
- **自動機能**: localStorage管理、システムテーマ検出、DOM操作、MediaQuery監視すべて自動化
- **互換性保持**: 既存API（`setTheme`, `toggleTheme`, `initializeTheme`）は維持
- **UI要素保持**: 日本語テーマボタンのアイコン/テキスト表示は独自実装として保持

## アーキテクチャの主要構成

### Piniaストア構成
- **useFoodStore**: 食品データ管理、CRUD操作、計算ロジック
- **useDishStore**: 食器プリセット管理、検索・ソート機能
- **useThemeStore**: VueUse useDark()ベースのテーマ管理、日本語UI要素
- **useToastStore**: 通知管理、自動削除タイマー
- **useAppStore**: アプリケーション全体の状態、データ永続化

### Composables
- **useSwipe**: タッチイベント処理、スワイプUndo機能
- **useClipboard**: クリップボード操作、フォールバック処理

### Utilities
- **calculation.ts**: 依存関係計算、循環参照検出
- **storage.ts**: localStorage操作の抽象化
- **clipboard.ts**: クリップボードAPI操作

### TDD開発方針
新機能実装時は必ずRED→GREEN→REFACTORサイクルを適用し、既存テストの継続通過を確認する。

## FoodCardコンポーネントの最新レイアウト仕様

### 統一された3列レイアウト
全コントロール行（重量・食器・計算）は以下の統一された3列等分割構造を採用：

**重量行**: `[空白] [重量入力] [+ボタン]`
**食器行**: `[食器選択] [食器重量入力] [-ボタン]`  
**計算行**: `[食品選択] [× 1.0入力] [計算ボタン]`

### CSS設定
```css
.control-row,
.calculation-row {
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px; /* デスクトップ */
}

@media (max-width: 480px) {
  .control-row,
  .calculation-row {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 5px; /* モバイル */
  }
}
```

### プレースホルダー活用
- 重量入力: `placeholder="重量を入力"`
- 食器重量入力: `placeholder="食器重量"`
- 計算入力: `placeholder="× 1.0"`
- 選択肢: デフォルトオプション（「食器選択」「食品選択」）

### UI改善のポイント
- ラベルレス設計によるスペース効率化
- プレースホルダーによる直感的な操作案内
- 全要素の`width: 100%`による列幅フル活用
- モバイルでの横はみ出し完全防止

## ブランディングとUI要素

### ファビコン設計
- **コンセプト**: 台形の重量計本体の上に皿が1枚乗っている構図
- **ファイル**: `/public/favicon.svg`（SVGフォーマット）
- **色彩**: 青色グラデーション（重量計）+ 緑色グラデーション（皿）
- **形状**: 下広がりの安定した台形本体、単一の皿による明確なシルエット
- **配置**: index.htmlで`<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`として設定