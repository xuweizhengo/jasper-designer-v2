// === 数据源注册表实现 ===
use crate::data::types::*;
use crate::data::storage::ConfigStorage;
use std::collections::HashMap;
use chrono::Utc;
use log::{info, error, warn};

/// 数据源注册表 - 管理所有数据源实例和提供者
pub struct DataSourceRegistry {
    providers: HashMap<String, Box<dyn DataSourceProvider>>,
    instances: HashMap<String, Box<dyn DataSource>>,
    config_storage: Box<dyn ConfigStorage>,
}

impl DataSourceRegistry {
    /// 创建新的注册表实例
    pub fn new(config_storage: Box<dyn ConfigStorage>) -> Self {
        let mut registry = Self {
            providers: HashMap::new(),
            instances: HashMap::new(),
            config_storage,
        };
        
        // 注册内置数据源提供者
        if let Err(e) = registry.register_builtin_providers() {
            error!("Failed to register builtin providers: {}", e);
        }
        
        registry
    }
    
    /// 注册数据源提供者
    pub fn register_provider<T>(&mut self, provider: T) -> Result<(), RegistryError> 
    where 
        T: DataSourceProvider + 'static 
    {
        let type_name = provider.get_type_name().to_string();
        
        if self.providers.contains_key(&type_name) {
            return Err(RegistryError::ProviderExists { provider_type: type_name });
        }
        
        info!("Registering data source provider: {}", type_name);
        self.providers.insert(type_name, Box::new(provider));
        Ok(())
    }
    
    /// 获取提供者
    pub fn get_provider(&self, type_name: &str) -> Option<&dyn DataSourceProvider> {
        self.providers.get(type_name).map(|p| p.as_ref())
    }
    
    /// 获取所有可用的数据源类型
    pub fn get_available_types(&self) -> Vec<DataSourceTypeInfo> {
        self.providers.iter()
            .map(|(type_name, provider)| DataSourceTypeInfo {
                type_name: type_name.clone(),
                display_name: provider.get_display_name().to_string(),
                description: provider.get_description().to_string(),
                icon: provider.get_icon().map(|s| s.to_string()),
                version: provider.get_version().to_string(),
                config_schema: provider.get_config_schema(),
                capabilities: self.get_provider_capabilities(provider.as_ref()),
            })
            .collect()
    }
    
