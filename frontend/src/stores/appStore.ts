import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { AppState, Element, CanvasConfig, MockDataSource } from '../types'

// Default canvas configuration
const defaultCanvasConfig: CanvasConfig = {
  width: 595,  // A4 width in pixels at 72 DPI
  height: 842, // A4 height in pixels at 72 DPI
  scale: 1.0,
  offsetX: 0,
  offsetY: 0,
  gridSize: 10,
  showGrid: true,
  showRuler: true,
  snapToGrid: true,
}

// Default mock data for bank receipt
const defaultMockData: MockDataSource = {
  fields: [
    { name: 'bankName', displayName: '银行名称', type: 'string', sampleValue: '中国工商银行' },
    { name: 'bankCode', displayName: '机构号', type: 'string', sampleValue: '102100024506' },
    { name: 'branchName', displayName: '开户行', type: 'string', sampleValue: '北京分行营业部' },
    { name: 'customerName', displayName: '客户姓名', type: 'string', sampleValue: '张三' },
    { name: 'accountNumber', displayName: '账户号码', type: 'string', sampleValue: '6222024200012345678' },
    { name: 'amount', displayName: '交易金额', type: 'number', sampleValue: 1280.50 },
    { name: 'transactionTime', displayName: '交易时间', type: 'date', sampleValue: '2024-01-15 14:30:25' },
    { name: 'transactionType', displayName: '交易类型', type: 'string', sampleValue: '网银转账' },
    { name: 'serialNumber', displayName: '流水号', type: 'string', sampleValue: '20240115001122334' },
    { name: 'fee', displayName: '手续费', type: 'number', sampleValue: 2.00 },
    { name: 'balance', displayName: '余额', type: 'number', sampleValue: 15240.30 },
    { name: 'remark', displayName: '备注', type: 'string', sampleValue: '工资发放' },
    { name: 'recipientName', displayName: '收款姓名', type: 'string', sampleValue: '李四' },
    { name: 'recipientAccount', displayName: '收款账户', type: 'string', sampleValue: '6222024200087654321' },
  ],
  sampleData: {
    bankName: '中国工商银行',
    bankCode: '102100024506',
    branchName: '北京分行营业部',
    customerName: '张三',
    accountNumber: '6222024200012345678',
    amount: 1280.50,
    transactionTime: '2024-01-15 14:30:25',
    transactionType: '网银转账',
    serialNumber: '20240115001122334',
    fee: 2.00,
    balance: 15240.30,
    remark: '工资发放',
    recipientName: '李四',
    recipientAccount: '6222024200087654321',
  }
}

interface AppStoreState {
  // Canvas state
  canvas: {
    config: CanvasConfig
    elements: Element[]
    selectedIds: string[]
  }
  
  // Mock data
  mockData: MockDataSource
  
  // UI state
  ui: {
    showGrid: boolean
    showRuler: boolean
    leftPanelWidth: number
    rightPanelWidth: number
    activePanel: 'components' | 'data' | 'templates'
    isDragging: boolean
    dragType?: 'component' | 'element' | 'resize'
    dragData?: any
  }
}

interface AppStoreActions {
  // Canvas actions
  updateCanvasConfig: (config: Partial<CanvasConfig>) => void
  addElement: (element: Element) => void
  updateElement: (id: string, props: Partial<Element>) => void
  deleteElement: (id: string) => void
  selectElements: (ids: string[]) => void
  clearSelection: () => void
  moveElements: (ids: string[], deltaX: number, deltaY: number) => void
  
  // UI actions
  setActivePanel: (panel: 'components' | 'data' | 'templates') => void
  toggleGrid: () => void
  toggleRuler: () => void
  setDragging: (isDragging: boolean, dragType?: 'component' | 'element' | 'resize', dragData?: any) => void
  
  // Utility actions
  getElementById: (id: string) => Element | undefined
  getSelectedElements: () => Element[]
  generateElementId: () => string
}

