/**
 * 🏢 企业级报表设计器完整架构设计
 * 
 * 设计目标：
 * 1. 支持复杂业务组件（文本框、表格、图表、子报表等）
 * 2. 数据源对接和数据绑定系统
 * 3. 多格式报表导出能力
 * 4. 实时渲染和数据刷新
 * 5. 完整的插件系统和扩展能力
 * 6. 企业级特性（权限、模板、版本控制）
 */

// ================================
// 第一层：基础设施层 (Infrastructure Layer)
// ================================

/**
 * 事件总线 - 企业级事件管理
 */
export interface EnterpriseEventBus extends EventBus {
  // 事件命名空间支持
  emitNamespaced<T>(namespace: string, event: string, payload: T): void;
  onNamespaced<T>(namespace: string, event: string, handler: (payload: T) => void): () => void;
  
  // 事件持久化和重放
  persistEvent(event: string, payload: any): void;
  replayEvents(fromTimestamp?: number): void;
  
  // 事件监控和统计
  getEventStats(): EventStats;
  enableEventMonitoring(enabled: boolean): void;
}

/**
 * 数据引擎 - 统一的数据管理
 */
export interface DataEngine {
  // 数据源管理
  registerDataSource(id: string, dataSource: DataSource): void;
  getDataSource(id: string): DataSource | null;
  testConnection(dataSourceId: string): Promise<ConnectionResult>;
  
  // 数据查询和缓存
  executeQuery(dataSourceId: string, query: DataQuery): Promise<DataResult>;
  getCachedData(cacheKey: string): DataResult | null;
  invalidateCache(pattern?: string): void;
  
  // 实时数据订阅
  subscribeToData(subscription: DataSubscription): () => void;
  unsubscribeFromData(subscriptionId: string): void;
  
  // 数据变换和处理
  transformData(data: any[], transformer: DataTransformer): any[];
  aggregateData(data: any[], aggregation: DataAggregation): any;
}

/**
 * 渲染引擎 - 支持多种渲染模式
 */
export interface AdvancedRenderEngine extends RenderEngine {
  // 渲染模式
  setRenderMode(mode: RenderMode): void; // 'design' | 'preview' | 'print' | 'export'
  getRenderMode(): RenderMode;
  
  // 性能优化
  enableVirtualization(enabled: boolean): void;
  setRenderBatch(size: number): void;
  
  // 多格式输出
  exportToSVG(): string;
  exportToPDF(): Promise<Blob>;
  exportToImage(format: 'png' | 'jpg', dpi?: number): Promise<Blob>;
  
  // 实时渲染
  enableRealTimeRendering(enabled: boolean): void;
  scheduleRender(priority: 'high' | 'medium' | 'low'): void;
}

/**
 * 模板引擎 - 企业级模板管理
 */
export interface TemplateEngine {
  // 模板CRUD
  createTemplate(template: ReportTemplate): Promise<string>;
  getTemplate(id: string): Promise<ReportTemplate | null>;
  updateTemplate(id: string, updates: Partial<ReportTemplate>): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
  
  // 模板分类和搜索
  listTemplates(category?: string, tags?: string[]): Promise<ReportTemplate[]>;
  searchTemplates(query: string): Promise<ReportTemplate[]>;
  
  // 模板版本控制
  createTemplateVersion(templateId: string, version: TemplateVersion): Promise<string>;
  getTemplateVersions(templateId: string): Promise<TemplateVersion[]>;
  revertToVersion(templateId: string, versionId: string): Promise<void>;
  
  // 模板继承和组合
  extendTemplate(baseTemplateId: string, overrides: TemplateOverrides): Promise<ReportTemplate>;
  composeTemplate(components: TemplateComponent[]): Promise<ReportTemplate>;
}

// ================================
// 第二层：数据层 (Data Layer)
// ================================

/**
 * 数据源接口 - 支持多种数据源
 */
export interface DataSource {
  id: string;
  type: DataSourceType; // 'sql' | 'rest' | 'graphql' | 'file' | 'mock' | 'realtime'
  name: string;
  config: DataSourceConfig;
  
  // 连接管理
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // 数据操作
  query(query: DataQuery): Promise<DataResult>;
  getSchema(): Promise<DataSchema>;
  
