use chrono::Local;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;
use once_cell::sync::Lazy;

/// 日志级别
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub enum LogLevel {
    Error = 0,
    Warn = 1,
    Info = 2,
    Debug = 3,
    Trace = 4,
}

/// 全局日志器
static LOGGER: Lazy<Mutex<Logger>> = Lazy::new(|| {
    Mutex::new(Logger::new(LogLevel::Info))
});

/// 日志器结构
pub struct Logger {
    level: LogLevel,
    log_file: Option<PathBuf>,
    enable_console: bool,
}

impl Logger {
    /// 创建新的日志器
    pub fn new(level: LogLevel) -> Self {
        Self {
            level,
            log_file: None,
            enable_console: true,
        }
    }

    /// 设置日志文件
    pub fn set_log_file(&mut self, path: PathBuf) {
        self.log_file = Some(path);
    }

    /// 设置日志级别
    pub fn set_level(&mut self, level: LogLevel) {
        self.level = level;
    }

    /// 记录日志
    pub fn log(&self, level: LogLevel, module: &str, message: &str) {
        if level > self.level {
            return;
        }

        let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
        let level_str = match level {
            LogLevel::Error => "ERROR",
            LogLevel::Warn => "WARN ",
            LogLevel::Info => "INFO ",
            LogLevel::Debug => "DEBUG",
            LogLevel::Trace => "TRACE",
        };

        let log_line = format!("[{}] [{}] [{}] {}", timestamp, level_str, module, message);

        // 输出到控制台
        if self.enable_console {
            match level {
                LogLevel::Error => eprintln!("{}", log_line),
                _ => println!("{}", log_line),
            }
        }

        // 写入文件
        if let Some(ref path) = self.log_file {
            if let Ok(mut file) = OpenOptions::new()
                .create(true)
                .append(true)
                .open(path)
            {
                let _ = writeln!(file, "{}", log_line);
            }
        }
    }
}

/// 公共日志宏
#[macro_export]
macro_rules! log_error {
    ($module:expr, $($arg:tt)*) => {
        $crate::renderer::utils::logger::log(
            $crate::renderer::utils::logger::LogLevel::Error,
            $module,
            &format!($($arg)*)
        )
    };
}

#[macro_export]
macro_rules! log_warn {
    ($module:expr, $($arg:tt)*) => {
        $crate::renderer::utils::logger::log(
            $crate::renderer::utils::logger::LogLevel::Warn,
            $module,
            &format!($($arg)*)
        )
    };
}

#[macro_export]
macro_rules! log_info {
    ($module:expr, $($arg:tt)*) => {
        $crate::renderer::utils::logger::log(
            $crate::renderer::utils::logger::LogLevel::Info,
            $module,
            &format!($($arg)*)
        )
    };
}

#[macro_export]
macro_rules! log_debug {
    ($module:expr, $($arg:tt)*) => {
        $crate::renderer::utils::logger::log(
            $crate::renderer::utils::logger::LogLevel::Debug,
            $module,
            &format!($($arg)*)
        )
    };
}

#[macro_export]
macro_rules! log_trace {
    ($module:expr, $($arg:tt)*) => {
        $crate::renderer::utils::logger::log(
            $crate::renderer::utils::logger::LogLevel::Trace,
            $module,
            &format!($($arg)*)
        )
    };
}

/// 公共日志函数
pub fn log(level: LogLevel, module: &str, message: &str) {
    if let Ok(logger) = LOGGER.lock() {
        logger.log(level, module, message);
    }
}

/// 初始化日志系统
pub fn init_logger(level: LogLevel, log_file: Option<PathBuf>) {
    if let Ok(mut logger) = LOGGER.lock() {
        logger.set_level(level);
        if let Some(path) = log_file {
            logger.set_log_file(path);
        }
    }
}

/// 性能计时器
pub struct PerfTimer {
    name: String,
    start: std::time::Instant,
}

impl PerfTimer {
    pub fn new(name: &str) -> Self {
        log_debug!("Performance", "Starting timer: {}", name);
        Self {
            name: name.to_string(),
            start: std::time::Instant::now(),
        }
    }
}

impl Drop for PerfTimer {
    fn drop(&mut self) {
        let elapsed = self.start.elapsed();
        log_info!(
            "Performance",
            "{} completed in {:.3}ms",
            self.name,
            elapsed.as_secs_f64() * 1000.0
        );
    }
}