type AppStore = AppStoreState & AppStoreActions

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    canvas: {
      config: defaultCanvasConfig,
      elements: [],
      selectedIds: [],
    },
    
    mockData: defaultMockData,
    
    ui: {
      showGrid: true,
      showRuler: true,
      leftPanelWidth: 280,
      rightPanelWidth: 320,
      activePanel: 'components',
      isDragging: false,
    },
    
    // Actions
    updateCanvasConfig: (config) => {
      set((state) => ({
        canvas: {
          ...state.canvas,
          config: { ...state.canvas.config, ...config }
        }
      }))
    },
    
    addElement: (element) => {
      set((state) => ({
        canvas: {
          ...state.canvas,
          elements: [...state.canvas.elements, element],
          selectedIds: [element.id],
        }
      }))
    },
    
    updateElement: (id, props) => {
      set((state) => ({
        canvas: {
          ...state.canvas,
          elements: state.canvas.elements.map((el) =>
            el.id === id ? { ...el, ...props } : el
          ),
        }
      }))
    },
    
    deleteElement: (id) => {
      set((state) => ({
        canvas: {
          ...state.canvas,
          elements: state.canvas.elements.filter((el) => el.id !== id),
          selectedIds: state.canvas.selectedIds.filter((selectedId) => selectedId !== id),
        }
      }))
    },
    
    selectElements: (ids) => {
      set((state) => ({
        canvas: {
          ...state.canvas,
          selectedIds: ids,
        }
      }))
    },
    
    clearSelection: () => {
      set((state) => ({
        canvas: {
          ...state.canvas,
          selectedIds: [],
        }
      }))
    },
    
    moveElements: (ids, deltaX, deltaY) => {
      set((state) => ({
        canvas: {
          ...state.canvas,
          elements: state.canvas.elements.map((el) =>
            ids.includes(el.id)
              ? {
                  ...el,
                  props: {
                    ...el.props,
                    x: el.props.x + deltaX,
                    y: el.props.y + deltaY,
                  }
                }
              : el
          ),
        }
      }))
    },
    
    setActivePanel: (panel) => {
      set((state) => ({
        ui: {
          ...state.ui,
          activePanel: panel,
        }
      }))
    },
    
    toggleGrid: () => {
      set((state) => ({
        ui: {
          ...state.ui,
          showGrid: !state.ui.showGrid,
        },
        canvas: {
          ...state.canvas,
          config: {
            ...state.canvas.config,
            showGrid: !state.ui.showGrid,
          }
        }
      }))
    },
    
    toggleRuler: () => {
      set((state) => ({
        ui: {
          ...state.ui,
          showRuler: !state.ui.showRuler,
        },
        canvas: {
          ...state.canvas,
          config: {
            ...state.canvas.config,
            showRuler: !state.ui.showRuler,
          }
        }
      }))
    },
    
    setDragging: (isDragging, dragType, dragData) => {
      set((state) => ({
        ui: {
          ...state.ui,
          isDragging,
          dragType,
          dragData,
        }
      }))
    },
    
    // Utility functions
    getElementById: (id) => {
      const state = get()
      return state.canvas.elements.find((el) => el.id === id)
    },
    
    getSelectedElements: () => {
      const state = get()
      return state.canvas.elements.filter((el) => 
        state.canvas.selectedIds.includes(el.id)
      )
    },
    
    generateElementId: () => {
      return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
  }))
)

// History management with undo/redo
interface HistoryState {
  past: AppStoreState[]
  future: AppStoreState[]
  canUndo: boolean
  canRedo: boolean
}

interface HistoryActions {
  undo: () => void
  redo: () => void
  saveToHistory: () => void
  clearHistory: () => void
}

type HistoryStore = HistoryState & HistoryActions

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,
  
  undo: () => {
    const { past, future } = get()
    if (past.length === 0) return
    
    const previous = past[past.length - 1]
    const newPast = past.slice(0, past.length - 1)
    
    // Get current state from main store
    const currentState = useAppStore.getState()
    const newFuture = [
      {
        canvas: currentState.canvas,
        mockData: currentState.mockData,
        ui: currentState.ui,
      },
      ...future
    ]
    
    // Restore previous state to main store
    useAppStore.setState(previous)
    
    set({
      past: newPast,
      future: newFuture,
      canUndo: newPast.length > 0,
      canRedo: true,
    })
  },
  
  redo: () => {
    const { past, future } = get()
    if (future.length === 0) return
    
    const next = future[0]
    const newFuture = future.slice(1)
    
    // Get current state from main store
    const currentState = useAppStore.getState()
    const newPast = [
      ...past,
      {
        canvas: currentState.canvas,
        mockData: currentState.mockData,
        ui: currentState.ui,
      }
    ]
    
    // Restore next state to main store
    useAppStore.setState(next)
    
    set({
      past: newPast,
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
    })
  },
  
  saveToHistory: () => {
    const currentState = useAppStore.getState()
    const { past } = get()
    
    const stateToSave = {
      canvas: currentState.canvas,
      mockData: currentState.mockData,
      ui: currentState.ui,
    }
    
    // Limit history size to 50 entries
    const newPast = [...past, stateToSave].slice(-50)
    
    set({
      past: newPast,
      future: [], // Clear future when new action is performed
      canUndo: true,
      canRedo: false,
    })
  },
  
  clearHistory: () => {
    set({
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
    })
  },
}))

// Subscribe to main store changes and save to history
// Only save significant changes, not UI state changes
useAppStore.subscribe(
  (state) => state.canvas,
  () => {
    // Debounce history saving
    const saveToHistory = useHistoryStore.getState().saveToHistory
    setTimeout(saveToHistory, 500)
  },
  { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
)