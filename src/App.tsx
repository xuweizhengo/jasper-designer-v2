import { Component, onMount } from "solid-js";
import MainLayout from "./components/Layout/MainLayout";
import { AppProvider } from "./stores/AppContext";
import KeyboardManager from "./components/KeyboardShortcuts/KeyboardManager";
// Import data source integration test (runs in dev mode)
import "./tests/data-source-integration";
import { dataContextManager } from './stores/DataContextManager';

const App: Component = () => {
  onMount(() => {
    // Disable context menu to prevent interference with custom context menus
    document.addEventListener('contextmenu', e => e.preventDefault());

    // 自动恢复上次激活的数据源
    try {
      const lastId = typeof window !== 'undefined' ? window.localStorage.getItem('jasper.activeDataSourceId') : null;
      if (lastId) {
        // 异步激活，避免阻塞渲染
        dataContextManager.setActiveDataSource(lastId).catch(err => {
          console.warn('恢复激活数据源失败:', err);
        });
      }
    } catch (e) {
      console.warn('读取本地激活数据源失败:', e);
    }
  });

  return (
    <AppProvider>
      <KeyboardManager />
      <MainLayout />
    </AppProvider>
  );
};

export default App;// Build: Sun Aug 10 01:08:49 PM CST 2025
