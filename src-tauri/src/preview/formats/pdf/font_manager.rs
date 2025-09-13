use crate::preview::{PreviewError, PreviewResult};
use std::collections::HashMap;
use printpdf::*;

/// PDF字体管理器
pub struct FontManager {
    font_cache: HashMap<String, IndirectFontRef>,
    builtin_fonts: HashMap<String, BuiltinFont>,
}

impl FontManager {
    pub fn new() -> Self {
        let mut builtin_fonts = HashMap::new();
        
        // 添加内置字体映射
        builtin_fonts.insert("Arial".to_string(), BuiltinFont::Helvetica);
        builtin_fonts.insert("Helvetica".to_string(), BuiltinFont::Helvetica);
        builtin_fonts.insert("Times".to_string(), BuiltinFont::TimesRoman);
        builtin_fonts.insert("Times New Roman".to_string(), BuiltinFont::TimesRoman);
        builtin_fonts.insert("Courier".to_string(), BuiltinFont::Courier);
        builtin_fonts.insert("Courier New".to_string(), BuiltinFont::Courier);
        
        Self {
            font_cache: HashMap::new(),
            builtin_fonts,
        }
    }

    /// 获取或创建字体引用
    pub fn get_font(
        &mut self,
        doc: &PdfDocumentReference,
        font_family: &str,
        font_weight: &str,
    ) -> PreviewResult<IndirectFontRef> {
        let font_key = format!("{}:{}", font_family, font_weight);
        
        if let Some(font_ref) = self.font_cache.get(&font_key) {
            return Ok(font_ref.clone());
        }

        // 尝试使用内置字体
        let builtin_font = self.resolve_builtin_font(font_family, font_weight);
        let font_ref = doc.add_builtin_font(builtin_font)
            .map_err(|e| PreviewError::FontError {
                message: format!("Failed to add builtin font: {}", e),
            })?;

        self.font_cache.insert(font_key, font_ref.clone());
        Ok(font_ref)
    }

    /// 解析内置字体
    fn resolve_builtin_font(&self, font_family: &str, font_weight: &str) -> BuiltinFont {
        let base_font = self.builtin_fonts
            .get(font_family)
            .copied()
            .unwrap_or(BuiltinFont::Helvetica);

        // 根据字重选择字体变体
        match (base_font, font_weight) {
            (BuiltinFont::Helvetica, weight) if weight.contains("bold") => BuiltinFont::HelveticaBold,
            (BuiltinFont::TimesRoman, weight) if weight.contains("bold") => BuiltinFont::TimesBold,
            (BuiltinFont::Courier, weight) if weight.contains("bold") => BuiltinFont::CourierBold,
            _ => base_font,
        }
    }

    /// 计算文本宽度（近似）
    pub fn calculate_text_width(
        &self,
        text: &str,
        font_size: f64,
        _font_family: &str,
    ) -> f64 {
        // 简化的文本宽度计算
        // 实际项目中可能需要更精确的字体度量
        let avg_char_width = font_size * 0.6; // 近似值
        text.len() as f64 * avg_char_width
    }

    /// 清理字体缓存
    pub fn clear_cache(&mut self) {
        self.font_cache.clear();
    }
}