  // 实时能力
  supportsRealTime(): boolean;
  subscribe(subscription: DataSubscription): Promise<string>;
  unsubscribe(subscriptionId: string): Promise<void>;
}

/**
 * SQL数据源实现
 */
export class SqlDataSource implements DataSource {
  type: DataSourceType = 'sql';
  
  constructor(private config: SqlDataSourceConfig) {}
  
  async query(query: DataQuery): Promise<DataResult> {
    // SQL查询执行
    const sqlQuery = this.buildSqlQuery(query);
    const result = await this.executeQuery(sqlQuery);
    return this.transformResult(result);
  }
  
  private buildSqlQuery(query: DataQuery): string {
    // 动态SQL构建，支持参数绑定
    return this.applyQueryBuilder(query);
  }
}

/**
 * REST API数据源实现
 */
export class RestDataSource implements DataSource {
  type: DataSourceType = 'rest';
  
  async query(query: DataQuery): Promise<DataResult> {
    const request = this.buildRestRequest(query);
    const response = await fetch(request.url, request.options);
    return this.parseResponse(response);
  }
  
  supportsRealTime(): boolean {
    return this.config.websocketUrl != null;
  }
}

/**
 * 数据绑定管理器
 */
export class DataBindingManager {
  private bindings = new Map<string, DataBinding>();
  private subscriptions = new Map<string, string>();
  
  /**
   * 绑定元素到数据源
   */
  bindElement(elementId: string, binding: DataBinding): void {
    this.bindings.set(elementId, binding);
    
    // 如果是实时数据，建立订阅
    if (binding.realTime) {
      this.subscribeToRealTimeData(elementId, binding);
    }
  }
  
  /**
   * 获取元素的当前数据
   */
  async getElementData(elementId: string): Promise<any> {
    const binding = this.bindings.get(elementId);
    if (!binding) return null;
    
    const dataSource = this.dataEngine.getDataSource(binding.dataSourceId);
    if (!dataSource) return null;
    
    const result = await dataSource.query(binding.query);
    return this.applyDataMapping(result.data, binding.mapping);
  }
  
  /**
   * 实时数据订阅
   */
  private async subscribeToRealTimeData(elementId: string, binding: DataBinding): Promise<void> {
    const dataSource = this.dataEngine.getDataSource(binding.dataSourceId);
    if (!dataSource?.supportsRealTime()) return;
    
    const subscriptionId = await dataSource.subscribe({
      query: binding.query,
      callback: (data) => {
        this.eventBus.emit('data:updated', { elementId, data });
      }
    });
    
    this.subscriptions.set(elementId, subscriptionId);
  }
}

// ================================
// 第三层：组件层 (Component Layer) 
// ================================

/**
 * 企业组件接口 - 支持数据绑定和复杂交互
 */
export interface EnterpriseComponent extends RenderableElement {
  // 数据绑定能力
  dataBinding?: DataBinding;
  supportsDataBinding(): boolean;
  updateData(data: any): void;
  
  // 交互能力
  interactions?: ComponentInteraction[];
  addEventListener(event: string, handler: Function): void;
  removeEventListener(event: string, handler: Function): void;
  
  // 子组件支持
  children?: EnterpriseComponent[];
  addChild(child: EnterpriseComponent): void;
  removeChild(childId: string): void;
  
  // 生命周期
  onMount?(): void;
  onUnmount?(): void;
  onDataUpdate?(data: any): void;
  onResize?(size: Size): void;
}

/**
 * 数据绑定文本框组件
 */
export class DataBoundTextComponent implements EnterpriseComponent {
  id: string;
  type = 'DataBoundText';
  dataBinding?: DataBinding;
  
  constructor(config: DataBoundTextConfig) {
    this.id = config.id;
    this.dataBinding = config.dataBinding;
  }
  
  supportsDataBinding(): boolean {
    return true;
  }
  
  updateData(data: any): void {
    // 数据更新时重新渲染文本内容
    const text = this.formatData(data);
    this.updateTextContent(text);
    
    // 触发重新渲染
    this.eventBus.emit('component:dataUpdated', { 
      componentId: this.id, 
      newData: data 
    });
  }
  
