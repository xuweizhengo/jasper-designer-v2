use std::collections::HashMap;
use crate::types::preview_types::RenderResult;

/// 渲染缓存系统
pub struct RenderCache {
    // 简单的内存缓存实现
    svg_cache: HashMap<String, String>,
    output_cache: HashMap<String, Vec<u8>>,
    result_cache: HashMap<String, RenderResult>,
    max_size: usize,
}

impl RenderCache {
    pub fn new() -> Self {
        Self {
            svg_cache: HashMap::new(),
            output_cache: HashMap::new(),
            result_cache: HashMap::new(),
            max_size: 100, // 最多缓存100个条目
        }
    }

    pub fn get_svg(&self, key: &str) -> Option<&String> {
        self.svg_cache.get(key)
    }

    pub fn put_svg(&mut self, key: String, value: String) {
        if self.svg_cache.len() >= self.max_size {
            // 简单的清理策略：清空缓存
            self.svg_cache.clear();
        }
        self.svg_cache.insert(key, value);
    }

    pub fn get_output(&self, key: &str) -> Option<&Vec<u8>> {
        self.output_cache.get(key)
    }

    pub fn put_output(&mut self, key: String, value: Vec<u8>) {
        if self.output_cache.len() >= self.max_size {
            // 简单的清理策略：清空缓存
            self.output_cache.clear();
        }
        self.output_cache.insert(key, value);
    }

    pub fn clear(&mut self) {
        self.svg_cache.clear();
        self.output_cache.clear();
        self.result_cache.clear();
    }
    
    // Generic cache methods for RenderResult
    pub fn get(&self, key: &str) -> Option<&RenderResult> {
        self.result_cache.get(key)
    }
    
    pub fn insert(&mut self, key: String, value: RenderResult) {
        if self.result_cache.len() >= self.max_size {
            self.result_cache.clear();
        }
        self.result_cache.insert(key, value);
    }
    
    pub fn estimated_size_mb(&self) -> f64 {
        // Rough estimation of cache size in MB
        let svg_size: usize = self.svg_cache.values().map(|v| v.len()).sum();
        let output_size: usize = self.output_cache.values().map(|v| v.len()).sum();
        let result_size = self.result_cache.len() * 1024; // Rough estimate
        
        (svg_size + output_size + result_size) as f64 / (1024.0 * 1024.0)
    }

    pub fn stats(&self) -> CacheStats {
        CacheStats {
            svg_entries: self.svg_cache.len(),
            output_entries: self.output_cache.len(),
            total_entries: self.svg_cache.len() + self.output_cache.len(),
        }
    }
}

#[derive(Debug)]
pub struct CacheStats {
    pub svg_entries: usize,
    pub output_entries: usize,
    pub total_entries: usize,
}