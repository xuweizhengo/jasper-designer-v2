use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::preview::{PreviewRenderer, RenderCache, PreviewResult};
use crate::types::preview_types::*;

/// 预览管理器
/// 统一管理预览渲染、缓存、进度跟踪等功能
pub struct PreviewManager {
    renderer: PreviewRenderer,
    cache: Arc<Mutex<RenderCache>>,
    active_tasks: Arc<Mutex<HashMap<String, RenderProgress>>>,
    stats: Arc<Mutex<RenderStats>>,
}

impl PreviewManager {
    pub fn new() -> Self {
        Self {
            renderer: PreviewRenderer::new(),
            cache: Arc::new(Mutex::new(RenderCache::new())),
            active_tasks: Arc::new(Mutex::new(HashMap::new())),
            stats: Arc::new(Mutex::new(RenderStats {
                total_renders: 0,
                cache_hits: 0,
                cache_misses: 0,
                average_render_time_ms: 0.0,
                memory_usage_mb: 0.0,
                error_count: 0,
            })),
        }
    }

    /// 渲染预览
    pub async fn render_preview(&self, request: &PreviewRequest) -> PreviewResult<RenderResult> {
        let start_time = std::time::Instant::now();
        
        // 生成缓存键
        let cache_key = if request.use_cache {
            Some(self.generate_cache_key(request))
        } else {
            None
        };

        // 检查缓存
        if let Some(key) = &cache_key {
            let cache = self.cache.lock().await;
            if let Some(cached_result) = cache.get(key) {
                self.update_stats(true, start_time.elapsed().as_millis() as u64).await;
                return Ok(cached_result.clone());
            }
        }

        // 执行渲染
        let result = match self.renderer.render(
            &request.elements,
            &request.options
        ).await {
            Ok(mut result) => {
                result.metadata.cache_hit = false;
                result
            }
            Err(e) => {
                self.increment_error_count().await;
                return Err(e);
            }
        };

        // 缓存结果
        if let Some(key) = cache_key {
            let mut cache = self.cache.lock().await;
            cache.insert(key, result.clone());
        }

        let render_time = start_time.elapsed().as_millis() as u64;
        self.update_stats(false, render_time).await;

        Ok(result)
    }

    /// 验证渲染选项
    pub async fn validate_options(&self, options: &RenderOptions) -> PreviewResult<()> {
        self.renderer.validate_options(options).await
    }

    /// 获取统计信息
    pub async fn get_stats(&self) -> RenderStats {
        self.stats.lock().await.clone()
    }

    /// 清理缓存
    pub async fn clear_cache(&self) -> PreviewResult<()> {
        let mut cache = self.cache.lock().await;
        cache.clear();
        Ok(())
    }

    /// 获取渲染进度
    pub async fn get_progress(&self, task_id: &str) -> Option<RenderProgress> {
        let tasks = self.active_tasks.lock().await;
        tasks.get(task_id).cloned()
    }

    /// 取消渲染任务
    pub async fn cancel_task(&self, task_id: &str) -> bool {
        let mut tasks = self.active_tasks.lock().await;
        tasks.remove(task_id).is_some()
    }

    /// 生成缓存键
    fn generate_cache_key(&self, request: &PreviewRequest) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        
        // 对关键数据进行哈希
        format!("{:?}", request.elements).hash(&mut hasher);
        format!("{:?}", request.canvas_config).hash(&mut hasher);
        format!("{:?}", request.options).hash(&mut hasher);

        format!("preview_{:x}", hasher.finish())
    }

    /// 更新统计信息
    async fn update_stats(&self, cache_hit: bool, render_time_ms: u64) {
        let mut stats = self.stats.lock().await;
        
        stats.total_renders += 1;
        
        if cache_hit {
            stats.cache_hits += 1;
        } else {
            stats.cache_misses += 1;
        }

        // 更新平均渲染时间
        let total_time = stats.average_render_time_ms * (stats.total_renders - 1) as f64 + render_time_ms as f64;
        stats.average_render_time_ms = total_time / stats.total_renders as f64;

        // 更新内存使用情况（简化估算）
        stats.memory_usage_mb = self.estimate_memory_usage().await as f64;
    }

    /// 增加错误计数
    async fn increment_error_count(&self) {
        let mut stats = self.stats.lock().await;
        stats.error_count += 1;
    }

    /// 估算内存使用量
    async fn estimate_memory_usage(&self) -> f64 {
        let cache = self.cache.lock().await;
        let cache_size_mb = cache.estimated_size_mb();
        
        // 基础内存使用 + 缓存大小
        10.0 + cache_size_mb
    }
}