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

## 主要データモデル

### 食品オブジェクト構造
```javascript
{
    id: number,           // 一意識別子
    name: string,         // ユーザー編集可能な食品名
    weight: number,       // 現在の正味重量（グラム、整数で表示）
    calculation: {        // 他の食品からの計算（オプション）
        sourceId: number, // 他の食品IDへの参照
        multiplier: number // 乗算係数（例：60%の場合0.6）
    } | null,
    history: [            // 操作履歴（全件保存、スクロール表示）
        {
            type: 'add'|'subtract'|'calculation',
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
- **計算**: 他の食品からの乗算による重量導出（結果は`Math.round()`で整数化）
- **Gmail風スワイプUndo**: 左スワイプ（80px閾値）で最後の操作を取り消し
- **クリップボードコピー**: 重量表示をタップして数値のみをコピー
- **全削除**: 全料理データを削除（カスタム確認モーダル付き）

### UI/UX機能
- **料理名編集**: `onfocus="this.select()"`で全選択、Enterキーでフォーカス解除
- **重量表示**: `Math.round()`で整数表示、クリック可能（`cursor: pointer`）
- **数値入力**: Enterキーで即座に実行、入力欄自動クリア
- **クリップボード**: `navigator.clipboard.writeText()`とフォールバック実装
- **操作履歴**: 全操作履歴をスクロール表示（60px固定高でoverflow-y: auto）
- **モーダルUI**: 食器設定と全削除確認に統一されたモーダルデザイン
- **テーマ切り替え**: ライト・ダークテーマの切り替え機能（localStorage永続化）

### データフロー
1. すべてのユーザーアクションがデータモデルを即座に更新
2. `saveData()`が各変更後にlocalStorageに永続化
3. `render()`がカードインターフェース全体を再構築
4. 動的イベントリスナーが`querySelectorAll()`で要素にバインド

## 重要な実装パターン

### モーダル管理
- 食器設定モーダル（`#dish-modal`）と全削除確認モーダル（`#confirm-modal`）
- 背景クリックで閉じる機能、ESCキー対応は未実装
- 統一されたCSS（`.modal`, `.modal-content`, `.modal-header`, `.modal-body`）

### UI状態管理
- `render()`メソッドで全UI状態を再構築
- 全削除ボタンは料理0件時に`disabled`状態で透明化（`opacity: 0.5`）
- 早期リターンで無効時のモーダル表示を防止

### クリップボード機能
- `weight-display`クラスに`data-copy-value`属性とクリックイベント
- Modern API優先（`navigator.clipboard`）+ フォールバック（`document.execCommand`）
- モバイル対応で画面外のtextarea要素を使用

### 計算機能
- `updateCalculation()`で結果を`Math.round()`して整数保存
- 参照元の重量変更時は自動更新されない設計
- 履歴に計算元と乗数を記録

### テーマシステム
- CSS変数（カスタムプロパティ）を使用したテーマ切り替え
- `data-theme`属性でライト/ダーク状態を管理
- `this.theme`プロパティでJavaScript側の状態管理
- localStorageで設定永続化、アプリ起動時に自動復元
- ヘッダー右上の切り替えボタン（🌙/☀️アイコン）

### レイアウトシステム
- **CSS Grid**: コントロール要素の配置に4列グリッド（`80px 100px 100px 60px`）を使用
- **要素の縦整列**: 入力欄とボタンが各行で縦に揃うよう設計
- **近接の原則**: 関連操作（重量・食器重量）を`gap: 5px`でグループ化
- **分離**: 操作エリアと履歴の間に`margin-top: 20px`で適切な分離
- **スペーサー要素**: 重量行に`<span></span>`を追加して4列構造に統一

