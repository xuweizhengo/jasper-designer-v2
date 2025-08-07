import { createContext, useContext, ParentComponent, createSignal, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { invoke } from '@tauri-apps/api/tauri';
import type { AppState, CanvasConfig } from '../types';

// App Context Type
interface AppContextType {
  // State
  state: AppState;
  
  // Actions
  createElement: (type: string, position: { x: number; y: number }, size: { width: number; height: number }, data?: any) => Promise<string>;
  updateElement: (id: string, updates: Record<string, any>) => Promise<void>;
  deleteElement: (id: string) => Promise<void>;
  selectElement: (id: string) => Promise<void>;
  clearSelection: () => Promise<void>;
  copySelected: () => Promise<void>;
  pasteElements: (offsetX: number, offsetY: number) => Promise<string[]>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  updateCanvasConfig: (config: Partial<CanvasConfig>) => Promise<void>;
  getElementsAtPoint: (x: number, y: number) => Promise<string[]>;
  
  // UI State
  isLoading: () => boolean;
  setLoading: (loading: boolean) => void;
  dragOperation: () => any;
  setDragOperation: (operation: any) => void;
}

const AppContext = createContext<AppContextType>();

export const AppProvider: ParentComponent = (props) => {
  // Create reactive state store
  const [state, setState] = createStore<AppState>({
    elements: [],
    selected_ids: [],
    canvas_config: {
      width: 595,
      height: 842,
      zoom: 1.0,
      offset_x: 0,
      offset_y: 0,
      show_grid: true,
      show_rulers: true,
      grid_size: 10,
      snap_to_grid: true,
      background_color: '#ffffff',
    },
    can_undo: false,
    can_redo: false,
    dirty: false,
  });

  const [isLoading, setLoading] = createSignal(false);
  const [dragOperation, setDragOperation] = createSignal<any>(null);

  // Load initial state from backend
  const loadAppState = async () => {
    try {
      setLoading(true);
      const appState = await invoke<AppState>('get_app_state');
      setState(appState);
    } catch (error) {
      console.error('Failed to load app state:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize app state on mount
  onMount(() => {
    loadAppState();
  });

  // Element operations
  const createElement = async (
    type: string, 
    position: { x: number; y: number }, 
    size: { width: number; height: number },
    data: any = {}
  ): Promise<string> => {
    try {
      setLoading(true);
      const elementId = await invoke<string>('create_element', {
        request: {
          element_type: type,
          position,
          size,
          content_data: data,
        },
      });
      
      // Reload state after operation
      await loadAppState();
      return elementId;
    } catch (error) {
      console.error('Failed to create element:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateElement = async (id: string, updates: Record<string, any>): Promise<void> => {
    try {
      setLoading(true);
      await invoke('update_element', {
        request: { id, updates },
      });
      
      await loadAppState();
    } catch (error) {
      console.error('Failed to update element:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteElement = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      await invoke('delete_element', { elementId: id });
      await loadAppState();
    } catch (error) {
      console.error('Failed to delete element:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const selectElement = async (id: string): Promise<void> => {
    try {
      await invoke('select_element', { elementId: id });
      await loadAppState();
    } catch (error) {
      console.error('Failed to select element:', error);
      throw error;
    }
  };

  const clearSelection = async (): Promise<void> => {
    try {
      await invoke('clear_selection');
      await loadAppState();
    } catch (error) {
      console.error('Failed to clear selection:', error);
      throw error;
    }
  };

  const copySelected = async (): Promise<void> => {
    try {
      await invoke('copy_selected');
    } catch (error) {
      console.error('Failed to copy selected elements:', error);
      throw error;
    }
  };

  const pasteElements = async (offsetX: number, offsetY: number): Promise<string[]> => {
    try {
      setLoading(true);
      const newIds = await invoke<string[]>('paste_elements', { offsetX, offsetY });
      await loadAppState();
      return newIds;
    } catch (error) {
      console.error('Failed to paste elements:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const undo = async (): Promise<void> => {
    try {
      setLoading(true);
      await invoke('undo');
      await loadAppState();
    } catch (error) {
      console.error('Failed to undo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const redo = async (): Promise<void> => {
    try {
      setLoading(true);
      await invoke('redo');
      await loadAppState();
    } catch (error) {
      console.error('Failed to redo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCanvasConfig = async (config: Partial<CanvasConfig>): Promise<void> => {
    try {
      setLoading(true);
      await invoke('update_canvas_config', { request: config });
      await loadAppState();
    } catch (error) {
      console.error('Failed to update canvas config:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getElementsAtPoint = async (x: number, y: number): Promise<string[]> => {
    try {
      return await invoke<string[]>('get_elements_at_point', { x, y });
    } catch (error) {
      console.error('Failed to get elements at point:', error);
      return [];
    }
  };

  const contextValue: AppContextType = {
    state,
    createElement,
    updateElement,
    deleteElement,
    selectElement,
    clearSelection,
    copySelected,
    pasteElements,
    undo,
    redo,
    updateCanvasConfig,
    getElementsAtPoint,
    isLoading,
    setLoading,
    dragOperation,
    setDragOperation,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {props.children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};