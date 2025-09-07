import { createContext, useContext, ParentComponent, createSignal, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { invoke } from '@tauri-apps/api/tauri';
import type { AppState, CanvasConfig } from '../types';

// App Context Type
interface AppContextType {
  // State
  state: AppState;
  setState: (newState: Partial<AppState>) => void;
  
  // Actions
  createElement: (type: string, position: { x: number; y: number }, size: { width: number; height: number }, data?: any) => Promise<string>;
  updateElement: (id: string, updates: Record<string, any>) => Promise<void>;
  batchUpdatePositions: (updates: Array<{element_id: string, new_position: {x: number, y: number}}>) => Promise<void>;
  deleteElement: (id: string) => Promise<void>;
  selectElement: (id: string) => Promise<void>;
  selectMultiple: (ids: string[]) => Promise<void>;
  addToSelection: (id: string) => Promise<void>;
  removeFromSelection: (id: string) => Promise<void>;
  toggleSelection: (id: string) => Promise<void>;
  clearSelection: () => Promise<void>;
  copySelected: () => Promise<void>;
  copySelectedElements: () => Promise<void>; // 别名，保持兼容性
  pasteElements: (offsetX: number, offsetY: number) => Promise<string[]>;
  deleteElements: (ids: string[]) => Promise<void>;
  selectAllElements: () => Promise<void>;
  moveElements: (ids: string[], deltaX: number, deltaY: number) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  updateCanvasConfig: (config: Partial<CanvasConfig>) => Promise<void>;
  getElementsAtPoint: (x: number, y: number) => Promise<string[]>;
  
  // UI State
  isLoading: () => boolean;
  setLoading: (loading: boolean) => void;
  dragOperation: () => any;
  setDragOperation: (operation: any) => void;
  resizeOperation: () => boolean;
  setResizeOperation: (resizing: boolean) => void;
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
  const [resizeOperation, setResizeOperation] = createSignal<boolean>(false);

  // Load initial state from backend
  const loadAppState = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading app state...');
      const appState = await invoke<AppState>('get_app_state');
      console.log('🔄 App state loaded, selected_ids:', appState.selected_ids);
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

  const batchUpdatePositions = async (updates: Array<{element_id: string, new_position: {x: number, y: number}}>): Promise<void> => {
    try {
      setLoading(true);
      
      // Send batch update to backend
      await invoke('batch_update_positions', {
        request: { updates },
      });
      
      // Optimized: Update local state directly instead of full reload
      // This avoids the expensive full state reload for better drag performance
      setState(prevState => {
        const newElements = prevState.elements.map(element => {
          const update = updates.find(u => u.element_id === element.id);
          if (update) {
            return {
              ...element,
              position: update.new_position
            };
          }
          return element;
        });
        
        return {
          ...prevState,
          elements: newElements,
          dirty: true
        };
      });
      
      console.log('🚀 Optimized batch position update completed without full reload');
      
    } catch (error) {
      console.error('Failed to batch update positions:', error);
      // Fallback to full reload on error
      await loadAppState();
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
      console.log('Selecting element:', id);
      await invoke('select_element', { elementId: id });
      console.log('Select command completed, reloading state...');
      await loadAppState();
      console.log('State reloaded, selected_ids:', state.selected_ids);
    } catch (error) {
      console.error('Failed to select element:', error);
      throw error;
    }
  };

  const selectMultiple = async (ids: string[]): Promise<void> => {
    try {
      console.log('Selecting multiple elements:', ids);
      if (ids.length > 0) {
        await invoke('select_multiple', { elementIds: ids });
        console.log('✅ Multi-select completed for:', ids.length, 'elements');
      } else {
        await invoke('clear_selection');
      }
      await loadAppState();
      
    } catch (error) {
      console.error('Failed to select multiple elements:', error);
      throw error;
    }
  };

  const addToSelection = async (id: string): Promise<void> => {
    try {
      console.log('Adding to selection:', id);
      await invoke('add_to_selection', { elementId: id });
      await loadAppState();
    } catch (error) {
      console.error('Failed to add to selection:', error);
      throw error;
    }
  };

  const removeFromSelection = async (id: string): Promise<void> => {
    try {
      console.log('Removing from selection:', id);
      await invoke('remove_from_selection', { elementId: id });
      await loadAppState();
    } catch (error) {
      console.error('Failed to remove from selection:', error);
      throw error;
    }
  };

  const toggleSelection = async (id: string): Promise<void> => {
    try {
      console.log('Toggling selection:', id);
      await invoke('toggle_selection', { elementId: id });
      await loadAppState();
    } catch (error) {
      console.error('Failed to toggle selection:', error);
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

  // 新增方法实现
  const copySelectedElements = async (): Promise<void> => {
    // 别名方法，指向 copySelected
    return copySelected();
  };

  const deleteElements = async (ids: string[]): Promise<void> => {
    try {
      setLoading(true);
      
      // 批量删除元素
      for (const id of ids) {
        await invoke('delete_element', { elementId: id });
      }
      
      await loadAppState();
    } catch (error) {
      console.error('Failed to delete elements:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const selectAllElements = async (): Promise<void> => {
    try {
      const allIds = state.elements.map(element => element.id);
      await selectMultiple(allIds);
    } catch (error) {
      console.error('Failed to select all elements:', error);
      throw error;
    }
  };

  const moveElements = async (ids: string[], deltaX: number, deltaY: number): Promise<void> => {
    try {
      setLoading(true);
      
      // 构建位置更新数组
      const updates = state.elements
        .filter(element => ids.includes(element.id))
        .map(element => ({
          element_id: element.id,
          new_position: {
            x: element.position.x + deltaX,
            y: element.position.y + deltaY
          }
        }));
      
      if (updates.length > 0) {
        await batchUpdatePositions(updates);
      }
    } catch (error) {
      console.error('Failed to move elements:', error);
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
    setState,
    createElement,
    updateElement,
    batchUpdatePositions,
    deleteElement,
    selectElement,
    selectMultiple,
    addToSelection,
    removeFromSelection,
    toggleSelection,
    clearSelection,
    copySelected,
    copySelectedElements,
    pasteElements,
    deleteElements,
    selectAllElements,
    moveElements,
    undo,
    redo,
    updateCanvasConfig,
    getElementsAtPoint,
    isLoading,
    setLoading,
    dragOperation,
    setDragOperation,
    resizeOperation,
    setResizeOperation,
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