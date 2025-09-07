// === 基础表达式求值引擎 ===
import type { EvaluationResult, DataContext } from '../types/data-binding';

/**
 * 基础表达式求值引擎
 * 
 * 支持的表达式格式:
 * - 简单字段访问: {fieldName}
 * - 嵌套对象访问: {user.name}  
 * - 数组索引访问: {users[0].name}
 * - 多级嵌套: {order.customer.address.city}
 * 
 * 设计原则:
 * 1. 类型安全 - 完整的TypeScript支持
 * 2. 错误处理 - 详细的错误信息和恢复机制
 * 3. 性能优化 - 表达式缓存和预编译
 * 4. 扩展性 - 支持自定义函数和运算符
 */
export class ExpressionEngine {
  private expressionCache = new Map<string, CompiledExpression>();
  private readonly maxCacheSize = 1000;

  /**
   * 求值主方法 - 统一入口
   */
  async evaluateExpression(
    expression: string, 
    context: DataContext | null
  ): Promise<EvaluationResult> {
    // 基础验证
    if (!expression || !expression.trim()) {
      return {
        success: false,
        error: '表达式不能为空'
      };
    }

    if (!context) {
      return {
        success: false,
        error: '没有可用的数据上下文'
      };
    }

    try {
      // 预处理表达式
      const cleanExpression = this.preprocessExpression(expression);
      
      // 获取或编译表达式
      const compiled = this.getCompiledExpression(cleanExpression);
      
      // 执行求值
      const result = await this.executeCompiledExpression(compiled, context);
      
      return {
        success: true,
        value: result.value,
        type: this.inferValueType(result.value)
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 表达式验证 - 静态分析
   */
  validateExpression(expression: string, context: DataContext | null): {
    valid: boolean;
    error?: string;
    suggestions?: string[];
    warnings?: string[];
  } {
    if (!expression || !expression.trim()) {
      return {
        valid: false,
        error: '表达式不能为空'
      };
    }

    try {
      const cleanExpression = this.preprocessExpression(expression);
      const compiled = this.compileExpression(cleanExpression);
      
      // 静态验证
      const validationResult = this.staticValidation(compiled, context);
      
      return validationResult;
      
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : '表达式格式错误'
      };
    }
  }

  /**
   * 获取字段建议 - 自动完成支持
   */
  getFieldSuggestions(
    partialExpression: string, 
    context: DataContext | null
  ): string[] {
    if (!context) return [];

    const partial = partialExpression.toLowerCase().replace(/[{}]/g, '');
    const suggestions: string[] = [];

    // 直接字段匹配
    context.fields.forEach(field => {
      if (field.name.toLowerCase().includes(partial)) {
        suggestions.push(`{${field.name}}`);
      }
      
      // 显示名称匹配
      if (field.displayName && field.displayName.toLowerCase().includes(partial)) {
        suggestions.push(`{${field.name}}`);
      }
    });

    // 嵌套字段分析
    if (context.currentRecord.data) {
      const nestedSuggestions = this.getNestedFieldSuggestions(
        partial, 
        context.currentRecord.data, 
        ''
      );
      suggestions.push(...nestedSuggestions);
    }

    // 去重并排序
    return Array.from(new Set(suggestions))
      .sort((a, b) => {
        const aField = a.replace(/[{}]/g, '');
        const bField = b.replace(/[{}]/g, '');
        
        // 精确匹配优先
        if (aField === partial) return -1;
        if (bField === partial) return 1;
        
        // 前缀匹配优先
        if (aField.startsWith(partial)) return -1;
        if (bField.startsWith(partial)) return 1;
        
        // 字母序排序
        return aField.localeCompare(bField);
      })
      .slice(0, 20); // 限制建议数量
  }

  /**
   * 预处理表达式
   */
  private preprocessExpression(expression: string): string {
    // 移除首尾空白
    let cleaned = expression.trim();
    
    // 统一大括号格式
    if (!cleaned.startsWith('{') && !cleaned.endsWith('}')) {
      cleaned = `{${cleaned}}`;
    }
    
    // 移除多余的大括号
    cleaned = cleaned.replace(/^\{+/, '{').replace(/\}+$/, '}');
    
    return cleaned;
  }

  /**
   * 获取或编译表达式
   */
  private getCompiledExpression(expression: string): CompiledExpression {
    // 查找缓存
    let compiled = this.expressionCache.get(expression);
    
    if (!compiled) {
      // 编译新表达式
      compiled = this.compileExpression(expression);
      
      // 缓存管理
      if (this.expressionCache.size >= this.maxCacheSize) {
        // LRU淘汰策略
        const firstKey = this.expressionCache.keys().next().value;
        if (firstKey) {
          this.expressionCache.delete(firstKey);
        }
      }
      
      this.expressionCache.set(expression, compiled);
    }
    
    return compiled;
  }

  /**
   * 编译表达式为可执行结构
   */
  private compileExpression(expression: string): CompiledExpression {
    // 移除外层大括号
    const inner = expression.slice(1, -1);
    
    // 解析路径
    const path = this.parsePath(inner);
    
    return {
      original: expression,
      path,
      type: this.determineExpressionType(path)
    };
  }

  /**
   * 解析字段路径
   */
  private parsePath(pathStr: string): PathSegment[] {
    const segments: PathSegment[] = [];
    let current = '';
    let inBracket = false;
    
    for (let i = 0; i < pathStr.length; i++) {
      const char = pathStr[i];
      
      if (char === '[' && !inBracket) {
        // 开始数组索引
        if (current) {
          segments.push({ type: 'field', value: current });
          current = '';
        }
        inBracket = true;
      } else if (char === ']' && inBracket) {
        // 结束数组索引
        const index = parseInt(current, 10);
        if (isNaN(index)) {
          throw new Error(`无效的数组索引: ${current}`);
        }
        segments.push({ type: 'index', value: index });
        current = '';
        inBracket = false;
      } else if (char === '.' && !inBracket) {
        // 字段分隔符
        if (current) {
          segments.push({ type: 'field', value: current });
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    // 处理最后一个片段
    if (current) {
      if (inBracket) {
        throw new Error('未闭合的数组索引');
      }
      segments.push({ type: 'field', value: current });
    }
    
    if (segments.length === 0) {
      throw new Error('空的字段路径');
    }
    
    return segments;
  }

  /**
   * 执行编译后的表达式
   */
  private async executeCompiledExpression(
    compiled: CompiledExpression, 
    context: DataContext
  ): Promise<{ value: any }> {
    let current: any = context.currentRecord.data;
    
    for (const segment of compiled.path) {
      if (current === null || current === undefined) {
        throw new Error(`无法访问 null/undefined 值的属性`);
      }
      
      if (segment.type === 'field') {
        if (typeof current !== 'object') {
          throw new Error(`尝试访问非对象类型的字段: ${segment.value}`);
        }
        
        if (!(segment.value in current)) {
          throw new Error(`字段不存在: ${segment.value}`);
        }
        
        current = current[segment.value];
        
      } else if (segment.type === 'index') {
        if (!Array.isArray(current)) {
          throw new Error(`尝试对非数组类型使用索引访问`);
        }
        
        const index = segment.value as number;
        if (index < 0 || index >= current.length) {
          throw new Error(`数组索引超出范围: ${index}`);
        }
        
        current = current[index];
      }
    }
    
    return { value: current };
  }

  /**
   * 静态验证
   */
  private staticValidation(
    compiled: CompiledExpression, 
    context: DataContext | null
  ): {
    valid: boolean;
    error?: string;
    suggestions?: string[];
    warnings?: string[];
  } {
    if (!context) {
      return {
        valid: true,
        warnings: ['没有数据上下文，无法验证字段是否存在']
      };
    }

    const warnings: string[] = [];

    // 检查第一个字段是否存在
    const firstSegment = compiled.path[0];
    if (firstSegment && firstSegment.type === 'field') {
      const fieldName = firstSegment.value as string;
      const fieldExists = context.fields.some(field => field.name === fieldName);
      
      if (!fieldExists) {
        // 查找相似字段
        const similarFields = context.fields
          .filter(field => 
            field.name.toLowerCase().includes(fieldName.toLowerCase()) ||
            this.levenshteinDistance(field.name.toLowerCase(), fieldName.toLowerCase()) <= 2
          )
          .map(field => `{${field.name}}`)
          .slice(0, 5);
        
        return {
          valid: false,
          error: `字段不存在: ${fieldName}`,
          suggestions: similarFields
        };
      }
    }

    // 检查路径复杂性
    if (compiled.path.length > 5) {
      warnings.push('表达式路径过深，可能影响性能');
    }

    const result: any = { valid: true };
    if (warnings.length > 0) {
      result.warnings = warnings;
    }
    return result;
  }

  /**
   * 获取嵌套字段建议
   */
  private getNestedFieldSuggestions(
    partial: string, 
    obj: any, 
    prefix: string
  ): string[] {
    const suggestions: string[] = [];
    
    if (!obj || typeof obj !== 'object') return suggestions;
    
    for (const key of Object.keys(obj)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      
      if (fullPath.toLowerCase().includes(partial)) {
        suggestions.push(`{${fullPath}}`);
      }
      
      // 递归检查嵌套对象（限制深度避免无限递归）
      if (prefix.split('.').length < 3 && obj[key] && typeof obj[key] === 'object') {
        suggestions.push(...this.getNestedFieldSuggestions(partial, obj[key], fullPath));
      }
    }
    
    return suggestions;
  }

  /**
   * 推断值类型
   */
  private inferValueType(value: any): 'string' | 'number' | 'boolean' | 'date' | 'object' {
    if (value === null || value === undefined) return 'object';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (typeof value === 'object') return 'object';
    return 'string';
  }

  /**
   * 确定表达式类型
   */
  private determineExpressionType(path: PathSegment[]): 'simple' | 'nested' | 'complex' {
    if (path.length === 1) return 'simple';
    if (path.length <= 3 && path.every(seg => seg.type === 'field')) return 'nested';
    return 'complex';
  }

  /**
   * 计算字符串编辑距离（用于模糊匹配）
   */
  private levenshteinDistance(str1: string, str2: string): number {
    if (str1.length === 0) return str2.length;
    if (str2.length === 0) return str1.length;
    
    const matrix = new Array(str2.length + 1);
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = new Array(str1.length + 1);
      matrix[i][0] = i;
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        const cost = str1[j - 1] === str2[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.expressionCache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    return {
      size: this.expressionCache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0 // 可以添加hit/miss统计
    };
  }
}

// 内部类型定义
interface CompiledExpression {
  original: string;
  path: PathSegment[];
  type: 'simple' | 'nested' | 'complex';
}

interface PathSegment {
  type: 'field' | 'index';
  value: string | number;
}

// 创建全局表达式引擎实例
export const expressionEngine = new ExpressionEngine();