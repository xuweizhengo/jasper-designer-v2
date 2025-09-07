// === 配置存储抽象接口 ===
use crate::data::types::{DataSourceConfig, RegistryError};
use async_trait::async_trait;
use std::collections::HashMap;
use std::path::PathBuf;
use tokio::sync::RwLock;

/// 配置存储抽象trait
#[async_trait]
pub trait ConfigStorage: Send + Sync {
    /// 保存数据源配置
    async fn save_config(&self, id: &str, config: &DataSourceConfig) -> Result<(), RegistryError>;
    
    /// 加载数据源配置
    async fn load_config(&self, id: &str) -> Result<Option<DataSourceConfig>, RegistryError>;
    
    /// 删除数据源配置
    async fn delete_config(&self, id: &str) -> Result<(), RegistryError>;
    
    /// 列出所有配置
    async fn list_configs(&self) -> Result<Vec<DataSourceConfig>, RegistryError>;
    
    /// 更新配置
    async fn update_config(&self, id: &str, config: &DataSourceConfig) -> Result<(), RegistryError>;
}

/// 内存配置存储 (用于测试)
pub struct MemoryConfigStorage {
    configs: RwLock<HashMap<String, DataSourceConfig>>,
}

impl MemoryConfigStorage {
    pub fn new() -> Self {
        Self {
            configs: RwLock::new(HashMap::new()),
        }
    }
}

#[async_trait]
impl ConfigStorage for MemoryConfigStorage {
    async fn save_config(&self, id: &str, config: &DataSourceConfig) -> Result<(), RegistryError> {
        let mut configs = self.configs.write().await;
        configs.insert(id.to_string(), config.clone());
        Ok(())
    }
    
    async fn load_config(&self, id: &str) -> Result<Option<DataSourceConfig>, RegistryError> {
        let configs = self.configs.read().await;
        Ok(configs.get(id).cloned())
    }
    
    async fn delete_config(&self, id: &str) -> Result<(), RegistryError> {
        let mut configs = self.configs.write().await;
        configs.remove(id);
        Ok(())
    }
    
    async fn list_configs(&self) -> Result<Vec<DataSourceConfig>, RegistryError> {
        let configs = self.configs.read().await;
        Ok(configs.values().cloned().collect())
    }
    
    async fn update_config(&self, id: &str, config: &DataSourceConfig) -> Result<(), RegistryError> {
        let mut configs = self.configs.write().await;
        if configs.contains_key(id) {
            configs.insert(id.to_string(), config.clone());
            Ok(())
        } else {
            Err(RegistryError::SourceNotFound { source_id: id.to_string() })
        }
    }
}

/// 文件配置存储
pub struct FileConfigStorage {
    file_path: PathBuf,
}

impl FileConfigStorage {
    pub fn new<P: Into<PathBuf>>(file_path: P) -> Self {
        Self {
            file_path: file_path.into(),
        }
    }
}

#[async_trait]
impl ConfigStorage for FileConfigStorage {
    async fn save_config(&self, id: &str, config: &DataSourceConfig) -> Result<(), RegistryError> {
        let mut all_configs = self.load_all_configs().await?;
        all_configs.insert(id.to_string(), config.clone());
        self.save_all_configs(&all_configs).await
    }
    
    async fn load_config(&self, id: &str) -> Result<Option<DataSourceConfig>, RegistryError> {
        let all_configs = self.load_all_configs().await?;
        Ok(all_configs.get(id).cloned())
    }
    
    async fn delete_config(&self, id: &str) -> Result<(), RegistryError> {
        let mut all_configs = self.load_all_configs().await?;
        all_configs.remove(id);
        self.save_all_configs(&all_configs).await
    }
    
    async fn list_configs(&self) -> Result<Vec<DataSourceConfig>, RegistryError> {
        let all_configs = self.load_all_configs().await?;
        Ok(all_configs.values().cloned().collect())
    }
    
    async fn update_config(&self, id: &str, config: &DataSourceConfig) -> Result<(), RegistryError> {
        let mut all_configs = self.load_all_configs().await?;
        if all_configs.contains_key(id) {
            all_configs.insert(id.to_string(), config.clone());
            self.save_all_configs(&all_configs).await
        } else {
            Err(RegistryError::SourceNotFound { source_id: id.to_string() })
        }
    }
}

impl FileConfigStorage {
    async fn load_all_configs(&self) -> Result<HashMap<String, DataSourceConfig>, RegistryError> {
        if !self.file_path.exists() {
            return Ok(HashMap::new());
        }
        
        let content = tokio::fs::read_to_string(&self.file_path).await
            .map_err(|e| RegistryError::StorageError { 
                message: format!("Failed to read config file: {}", e) 
            })?;
        
        if content.trim().is_empty() {
            return Ok(HashMap::new());
        }
        
        // 尝试解析配置文件，如果失败则返回空配置并删除损坏的文件
        match serde_json::from_str::<HashMap<String, DataSourceConfig>>(&content) {
            Ok(configs) => Ok(configs),
            Err(e) => {
                eprintln!("⚠️ Warning: Config file corrupted or incompatible: {}", e);
                eprintln!("⚠️ Config file path: {:?}", self.file_path);
                eprintln!("⚠️ Will delete corrupted file and create new one");
                
                // 删除损坏的配置文件
                if let Err(del_err) = tokio::fs::remove_file(&self.file_path).await {
                    eprintln!("⚠️ Failed to delete corrupted config file: {}", del_err);
                }
                
                // 返回空配置，允许创建新的
                Ok(HashMap::new())
            }
        }
    }
    
    async fn save_all_configs(&self, configs: &HashMap<String, DataSourceConfig>) -> Result<(), RegistryError> {
        // 创建父目录（如果不存在）
        if let Some(parent) = self.file_path.parent() {
            tokio::fs::create_dir_all(parent).await
                .map_err(|e| RegistryError::StorageError { 
                    message: format!("Failed to create config directory: {}", e) 
                })?;
        }
        
        let content = serde_json::to_string_pretty(configs)
            .map_err(|e| RegistryError::StorageError { 
                message: format!("Failed to serialize configs: {}", e) 
            })?;
        
        tokio::fs::write(&self.file_path, content).await
            .map_err(|e| RegistryError::StorageError { 
                message: format!("Failed to write config file: {}", e) 
            })?;
        
        Ok(())
    }
}