  render(context: RenderContext): SVGElement {
    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    
    // 如果有数据绑定，显示动态内容；否则显示占位符
    const content = this.dataBinding ? 
      this.getCurrentDataValue() : 
      this.config.placeholder || '[数据绑定文本]';
      
    textElement.textContent = content;
    
    // 应用样式和格式化
    this.applyTextStyling(textElement);
    
    return textElement;
  }
  
  private formatData(data: any): string {
    // 支持多种数据格式化：日期、数字、货币等
    if (this.config.format) {
      return this.dataFormatter.format(data, this.config.format);
    }
    return String(data);
  }
}

/**
 * 表格组件 - 支持复杂表格渲染
 */
export class TableComponent implements EnterpriseComponent {
  id: string;
  type = 'Table';
  dataBinding?: DataBinding;
  
  constructor(private config: TableConfig) {
    this.id = config.id;
    this.dataBinding = config.dataBinding;
  }
  
  supportsDataBinding(): boolean {
    return true;
  }
  
  updateData(data: any[]): void {
    this.tableData = data;
    this.rebuildTable();
  }
  
  render(context: RenderContext): SVGElement {
    const tableGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // 渲染表头
    const header = this.renderTableHeader();
    tableGroup.appendChild(header);
    
    // 渲染表格数据行
    const rows = this.renderTableRows();
    rows.forEach(row => tableGroup.appendChild(row));
    
    // 渲染表格边框和网格线
    const borders = this.renderTableBorders();
    tableGroup.appendChild(borders);
    
    return tableGroup;
  }
  
  private renderTableHeader(): SVGElement {
    // 基于配置的列定义渲染表头
    const headerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    this.config.columns.forEach((column, index) => {
      const headerCell = this.createHeaderCell(column, index);
      headerGroup.appendChild(headerCell);
    });
    
    return headerGroup;
  }
  
  private renderTableRows(): SVGElement[] {
    // 基于数据渲染表格行
    return this.tableData.map((rowData, rowIndex) => {
      return this.renderTableRow(rowData, rowIndex);
    });
  }
}

/**
 * 图表组件 - 集成图表库
 */
export class ChartComponent implements EnterpriseComponent {
  id: string;
  type = 'Chart';
  dataBinding?: DataBinding;
  
  constructor(private config: ChartConfig) {
    this.id = config.id;
    this.dataBinding = config.dataBinding;
  }
  
  updateData(data: any[]): void {
    this.chartData = this.transformDataForChart(data);
    this.rerenderChart();
  }
  
  render(context: RenderContext): SVGElement {
    // 使用Chart.js、D3.js或其他图表库渲染
    const chartContainer = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    
    // 创建HTML容器用于图表
    const htmlContainer = document.createElement('div');
    htmlContainer.style.width = `${this.config.width}px`;
    htmlContainer.style.height = `${this.config.height}px`;
    
    // 初始化图表
    this.initChart(htmlContainer);
    
    chartContainer.appendChild(htmlContainer);
    return chartContainer;
  }
  
  private initChart(container: HTMLElement): void {
    // 根据图表类型初始化相应的图表库
    switch (this.config.chartType) {
      case 'bar':
        this.initBarChart(container);
        break;
      case 'line':
        this.initLineChart(container);
        break;
      case 'pie':
        this.initPieChart(container);
        break;
      default:
        console.warn(`Unsupported chart type: ${this.config.chartType}`);
    }
  }
}

/**
 * 子报表组件 - 支持嵌套报表
 */
export class SubReportComponent implements EnterpriseComponent {
  id: string;
  type = 'SubReport';
  dataBinding?: DataBinding;
  
  constructor(private config: SubReportConfig) {
    this.id = config.id;
    this.dataBinding = config.dataBinding;
  }
  
  render(context: RenderContext): SVGElement {
    // 递归渲染子报表
    const subReportGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // 加载子报表模板
    const subTemplate = this.templateEngine.getTemplate(this.config.templateId);
    if (!subTemplate) {
      return this.renderPlaceholder();
    }
    
    // 创建子报表上下文
    const subContext = this.createSubReportContext(context);
    
    // 渲染子报表元素
    subTemplate.elements.forEach(element => {
      const renderedElement = this.renderSubReportElement(element, subContext);
      subReportGroup.appendChild(renderedElement);
    });
    
    return subReportGroup;
  }
  
