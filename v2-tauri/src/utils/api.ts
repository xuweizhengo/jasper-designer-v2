import { invoke } from '@tauri-apps/api/tauri';
import type { 
  CreateElementRequest, 
  UpdateElementRequest, 
  UpdateCanvasConfigRequest,
  AppState,
  CanvasConfig 
} from '../types';

// Wrapper functions for Tauri commands with proper error handling

export async function createElement(request: CreateElementRequest): Promise<string> {
  try {
    return await invoke<string>('create_element', { request });
  } catch (error) {
    console.error('API: Failed to create element', error);
    throw new Error(`Failed to create element: ${error}`);
  }
}

export async function updateElement(request: UpdateElementRequest): Promise<void> {
  try {
    await invoke('update_element', { request });
  } catch (error) {
    console.error('API: Failed to update element', error);
    throw new Error(`Failed to update element: ${error}`);
  }
}

export async function deleteElement(elementId: string): Promise<void> {
  try {
    await invoke('delete_element', { elementId });
  } catch (error) {
    console.error('API: Failed to delete element', error);
    throw new Error(`Failed to delete element: ${error}`);
  }
}

export async function selectElement(elementId: string): Promise<void> {
  try {
    await invoke('select_element', { elementId });
  } catch (error) {
    console.error('API: Failed to select element', error);
    throw new Error(`Failed to select element: ${error}`);
  }
}

export async function clearSelection(): Promise<void> {
  try {
    await invoke('clear_selection');
  } catch (error) {
    console.error('API: Failed to clear selection', error);
    throw new Error(`Failed to clear selection: ${error}`);
  }
}

export async function getElementsAtPoint(x: number, y: number): Promise<string[]> {
  try {
    return await invoke<string[]>('get_elements_at_point', { x, y });
  } catch (error) {
    console.error('API: Failed to get elements at point', error);
    return [];
  }
}

export async function copySelected(): Promise<void> {
  try {
    await invoke('copy_selected');
  } catch (error) {
    console.error('API: Failed to copy selected elements', error);
    throw new Error(`Failed to copy selected elements: ${error}`);
  }
}

export async function pasteElements(offsetX: number, offsetY: number): Promise<string[]> {
  try {
    return await invoke<string[]>('paste_elements', { offsetX, offsetY });
  } catch (error) {
    console.error('API: Failed to paste elements', error);
    throw new Error(`Failed to paste elements: ${error}`);
  }
}

export async function undo(): Promise<void> {
  try {
    await invoke('undo');
  } catch (error) {
    console.error('API: Failed to undo', error);
    throw new Error(`Failed to undo: ${error}`);
  }
}

export async function redo(): Promise<void> {
  try {
    await invoke('redo');
  } catch (error) {
    console.error('API: Failed to redo', error);
    throw new Error(`Failed to redo: ${error}`);
  }
}

export async function getCanvasConfig(): Promise<CanvasConfig> {
  try {
    return await invoke<CanvasConfig>('get_canvas_config');
  } catch (error) {
    console.error('API: Failed to get canvas config', error);
    throw new Error(`Failed to get canvas config: ${error}`);
  }
}

export async function updateCanvasConfig(request: UpdateCanvasConfigRequest): Promise<void> {
  try {
    await invoke('update_canvas_config', { request });
  } catch (error) {
    console.error('API: Failed to update canvas config', error);
    throw new Error(`Failed to update canvas config: ${error}`);
  }
}

export async function screenToCanvas(screenX: number, screenY: number): Promise<[number, number]> {
  try {
    return await invoke<[number, number]>('screen_to_canvas', { screenX, screenY });
  } catch (error) {
    console.error('API: Failed to convert screen to canvas coordinates', error);
    return [screenX, screenY];
  }
}

export async function canvasToScreen(canvasX: number, canvasY: number): Promise<[number, number]> {
  try {
    return await invoke<[number, number]>('canvas_to_screen', { canvasX, canvasY });
  } catch (error) {
    console.error('API: Failed to convert canvas to screen coordinates', error);
    return [canvasX, canvasY];
  }
}

export async function snapToGrid(x: number, y: number): Promise<[number, number]> {
  try {
    return await invoke<[number, number]>('snap_to_grid', { x, y });
  } catch (error) {
    console.error('API: Failed to snap to grid', error);
    return [x, y];
  }
}

export async function getAppState(): Promise<AppState> {
  try {
    return await invoke<AppState>('get_app_state');
  } catch (error) {
    console.error('API: Failed to get app state', error);
    throw new Error(`Failed to get app state: ${error}`);
  }
}

// File operations
export async function saveTemplate(name: string, description?: string, filePath?: string): Promise<string> {
  try {
    return await invoke<string>('save_template', { 
      request: { name, description, file_path: filePath }
    });
  } catch (error) {
    console.error('API: Failed to save template', error);
    throw new Error(`Failed to save template: ${error}`);
  }
}

export async function loadTemplate(filePath: string): Promise<void> {
  try {
    await invoke('load_template', { request: { file_path: filePath } });
  } catch (error) {
    console.error('API: Failed to load template', error);
    throw new Error(`Failed to load template: ${error}`);
  }
}

export async function newTemplate(): Promise<void> {
  try {
    await invoke('new_template');
  } catch (error) {
    console.error('API: Failed to create new template', error);
    throw new Error(`Failed to create new template: ${error}`);
  }
}

export async function exportJson(): Promise<string> {
  try {
    return await invoke<string>('export_json');
  } catch (error) {
    console.error('API: Failed to export JSON', error);
    throw new Error(`Failed to export JSON: ${error}`);
  }
}

export async function getRecentTemplates(): Promise<string[]> {
  try {
    return await invoke<string[]>('get_recent_templates');
  } catch (error) {
    console.error('API: Failed to get recent templates', error);
    return [];
  }
}

// Utility functions
export function handleApiError(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}

export async function withLoading<T>(
  operation: () => Promise<T>,
  onLoading?: (loading: boolean) => void
): Promise<T> {
  try {
    onLoading?.(true);
    return await operation();
  } finally {
    onLoading?.(false);
  }
}