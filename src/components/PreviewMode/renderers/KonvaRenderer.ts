import Konva from 'konva';
import type { ReportElement } from '../../../types';

export interface RendererOptions {
  width?: number;
  height?: number;
  background?: string;
  scale?: number;
}

export class KonvaRenderer {
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  private elements: Map<string, Konva.Node>;
  private backgroundLayer: Konva.Layer;
  
  constructor(container: HTMLDivElement, options: RendererOptions = {}) {
    this.stage = new Konva.Stage({
      container,
      width: options.width || container.clientWidth,
      height: options.height || container.clientHeight,
    });
    
    // 背景层
    this.backgroundLayer = new Konva.Layer();
    this.stage.add(this.backgroundLayer);
    
    // 设置背景
    if (options.background) {
      const bg = new Konva.Rect({
        x: 0,
        y: 0,
        width: this.stage.width(),
        height: this.stage.height(),
        fill: options.background,
      });
      this.backgroundLayer.add(bg);
    }
    
    // 主内容层
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
    this.elements = new Map();
  }
  
  /**
   * 渲染元素数组
   */
  render(elements: ReportElement[]) {
    // 清除旧元素
    this.layer.destroyChildren();
    this.elements.clear();
    
    // 批量添加新元素
    const startTime = performance.now();
    
    elements.forEach(el => {
      const konvaElement = this.createElement(el);
      if (konvaElement) {
        this.layer.add(konvaElement as Konva.Group | Konva.Shape);
        this.elements.set(el.id, konvaElement);
      }
    });
    
    // 批量绘制
    this.layer.batchDraw();
    
    const renderTime = performance.now() - startTime;
    console.log(`✨ Konva渲染完成: ${elements.length}个元素, 耗时${renderTime.toFixed(2)}ms`);
  }
  
  /**
   * 创建单个元素
   */
  private createElement(element: ReportElement): Konva.Node | null {
    const contentType = element.content.type;

    switch (contentType) {
      case 'Text':
        return this.createText(element);

      case 'Rectangle':
        return this.createRectangle(element);

      case 'Image':
        return this.createImage(element);

      case 'Line':
        return this.createLine(element);

      case 'DataField':
        return this.createDataField(element);

      default:
        console.warn(`未知元素类型: ${contentType}`);
        return null;
    }
  }
  
  /**
   * 创建文本元素
   */
  private createText(element: ReportElement): Konva.Text {
    if (element.content.type !== 'Text') return new Konva.Text({});

    const textContent = element.content;
    const style = textContent.style;

    return new Konva.Text({
      id: element.id,
      x: element.position.x,
      y: element.position.y,
      text: textContent.content || '文本',
      fontSize: style.font_size || 14,
      fontFamily: style.font_family || 'Arial',
      fontStyle: style.font_weight === 'bold' ? 'bold' : 'normal',
      fill: style.color || '#000000',
      width: element.size.width,
      align: style.align === 'Center' ? 'center' : style.align === 'Right' ? 'right' : 'left',
      verticalAlign: 'top',
      wrap: 'word',
      ellipsis: true,
    });
  }
  
  /**
   * 创建矩形元素
   */
  private createRectangle(element: ReportElement): Konva.Rect {
    if (element.content.type !== 'Rectangle') return new Konva.Rect({});

    const rectContent = element.content;

    return new Konva.Rect({
      id: element.id,
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height,
      fill: rectContent.fill_color || 'transparent',
      stroke: rectContent.border?.color || '#000000',
      strokeWidth: rectContent.border?.width || 0,
      cornerRadius: rectContent.corner_radius || 0,
      opacity: rectContent.opacity || 1,
    });
  }
  
  /**
   * 创建图片元素
   */
  private createImage(element: ReportElement): Konva.Image | Konva.Rect {
    // 创建占位符
    const placeholder = new Konva.Rect({
      id: element.id + '_placeholder',
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height,
      fill: '#f0f0f0',
      stroke: '#cccccc',
      strokeWidth: 1,
    });
    
    // 异步加载图片
    if (element.content.type === 'Image') {
      const imageContent = element.content;
      const image = new window.Image();
      image.onload = () => {
        const konvaImage = new Konva.Image({
          id: element.id,
          x: element.position.x,
          y: element.position.y,
          width: element.size.width,
          height: element.size.height,
          image,
        });

        // 替换占位符
        placeholder.destroy();
        this.layer.add(konvaImage);
        this.elements.set(element.id, konvaImage);
        this.layer.batchDraw();
      };

      image.onerror = () => {
        console.error(`图片加载失败: ${imageContent.src}`);
      };

      image.src = imageContent.src;
    }
    
    return placeholder;
  }
  