  private createSubReportContext(parentContext: RenderContext): RenderContext {
    return {
      ...parentContext,
      parentReportId: parentContext.reportId,
      reportId: this.config.templateId,
      dataContext: this.getSubReportData(),
      isSubReport: true
    };
  }
}

// ================================
// 第四层：渲染引擎层 (Rendering Engine Layer)
// ================================

/**
 * 实时渲染管理器
 */
export class RealTimeRenderManager {
  private renderQueue = new Map<string, RenderTask>();
  private isRendering = false;
  
  constructor(
    private renderEngine: AdvancedRenderEngine,
    private eventBus: EnterpriseEventBus
  ) {
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // 监听数据更新事件
    this.eventBus.on('data:updated', (event) => {
      this.scheduleRender(event.elementId, 'high');
    });
    
    // 监听组件更新事件
    this.eventBus.on('component:updated', (event) => {
      this.scheduleRender(event.componentId, 'medium');
    });
  }
  
  scheduleRender(elementId: string, priority: 'high' | 'medium' | 'low'): void {
    const task: RenderTask = {
      elementId,
      priority,
      timestamp: Date.now()
    };
    
    this.renderQueue.set(elementId, task);
    
    if (!this.isRendering) {
      this.processRenderQueue();
    }
  }
  
  private async processRenderQueue(): Promise<void> {
    this.isRendering = true;
    
    while (this.renderQueue.size > 0) {
      // 按优先级排序任务
      const tasks = Array.from(this.renderQueue.values())
        .sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));
      
      const task = tasks[0];
      this.renderQueue.delete(task.elementId);
      
      await this.renderElement(task.elementId);
      
      // 让出控制权，避免阻塞UI
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    this.isRendering = false;
  }
  
  private async renderElement(elementId: string): Promise<void> {
    // 获取元素的最新数据并重新渲染
    const element = this.elementManager.getElement(elementId);
    if (!element) return;
    
    if (this.supportsDataBinding(element)) {
      const newData = await this.dataBindingManager.getElementData(elementId);
      element.updateData(newData);
    }
    
    // 通知渲染引擎更新该元素
    this.renderEngine.updateElement(elementId, element);
  }
}

/**
 * 导出引擎 - 多格式报表导出
 */
export class ReportExportEngine {
  private exporters = new Map<ExportFormat, ReportExporter>();
  
  constructor() {
    this.registerDefaultExporters();
  }
  
  private registerDefaultExporters(): void {
    this.exporters.set('pdf', new PDFExporter());
    this.exporters.set('excel', new ExcelExporter());
    this.exporters.set('word', new WordExporter());
    this.exporters.set('image', new ImageExporter());
    this.exporters.set('html', new HTMLExporter());
  }
  
  async exportReport(
    report: ReportDefinition, 
    format: ExportFormat, 
    options?: ExportOptions
  ): Promise<ExportResult> {
    const exporter = this.exporters.get(format);
    if (!exporter) {
      throw new Error(`Unsupported export format: ${format}`);
    }
    
    // 预处理：解析数据绑定，获取实际数据
    const resolvedReport = await this.resolveReportData(report);
    
    // 导出
    const result = await exporter.export(resolvedReport, options);
    
    // 后处理：添加水印、签名等
    return this.postProcessExport(result, options);
  }
  
  private async resolveReportData(report: ReportDefinition): Promise<ResolvedReport> {
    const resolvedElements = await Promise.all(
      report.elements.map(async (element) => {
        if (this.hasDataBinding(element)) {
          const data = await this.dataBindingManager.getElementData(element.id);
          return { ...element, resolvedData: data };
        }
        return element;
      })
    );
    
    return { ...report, elements: resolvedElements };
  }
}

/**
 * PDF导出器
 */
export class PDFExporter implements ReportExporter {
  async export(report: ResolvedReport, options?: ExportOptions): Promise<ExportResult> {
    // 使用jsPDF或其他PDF库
    const pdf = new jsPDF(options?.pageFormat || 'a4');
    
    // 渲染报表元素到PDF
    for (const element of report.elements) {
      await this.renderElementToPDF(pdf, element);
    }
    
    const blob = pdf.output('blob');
    
    return {
      format: 'pdf',
      blob,
      filename: this.generateFilename(report, 'pdf'),
      success: true
    };
  }
  
