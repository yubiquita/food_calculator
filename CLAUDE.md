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
    history: [            // 操作履歴（最大5件表示）
        {
            type: 'add'|'subtract'|'calculation',
            value: number,
            timestamp: string,
            sourceName?: string,    // 計算時のみ
            multiplier?: number     // 計算時のみ
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
- **クリップボードコピー**: 重量表示をタップして数値のみをコピー
- **全削除**: 全料理データを削除（カスタム確認モーダル付き）

### UI/UX機能
- **料理名編集**: `onfocus="this.select()"`で全選択、Enterキーでフォーカス解除
- **重量表示**: `Math.round()`で整数表示、クリック可能（`cursor: pointer`）
- **数値入力**: Enterキーで即座に実行、入力欄自動クリア
- **クリップボード**: `navigator.clipboard.writeText()`とフォールバック実装
- **操作履歴**: 最新5件の操作を時刻付きで表示
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

## 開発コマンド

### アプリケーション実行
```bash
# ローカル開発
# 任意のモダンブラウザでindex.htmlを直接開く
# ビルドプロセスやサーバーは不要

# GitHub Pages デプロイ
# git push で自動デプロイ（通常40秒程度で反映）
```

### テスト環境
```bash
# 全テスト実行（54個のテストケース）
npm test

# ウォッチモードでテスト実行（開発中の継続テスト）
npm run test:watch

# カバレッジ付きテスト実行
npm run test:coverage

# Jest依存関係インストール
npm install
```

### テスト構造
- **tests/setup.js**: Jestグローバル設定、DOM・localStorage・clipboard モック
- **tests/foodCalculator.test.js**: 基本機能、重量操作、データ永続化、UI機能テスト
- **tests/utils.test.js**: ユーティリティ機能、エッジケース、レンダリングテスト
- **テストカバレッジ**: 主要ビジネスロジック、エラーハンドリング、UI状態管理を包括

## テスト開発ガイドライン

### テスト実装時の注意点
- **FoodCalculatorクラステスト**: `tests/setup.js`でシンプル化されたクラス定義を使用
- **モック管理**: localStorage・navigator.clipboardは個別テストでモック作成
- **データ分離**: テスト間でのデータ汚染を防ぐため独立したインスタンス作成
- **メソッド置換**: 外部依存関係（localStorage等）は一時的なメソッド置換でモック注入

### テスト実行時の確認ポイント
- 全54テストの完全パス確認
- モック設定の正確性（特にクリップボード・データ永続化）
- エラーハンドリングの網羅性
- Math.round計算ロジックの精度確認

## 実装ガイドライン

- 重量は常に`Math.round()`で整数化して表示
- 新機能追加時は`render()`内でイベントリスナーを忘れずに設定
- モバイル対応を前提とした実装（タップイベント、クリップボード等）
- モーダル追加時は既存のCSSクラス（`.modal`, `.btn-*`）を再利用
- ボタンの無効化は`disabled`属性 + 透明度での視覚フィードバック
- 数値入力にはEnterキー対応を必須実装
- 用語統一：「皿」→「食器」に変更済み
- テーマ機能追加時はCSS変数を使用し、既存の`:root`と`[data-theme="dark"]`セレクタを活用
- 新しいUI要素にはテーマ対応の`var(--変数名)`と`transition`を必須で設定
- レイアウト変更時はCSS Gridの4列構造（`80px 100px 100px 60px`）を維持
- デザインの近接原則に従い、関連要素のグループ化と適切な分離を確保