### Gmail風スワイプUndo機能
- **カード構造**: `.card-container`が`.undo-background`と`.food-card`を包含
- **スワイプ検出**: タッチイベント（`touchstart`, `touchmove`, `touchend`）で左スワイプを検出
- **視覚フィードバック**: スワイプ中にカードが左移動し、背景の赤いundoアイコンが表示
- **閾値判定**: 80px以上の左スワイプ＋500ms以内の操作でundo実行
- **方向制限**: `deltaX <= -threshold`で左スワイプのみに制限（右スワイプではundo動作しない）
- **タップ誤動作防止**: `hasMoved`フラグで実際のスワイプとタップを区別（`script.js:271`、`tests/setup.js:276`）
- **状態管理**: 操作前の状態を`stateHistory`に保存し、undo時に復元
- **履歴連動**: `history`がある場合のみスワイプ可能（`.swipeable`クラス）

## 開発コマンド

### アプリケーション実行
```bash
# ローカル開発
# 任意のモダンブラウザでindex.htmlを直接開く
# ビルドプロセスやサーバーは不要

# GitHub Pages デプロイ
# git push で自動デプロイ（通常40秒程度で反映）
```

### 開発時の重要な注意事項
- **自動同期**: `tests/setup.js`は`require('../script.js')`でFoodCalculatorクラスを自動インポート（手動同期不要）
- **CommonJS対応**: `script.js`は条件付きで`module.exports`を提供、ブラウザ環境では通常通り動作
- **型安全性**: 重量計算は常に`Math.round()`で整数化、`parseFloat() || 0`でエラー回避

### テスト環境
```bash
# 全テスト実行
npm test

# 特定のテストグループ実行
npm test -- --testNamePattern="Gmail風スワイプUndo機能"
npm test -- --testNamePattern="基本機能"

# 単一テストファイル実行
npm test tests/foodCalculator.test.js
npm test tests/utils.test.js
npm test tests/renderFoodCard.test.js

# ウォッチモードでテスト実行（開発中の継続テスト）
npm run test:watch

# カバレッジ付きテスト実行
npm run test:coverage

# Jest依存関係インストール
npm install
```

### 履歴機能の実装詳細
- **全件保存**: 履歴の保存件数に上限なし（ユーザーが手動で料理を削除するまで永続化）
- **降順表示**: `script.js:271`と`tests/setup.js:238`で`food.history.slice().reverse()`を使用し、最新の操作が上に表示
- **スクロール表示**: 全履歴を`renderHistory()`で表示、最新が上なのでスクロール不要
- **CSS実装**: `style.css:299-305`で`.history-items`に`max-height: 60px`と`overflow-y: auto`を設定
- **テスト**: `tests/utils.test.js`で履歴の降順表示（最新が上）を確認

### テスト構造
- **tests/setup.js**: Jestグローバル設定、DOM・localStorage・clipboard モック、script.jsからのFoodCalculator自動インポート、index.htmlからの実際のDOM環境構築
- **tests/foodCalculator.test.js**: 基本機能、重量操作、データ永続化、UI機能テスト
- **tests/utils.test.js**: ユーティリティ機能、エッジケース、レンダリングテスト
- **tests/renderFoodCard.test.js**: スナップショットテストによるrenderFoodCard出力の回帰テスト
- **テストカバレッジ**: 主要ビジネスロジック、エラーハンドリング、UI状態管理、HTML出力の回帰テストを包括

## テスト開発ガイドライン

### テスト実装時の注意点
- **FoodCalculatorクラステスト**: `tests/setup.js`でscript.jsから自動インポートしたTestFoodCalculatorクラスを使用
- **モック管理**: localStorage・navigator.clipboardは個別テストでモック作成
- **データ分離**: テスト間でのデータ汚染を防ぐため独立したインスタンス作成
- **メソッド置換**: 外部依存関係（localStorage等）は一時的なメソッド置換でモック注入
- **DOM環境**: jest-environment-jsdomでブラウザ環境をシミュレート

### テスト実行時の確認ポイント
- 全テストの実行確認（全テスト通過済み）
- DOM環境の安定性確認（DOM要素アクセス完全復旧済み）
- モック設定の正確性（クリップボード・データ永続化モック完全対応済み）
- Math.round計算ロジックの精度確認
- スワイプundo機能のタップ誤動作防止とstate管理
- テスト間でのデータ分離（独立したインスタンス作成）
- スナップショットテストによる回帰テスト（HTML出力の変更検出）