  private async renderElementToPDF(pdf: any, element: ResolvedReportElement): Promise<void> {
    switch (element.type) {
      case 'Text':
      case 'DataBoundText':
        this.renderTextToPDF(pdf, element);
        break;
      case 'Table':
        this.renderTableToPDF(pdf, element);
        break;
      case 'Chart':
        await this.renderChartToPDF(pdf, element);
        break;
      case 'Image':
        await this.renderImageToPDF(pdf, element);
        break;
    }
  }
}

// ================================
// 第五层：插件系统层 (Plugin System Layer)
// ================================

/**
 * 企业级插件管理器
 */
export class EnterprisePluginManager implements PluginManager {
  private plugins = new Map<string, EnterprisePlugin>();
  private pluginHooks = new Map<string, PluginHook[]>();
  private pluginSandbox = new PluginSandbox();
  
  /**
   * 加载插件 - 支持热加载和沙箱隔离
   */
  async loadPlugin(plugin: EnterprisePlugin): Promise<void> {
    // 验证插件签名和权限
    await this.validatePlugin(plugin);
    
    // 在沙箱中初始化插件
    const sandboxContext = this.pluginSandbox.createContext(plugin.id);
    await plugin.install(sandboxContext);
    
    // 注册插件提供的能力
    this.registerPluginCapabilities(plugin);
    
    // 注册插件的钩子
    this.registerPluginHooks(plugin);
    
    this.plugins.set(plugin.id, plugin);
    
    this.eventBus.emit('plugin:loaded', { pluginId: plugin.id });
  }
  
  /**
   * 注册钩子 - 允许插件在特定时机介入
   */
  registerHook(hookName: string, callback: PluginHookCallback): void {
    if (!this.pluginHooks.has(hookName)) {
      this.pluginHooks.set(hookName, []);
    }
    
    this.pluginHooks.get(hookName)!.push({
      callback,
      priority: 100 // 默认优先级
    });
  }
  
  /**
   * 触发钩子 - 按优先级顺序执行
   */
  async triggerHook(hookName: string, context: any): Promise<any> {
    const hooks = this.pluginHooks.get(hookName) || [];
    
    // 按优先级排序
    hooks.sort((a, b) => b.priority - a.priority);
    
    let result = context;
    
    for (const hook of hooks) {
      try {
        result = await hook.callback(result) || result;
      } catch (error) {
        console.error(`Hook ${hookName} failed:`, error);
      }
    }
    
    return result;
  }
}

/**
 * 插件钩子定义 - 预留的扩展点
 */
export const PLUGIN_HOOKS = {
  // 组件生命周期钩子
  BEFORE_COMPONENT_RENDER: 'before_component_render',
  AFTER_COMPONENT_RENDER: 'after_component_render',
  COMPONENT_DATA_UPDATED: 'component_data_updated',
  
  // 数据处理钩子
  BEFORE_DATA_FETCH: 'before_data_fetch',
  AFTER_DATA_FETCH: 'after_data_fetch',
  DATA_TRANSFORM: 'data_transform',
  
  // 渲染钩子
  BEFORE_RENDER: 'before_render',
  AFTER_RENDER: 'after_render',
  RENDER_OPTIMIZE: 'render_optimize',
  
  // 导出钩子
  BEFORE_EXPORT: 'before_export',
  AFTER_EXPORT: 'after_export',
  EXPORT_CUSTOMIZE: 'export_customize',
  
  // 交互钩子
  BEFORE_INTERACTION: 'before_interaction',
  AFTER_INTERACTION: 'after_interaction',
  
  // 权限钩子
  CHECK_PERMISSION: 'check_permission',
  FILTER_DATA: 'filter_data',
  
  // 自定义钩子
  CUSTOM_ELEMENT_TYPE: 'custom_element_type',
  CUSTOM_DATA_SOURCE: 'custom_data_source',
  CUSTOM_EXPORTER: 'custom_exporter'
};

/**
 * 插件开发示例 - 自定义图表插件
 */
export class CustomChartPlugin implements EnterprisePlugin {
  id = 'custom-chart-plugin';
  name = 'Custom Chart Plugin';
  version = '1.0.0';
  author = 'Enterprise Team';
  description = 'Adds support for custom enterprise charts';
  
