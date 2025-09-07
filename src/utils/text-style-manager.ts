/**
 * TextStyleManager - 专业排版系统的核心样式管理引擎
 * 
 * 功能特性:
 * - 创建、编辑、删除文字样式
 * - 全局样式同步: 一处修改，处处更新
 * - 样式继承和覆盖机制
 * - 使用统计和智能清理
 * - 样式导入导出
 * - 观察者模式事件通知
 */

import {
  TextStyleDefinition,
  ProfessionalTextStyle,
  StyleCategory,
  StyleObserver,
  StyleManagerEvent,
  StyleApplicationResult,
  StyleUsageStats,
  StyleLibraryExport
} from '../types/professional-text-types';

export class TextStyleManager {
  private styles: Map<string, TextStyleDefinition> = new Map();
  private elementStyleMap: Map<string, string> = new Map(); // elementId -> styleId
  private observers: Set<StyleObserver> = new Set();
  private initialized: boolean = false;
  
  constructor() {
    console.log('🎨 TextStyleManager 初始化中...');
  }

  /**
   * 初始化样式管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 加载系统预设样式
      await this.loadSystemStyles();
      
      // 加载用户自定义样式
      await this.loadUserStyles();
      
      this.initialized = true;
      console.log(`✅ TextStyleManager 初始化完成，加载了 ${this.styles.size} 个样式`);
    } catch (error) {
      console.error('❌ TextStyleManager 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建新样式
   */
  createStyle(definition: Omit<TextStyleDefinition, 'id' | 'metadata'>): string {
    const styleId = `style_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newStyle: TextStyleDefinition = {
      ...definition,
      id: styleId,
      metadata: {
        createdAt: new Date(),
        lastModified: new Date(),
        author: 'user',
        usageCount: 0,
        isSystemStyle: false,
        tags: []
      }
    };
    
    this.styles.set(styleId, newStyle);
    this.notifyObservers('style-created', styleId);
    this.saveUserStyles();
    
    console.log(`🎨 创建新样式: ${newStyle.name} (${styleId})`);
    return styleId;
  }

  /**
   * 获取样式定义
   */
  getStyle(styleId: string): TextStyleDefinition | null {
    return this.styles.get(styleId) || null;
  }

  /**
   * 更新样式定义 - 核心功能：全局同步
   */
  updateStyle(styleId: string, updates: Partial<ProfessionalTextStyle>): boolean {
    const style = this.styles.get(styleId);
    if (!style) {
      console.warn(`⚠️ 样式 ${styleId} 不存在`);
      return false;
    }
    
    if (style.metadata.isSystemStyle) {
      console.warn(`⚠️ 无法修改系统预设样式 ${styleId}`);
      return false;
    }
    
    // 更新样式定义
    const updatedStyle = {
      ...style,
      style: { ...style.style, ...updates },
      metadata: {
        ...style.metadata,
        lastModified: new Date()
      }
    };
    
    this.styles.set(styleId, updatedStyle);
    
    // 🎯 核心价值：全局同步所有使用此样式的元素
    this.syncAllStyleInstances(styleId);
    
    // 持久化保存
    this.saveUserStyles();
    
    // 通知观察者
    this.notifyObservers('style-updated', styleId);
    
    console.log(`🔄 样式已更新: ${style.name} (${styleId})`);
    return true;
  }

  /**
   * 删除样式
   */
  deleteStyle(styleId: string): boolean {
    const style = this.styles.get(styleId);
    if (!style) {
      return false;
    }
    
    if (style.metadata.isSystemStyle) {
      console.warn(`⚠️ 无法删除系统预设样式 ${styleId}`);
      return false;
    }
    
    // 检查是否有元素在使用此样式
    const elementsUsingStyle = Array.from(this.elementStyleMap.entries())
      .filter(([_, usedStyleId]) => usedStyleId === styleId)
      .map(([elementId, _]) => elementId);
    
    if (elementsUsingStyle.length > 0) {
      console.warn(`⚠️ 无法删除样式 ${styleId}，仍有 ${elementsUsingStyle.length} 个元素在使用`);
      return false;
    }
    
    this.styles.delete(styleId);
    this.saveUserStyles();
    this.notifyObservers('style-deleted', styleId);
    
    console.log(`🗑️ 样式已删除: ${style.name} (${styleId})`);
    return true;
  }

  /**
   * 应用样式到元素
   */
  applyStyleToElement(elementId: string, styleId: string): StyleApplicationResult {
    const style = this.styles.get(styleId);
    if (!style) {
      return {
        success: false,
        elementId,
        styleId,
        appliedAt: new Date(),
        error: `样式 ${styleId} 不存在`
      };
    }
    
    try {
      // 更新元素样式映射
      const oldStyleId = this.elementStyleMap.get(elementId);
      this.elementStyleMap.set(elementId, styleId);
      
      // 更新使用统计
      style.metadata.usageCount++;
      if (oldStyleId && oldStyleId !== styleId) {
        const oldStyle = this.styles.get(oldStyleId);
        if (oldStyle) {
          oldStyle.metadata.usageCount = Math.max(0, oldStyle.metadata.usageCount - 1);
        }
      }
      
      // 应用样式到实际元素
      this.applyStyleToDOM(elementId, style.style);
      
      // 通知观察者
      this.notifyObservers('style-applied', { elementId, styleId });
      
      console.log(`🎯 应用样式: ${style.name} → 元素 ${elementId}`);
      
      return {
        success: true,
        elementId,
        styleId,
        appliedAt: new Date()
      };
    } catch (error) {
      console.error(`❌ 应用样式失败: ${error}`);
      return {
        success: false,
        elementId,
        styleId,
        appliedAt: new Date(),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 获取元素当前使用的样式ID
   */
  getElementStyleId(elementId: string): string | null {
    return this.elementStyleMap.get(elementId) || null;
  }

  /**
   * 移除元素的样式映射
   */
  removeElementStyle(elementId: string): void {
    const styleId = this.elementStyleMap.get(elementId);
    if (styleId) {
      this.elementStyleMap.delete(elementId);
      
      // 减少使用计数
      const style = this.styles.get(styleId);
      if (style) {
        style.metadata.usageCount = Math.max(0, style.metadata.usageCount - 1);
      }
      
      console.log(`🔗 移除元素样式映射: 元素 ${elementId}`);
    }
  }

  /**
   * 获取样式库列表
   */
  getStylesByCategory(category?: StyleCategory): TextStyleDefinition[] {
    const styles = Array.from(this.styles.values());
    
    let filteredStyles = category 
      ? styles.filter(s => s.category === category)
      : styles;
    
    return filteredStyles.sort((a, b) => {
      // 系统样式优先，然后按使用频率排序
      if (a.metadata.isSystemStyle !== b.metadata.isSystemStyle) {
        return a.metadata.isSystemStyle ? -1 : 1;
      }
      return b.metadata.usageCount - a.metadata.usageCount;
    });
  }

  /**
   * 搜索样式
   */
  searchStyles(query: string, category?: StyleCategory): TextStyleDefinition[] {
    const styles = this.getStylesByCategory(category);
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
      return styles;
    }
    
    return styles.filter(style => 
      style.name.toLowerCase().includes(searchTerm) ||
      style.description.toLowerCase().includes(searchTerm) ||
      style.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * 获取样式使用统计
   */
  getStyleUsageStats(): StyleUsageStats[] {
    const stats: StyleUsageStats[] = [];
    
    for (const [styleId, style] of this.styles) {
      const elements = Array.from(this.elementStyleMap.entries())
        .filter(([_, usedStyleId]) => usedStyleId === styleId)
        .map(([elementId, _]) => elementId);
      
      stats.push({
        styleId,
        usageCount: elements.length,
        elements,
        lastUsed: style.metadata.lastModified
      });
    }
    
    return stats.sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * 清理未使用的样式
   */
  cleanupUnusedStyles(): string[] {
    const usedStyleIds = new Set(this.elementStyleMap.values());
    const removedStyleIds: string[] = [];
    
    for (const [styleId, style] of this.styles) {
      if (!usedStyleIds.has(styleId) && !style.metadata.isSystemStyle) {
        this.styles.delete(styleId);
        removedStyleIds.push(styleId);
        console.log(`🧹 清理未使用样式: ${style.name} (${styleId})`);
      }
    }
    
    if (removedStyleIds.length > 0) {
      this.saveUserStyles();
    }
    
    return removedStyleIds;
  }

  /**
   * 导出样式库
   */
  exportStyles(styleIds?: string[]): StyleLibraryExport {
    const stylesToExport = styleIds 
      ? styleIds.map(id => this.styles.get(id)).filter(Boolean) as TextStyleDefinition[]
      : Array.from(this.styles.values());
    
    const categories = new Set(stylesToExport.map(s => s.category));
    
    return {
      version: '2.0.0',
      exportedAt: new Date(),
      styles: stylesToExport,
      metadata: {
        totalStyles: stylesToExport.length,
        categories: Array.from(categories),
        author: 'user'
      }
    };
  }

  /**
   * 导入样式库
   */
  async importStyles(exportData: StyleLibraryExport): Promise<string[]> {
    const importedStyleIds: string[] = [];
    
    for (const style of exportData.styles) {
      // 检查是否已存在同名样式
      const existingStyle = Array.from(this.styles.values())
        .find(s => s.name === style.name && s.category === style.category);
      
      if (existingStyle) {
        console.warn(`⚠️ 跳过已存在的样式: ${style.name}`);
        continue;
      }
      
      // 生成新的ID
      const newStyleId = this.createStyle({
        name: style.name,
        description: style.description,
        category: style.category,
        style: style.style,
        ...(style.inheritance && { inheritance: style.inheritance })
      });
      
      importedStyleIds.push(newStyleId);
    }
    
    console.log(`📦 导入完成，共导入 ${importedStyleIds.length} 个样式`);
    return importedStyleIds;
  }

  /**
   * 添加观察者
   */
  addObserver(observer: StyleObserver): void {
    this.observers.add(observer);
  }

  /**
   * 移除观察者
   */
  removeObserver(observer: StyleObserver): void {
    this.observers.delete(observer);
  }

  // ==== 私有方法 ====

  /**
   * 全局样式同步 - 批量更新所有实例
   */
  private syncAllStyleInstances(styleId: string): void {
    const style = this.styles.get(styleId);
    if (!style) return;
    
    const affectedElements: string[] = [];
    
    // 查找所有使用此样式的元素
    for (const [elementId, assignedStyleId] of this.elementStyleMap) {
      if (assignedStyleId === styleId) {
        this.applyStyleToDOM(elementId, style.style);
        affectedElements.push(elementId);
      }
    }
    
    this.notifyObservers('styles-synced', { styleId, affectedElements });
    console.log(`🔄 样式同步完成: ${styleId} → ${affectedElements.length} 个元素`);
  }

  /**
   * 应用样式到DOM元素
   */
  private applyStyleToDOM(elementId: string, style: ProfessionalTextStyle): void {
    // 这里会调用统一边界计算器和渲染系统
    // 暂时先记录日志，后续会实现实际的DOM操作
    console.log(`🎨 应用样式到DOM: 元素 ${elementId}`, {
      font_family: style.font_family,
      font_size: style.font_size,
      typography: style.typography
    });
    
    // TODO: 调用TypographyController或其他渲染系统
    // 这里需要与已有的ElementRenderer集成
  }

  /**
   * 加载系统预设样式
   */
  private async loadSystemStyles(): Promise<void> {
    try {
      // 动态导入银行预设样式库
      const { BANK_TEXT_STYLES } = await import('../data/bank-text-styles');
      
      for (const style of BANK_TEXT_STYLES) {
        this.styles.set(style.id, style);
      }
      
      console.log(`🏦 加载了 ${BANK_TEXT_STYLES.length} 个银行预设样式`);
    } catch (error) {
      console.warn('⚠️ 加载系统样式失败:', error);
      // 继续执行，不阻断初始化过程
    }
  }

  /**
   * 加载用户自定义样式
   */
  private async loadUserStyles(): Promise<void> {
    try {
      const saved = localStorage.getItem('jasper-text-styles');
      if (saved) {
        const userStyles: TextStyleDefinition[] = JSON.parse(saved);
        for (const style of userStyles) {
          // 确保日期对象正确反序列化
          style.metadata.createdAt = new Date(style.metadata.createdAt);
          style.metadata.lastModified = new Date(style.metadata.lastModified);
          
          this.styles.set(style.id, style);
        }
        console.log(`👤 加载了 ${userStyles.length} 个用户自定义样式`);
      }
    } catch (error) {
      console.warn('⚠️ 加载用户样式失败:', error);
    }
  }

  /**
   * 保存用户自定义样式
   */
  private saveUserStyles(): void {
    try {
      const userStyles = Array.from(this.styles.values())
        .filter(style => !style.metadata.isSystemStyle);
      
      localStorage.setItem('jasper-text-styles', JSON.stringify(userStyles));
      console.log(`💾 保存了 ${userStyles.length} 个用户自定义样式`);
    } catch (error) {
      console.error('❌ 保存用户样式失败:', error);
    }
  }

  /**
   * 通知所有观察者
   */
  private notifyObservers(event: StyleManagerEvent, data: any): void {
    for (const observer of this.observers) {
      try {
        observer.onStyleChange(event, data);
      } catch (error) {
        console.error('❌ 观察者通知失败:', error);
      }
    }
  }
}

// 创建全局单例实例
export const textStyleManager = new TextStyleManager();