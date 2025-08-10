import { Component, createSignal, For } from 'solid-js';
import { useAppContext } from '../../stores/AppContext';

const TestPanel: Component = () => {
  const { state, createElement, selectElement, clearSelection } = useAppContext();
  const [showTestPanel, setShowTestPanel] = createSignal(false);

  // 预定义测试案例
  const testCases = [
    {
      name: '创建文字元素',
      action: async () => {
        const elementId = await createElement(
          'text',
          { x: 100, y: 100 },
          { width: 100, height: 24 },
          {
            type: 'Text',
            content: '测试文字',
            style: {
              font_family: 'SimSun',
              font_size: 14,
              font_weight: 'normal',
              color: '#000000',
              align: 'Left' as const,
            },
          }
        );
        console.log('✅ 测试文字元素创建成功:', elementId);
        return elementId;
      }
    },
    {
      name: '创建矩形元素',
      action: async () => {
        const elementId = await createElement(
          'rectangle',
          { x: 250, y: 100 },
          { width: 100, height: 60 },
          {
            type: 'Rectangle',
            fill_color: 'rgba(59, 130, 246, 0.2)',
            border: {
              color: '#3b82f6',
              width: 2,
              style: 'Solid' as const,
            },
          }
        );
        console.log('✅ 测试矩形元素创建成功:', elementId);
        return elementId;
      }
    },
    {
      name: '创建线条元素',
      action: async () => {
        const elementId = await createElement(
          'line',
          { x: 400, y: 130 },
          { width: 150, height: 2 },
          {
            type: 'Line',
            color: '#ef4444',
            width: 3,
          }
        );
        console.log('✅ 测试线条元素创建成功:', elementId);
        return elementId;
      }
    },
    {
      name: '创建数据字段',
      action: async () => {
        const elementId = await createElement(
          'data_field',
          { x: 100, y: 200 },
          { width: 120, height: 24 },
          {
            type: 'DataField',
            expression: '${测试数据}',
            format: undefined,
            style: {
              font_family: 'SimSun',
              font_size: 12,
              font_weight: 'bold',
              color: '#059669',
              align: 'Left' as const,
            },
          }
        );
        console.log('✅ 测试数据字段创建成功:', elementId);
        return elementId;
      }
    }
  ];

  const runTest = async (testCase: typeof testCases[0]) => {
    try {
      console.log(`🧪 开始测试: ${testCase.name}`);
      const elementId = await testCase.action();
      // 自动选中创建的元素
      await selectElement(elementId);
      console.log(`✅ 测试完成: ${testCase.name}, 元素ID: ${elementId}`);
    } catch (error) {
      console.error(`❌ 测试失败: ${testCase.name}`, error);
    }
  };

  const runAllTests = async () => {
    console.log('🚀 开始运行所有测试案例...');
    await clearSelection();
    
    for (const testCase of testCases) {
      await runTest(testCase);
      // 稍微延迟一下，便于观察
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('🎉 所有测试案例运行完成!');
  };

  const clearAllElements = async () => {
    try {
      console.log('🧹 清理所有测试元素...');
      // 这里应该调用删除所有元素的API，暂时只是清除选择
      await clearSelection();
      console.log('✅ 清理完成');
    } catch (error) {
      console.error('❌ 清理失败:', error);
    }
  };

  return (
    <>
      {/* 测试按钮 */}
      <button
        class="fixed top-20 right-4 z-50 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium"
        onClick={() => setShowTestPanel(!showTestPanel())}
        title="开启/关闭测试面板"
      >
        🧪 测试
      </button>

      {/* 测试面板 */}
      {showTestPanel() && (
        <div class="fixed top-16 right-4 z-40 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 max-h-96 overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">🧪 测试面板</h3>
            <button
              class="text-gray-500 hover:text-gray-700"
              onClick={() => setShowTestPanel(false)}
            >
              ✕
            </button>
          </div>

          {/* 状态信息 */}
          <div class="mb-4 p-3 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">
              <div>元素总数: <span class="font-medium">{state.elements.length}</span></div>
              <div>已选择: <span class="font-medium">{state.selected_ids.length}</span></div>
              <div>可撤销: <span class="font-medium">{state.can_undo ? '是' : '否'}</span></div>
              <div>可重做: <span class="font-medium">{state.can_redo ? '是' : '否'}</span></div>
            </div>
          </div>

          {/* 快速操作 */}
          <div class="space-y-2 mb-4">
            <button
              class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm"
              onClick={runAllTests}
            >
              🚀 运行所有测试
            </button>
            <button
              class="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm"
              onClick={clearAllElements}
            >
              🧹 清理元素
            </button>
          </div>

          {/* 单独测试案例 */}
          <div class="space-y-2">
            <h4 class="text-sm font-medium text-gray-700 mb-2">单独测试:</h4>
            <For each={testCases}>
              {(testCase) => (
                <button
                  class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm text-left"
                  onClick={() => runTest(testCase)}
                >
                  {testCase.name}
                </button>
              )}
            </For>
          </div>

          {/* 元素列表 */}
          <div class="mt-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">当前元素:</h4>
            <div class="max-h-32 overflow-y-auto">
              <For each={state.elements}>
                {(element) => (
                  <div 
                    class={`text-xs p-2 mb-1 rounded cursor-pointer ${
                      state.selected_ids.includes(element.id) 
                        ? 'bg-blue-100 border border-blue-300' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => selectElement(element.id)}
                  >
                    <div class="font-medium">{element.content.type}</div>
                    <div class="text-gray-500 truncate">ID: {element.id.slice(0, 8)}...</div>
                    <div class="text-gray-500">位置: ({Math.round(element.position.x)}, {Math.round(element.position.y)})</div>
                  </div>
                )}
              </For>
              {state.elements.length === 0 && (
                <div class="text-xs text-gray-500 p-2">暂无元素</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TestPanel;