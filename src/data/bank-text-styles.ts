/**
 * 银行专用样式预设库 - 符合金融行业标准
 * 
 * 这些预设样式专门为银行业务文档设计，包含：
 * - 机构名称、账号显示、金额显示等核心样式
 * - 符合金融行业规范的字体、颜色、间距设置
 * - 专业的排版效果和视觉层次
 */

import { TextStyleDefinition } from '../types/professional-text-types';

export const BANK_TEXT_STYLES: TextStyleDefinition[] = [
  {
    id: 'bank-institution-name',
    name: '机构名称',
    description: '银行机构全称，用于文档顶部标题',
    category: 'bank-special',
    style: {
      font_family: 'SimSun',
      font_size: 18,
      font_weight: 'bold',
      color: '#000000',
      align: 'Center',
      typography: {
        letterSpacing: 1.0,        // 增加字间距，提升正式感
        lineHeight: 1.4,           // 适中行高
        paragraphSpacing: 20,      // 较大段落间距
        textIndent: 0,
        decoration: {
          underline: false,
          strikethrough: false,
          overline: false,
          decorationStyle: 'solid'
        },
        textTransform: 'none'
      },
      fills: [{ 
        type: 'solid', 
        enabled: true, 
        opacity: 1, 
        solid: { color: '#000000' } 
      }],
      effects: [],
      banking: {
        formatType: 'text'
      }
    },
    metadata: {
      createdAt: new Date('2025-08-19'),
      lastModified: new Date('2025-08-19'),
      author: 'system',
      usageCount: 0,
      isSystemStyle: true,
      tags: ['bank', 'title', 'institution']
    }
  },
  
  {
    id: 'bank-account-number',
    name: '账号显示',
    description: '银行账号、卡号等标识性数字',
    category: 'bank-special',
    style: {
      font_family: 'Courier New',   // 等宽字体，便于对齐
      font_size: 14,
      font_weight: 'normal',
      color: '#000000',
      align: 'Center',
      typography: {
        letterSpacing: 2.0,        // 较大字间距，便于识别
        lineHeight: 1.3,
        paragraphSpacing: 12,
        textIndent: 0,
        decoration: {
          underline: true,         // 下划线强调
          strikethrough: false,
          overline: false,
          decorationStyle: 'solid',
          decorationColor: '#666666'
        }
      },
      fills: [{ 
        type: 'solid', 
        enabled: true, 
        opacity: 1, 
        solid: { color: '#000000' } 
      }],
      effects: [],
      banking: {
        formatType: 'text'
      }
    },
    metadata: {
      createdAt: new Date('2025-08-19'),
      lastModified: new Date('2025-08-19'),
      author: 'system',
      usageCount: 0,
      isSystemStyle: true,
      tags: ['bank', 'account', 'number']
    }
  },
  
  {
    id: 'bank-amount-primary',
    name: '主要金额',
    description: '重要金额显示，如总额、余额等',
    category: 'bank-special',
    style: {
      font_family: 'Arial',
      font_size: 16,
      font_weight: '600',
      color: '#000000',
      align: 'Right',
      typography: {
        letterSpacing: 0.8,        // 适度字间距，保持紧凑
        lineHeight: 1.2,
        paragraphSpacing: 16,
        textIndent: 0,
        decoration: {
          underline: false,
          strikethrough: false,
          overline: false,
          decorationStyle: 'solid'
        }
      },
      fills: [{ 
        type: 'solid', 
        enabled: true, 
        opacity: 1, 
        solid: { color: '#000000' } 
      }],
      effects: [],
      banking: {
        formatType: 'currency',
        locale: 'zh-CN',
        precision: 2,
        currencySymbol: '¥'
      }
    },
    metadata: {
      createdAt: new Date('2025-08-19'),
      lastModified: new Date('2025-08-19'),
      author: 'system',
      usageCount: 0,
      isSystemStyle: true,
      tags: ['bank', 'amount', 'currency', 'primary']
    }
  },
  
  {
    id: 'bank-amount-secondary',
    name: '次要金额',
    description: '明细金额、小计等辅助金额',
    category: 'bank-special',
    style: {
      font_family: 'Arial',
      font_size: 12,
      font_weight: 'normal',
      color: '#666666',
      align: 'Right',
      typography: {
        letterSpacing: 0.5,
        lineHeight: 1.2,
        paragraphSpacing: 8,
        textIndent: 0,
        decoration: {
          underline: false,
          strikethrough: false,
          overline: false,
          decorationStyle: 'solid'
        }
      },
      fills: [{ 
        type: 'solid', 
        enabled: true, 
        opacity: 1, 
        solid: { color: '#666666' } 
      }],
      effects: [],
      banking: {
        formatType: 'currency',
        locale: 'zh-CN',
        precision: 2,
        currencySymbol: '¥'
      }
    },
    metadata: {
      createdAt: new Date('2025-08-19'),
      lastModified: new Date('2025-08-19'),
      author: 'system',
      usageCount: 0,
      isSystemStyle: true,
      tags: ['bank', 'amount', 'currency', 'secondary']
    }
  },
  
  {
    id: 'bank-field-label',
    name: '字段标签',
    description: '数据字段的标识文字，如"客户姓名："',
    category: 'bank-special',
    style: {
      font_family: 'Microsoft YaHei',
      font_size: 11,
      font_weight: 'normal',
      color: '#666666',
      align: 'Left',
      typography: {
        letterSpacing: 0,
        lineHeight: 1.4,
        paragraphSpacing: 6,
        textIndent: 0,
        decoration: {
          underline: false,
          strikethrough: false,
          overline: false,
          decorationStyle: 'solid'
        }
      },
      fills: [{ 
        type: 'solid', 
        enabled: true, 
        opacity: 1, 
        solid: { color: '#666666' } 
      }],
      effects: [],
      banking: {
        formatType: 'text'
      }
    },
    metadata: {
      createdAt: new Date('2025-08-19'),
      lastModified: new Date('2025-08-19'),
      author: 'system',
      usageCount: 0,
      isSystemStyle: true,
      tags: ['bank', 'label', 'field']
    }
  },
  
  {
    id: 'bank-date-standard',
    name: '标准日期',
    description: '标准日期格式显示',
    category: 'bank-special',
    style: {
      font_family: 'SimSun',
      font_size: 12,
      font_weight: 'normal',
      color: '#000000',
      align: 'Center',
      typography: {
        letterSpacing: 0.3,
        lineHeight: 1.3,
        paragraphSpacing: 8,
        textIndent: 0,
        decoration: {
          underline: false,
          strikethrough: false,
          overline: false,
          decorationStyle: 'solid'
        }
      },
      fills: [{ 
        type: 'solid', 
        enabled: true, 
        opacity: 1, 
        solid: { color: '#000000' } 
      }],
      effects: [],
      banking: {
        formatType: 'date',
        locale: 'zh-CN'
      }
    },
    metadata: {
      createdAt: new Date('2025-08-19'),
      lastModified: new Date('2025-08-19'),
      author: 'system',
      usageCount: 0,
      isSystemStyle: true,
      tags: ['bank', 'date', 'time']
    }
  },
  
  {
    id: 'bank-important-notice',
    name: '重要提示',
    description: '需要特别注意的重要信息，如风险提示等',
    category: 'bank-special',
    style: {
      font_family: 'Microsoft YaHei',
      font_size: 12,
      font_weight: 'bold',
      color: '#dc2626',
      align: 'Center',
      typography: {
        letterSpacing: 0.5,
        lineHeight: 1.5,
        paragraphSpacing: 16,
        textIndent: 0,
        decoration: {
          underline: false,
          strikethrough: false,
          overline: false,
          decorationStyle: 'solid'
        }
      },
      fills: [{ 
        type: 'solid', 
        enabled: true, 
        opacity: 1, 
        solid: { color: '#dc2626' } 
      }],
      effects: [
        {
          type: 'drop-shadow',
          enabled: true,
          dropShadow: {
            offsetX: 0,
            offsetY: 2,
            blur: 4,
            spread: 0,
            color: '#dc2626',
            opacity: 0.25
          }
        }
      ],
      banking: {
        formatType: 'text'
      }
    },
    metadata: {
      createdAt: new Date('2025-08-19'),
      lastModified: new Date('2025-08-19'),
      author: 'system',
      usageCount: 0,
      isSystemStyle: true,
      tags: ['bank', 'important', 'notice', 'warning']
    }
  },
  
  {
    id: 'bank-signature-line',
    name: '签名区域',
    description: '签名、盖章等操作提示文字',
    category: 'bank-special',
    style: {
      font_family: 'KaiTi',         // 楷体，更正式
      font_size: 10,
      font_weight: 'normal',
      color: '#888888',
      align: 'Right',
      typography: {
        letterSpacing: 0.2,
        lineHeight: 1.5,
        paragraphSpacing: 20,
        textIndent: 0,
        decoration: {
          underline: true,          // 下划线作为签名线
          strikethrough: false,
          overline: false,
          decorationStyle: 'solid',
          decorationColor: '#cccccc'
        }
      },
      fills: [{ 
        type: 'solid', 
        enabled: true, 
        opacity: 1, 
        solid: { color: '#888888' } 
      }],
      effects: [],
      banking: {
        formatType: 'text'
      }
    },
    metadata: {
      createdAt: new Date('2025-08-19'),
      lastModified: new Date('2025-08-19'),
      author: 'system',
      usageCount: 0,
      isSystemStyle: true,
      tags: ['bank', 'signature', 'formal']
    }
  },

  // 添加一些通用的标题和正文样式
  {
    id: 'heading-large',
    name: '大标题',
    description: '文档主标题，适用于重要章节',
    category: 'heading',
    style: {
      font_family: 'Microsoft YaHei',
      font_size: 20,
      font_weight: 'bold',
      color: '#000000',
      align: 'Center',
      typography: {
        letterSpacing: 0.5,
        lineHeight: 1.3,
        paragraphSpacing: 24,
        textIndent: 0,
        decoration: {
          underline: false,
          strikethrough: false,
          overline: false,
          decorationStyle: 'solid'
        }
      },
      fills: [{ 
        type: 'solid', 
        enabled: true, 
        opacity: 1, 
        solid: { color: '#000000' } 
      }],
      effects: []
    },
    metadata: {
      createdAt: new Date('2025-08-19'),
      lastModified: new Date('2025-08-19'),
      author: 'system',
      usageCount: 0,
      isSystemStyle: true,
      tags: ['heading', 'title', 'large']
    }
  },

  {
    id: 'heading-medium',
    name: '中标题',
    description: '次级标题，适用于小节标题',
    category: 'heading',
    style: {
      font_family: 'Microsoft YaHei',
      font_size: 16,
      font_weight: '600',
      color: '#000000',
      align: 'Left',
      typography: {
        letterSpacing: 0.3,
        lineHeight: 1.4,
        paragraphSpacing: 16,
        textIndent: 0,
        decoration: {
          underline: false,
          strikethrough: false,
          overline: false,
          decorationStyle: 'solid'
        }
      },
      fills: [{ 
        type: 'solid', 
        enabled: true, 
        opacity: 1, 
        solid: { color: '#000000' } 
      }],
      effects: []
    },
    metadata: {
      createdAt: new Date('2025-08-19'),
      lastModified: new Date('2025-08-19'),
      author: 'system',
      usageCount: 0,
      isSystemStyle: true,
      tags: ['heading', 'subtitle', 'medium']
    }
  },

  {
    id: 'body-regular',
    name: '正文文本',
    description: '标准正文内容，适用于大部分文字',
    category: 'body',
    style: {
      font_family: 'Microsoft YaHei',
      font_size: 14,
      font_weight: 'normal',
      color: '#000000',
      align: 'Left',
      typography: {
        letterSpacing: 0,
        lineHeight: 1.6,
        paragraphSpacing: 12,
        textIndent: 0,
        decoration: {
          underline: false,
          strikethrough: false,
          overline: false,
          decorationStyle: 'solid'
        }
      },
      fills: [{ 
        type: 'solid', 
        enabled: true, 
        opacity: 1, 
        solid: { color: '#000000' } 
      }],
      effects: []
    },
    metadata: {
      createdAt: new Date('2025-08-19'),
      lastModified: new Date('2025-08-19'),
      author: 'system',
      usageCount: 0,
      isSystemStyle: true,
      tags: ['body', 'text', 'regular']
    }
  },

  {
    id: 'caption-small',
    name: '说明文字',
    description: '小号说明文字，适用于注释和补充信息',
    category: 'caption',
    style: {
      font_family: 'Microsoft YaHei',
      font_size: 11,
      font_weight: 'normal',
      color: '#666666',
      align: 'Left',
      typography: {
        letterSpacing: 0,
        lineHeight: 1.4,
        paragraphSpacing: 8,
        textIndent: 0,
        decoration: {
          underline: false,
          strikethrough: false,
          overline: false,
          decorationStyle: 'solid'
        }
      },
      fills: [{ 
        type: 'solid', 
        enabled: true, 
        opacity: 1, 
        solid: { color: '#666666' } 
      }],
      effects: []
    },
    metadata: {
      createdAt: new Date('2025-08-19'),
      lastModified: new Date('2025-08-19'),
      author: 'system',
      usageCount: 0,
      isSystemStyle: true,
      tags: ['caption', 'small', 'note']
    }
  }
];

/**
 * 根据分类获取银行预设样式
 */
export function getBankStylesByCategory(category: string) {
  return BANK_TEXT_STYLES.filter(style => style.category === category);
}

/**
 * 获取最常用的银行样式
 */
export function getPopularBankStyles() {
  return [
    'bank-institution-name',
    'bank-amount-primary',
    'bank-account-number',
    'bank-field-label',
    'heading-large',
    'body-regular'
  ].map(id => BANK_TEXT_STYLES.find(style => style.id === id)!);
}