  /**
   * 创建线条元素
   */
  private createLine(element: ReportElement): Konva.Line {
    const isHorizontal = element.size.height < element.size.width;
    const points = isHorizontal
      ? [0, 0, element.size.width, 0]
      : [0, 0, 0, element.size.height];
    
    if (element.content.type !== 'Line') return new Konva.Line({});

    const lineContent = element.content;
    const dashArray = lineContent.line_style === 'Dashed' ? [5, 5] :
                     lineContent.line_style === 'Dotted' ? [2, 2] :
                     lineContent.line_style === 'DashDot' ? [5, 2, 2, 2] : undefined;

    const lineConfig: any = {
      id: element.id,
      x: element.position.x,
      y: element.position.y,
      points,
      stroke: lineContent.color || '#000000',
      strokeWidth: lineContent.width || 1,
      lineCap: 'round',
      lineJoin: 'round',
    };

    if (dashArray) {
      lineConfig.dash = dashArray;
    }

    return new Konva.Line(lineConfig);
  }
  
  /**
   * 创建数据字段元素
   */
  private createDataField(element: ReportElement): Konva.Text {
    if (element.content.type !== 'DataField') return new Konva.Text({});

    const dataContent = element.content;
    const style = dataContent.style;

    return new Konva.Text({
      id: element.id,
      x: element.position.x,
      y: element.position.y,
      text: dataContent.expression || '[Data Field]',
      fontSize: style.font_size || 14,
      fontFamily: style.font_family || 'Arial',
      fontStyle: style.font_weight === 'bold' ? 'bold' : 'normal',
      fill: style.color || '#000000',
      width: element.size.width,
      align: style.align === 'Center' ? 'center' : style.align === 'Right' ? 'right' : 'left',
      verticalAlign: 'top',
      wrap: 'word',
      ellipsis: true,
    });
  }

  
  /**
   * 设置缩放
   */
  setScale(scale: number) {
    this.stage.scale({ x: scale, y: scale });
    this.stage.batchDraw();
  }
  
  /**
   * 获取当前缩放
   */
  getScale(): number {
    return this.stage.scaleX();
  }
  
  /**
   * 设置位置偏移
   */
  setPosition(x: number, y: number) {
    this.stage.position({ x, y });
    this.stage.batchDraw();
  }
  
  /**
   * 获取位置
   */
  getPosition(): { x: number; y: number } {
    return this.stage.position();
  }
  
  /**
   * 适应容器大小
   */
  fitToContainer() {
    const container = this.stage.container();
    const containerRect = container.getBoundingClientRect();
    
    this.stage.width(containerRect.width);
    this.stage.height(containerRect.height);
    
    // 更新背景
    const bg = this.backgroundLayer.findOne('Rect');
    if (bg) {
      bg.width(containerRect.width);
      bg.height(containerRect.height);
    }
    
    this.stage.batchDraw();
  }
  
  /**
   * 导出为图片
   */
  async toDataURL(options: { pixelRatio?: number; mimeType?: string } = {}): Promise<string> {
    return this.stage.toDataURL({
      pixelRatio: options.pixelRatio || 2,
      mimeType: options.mimeType || 'image/png',
    });
  }
  
  /**
   * 销毁渲染器
   */
  destroy() {
    this.elements.clear();
    this.stage.destroy();
  }
  
  /**
   * 获取渲染统计信息
   */
  getStats() {
    return {
      elementsCount: this.elements.size,
      layersCount: this.stage.getLayers().length,
      stageSize: {
        width: this.stage.width(),
        height: this.stage.height(),
      },
      scale: this.getScale(),
      position: this.getPosition(),
    };
  }
}

export default KonvaRenderer;