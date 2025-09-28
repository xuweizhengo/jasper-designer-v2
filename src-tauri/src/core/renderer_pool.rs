use std::sync::Arc;
use tokio::sync::{Mutex, Semaphore};
use tokio::time::{timeout, Duration};
use super::errors::{PoolError, PoolResult};
use super::renderer_trait::{Renderer, RendererFactory, RendererConfig};

/// 渲染器池配置
#[derive(Debug, Clone)]
pub struct PoolConfig {
    /// 池的最小大小
    pub min_size: usize,
    /// 池的最大大小
    pub max_size: usize,
    /// 创建渲染器的超时时间（秒）
    pub create_timeout_seconds: u64,
    /// 借用渲染器的超时时间（秒）
    pub checkout_timeout_seconds: u64,
    /// 空闲渲染器的最大存活时间（秒）
    pub idle_timeout_seconds: u64,
    /// 是否在启动时预创建渲染器
    pub pre_create: bool,
}

impl Default for PoolConfig {
    fn default() -> Self {
        Self {
            min_size: 1,
            max_size: 4,
            create_timeout_seconds: 10,
            checkout_timeout_seconds: 30,
            idle_timeout_seconds: 300,
            pre_create: true,
        }
    }
}

/// 池化的渲染器包装
struct PooledRenderer<R: Renderer> {
    renderer: R,
    created_at: std::time::Instant,
    last_used: std::time::Instant,
    use_count: usize,
}

impl<R: Renderer> PooledRenderer<R> {
    fn new(renderer: R) -> Self {
        let now = std::time::Instant::now();
        Self {
            renderer,
            created_at: now,
            last_used: now,
            use_count: 0,
        }
    }

    fn checkout(&mut self) {
        self.last_used = std::time::Instant::now();
        self.use_count += 1;
    }

    fn is_expired(&self, idle_timeout: Duration) -> bool {
        self.last_used.elapsed() > idle_timeout
    }
}

/// 渲染器池
pub struct RendererPool<F: RendererFactory> {
    factory: Arc<F>,
    config: PoolConfig,
    renderers: Arc<Mutex<Vec<PooledRenderer<F::Renderer>>>>,
    semaphore: Arc<Semaphore>,
    shutdown: Arc<Mutex<bool>>,
}

impl<F: RendererFactory> RendererPool<F> {
    /// 创建新的渲染器池
    pub async fn new(factory: F, config: PoolConfig) -> PoolResult<Self> {
        let pool = Self {
            factory: Arc::new(factory),
            config: config.clone(),
            renderers: Arc::new(Mutex::new(Vec::with_capacity(config.max_size))),
            semaphore: Arc::new(Semaphore::new(config.max_size)),
            shutdown: Arc::new(Mutex::new(false)),
        };

        // 预创建渲染器
        if config.pre_create {
            pool.pre_create_renderers().await?;
        }

        // 启动清理任务
        pool.start_cleanup_task();

        Ok(pool)
    }

    /// 预创建渲染器
    async fn pre_create_renderers(&self) -> PoolResult<()> {
        let mut renderers = self.renderers.lock().await;

        for _ in 0..self.config.min_size {
            let renderer = self.create_renderer_with_timeout().await?;
            renderers.push(PooledRenderer::new(renderer));
        }

        Ok(())
    }

    /// 创建带超时的渲染器
    async fn create_renderer_with_timeout(&self) -> PoolResult<F::Renderer> {
        let factory = self.factory.clone();
        let config = RendererConfig::default();

        match timeout(
            Duration::from_secs(self.config.create_timeout_seconds),
            tokio::task::spawn_blocking(move || factory.create_with_config(config))
        ).await {
            Ok(Ok(Ok(renderer))) => Ok(renderer),
            Ok(Ok(Err(e))) => Err(PoolError::CreateFailed {
                reason: e.to_string()
            }),
            Ok(Err(e)) => Err(PoolError::CreateFailed {
                reason: format!("Task join error: {}", e)
            }),
            Err(_) => Err(PoolError::CheckoutTimeout {
                seconds: self.config.create_timeout_seconds
            }),
        }
    }

    /// 借用渲染器
    pub async fn checkout(&self) -> PoolResult<RendererGuard<F>> {
        // 检查是否已关闭
        if *self.shutdown.lock().await {
            return Err(PoolError::PoolShutdown);
        }

        // 获取许可
        let permit = match timeout(
            Duration::from_secs(self.config.checkout_timeout_seconds),
            self.semaphore.acquire()
        ).await {
            Ok(Ok(permit)) => permit,
            Ok(Err(_)) => return Err(PoolError::PoolEmpty),
            Err(_) => return Err(PoolError::CheckoutTimeout {
                seconds: self.config.checkout_timeout_seconds
            }),
        };

        // 尝试从池中获取渲染器
        let mut renderers = self.renderers.lock().await;

        if let Some(mut pooled) = renderers.pop() {
            pooled.checkout();
            drop(renderers);

            Ok(RendererGuard {
                renderer: Some(pooled.renderer),
                pool: self,
                _permit: permit,
            })
        } else {
            drop(renderers);

            // 创建新渲染器
            let renderer = self.create_renderer_with_timeout().await?;

            Ok(RendererGuard {
                renderer: Some(renderer),
                pool: self,
                _permit: permit,
            })
        }
    }

    /// 归还渲染器
    async fn checkin(&self, renderer: F::Renderer) {
        let mut renderers = self.renderers.lock().await;

        // 只有在池未满且未关闭时才归还
        if renderers.len() < self.config.max_size && !*self.shutdown.lock().await {
            renderers.push(PooledRenderer::new(renderer));
        }
    }

