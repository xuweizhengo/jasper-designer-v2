import { Component, onMount } from "solid-js";
import MainLayout from "./components/Layout/MainLayout";
import { AppProvider } from "./stores/AppContext";

const App: Component = () => {
  onMount(() => {
    // Disable context menu to prevent interference with custom context menus
    document.addEventListener('contextmenu', e => e.preventDefault());
  });

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;// Build: Sun Aug 10 01:08:49 PM CST 2025