  capabilities: EnterprisePluginCapability[] = [
    {
      type: 'component',
      componentType: 'CustomBarChart',
      factory: new CustomBarChartFactory(),
      selectionStrategy: new ChartSelectionStrategy(),
      exportSupport: ['pdf', 'image', 'excel']
    },
    {
      type: 'data-transformer',
      name: 'ChartDataAggregator',
      transformer: new ChartDataAggregator()
    }
  ];
  
  async install(context: PluginContext): Promise<void> {
    // 注册自定义组件
    context.componentRegistry.register('CustomBarChart', new CustomBarChartFactory());
    
    // 注册数据转换器
    context.dataEngine.registerTransformer('chart-aggregator', new ChartDataAggregator());
    
    // 注册钩子
    context.pluginManager.registerHook(PLUGIN_HOOKS.DATA_TRANSFORM, async (data) => {
      if (data.targetComponent === 'CustomBarChart') {
        return this.transformDataForChart(data);
      }
      return data;
    });
    
    // 注册导出支持
    context.exportEngine.registerCustomRenderer('CustomBarChart', this.renderChartForExport);
  }
  
  private async transformDataForChart(data: any): Promise<any> {
    // 自定义图表数据转换逻辑
    return this.aggregateChartData(data);
  }
  
  private async renderChartForExport(element: any, format: ExportFormat): Promise<any> {
    // 自定义图表导出渲染逻辑
    return this.generateChartImage(element, format);
  }
}

// ================================
// 第六层：应用层 (Application Layer)
// ================================

/**
 * 企业级报表设计器主应用
 */
export class EnterpriseReportDesigner {
  private eventBus: EnterpriseEventBus;
  private dataEngine: DataEngine;
  private templateEngine: TemplateEngine;
  private renderEngine: AdvancedRenderEngine;
  private pluginManager: EnterprisePluginManager;
  private exportEngine: ReportExportEngine;
  private realTimeManager: RealTimeRenderManager;
  private securityManager: SecurityManager;
  
  constructor(config: EnterpriseConfig) {
    this.initializeCore(config);
    this.setupEventHandlers();
    this.loadCorePlugins();
    this.initializeSecurity(config.security);
  }
  
  private initializeCore(config: EnterpriseConfig): void {
    this.eventBus = new EnterpriseEventBusImpl();
    this.dataEngine = new DataEngineImpl(config.dataSources);
    this.templateEngine = new TemplateEngineImpl();
    this.renderEngine = new AdvancedRenderEngineImpl();
    this.pluginManager = new EnterprisePluginManager();
    this.exportEngine = new ReportExportEngine();
    this.realTimeManager = new RealTimeRenderManager(this.renderEngine, this.eventBus);
    this.securityManager = new SecurityManager(config.security);
  }
  
  /**
   * 创建新报表
   */
  async createReport(templateId?: string): Promise<string> {
    const reportId = this.generateReportId();
    
    // 触发钩子：报表创建前
    await this.pluginManager.triggerHook(PLUGIN_HOOKS.BEFORE_REPORT_CREATE, {
      reportId,
      templateId
    });
    
    let report: ReportDefinition;
    
    if (templateId) {
      // 基于模板创建
      const template = await this.templateEngine.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }
      report = this.createReportFromTemplate(template, reportId);
    } else {
      // 创建空白报表
      report = this.createBlankReport(reportId);
    }
    
    // 保存报表
    await this.saveReport(report);
    
    // 触发钩子：报表创建后
    await this.pluginManager.triggerHook(PLUGIN_HOOKS.AFTER_REPORT_CREATE, {
      reportId,
      report
    });
    
