// === Data Source Layer Integration Test ===
import { DataSourceAPI } from '../api/data-sources';

export async function testDataSourceIntegration(): Promise<boolean> {
  console.log('🧪 开始数据源层集成测试...');
  
  try {
    // 1. 测试获取可用数据源类型
    console.log('1. 测试获取可用数据源类型...');
    const types = await DataSourceAPI.getAvailableTypes();
    console.log(`✅ 找到 ${types.length} 种数据源类型:`, types.map(t => t.display_name).join(', '));
    
    if (types.length === 0) {
      throw new Error('没有找到任何可用的数据源类型');
    }

    // 2. 测试JSON数据源类型
    const jsonType = types.find(t => t.type_name === 'json');
    if (!jsonType) {
      throw new Error('没有找到JSON数据源类型');
    }
    console.log('✅ JSON数据源类型可用');

    // 3. 测试获取配置Schema
    console.log('2. 测试获取JSON数据源配置Schema...');
    const configSchema = await DataSourceAPI.getConfigSchema('json');
    console.log(`✅ 配置Schema包含 ${configSchema.fields.length} 个字段`);

    // 4. 测试获取默认配置
    console.log('3. 测试获取默认配置...');
    const defaultConfig = await DataSourceAPI.getDefaultConfig('json');
    console.log('✅ 默认配置获取成功:', defaultConfig);

    // 5. 测试配置验证
    console.log('4. 测试配置验证...');
    const validationResult = await DataSourceAPI.validateConfig('json', defaultConfig);
    if (!validationResult.valid) {
      throw new Error(`配置验证失败: ${validationResult.errors.join(', ')}`);
    }
    console.log('✅ 配置验证通过');

    // 6. 测试创建数据源 (使用示例JSON数据)
    console.log('5. 测试创建数据源...');
    const testConfig = {
      source_type: 'content',
      content: JSON.stringify([
        { id: 1, name: '测试用户1', email: 'user1@test.com' },
        { id: 2, name: '测试用户2', email: 'user2@test.com' }
      ])
    };

    const sourceId = await DataSourceAPI.createDataSource('集成测试数据源', 'json', testConfig);
    console.log(`✅ 数据源创建成功，ID: ${sourceId}`);

    // 7. 测试数据预览
    console.log('6. 测试数据预览...');
    const preview = await DataSourceAPI.getPreview(sourceId, undefined, 10);
    console.log(`✅ 数据预览成功，包含 ${preview.rows.length} 行数据`);
    console.log('预览数据:', preview.rows[0]);

    // 8. 测试数据查询
    console.log('7. 测试数据查询...');
    const queryResult = await DataSourceAPI.queryData(sourceId, {
      limit: 1
    });
    console.log(`✅ 数据查询成功，返回 ${queryResult.rows.length} 行`);

    // 9. 测试表达式求值
    console.log('8. 测试表达式求值...');
    const expressionResult = await DataSourceAPI.evaluateExpression(sourceId, '[0].name', null);
    console.log(`✅ 表达式求值成功，结果: ${expressionResult}`);

    // 10. 测试数据源列表
    console.log('9. 测试数据源列表...');
    const sources = await DataSourceAPI.listDataSources();
    console.log(`✅ 数据源列表获取成功，包含 ${sources.length} 个数据源`);

    // 11. 清理测试数据源
    console.log('10. 清理测试数据源...');
    await DataSourceAPI.deleteDataSource(sourceId);
    console.log('✅ 测试数据源清理完成');

    console.log('🎉 数据源层集成测试全部通过！');
    return true;

  } catch (error) {
    console.error('❌ 数据源层集成测试失败:', error);
    return false;
  }
}

// 在开发模式下自动运行测试
if (import.meta.env.DEV) {
  // 延迟执行以确保Tauri已初始化
  setTimeout(() => {
    testDataSourceIntegration().then(success => {
      if (success) {
        console.log('🎯 Jasper Designer数据源层已就绪，可以开始使用数据绑定功能！');
      } else {
        console.warn('⚠️  数据源层测试未通过，某些功能可能无法正常工作');
      }
    });
  }, 2000);
}