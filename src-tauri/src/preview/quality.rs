use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 质量设置和预设
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualitySettings {
    pub dpi: u32,
    pub compression: f32,
    pub anti_aliasing: bool,
    pub font_hinting: bool,
    pub color_accuracy: ColorAccuracy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ColorAccuracy {
    Fast,
    Accurate,
    Professional,
}

impl Default for QualitySettings {
    fn default() -> Self {
        Self {
            dpi: 300,
            compression: 0.9,
            anti_aliasing: true,
            font_hinting: true,
            color_accuracy: ColorAccuracy::Accurate,
        }
    }
}

/// 质量预设管理器
pub struct QualityPresets {
    presets: HashMap<String, QualitySettings>,
}

impl QualityPresets {
    pub fn new() -> Self {
        let mut presets = HashMap::new();
        
        // 草稿质量 - 快速预览
        presets.insert("draft".to_string(), QualitySettings {
            dpi: 96,
            compression: 0.7,
            anti_aliasing: false,
            font_hinting: false,
            color_accuracy: ColorAccuracy::Fast,
        });
        
        // 标准质量
        presets.insert("standard".to_string(), QualitySettings {
            dpi: 150,
            compression: 0.8,
            anti_aliasing: true,
            font_hinting: true,
            color_accuracy: ColorAccuracy::Accurate,
        });
        
        // 高质量
        presets.insert("high".to_string(), QualitySettings {
            dpi: 300,
            compression: 0.9,
            anti_aliasing: true,
            font_hinting: true,
            color_accuracy: ColorAccuracy::Accurate,
        });
        
        // 印刷质量
        presets.insert("print".to_string(), QualitySettings {
            dpi: 600,
            compression: 0.95,
            anti_aliasing: true,
            font_hinting: true,
            color_accuracy: ColorAccuracy::Professional,
        });
        
        Self { presets }
    }
    
    pub fn get(&self, name: &str) -> Option<&QualitySettings> {
        self.presets.get(name)
    }
    
    pub fn get_all(&self) -> &HashMap<String, QualitySettings> {
        &self.presets
    }
}