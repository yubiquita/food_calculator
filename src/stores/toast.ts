// トースト通知の状態管理

import { defineStore } from 'pinia'
import type { ToastNotification, ToastType } from '../types'
import { generateUniqueId } from '../utils'

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as ToastNotification[],
    maxToasts: 3, // 同時に表示する最大数
    defaultDuration: 3000 // デフォルトの表示時間（ミリ秒）
  }),

  getters: {
    // 表示中のトースト一覧
    visibleToasts: (state) => state.toasts,
    
    // トースト数
    toastCount: (state) => state.toasts.length,
    
    // 特定のタイプのトーストがあるかチェック
    hasToastOfType: (state) => (type: ToastType) =>
      state.toasts.some(toast => toast.type === type)
  },

  actions: {
    // トースト通知を表示
    showToast(
      message: string, 
      type: ToastType = 'info', 
      duration?: number
    ): string {
      const id = generateUniqueId()
      const toast: ToastNotification = {
        id,
        message,
        type,
        duration: duration || this.defaultDuration
      }

      // 最大数を超える場合は古いものを削除
      if (this.toasts.length >= this.maxToasts) {
        this.removeOldestToast()
      }

      // 新しいトーストを追加
      this.toasts.push(toast)

      // 自動削除のタイマーを設定
      this.scheduleRemoval(id, toast.duration!)

      return id
    },

    // 成功メッセージを表示
    showSuccess(message: string, duration?: number): string {
      return this.showToast(message, 'success', duration)
    },

    // エラーメッセージを表示
    showError(message: string, duration?: number): string {
      return this.showToast(message, 'error', duration)
    },

    // 警告メッセージを表示
    showWarning(message: string, duration?: number): string {
      return this.showToast(message, 'warning', duration)
    },

    // 情報メッセージを表示
    showInfo(message: string, duration?: number): string {
      return this.showToast(message, 'info', duration)
    },

    // 特定のトーストを削除
    removeToast(id: string): void {
      const index = this.toasts.findIndex(toast => toast.id === id)
      if (index !== -1) {
        this.toasts.splice(index, 1)
      }
    },

    // 最も古いトーストを削除
    removeOldestToast(): void {
      if (this.toasts.length > 0) {
        this.toasts.shift()
      }
    },

    // 全てのトーストを削除
    clearAllToasts(): void {
      this.toasts = []
    },

    // 特定のタイプのトーストを全て削除
    clearToastsByType(type: ToastType): void {
      this.toasts = this.toasts.filter(toast => toast.type !== type)
    },

    // 自動削除をスケジュール
    scheduleRemoval(id: string, duration: number): void {
      setTimeout(() => {
        this.removeToast(id)
      }, duration)
    },

    // トーストの表示時間を更新
    updateToastDuration(id: string, newDuration: number): void {
      const toast = this.toasts.find(t => t.id === id)
      if (toast) {
        toast.duration = newDuration
      }
    },

    // トーストメッセージを更新
    updateToastMessage(id: string, newMessage: string): void {
      const toast = this.toasts.find(t => t.id === id)
      if (toast) {
        toast.message = newMessage
      }
    },

    // 重複メッセージのチェック
    isDuplicateMessage(message: string, type: ToastType): boolean {
      return this.toasts.some(toast => 
        toast.message === message && toast.type === type
      )
    },

    // 重複を避けてトーストを表示
    showToastIfNotDuplicate(
      message: string, 
      type: ToastType = 'info', 
      duration?: number
    ): string | null {
      if (this.isDuplicateMessage(message, type)) {
        return null
      }
      return this.showToast(message, type, duration)
    },

    // トーストの優先度を設定（高優先度は前に表示）
    showPriorityToast(
      message: string, 
      type: ToastType = 'info', 
      duration?: number
    ): string {
      const id = generateUniqueId()
      const toast: ToastNotification = {
        id,
        message,
        type,
        duration: duration || this.defaultDuration
      }

      // 最大数を超える場合は古いものを削除
      if (this.toasts.length >= this.maxToasts) {
        this.removeOldestToast()
      }

      // 優先度の高いトーストは先頭に追加
      this.toasts.unshift(toast)

      // 自動削除のタイマーを設定
      this.scheduleRemoval(id, toast.duration!)

      return id
    }
  }
})