    return reportId;
  }
  
  /**
   * 预览报表
   */
  async previewReport(reportId: string, dataContext?: any): Promise<PreviewResult> {
    const report = await this.getReport(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }
    
    // 权限检查
    await this.securityManager.checkPermission('report:preview', reportId);
    
    // 设置预览模式
    this.renderEngine.setRenderMode('preview');
    
    // 解析数据绑定
    const resolvedReport = await this.resolveReportData(report, dataContext);
    
    // 渲染报表
    const renderResult = await this.renderEngine.renderReport(resolvedReport);
    
    return {
      reportId,
      html: renderResult.html,
      css: renderResult.css,
      scripts: renderResult.scripts,
      metadata: {
        renderTime: renderResult.renderTime,
        elementCount: resolvedReport.elements.length,
        dataSourcesUsed: this.getUsedDataSources(resolvedReport)
      }
    };
  }
  
  /**
   * 导出报表
   */
  async exportReport(
    reportId: string, 
    format: ExportFormat,
    options?: ExportOptions
  ): Promise<ExportResult> {
    const report = await this.getReport(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }
    
    // 权限检查
    await this.securityManager.checkPermission('report:export', reportId);
    
    // 触发导出前钩子
    const exportContext = await this.pluginManager.triggerHook(PLUGIN_HOOKS.BEFORE_EXPORT, {
      reportId,
      format,
      options,
      report
    });
    
    // 执行导出
    const result = await this.exportEngine.exportReport(
      exportContext.report,
      exportContext.format,
      exportContext.options
    );
    
    // 触发导出后钩子
    await this.pluginManager.triggerHook(PLUGIN_HOOKS.AFTER_EXPORT, {
      reportId,
      format,
      result
    });
    
    return result;
  }
  
  /**
   * 加载核心插件
   */
  private async loadCorePlugins(): Promise<void> {
    // 基础组件插件
    await this.pluginManager.loadPlugin(new CoreComponentsPlugin());
    
    // 数据源插件
    await this.pluginManager.loadPlugin(new CoreDataSourcesPlugin());
    
    // 导出插件
    await this.pluginManager.loadPlugin(new CoreExportersPlugin());
    
    // 企业功能插件
    await this.pluginManager.loadPlugin(new EnterpriseSecurityPlugin());
    await this.pluginManager.loadPlugin(new EnterpriseCollaborationPlugin());
  }
}

// ================================
// 类型定义
// ================================

export type RenderMode = 'design' | 'preview' | 'print' | 'export';
export type DataSourceType = 'sql' | 'rest' | 'graphql' | 'file' | 'mock' | 'realtime';
export type ExportFormat = 'pdf' | 'excel' | 'word' | 'image' | 'html';

export interface DataBinding {
  dataSourceId: string;
  query: DataQuery;
  mapping?: DataMapping;
  realTime?: boolean;
  refreshInterval?: number;
}

export interface EnterpriseConfig {
  dataSources: DataSourceConfig[];
  security: SecurityConfig;
  plugins: PluginConfig[];
  rendering: RenderingConfig;
}

export interface PluginHook {
  callback: PluginHookCallback;
  priority: number;
}

export type PluginHookCallback = (context: any) => Promise<any> | any;

/**
 * 🎯 使用示例
 */

// 1. 初始化企业级设计器
const designer = new EnterpriseReportDesigner({
  dataSources: [
    { type: 'sql', name: 'MainDB', connectionString: '...' },
    { type: 'rest', name: 'UserAPI', baseUrl: 'https://api.example.com' }
  ],
  security: {
    authentication: 'jwt',
    permissions: ['report:create', 'report:edit', 'report:export']
  },
  plugins: [
    { id: 'custom-charts', enabled: true },
    { id: 'advanced-tables', enabled: true }
  ],
  rendering: {
    mode: 'svg',
    optimization: true,
    virtualScrolling: true
  }
});

// 2. 创建数据绑定组件
const salesChart = new ChartComponent({
  id: 'sales-chart-001',
  chartType: 'bar',
  dataBinding: {
    dataSourceId: 'MainDB',
    query: {
      sql: 'SELECT region, SUM(sales) as total FROM sales_data GROUP BY region',
      parameters: { year: 2024 }
    },
    realTime: true,
    refreshInterval: 30000 // 30秒刷新
  }
});

// 3. 注册自定义插件
await designer.loadPlugin(new CustomChartPlugin());

// 4. 创建和导出报表
const reportId = await designer.createReport('sales-template-001');
const exportResult = await designer.exportReport(reportId, 'pdf', {
  pageFormat: 'a4',
  orientation: 'portrait',
  margins: { top: 20, bottom: 20, left: 20, right: 20 }
});

export { EnterpriseReportDesigner, PLUGIN_HOOKS };