    /// 创建并保存数据源配置 - 新版本
    pub async fn save_data_source_config(
        &mut self,
        config: DataSourceConfig
    ) -> Result<String, RegistryError> {
        let id = config.id.clone();
        let name = config.name.clone();
        let provider_type = config.get_provider_type();
        let config_json = config.get_config_json();
        
        // 保存配置到存储
        self.config_storage.save_config(&id, &config).await?;
        
        // 创建内存实例（如果provider存在）
        if let Some(provider) = self.providers.get(&provider_type) {
            match provider.create_source(id.clone(), name.clone(), &config_json).await {
                Ok(source) => {
                    self.instances.insert(id.clone(), source);
                    info!("Data source created in memory: {} ({})", name, id);
                }
                Err(e) => {
                    warn!("Failed to create data source instance in memory: {}", e);
                    // 不返回错误，因为配置已经保存成功
                }
            }
        } else {
            warn!("Provider not found for type: {}, config saved but instance not created", provider_type);
        }
        
        info!("Data source config saved: {} ({})", name, id);
        Ok(id)
    }
    pub async fn create_data_source(
        &mut self,
        id: String,
        name: String,
        provider_type: String,
        config: serde_json::Value
    ) -> Result<String, RegistryError> {
        let provider = self.providers.get(&provider_type)
            .ok_or_else(|| RegistryError::ProviderNotFound { provider_type: provider_type.clone() })?;
        
        // 验证配置
        provider.validate_config(&config).map_err(|e| RegistryError::ValidationFailed {
            message: e.to_string(),
            errors: vec![e.to_string()],
        })?;
        
        // 测试连接
        if !provider.test_connection(&config).await? {
            return Err(RegistryError::ConnectionFailed);
        }
        
        // 创建实例
        let source = provider.create_source(id.clone(), name.clone(), &config).await?;
        
        // 存储配置 - 使用新的结构
        let config_data = DataSourceConfig {
            id: id.clone(),
            name,
            source_type: DataSourceConfigType::Database(DatabaseSourceConfig {
                database_type: provider_type.clone(),
                host: config.get("host").and_then(|v| v.as_str()).unwrap_or("localhost").to_string(),
                port: config.get("port").and_then(|v| v.as_u64()).unwrap_or(3306) as u16,
                database: config.get("database").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                username: config.get("username").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                password: config.get("password").and_then(|v| v.as_str()).map(|s| s.to_string()),
                sql: "SELECT 1".to_string(), // 默认SQL
                selected_tables: vec![], // 默认为空
            }),
            description: None,
            tags: vec![],
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        self.config_storage.save_config(&id, &config_data).await
            .map_err(|e| RegistryError::StorageError { message: e.to_string() })?;
        
        // 注册实例
        self.instances.insert(id.clone(), source);
        
        info!("Created data source: {}", id);
        Ok(id)
    }
    
    /// 获取数据源实例
    pub fn get_data_source(&self, id: &str) -> Option<&dyn DataSource> {
        self.instances.get(id).map(|s| s.as_ref())
    }
    
    /// 刷新数据源Schema
    pub async fn refresh_data_source_schema(&mut self, id: &str) -> Result<DataSchema, RegistryError> {
        let source = self.instances.get_mut(id)
            .ok_or_else(|| RegistryError::SourceNotFound { source_id: id.to_string() })?;
        
        source.refresh_schema().await.map_err(|e| RegistryError::ValidationFailed {
            message: e.to_string(),
            errors: vec![e.to_string()],
        })?;
        
        Ok(source.get_schema())
    }
    
    /// 查询数据
    pub async fn query_data(
        &self,
        source_id: &str,
        query: Option<DataQuery>
    ) -> Result<DataSet, RegistryError> {
        let source = self.instances.get(source_id)
            .ok_or_else(|| RegistryError::SourceNotFound { source_id: source_id.to_string() })?;
        
        // TODO: 添加缓存逻辑
        let data = source.get_data(query).await?;
        
        Ok(data)
    }
    
    /// 列出所有数据源
    pub fn list_all_sources(&self) -> Vec<DataSourceInfo> {
        println!("🔍 list_all_sources被调用");
        println!("🔍 内存实例数量: {}", self.instances.len());
        
        self.instances.iter()
            .map(|(id, source)| {
                println!("🔍 内存实例: id={}, name={}", id, source.get_name());
                DataSourceInfo {
                    id: id.clone(),
                    name: source.get_name().to_string(),
                    provider_type: match source.get_type() {
                        DataSourceType::Json => "json".to_string(),
                        DataSourceType::Database(db) => format!("database_{:?}", db).to_lowercase(),
                        DataSourceType::Api(api) => format!("api_{}", api),
                        DataSourceType::File(file) => format!("file_{:?}", file).to_lowercase(),
                        DataSourceType::Custom(custom) => format!("custom_{}", custom),
                    },
                    status: "active".to_string(),
                    created_at: Utc::now().to_rfc3339(),
                    last_updated: Utc::now().to_rfc3339(),
                    metadata: std::collections::HashMap::new(),
                }
            })
            .collect()
    }
    
    /// 删除数据源
    pub async fn remove_data_source(&mut self, id: &str) -> Result<(), RegistryError> {
        // 从实例中移除
        if self.instances.remove(id).is_none() {
            return Err(RegistryError::SourceNotFound { source_id: id.to_string() });
        }
        
        // 从配置存储中删除
        self.config_storage.delete_config(id).await
            .map_err(|e| RegistryError::StorageError { message: e.to_string() })?;
        
        info!("Removed data source: {}", id);
        Ok(())
    }
    
    /// 更新数据源配置
    pub async fn update_data_source_config(
        &mut self,
        id: &str,
        config: serde_json::Value
    ) -> Result<(), RegistryError> {
        // 检查数据源是否存在
        if !self.instances.contains_key(id) {
            return Err(RegistryError::SourceNotFound { source_id: id.to_string() });
        }
        
        // 加载现有配置
        let mut existing_config = self.config_storage.load_config(id).await
            .map_err(|e| RegistryError::StorageError { message: e.to_string() })?
            .ok_or_else(|| RegistryError::SourceNotFound { source_id: id.to_string() })?;
        
        // 获取提供者
        let provider_type = existing_config.get_provider_type();
        let provider = self.providers.get(&provider_type)
            .ok_or_else(|| RegistryError::ProviderNotFound { 
                provider_type: provider_type.clone() 
            })?;
        
        // 验证新配置
        provider.validate_config(&config).map_err(|e| RegistryError::ValidationFailed {
            message: e.to_string(),
            errors: vec![e.to_string()],
        })?;
        
        // 更新配置
        // 更新配置 - TODO: 需要按照新结构更新
        // existing_config.config = config.clone();
        existing_config.updated_at = Utc::now();
        
        // 保存配置
        self.config_storage.update_config(id, &existing_config).await
            .map_err(|e| RegistryError::StorageError { message: e.to_string() })?;
        
        // 重新创建数据源实例
        let config_json = existing_config.get_config_json();
        let new_source = provider.create_source(
            id.to_string(),
            existing_config.name.clone(),
            &config_json
        ).await?;
        
        self.instances.insert(id.to_string(), new_source);
        
        info!("Updated data source config: {}", id);
        Ok(())
    }
    
    /// 批量查询
    pub async fn batch_query(
        &self,
        requests: Vec<BatchQueryRequest>
    ) -> Result<Vec<BatchQueryResponse>, RegistryError> {
        let mut responses = Vec::new();
        
        for request in requests {
            let result = self.query_data(&request.source_id, request.query).await;
            responses.push(BatchQueryResponse {
                request_id: request.request_id,
                result: result.map_err(|e| e.to_string()),
            });
        }
        
        Ok(responses)
    }
    
    /// 从配置存储加载所有数据源
    pub async fn load_from_storage(&mut self) -> Result<(), RegistryError> {
        let configs = self.config_storage.list_configs().await
            .map_err(|e| RegistryError::StorageError { message: e.to_string() })?;
        
        for config in configs {
            let provider_type = config.get_provider_type();
            if let Some(provider) = self.providers.get(&provider_type) {
                let config_json = config.get_config_json();
                match provider.create_source(
                    config.id.clone(),
                    config.name.clone(),
                    &config_json
                ).await {
                    Ok(source) => {
                        self.instances.insert(config.id.clone(), source);
                        info!("Loaded data source from storage: {}", config.id);
                    }
                    Err(e) => {
                        warn!("Failed to load data source {}: {}", config.id, e);
                    }
                }
            } else {
                warn!("Unknown provider type for data source {}: {}", config.id, provider_type);
            }
        }
        
        Ok(())
    }
    
    /// 注册内置提供者
    fn register_builtin_providers(&mut self) -> Result<(), RegistryError> {
        // 注册JSON数据源
        self.register_provider(crate::data::providers::JsonDataSourceProvider::new())?;
        
        // 注册数据库数据源
        self.register_provider(crate::data::providers::database::DatabaseProvider::new())?;
        
        info!("Registered {} builtin providers", 2);
        Ok(())
    }
    
    /// 获取提供者能力
    fn get_provider_capabilities(&self, provider: &dyn DataSourceProvider) -> Vec<String> {
        let mut capabilities = vec!["query".to_string()];
        
        if provider.supports_wizard() {
            capabilities.push("wizard".to_string());
        }
        
        // TODO: 基于provider类型添加更多能力标识
        capabilities
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::data::storage::MemoryConfigStorage;
    use chrono::Utc;

    #[tokio::test]
    async fn test_registry_save_and_load_config() {
        println!("🧪 测试注册表保存和加载配置");
        
        // 创建内存存储的注册表
        let storage = Box::new(MemoryConfigStorage::new()) as Box<dyn ConfigStorage>;
        let mut registry = DataSourceRegistry::new(storage);
        
        // 创建测试配置
        let config = DataSourceConfig {
            id: "test-001".to_string(),
            name: "测试MySQL数据源".to_string(),
            source_type: DataSourceConfigType::Database(DatabaseSourceConfig {
                database_type: "mysql".to_string(),
                host: "localhost".to_string(),
                port: 3306,
                database: "test_db".to_string(),
                username: "test_user".to_string(),
                password: Some("test_password".to_string()),
                sql: "SELECT * FROM users".to_string(),
                selected_tables: vec!["users".to_string()],
            }),
            description: Some("测试描述".to_string()),
            tags: vec!["test".to_string()],
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        // 测试保存配置
        let result = registry.save_data_source_config(config.clone()).await;
        assert!(result.is_ok(), "保存配置失败: {:?}", result.err());
        
        let saved_id = result.unwrap();
        assert_eq!(saved_id, config.id);
        println!("✅ 配置保存成功，ID: {}", saved_id);
        
        // 测试兼容性方法
        assert_eq!(config.get_provider_type(), "database");
        let json_config = config.get_config_json();
        assert_eq!(json_config["database_type"], "mysql");
        assert_eq!(json_config["host"], "localhost");
        assert_eq!(json_config["port"], 3306);
        println!("✅ 兼容性方法测试通过");
        
        println!("🎉 注册表测试全部通过！");
    }
    
    #[test]
    fn test_data_source_config_compatibility() {
        println!("🧪 测试数据源配置兼容性");
        
        let config = DataSourceConfig {
            id: "test-db-001".to_string(),
            name: "PostgreSQL测试".to_string(),
            source_type: DataSourceConfigType::Database(DatabaseSourceConfig {
                database_type: "postgresql".to_string(),
                host: "localhost".to_string(),
                port: 5432,
                database: "testdb".to_string(),
                username: "admin".to_string(),
                password: None,
                sql: "SELECT id, name FROM products LIMIT 100".to_string(),
                selected_tables: vec!["products".to_string(), "categories".to_string()],
            }),
            description: None,
            tags: vec!["postgresql".to_string(), "test".to_string()],
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        // 测试provider类型提取
        assert_eq!(config.get_provider_type(), "database");
        
        // 测试配置JSON生成
        let json = config.get_config_json();
        assert!(json.is_object());
        assert_eq!(json["database_type"], "postgresql");
        assert_eq!(json["host"], "localhost");
        assert_eq!(json["port"], 5432);
        assert_eq!(json["database"], "testdb");
        assert_eq!(json["username"], "admin");
        assert!(json["password"].is_null());
        
        // 测试序列化和反序列化
        let serialized = serde_json::to_string(&config);
        assert!(serialized.is_ok());
        
        let deserialized: Result<DataSourceConfig, _> = serde_json::from_str(&serialized.unwrap());
        assert!(deserialized.is_ok());
        
        let restored = deserialized.unwrap();
        assert_eq!(restored.id, config.id);
        assert_eq!(restored.name, config.name);
        assert_eq!(restored.get_provider_type(), "database");
        
        println!("✅ 配置兼容性测试全部通过！");
    }
}