### テスト失敗時のトラブルシューティング
```bash
# 特定テストグループのみ実行して問題の特定
npm test -- --testNamePattern="Gmail風スワイプUndo機能"

# 単一テストファイルでの詳細確認
npm test tests/utils.test.js
npm test tests/renderFoodCard.test.js

# テスト環境のDOM状態確認
# console.log(document.getElementById('food-cards').innerHTML) をテストに追加
```

### テスト環境とscript.jsの自動同期
- **自動同期**: `tests/setup.js`は`require('../script.js')`によりFoodCalculatorクラスを直接インポート
- **同期確認**: script.js変更時は自動的にテスト環境に反映、手動同期作業は不要
- **DOM環境**: Jest標準のjsdom環境を活用し、`document.documentElement.innerHTML`でHTML注入
- **CSS/JS除去**: テスト環境用にCSSとscript.jsリンクを自動除去、テスト実行時の競合を防止
- **安定性**: DOM要素アクセス競合問題を完全解決、テスト環境の完全安定化を実現

## 実装ガイドライン

### コア実装原則
- **型安全性**: 重量は常に`Math.round()`で整数化、`parseFloat() || 0`でエラー回避
- **エラーハンドリング**: サイレントフェール設計（クリップボード、localStorage等）
- **DOM安全性**: 要素存在確認後の操作、`getElementById`のnullチェック必須
- **データ永続性**: 操作後の`saveData()`呼び出し、`render()`での画面同期

### UI/UX実装規則
- 新機能追加時は`render()`内でイベントリスナーを忘れずに設定
- モバイル対応を前提とした実装（タップイベント、クリップボード等）
- モーダル追加時は既存のCSSクラス（`.modal`, `.btn-*`）を再利用
- ボタンの無効化は`disabled`属性 + 透明度での視覚フィードバック
- 数値入力にはEnterキー対応を必須実装
- 用語統一：「皿」→「食器」に変更済み

### レイアウトとテーマ
- テーマ機能追加時はCSS変数を使用し、既存の`:root`と`[data-theme="dark"]`セレクタを活用
- 新しいUI要素にはテーマ対応の`var(--変数名)`と`transition`を必須で設定
- レイアウト変更時はCSS Gridの4列構造（`80px 100px 100px 60px`）を維持
- デザインの近接原則に従い、関連要素のグループ化と適切な分離を確保

### 履歴とUndo機能
- 履歴表示は全件保存・降順表示を採用（`script.js:406`と`tests/setup.js:424`で`.reverse()`使用、最新操作が上に表示）
- スワイプundo機能では操作前の状態を`stateHistory`に保存し、undo時に`history`と`stateHistory`の両方から削除
- 新規食品追加時は`stateHistory: []`の初期化を必須実装
- スワイプ機能実装時は`hasMoved`フラグでタップとスワイプを区別し、誤動作を防止
- スワイプ方向制限では`deltaX <= -threshold`を使用して左スワイプのみに制限（`Math.abs()`は使用しない）

### パフォーマンス最適化
- **全DOM再構築**: `render()`メソッドによる確実な状態同期（複雑な差分更新より保守性を優先）
- **イベントリスナー管理**: 動的バインディングによりメモリリーク防止
- **タッチイベント**: `{ passive: true }`オプションでスクロール性能最適化

## 開発ワークフロー

### プロジェクト管理
- **Issue管理**: GitHub Issuesで機能計画とバグ管理を一元化
- **Epic構成**: 関連する複数機能をEpicでグループ化（例：計算機能の改善 #1）
- **ラベル分類**: `enhancement`, `calculation`, `ui`, `refactoring`で分類
- **コミット連携**: `fixes #123`でIssueを自動クローズ

### 機能開発とリファクタリング
- **優先度**: UI改善 → 機能拡張 → リファクタリングの順で実装
- **品質確保**: 新機能実装時は必ずテストケース追加
- **進捗確認**: `gh issue list`でプロジェクト状況を確認