    /// 启动清理任务
    fn start_cleanup_task(&self) {
        let renderers = self.renderers.clone();
        let shutdown = self.shutdown.clone();
        let idle_timeout = Duration::from_secs(self.config.idle_timeout_seconds);
        let min_size = self.config.min_size;

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(60));

            loop {
                interval.tick().await;

                // 检查是否关闭
                if *shutdown.lock().await {
                    break;
                }

                // 清理过期的渲染器
                let mut renderers = renderers.lock().await;
                let original_len = renderers.len();

                // 保留未过期的渲染器，但至少保留min_size个
                renderers.retain(|pooled| {
                    if renderers.len() > min_size {
                        !pooled.is_expired(idle_timeout)
                    } else {
                        true
                    }
                });

                let removed = original_len - renderers.len();
                if removed > 0 {
                    log::debug!("Cleaned up {} expired renderers", removed);
                }
            }
        });
    }

    /// 关闭渲染器池
    pub async fn shutdown(&self) {
        *self.shutdown.lock().await = true;
        self.renderers.lock().await.clear();
    }

    /// 获取池的统计信息
    pub async fn stats(&self) -> PoolStats {
        let renderers = self.renderers.lock().await;

        PoolStats {
            available: renderers.len(),
            in_use: self.config.max_size - self.semaphore.available_permits(),
            total_created: renderers.iter().map(|r| r.use_count).sum(),
        }
    }
}

/// 渲染器守卫，用于自动归还
pub struct RendererGuard<'a, F: RendererFactory> {
    renderer: Option<F::Renderer>,
    pool: &'a RendererPool<F>,
    _permit: tokio::sync::OwnedSemaphorePermit,
}

impl<'a, F: RendererFactory> RendererGuard<'a, F> {
    /// 获取渲染器引用
    pub fn get(&self) -> &F::Renderer {
        self.renderer.as_ref().expect("Renderer already taken")
    }

    /// 获取可变渲染器引用
    pub fn get_mut(&mut self) -> &mut F::Renderer {
        self.renderer.as_mut().expect("Renderer already taken")
    }
}

impl<'a, F: RendererFactory> Drop for RendererGuard<'a, F> {
    fn drop(&mut self) {
        if let Some(renderer) = self.renderer.take() {
            let pool = self.pool;
            tokio::spawn(async move {
                pool.checkin(renderer).await;
            });
        }
    }
}

impl<'a, F: RendererFactory> std::ops::Deref for RendererGuard<'a, F> {
    type Target = F::Renderer;

    fn deref(&self) -> &Self::Target {
        self.get()
    }
}

impl<'a, F: RendererFactory> std::ops::DerefMut for RendererGuard<'a, F> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        self.get_mut()
    }
}

/// 池统计信息
#[derive(Debug, Clone)]
pub struct PoolStats {
    pub available: usize,
    pub in_use: usize,
    pub total_created: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::models::{Element, ElementId, ElementType, Geometry, Rectangle, Style, Metadata};
    use crate::core::renderer_trait::{RenderOutput, RenderContext};
    use async_trait::async_trait;

    // 测试用的模拟渲染器
    struct MockRenderer {
        id: usize,
    }

    #[async_trait]
    impl Renderer for MockRenderer {
        type Error = std::io::Error;

        fn capabilities(&self) -> crate::core::renderer_trait::RendererCapabilities {
            unimplemented!()
        }

        fn validate(&self, _element: &Element) -> ValidationResult {
            unimplemented!()
        }

        async fn render(
            &self,
            _element: &Element,
            _context: &RenderContext,
        ) -> Result<RenderOutput, Self::Error> {
            Ok(RenderOutput::Image(vec![self.id as u8]))
        }

        async fn export(
            &self,
            _element: &Element,
            _options: &ExportOptions,
        ) -> Result<ExportResult, Self::Error> {
            unimplemented!()
        }
    }

    struct MockFactory {
        next_id: Arc<Mutex<usize>>,
    }

    impl MockFactory {
        fn new() -> Self {
            Self {
                next_id: Arc::new(Mutex::new(0)),
            }
        }
    }

    impl RendererFactory for MockFactory {
        type Renderer = MockRenderer;

        fn create(&self) -> Result<Self::Renderer, Box<dyn std::error::Error + Send + Sync>> {
            let mut id = self.next_id.blocking_lock();
            let renderer = MockRenderer { id: *id };
            *id += 1;
            Ok(renderer)
        }

        fn create_with_config(
            &self,
            _config: RendererConfig,
        ) -> Result<Self::Renderer, Box<dyn std::error::Error + Send + Sync>> {
            self.create()
        }
    }

    #[tokio::test]
    async fn test_pool_creation() {
        let factory = MockFactory::new();
        let config = PoolConfig {
            min_size: 2,
            max_size: 4,
            pre_create: true,
            ..Default::default()
        };

        let pool = RendererPool::new(factory, config).await.unwrap();
        let stats = pool.stats().await;

        assert_eq!(stats.available, 2);
        assert_eq!(stats.in_use, 0);
    }

    #[tokio::test]
    async fn test_pool_checkout_checkin() {
        let factory = MockFactory::new();
        let config = PoolConfig {
            min_size: 1,
            max_size: 2,
            pre_create: true,
            ..Default::default()
        };

        let pool = RendererPool::new(factory, config).await.unwrap();

        // Checkout renderer
        {
            let _guard = pool.checkout().await.unwrap();
            let stats = pool.stats().await;
            assert_eq!(stats.in_use, 1);
        }

        // Renderer should be returned
        tokio::time::sleep(Duration::from_millis(100)).await;
        let stats = pool.stats().await;
        assert_eq!(stats.in_use, 0);
    }
}