// Type definitions that mirror Rust types

// ElementId is serialized as a string from Rust
export type ElementId = string;

export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface TextStyle {
  readonly font_family: string;
  readonly font_size: number;
  readonly font_weight: string;
  readonly color: string;
  readonly align: TextAlign;
  // Phase 1新增: 边框和背景支持
  readonly border?: {
    readonly color: string;
    readonly width: number;
    readonly style: BorderStyleType;
    readonly radius?: number;
  };
  readonly background?: {
    readonly color: string;
    readonly opacity?: number;
    readonly padding?: number;
  };
}

export type TextAlign = 'Left' | 'Center' | 'Right';

export interface BorderStyle {
  readonly color: string;
  readonly width: number;
  readonly style: BorderStyleType;
}

export type BorderStyleType = 'Solid' | 'Dashed' | 'Dotted';

export type LineCapType = 'None' | 'Arrow' | 'Circle' | 'Square';

export type LineStyleType = 'Solid' | 'Dashed' | 'Dotted' | 'DashDot';

export type ElementContent = 
  | { type: 'Text'; content: string; style: TextStyle }
  | { type: 'Image'; src: string; alt?: string }
  | { 
      type: 'Rectangle'; 
      fill_color?: string; 
      border?: BorderStyle; 
      corner_radius?: number; 
      opacity?: number; 
    }
  | { 
      type: 'Line'; 
      color: string; 
      width: number; 
      line_style?: LineStyleType;
      start_cap?: LineCapType;
      end_cap?: LineCapType;
      opacity?: number;
    }
  | { type: 'DataField'; expression: string; format?: string; style: TextStyle };

export interface ReportElement {
  readonly id: ElementId;
  readonly position: Position;
  readonly size: Size;
  readonly content: ElementContent;
  readonly z_index: number;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly name?: string;
}

export interface CanvasConfig {
  readonly width: number;
  readonly height: number;
  readonly zoom: number;
  readonly offset_x: number;
  readonly offset_y: number;
  readonly show_grid: boolean;
  readonly show_rulers: boolean;
  readonly grid_size: number;
  readonly snap_to_grid: boolean;
  readonly background_color: string;
}

export interface AppState {
  readonly elements: ReadonlyArray<ReportElement>;
  readonly selected_ids: ReadonlyArray<string>;
  readonly canvas_config: CanvasConfig;
  readonly can_undo: boolean;
  readonly can_redo: boolean;
  readonly undo_description?: string;
  readonly redo_description?: string;
  readonly dirty: boolean;
  readonly template_name?: string;
}

// UI Component types
export interface DragOperation {
  readonly type: 'move' | 'resize' | 'create';
  readonly element_ids: ReadonlyArray<string>;
  readonly start_position: Position;
  readonly current_position: Position;
  readonly offset: Position;
}

export interface SelectionBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ComponentDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: 'basic' | 'data' | 'bank';
  readonly icon: string;
  readonly description: string;
  readonly default_size: Size;
  readonly create_content: (data?: any) => ElementContent;
}

// Command types for Tauri API
export interface CreateElementRequest {
  readonly element_type: string;
  readonly position: Position;
  readonly size: Size;
  readonly content_data: Record<string, any>;
}

export interface UpdateElementRequest {
  readonly id: string;
  readonly updates: Record<string, any>;
}

export interface UpdateCanvasConfigRequest {
  readonly width?: number;
  readonly height?: number;
  readonly zoom?: number;
  readonly offset_x?: number;
  readonly offset_y?: number;
  readonly show_grid?: boolean;
  readonly show_rulers?: boolean;
  readonly grid_size?: number;
  readonly snap_to_grid?: boolean;
  readonly background_color?: string;
}

// Event types
export interface CanvasEvent {
  readonly type: 'click' | 'mousedown' | 'mouseup' | 'mousemove' | 'drag' | 'drop';
  readonly position: Position;
  readonly element_id?: string;
  readonly modifiers: {
    readonly ctrl: boolean;
    readonly shift: boolean;
    readonly alt: boolean;
  };
}

export interface KeyboardEvent {
  readonly key: string;
  readonly modifiers: {
    readonly ctrl: boolean;
    readonly shift: boolean;
    readonly alt: boolean;
  };
}

// Utility types
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type NonEmptyArray<T> = [T, ...T[]];

// Error types
export interface AppError {
  readonly type: string;
  readonly message: string;
  readonly details?: Record<string, any>;
}