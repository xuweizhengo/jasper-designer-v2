// 数据源层模块根文件
pub mod types;
pub mod registry;
pub mod providers;
pub mod storage;
pub mod commands;
pub mod utils;
pub mod database_simple;

// 重新导出核心类型
pub use types::*;
pub use registry::*;
pub use providers::*;

// === 统一的状态管理类型定义 ===
// 防止main.rs和commands.rs之间的类型不匹配

use tokio::sync::Mutex;

/// 数据源注册表的管理状态类型
/// 在main.rs中用于.manage()，在commands.rs中用于State<>
pub type ManagedDataRegistry = Mutex<DataSourceRegistry>;

// 类型断言确保兼容性
#[cfg(debug_assertions)]
const _: fn() = || {
    fn _assert_state_compatible() {
        use tauri::State;
        fn _test_state(_: State<ManagedDataRegistry>) {}
        fn _test_manage(_: ManagedDataRegistry) {}
    }
};