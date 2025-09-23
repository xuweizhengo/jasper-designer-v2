use thiserror::Error;

/// 渲染错误类型
#[derive(Error, Debug)]
pub enum RenderError {
    #[error("Initialization failed: {0}")]
    InitializationError(String),

    #[error("Invalid format: {0}")]
    InvalidFormat(String),

    #[error("Encoding failed: {0}")]
    EncodingError(String),

    #[error("Export failed: {format} - {message}")]
    ExportError {
        format: String,
        message: String,
    },

    #[error("Resource not found: {0}")]
    ResourceNotFound(String),

    #[error("Invalid element: {0}")]
    InvalidElement(String),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Skia error: {0}")]
    SkiaError(String),

    #[error("Office export error: {0}")]
    OfficeExportError(String),

    #[error("Memory error: {0}")]
    MemoryError(String),

    #[error("Unsupported operation: {0}")]
    UnsupportedOperation(String),

    #[error("Generic error: {0}")]
    Generic(String),
}

/// 结果类型别名
pub type RenderResult<T> = Result<T, RenderError>;

/// 错误恢复策略
pub enum ErrorRecovery {
    /// 忽略错误继续执行
    Continue,
    /// 使用默认值
    UseDefault,
    /// 重试操作
    Retry { max_attempts: u32 },
    /// 中止操作
    Abort,
}

/// 错误处理器
pub struct ErrorHandler {
    recovery_strategy: ErrorRecovery,
    error_log: Vec<RenderError>,
}

impl ErrorHandler {
    pub fn new(strategy: ErrorRecovery) -> Self {
        Self {
            recovery_strategy: strategy,
            error_log: Vec::new(),
        }
    }

    /// 处理错误
    pub fn handle_error<T>(&mut self, error: RenderError, default: T) -> Option<T> {
        use super::logger::{log, LogLevel};

        // 记录错误
        log(
            LogLevel::Error,
            "ErrorHandler",
            &format!("{}", error),
        );
        self.error_log.push(error);

        // 根据策略处理
        match &self.recovery_strategy {
            ErrorRecovery::Continue => Some(default),
            ErrorRecovery::UseDefault => Some(default),
            ErrorRecovery::Retry { .. } => {
                // TODO: 实现重试逻辑
                None
            }
            ErrorRecovery::Abort => None,
        }
    }

    /// 获取错误日志
    pub fn get_errors(&self) -> &[RenderError] {
        &self.error_log
    }

    /// 清空错误日志
    pub fn clear_errors(&mut self) {
        self.error_log.clear();
    }

    /// 是否有错误
    pub fn has_errors(&self) -> bool {
        !self.error_log.is_empty()
    }
}

/// 错误上下文
#[macro_export]
macro_rules! with_context {
    ($result:expr, $context:expr) => {
        $result.map_err(|e| {
            $crate::renderer::utils::error::RenderError::Generic(
                format!("{}: {}", $context, e)
            )
        })
    };
}

/// 安全执行宏
#[macro_export]
macro_rules! safe_execute {
    ($expr:expr) => {
        (|| -> Result<_, $crate::renderer::utils::error::RenderError> {
            Ok($expr)
        })()
    };
    ($expr:expr, $default:expr) => {
        (|| -> Result<_, $crate::renderer::utils::error::RenderError> {
            Ok($expr)
        })().unwrap_or($default)
    };
}