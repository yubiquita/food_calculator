# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## アプリケーション概要

食事記録のための日本語食品重量計算アプリです。食事前後の皿の計量によって食品の正味重量を計算し、複数の同時食品計算と皿重量プリセット機能をサポートします。

## アーキテクチャ

シンプルなクライアントサイドアーキテクチャを採用：

- **シングルページアプリケーション**: ビルドプロセス不要の純粋なHTML/CSS/JavaScript
- **クラスベースアーキテクチャ**: メインの`FoodCalculator`クラスがすべてのアプリケーション状態を管理
- **データ永続化**: クライアントサイドデータストレージにlocalStorageを使用
- **カードベースUI**: 各食品アイテムは個別のカードコンポーネントとしてレンダリング
- **動的イベントバインディング**: `render()`実行時にDOMイベントリスナーを再設定

## 開発コマンド

### アプリケーション実行
```bash
# ローカル開発サーバー（推奨）
npx http-server -p 8080
# ブラウザで http://127.0.0.1:8080 にアクセス
# CSS/JavaScriptの読み込み問題を回避

# キャッシュ無効でローカルサーバー起動
npx http-server -p 8080 -c-1
# Cache-Control: no-store でブラウザキャッシュを無効化

# 直接ファイル開く（非推奨）
# index.htmlを直接ブラウザで開く
# Content URI経由では相対パスリソースが読み込めない

# GitHub Pages デプロイ
# git push で自動デプロイ（通常40秒程度で反映）
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
npm test -- --testNamePattern="Gmail風スワイプUndo機能"
npm test -- --testNamePattern="基本機能"
npm test -- --testNamePattern="自動再計算機能"
npm test -- --testNamePattern="循環参照検出"
npm test -- --testNamePattern="トースト通知改善機能"
npm test -- --testNamePattern="テーマ機能"
npm test -- --testNamePattern="Math.round\(\)統合機能"
npm test -- --testNamePattern="計算結果統合機能"
npm test -- --testNamePattern="手動計算"
npm test -- --testNamePattern="動作違い"

# 単一テストファイル実行
npm test tests/foodCalculator.test.js
npm test tests/utils.test.js
npm test tests/toastNotification.test.js
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
1. すべてのユーザーアクションがデータモデルを即座に更新
2. `saveData()`が各変更後にlocalStorageに永続化
3. `render()`がカードインターフェース全体を再構築
4. 動的イベントリスナーが`querySelectorAll()`で要素にバインド

## 重要な実装パターン

### UI状態管理
- `render()`メソッドで全UI状態を再構築（複雑な差分更新より保守性を優先）
- 全削除ボタンは料理0件時に`disabled`状態で透明化（`opacity: 0.5`）
- 動的イベントバインディングによりメモリリーク防止

### Gmail風スワイプUndo機能
- **カード構造**: `.card-container`が`.undo-background`と`.food-card`を包含
- **スワイプ検出**: タッチイベント（`touchstart`, `touchmove`, `touchend`）で左スワイプを検出
- **閾値判定**: 80px以上の左スワイプ＋500ms以内の操作でundo実行
- **方向制限**: `deltaX <= -threshold`で左スワイプのみに制限（右スワイプではundo動作しない）
- **タップ誤動作防止**: `hasMoved`フラグで実際のスワイプとタップを区別
- **状態管理**: 操作前の状態を`stateHistory`に保存し、undo時に復元
- **自動再計算連携**: undo実行時に`recalculateDependent(id)`を呼び出し、依存する計算食品も自動更新

### レイアウトシステム
- **CSS Grid**: コントロール要素の配置に4列グリッド（`80px 100px 100px 60px`）を使用
- **要素の縦整列**: 入力欄とボタンが各行で縦に揃うよう設計
- **近接の原則**: 関連操作（重量・食器重量）を`gap: 5px`でグループ化

### 計算システム
- **手動計算（加算）**: `updateCalculation`で`food.weight += calculatedWeight`により既存重量に加算
- **自動再計算（上書き）**: `recalculateDependent`で`food.weight = newWeight`により新しい計算結果で上書き
- **依存関係追跡**: `recalculateDependent(changedFoodId)`で変更された食品を参照している食品を検出
- **再帰的更新**: 多階層の依存関係（A→B→C）も自動で連鎖更新
- **循環参照検出**: `detectCircularReference(sourceId, targetId)`で深度優先探索による循環参照防止
- **履歴管理**: 自動再計算は`auto_recalculation`タイプとして履歴に記録（🔄アイコンで表示）

### テーマシステム
- CSS変数（カスタムプロパティ）を使用したテーマ切り替え
- `data-theme`属性でライト/ダーク状態を管理
- localStorageで設定永続化、アプリ起動時に自動復元

### トースト通知システム
- **単一通知管理**: `currentToast`プロパティで同時表示を1個に制限
- **控えめなアニメーション**: フェードイン + 軽微な縦移動（-10px → 0px）
- **自動削除**: 3秒後にフェードアウトして自動削除
- **テーマ対応**: ライト・ダークテーマで適切な色彩変更

## テスト構造

### テストファイル
- **tests/setup.js**: Jestグローバル設定、DOM・localStorage・clipboard モック、script.jsからのFoodCalculator自動インポート
- **tests/foodCalculator.test.js**: 基本機能、重量操作、データ永続化、UI機能、Math.round()統合機能、計算結果統合機能テスト
- **tests/utils.test.js**: ユーティリティ機能、エッジケース、レンダリングテスト
- **tests/toastNotification.test.js**: トースト通知専用テスト（12テストケース）

### テスト実装時の注意点
- **FoodCalculatorクラステスト**: `tests/setup.js`でscript.jsから自動インポートしたTestFoodCalculatorクラスを使用
- **モック管理**: localStorage・navigator.clipboardは個別テストでモック作成
- **データ分離**: テスト間でのデータ汚染を防ぐため、各テストで`localStorage.clear()`と`createFoodCalculator()`を実行
- **DOM環境**: jest-environment-jsdomでブラウザ環境をシミュレート
- **トースト通知テスト**: `beforeEach`で`toast-container`DOM要素の確実なセットアップが必要
- **非同期テスト**: `jest.useFakeTimers()`でタイマー処理をモック、`jest.advanceTimersByTime()`で時間経過をシミュレート
- **テーマ機能テスト**: `document.querySelector`のモックが必要、`document.documentElement.setAttribute`の呼び出し確認でテーマ変更を検証

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
- **レイアウト維持**: CSS Gridの4列構造（`80px 100px 100px 60px`）を変更時も維持

## パフォーマンス最適化

### 現在の最適化手法
- **DOM操作の最小化**: `render()`メソッドによる一括再描画
- **イベントデリゲーション**: 動的要素に対する効率的なイベント処理
- **メモリリーク防止**: イベントリスナーの適切なクリーンアップ
- **レンダリング戦略**: 差分更新より保守性を優先した全体再構築

### 最適化指針
- 大量データ（100+食品）での性能確認が必要
- スワイプ処理の最適化（タッチイベント処理）
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

## 開発時の重要な注意事項

- **自動同期**: `tests/setup.js`は`require('../script.js')`でFoodCalculatorクラスを自動インポート（手動同期不要）
- **CommonJS対応**: `script.js`は条件付きで`module.exports`を提供、ブラウザ環境では通常通り動作
- **Jest依存関係**: 開発時は`npm install`でJest環境をセットアップ
- **TDD開発**: 新機能実装時はRED→GREEN→REFACTORサイクルを厳守
- **統合テスト**: 単体テストに加えて実際のユーザーフロー（登録→操作→表示）をテストして環境差異を検出

## トラブルシューティング

### ブラウザキャッシュ問題
JavaScriptの変更が反映されない場合、ブラウザのキャッシュが原因の可能性。開発時は強制再読み込み（Ctrl+F5）またはキャッシュクリアを実行。

### モバイルデバッグ
AndroidでConsole確認が必要な場合、erudaを一時的に追加：
```html
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
```
問題解決後は必ず削除すること。

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
- **テストカバレッジ**: 手動計算加算、複数回累積、動作違い検証を含む145テスト全通過

### TDD開発方針
新機能実装時は必ずRED→GREEN→REFACTORサイクルを適用し、既存テストの継続通過を確認する。