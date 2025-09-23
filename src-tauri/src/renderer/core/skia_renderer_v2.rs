use skia_safe::{
    surfaces, pdf, svg, scalar,
    Surface, Canvas, Paint, PaintStyle, Path, Font, FontMgr, FontStyle,
    Color, Color4f, Data, Image, ImageInfo, ColorType, AlphaType,
    Rect, Point as SkPoint, Size, Matrix, PathEffect, RRect,
    EncodedImageFormat, TextBlob, Typeface, Document,
    ClipOp, BlendMode as SkBlendMode,
    gradient_shader, Shader, TileMode,
    PathDirection, PathFillType,
    paint::{Join as StrokeJoin, Cap as StrokeCap},
    FontMetrics,
};
use crate::renderer::types::{
    RenderElement, RenderOptions, Transform, ElementType, ElementStyle,
    Shadow, BlendMode, ExportOptions, Viewport, Overlay, RenderQuality,
    Point
};
use anyhow::{Result, anyhow};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use base64::{Engine as _, engine::general_purpose};

/// 增强版 Skia 渲染器
/// 支持完整的 PDF、SVG 导出和高级渲染特性
pub struct SkiaRendererV2 {
    surface: Surface,
    width: i32,
    height: i32,
    font_mgr: FontMgr,
    image_cache: HashMap<String, Image>,
    font_cache: HashMap<String, Typeface>,
    quality: RenderQuality,
}

impl SkiaRendererV2 {
    /// 创建新的渲染器实例
    pub fn new(width: i32, height: i32) -> Result<Self> {
        let surface = surfaces::raster_n32_premul((width, height))
            .ok_or_else(|| anyhow!("Failed to create surface"))?;

        Ok(Self {
            surface,
            width,
            height,
            font_mgr: FontMgr::new(),
            image_cache: HashMap::new(),
            font_cache: HashMap::new(),
            quality: RenderQuality::High,
        })
    }

    /// 设置渲染质量
    pub fn set_quality(&mut self, quality: RenderQuality) {
        self.quality = quality;
    }

    /// 主渲染函数
    pub fn render(&mut self, elements: &[RenderElement]) -> Result<()> {
        self.render_with_options(elements, None)
    }

    /// 带选项的渲染函数
    pub fn render_with_options(&mut self, elements: &[RenderElement], options: Option<&RenderOptions>) -> Result<()> {
        let canvas = self.surface.canvas();

        // 清空画布
        let bg_color = options
            .and_then(|o| o.background.as_ref())
            .map(|c| self.parse_color(c))
            .unwrap_or(Color::WHITE);
        canvas.clear(bg_color);

        // 设置抗锯齿
        let mut paint = Paint::default();
        paint.set_anti_alias(self.quality != RenderQuality::Draft);

        // 渲染网格（如果启用）
        if let Some(opts) = options {
            if opts.show_grid.unwrap_or(false) {
                self.render_grid(canvas, opts.grid_size.unwrap_or(20));
            }
        }

        // 渲染所有元素
        for element in elements {
            if element.visible {
                self.render_element(canvas, element)?;
            }
        }

        // 渲染水印（如果有）
        if let Some(opts) = options {
            if let Some(watermark) = &opts.watermark {
                self.render_watermark(canvas, watermark);
            }
        }

        Ok(())
    }

    /// 渲染单个元素（使用传入的 Canvas）
    fn render_element(&mut self, canvas: &Canvas, element: &RenderElement) -> Result<()> {
        canvas.save();

        // 应用变换
        self.apply_transform(canvas, &element.transform);

        // 应用透明度
        let mut layer_paint = None;
        if let Some(opacity) = element.style.opacity {
            if opacity < 1.0 {
                let mut paint = Paint::default();
                paint.set_alpha((opacity * 255.0) as u8);
                layer_paint = Some(paint);
                canvas.save_layer(&Default::default());
            }
        }

        // 应用阴影
        if let Some(shadow) = &element.style.shadow {
            self.apply_shadow(canvas, shadow);
        }

        // 根据类型渲染
        match element.element_type {
            ElementType::Text => self.render_text(canvas, element)?,
            ElementType::Rectangle => self.render_rectangle(canvas, element)?,
            ElementType::Ellipse => self.render_ellipse(canvas, element)?,
            ElementType::Line => self.render_line(canvas, element)?,
            ElementType::Path => self.render_path(canvas, element)?,
            ElementType::Image => self.render_image(canvas, element)?,
            ElementType::Group => {
                for child in &element.children {
                    if child.visible {
                        self.render_element(canvas, child)?;
                    }
                }
            }
        }

        // 恢复透明度层
        if layer_paint.is_some() {
            canvas.restore();
        }

        canvas.restore();
        Ok(())
    }

    /// 渲染文本（增强版）
    fn render_text(&mut self, canvas: &Canvas, element: &RenderElement) -> Result<()> {
        let content = element.content.as_deref().unwrap_or("");
        if content.is_empty() {
            return Ok(());
        }

        let style = &element.style;
        let font_size = style.font_size.unwrap_or(14.0) as scalar;
        let font_family = style.font_family.as_deref().unwrap_or("Arial");
        let font_weight = style.font_weight.as_deref().unwrap_or("normal");

        // 获取或创建字体
        let typeface = self.get_or_create_typeface(font_family, font_weight);
        let font = Font::from_typeface(typeface, font_size);

        // 创建画笔
        let mut paint = Paint::default();
        paint.set_anti_alias(true);

        // 设置颜色
        if let Some(color) = &style.fill_color {
            paint.set_color(self.parse_color(color));
        } else {
            paint.set_color(Color::BLACK);
        }

        // 设置文本对齐
        let text_align = style.text_align.as_deref().unwrap_or("left");
        let x_offset = match text_align {
            "center" => element.size.width / 2.0,
            "right" => element.size.width,
            _ => 0.0,
        };

        // 处理多行文本
        let line_height = style.line_height.unwrap_or(1.2) * font_size;
        let lines: Vec<&str> = content.split('\n').collect();

        for (i, line) in lines.iter().enumerate() {
            let y = element.position.y + (i as f32 + 1.0) * line_height;
            let x = element.position.x + x_offset;

            canvas.draw_str(line, SkPoint::new(x, y), &font, &paint);
        }

        // 渲染文本装饰（下划线、删除线）
        if let Some(decoration) = &style.text_decoration {
            self.render_text_decoration(canvas, element, &font, &paint, decoration);
        }

        Ok(())
    }

    /// 渲染矩形（增强版）
    fn render_rectangle(&mut self, canvas: &Canvas, element: &RenderElement) -> Result<()> {
        let rect = Rect::from_xywh(
            element.position.x,
            element.position.y,
            element.size.width,
            element.size.height,
        );

        // 处理圆角
        let rounded_rect = if let Some(radius) = element.style.border_radius {
            RRect::new_rect_xy(rect, radius, radius)
        } else {
            RRect::new_rect(rect)
        };

        let mut paint = Paint::default();
        paint.set_anti_alias(true);

        // 填充
        if let Some(fill) = &element.style.fill_color {
            paint.set_style(PaintStyle::Fill);

            // 支持渐变填充
            if fill.starts_with("gradient:") {
                self.apply_gradient(&mut paint, fill, &rect);
            } else {
                paint.set_color(self.parse_color(fill));
            }

            canvas.draw_rrect(rounded_rect, &paint);
        }

        // 描边
        if let Some(stroke) = &element.style.stroke_color {
            paint.set_style(PaintStyle::Stroke);
            paint.set_color(self.parse_color(stroke));
            paint.set_stroke_width(element.style.stroke_width.unwrap_or(1.0));

            // 设置线条样式
            if let Some(dash_array) = &element.style.stroke_dash_array {
                self.apply_dash_effect(&mut paint, dash_array);
            }

            canvas.draw_rrect(rounded_rect, &paint);
        }

        Ok(())
    }

    /// 渲染椭圆
    fn render_ellipse(&mut self, canvas: &Canvas, element: &RenderElement) -> Result<()> {
        let center = SkPoint::new(
            element.position.x + element.size.width / 2.0,
            element.position.y + element.size.height / 2.0,
        );

        let mut paint = Paint::default();
        paint.set_anti_alias(true);

        // 填充
        if let Some(fill) = &element.style.fill_color {
            paint.set_style(PaintStyle::Fill);
            paint.set_color(self.parse_color(fill));
            canvas.draw_oval(
                &Rect::from_xywh(
                    element.position.x,
                    element.position.y,
                    element.size.width,
                    element.size.height,
                ),
                &paint,
            );
        }

        // 描边
        if let Some(stroke) = &element.style.stroke_color {
            paint.set_style(PaintStyle::Stroke);
            paint.set_color(self.parse_color(stroke));
            paint.set_stroke_width(element.style.stroke_width.unwrap_or(1.0));
            canvas.draw_oval(
                &Rect::from_xywh(
                    element.position.x,
                    element.position.y,
                    element.size.width,
                    element.size.height,
                ),
                &paint,
            );
        }

        Ok(())
    }

    /// 渲染线条
    fn render_line(&mut self, canvas: &Canvas, element: &RenderElement) -> Result<()> {
        let start = SkPoint::new(element.position.x, element.position.y);
        let end = SkPoint::new(
            element.position.x + element.size.width,
            element.position.y + element.size.height,
        );

        let mut paint = Paint::default();
        paint.set_anti_alias(true);
        paint.set_style(PaintStyle::Stroke);

        if let Some(stroke) = &element.style.stroke_color {
            paint.set_color(self.parse_color(stroke));
        } else {
            paint.set_color(Color::BLACK);
        }

        paint.set_stroke_width(element.style.stroke_width.unwrap_or(1.0));

        // 设置线条端点样式
        if let Some(cap) = &element.style.stroke_line_cap {
            paint.set_stroke_cap(self.parse_stroke_cap(cap));
        }

        canvas.draw_line(start, end, &paint);
        Ok(())
    }

    /// 渲染路径
    fn render_path(&mut self, canvas: &Canvas, element: &RenderElement) -> Result<()> {
        let mut path = Path::new();

        // 解析路径数据（SVG 路径格式）
        if let Some(path_data) = element.custom_properties.get("pathData") {
            if let Some(path_str) = path_data.as_str() {
                self.parse_svg_path(&mut path, path_str);
            }
        }

        let mut paint = Paint::default();
        paint.set_anti_alias(true);

        // 填充
        if let Some(fill) = &element.style.fill_color {
            paint.set_style(PaintStyle::Fill);
            paint.set_color(self.parse_color(fill));
            canvas.draw_path(&path, &paint);
        }

        // 描边
        if let Some(stroke) = &element.style.stroke_color {
            paint.set_style(PaintStyle::Stroke);
            paint.set_color(self.parse_color(stroke));
            paint.set_stroke_width(element.style.stroke_width.unwrap_or(1.0));
            canvas.draw_path(&path, &paint);
        }

        Ok(())
    }

    /// 渲染图片
    fn render_image(&mut self, canvas: &Canvas, element: &RenderElement) -> Result<()> {
        // 尝试从缓存获取图片
        let image_key = element.id.clone();

        if !self.image_cache.contains_key(&image_key) {
            // 尝试加载图片
            if let Some(src) = element.custom_properties.get("src") {
                if let Some(src_str) = src.as_str() {
                    if let Some(image) = self.load_image(src_str)? {
                        self.image_cache.insert(image_key.clone(), image);
                    }
                }
            }
        }

        if let Some(image) = self.image_cache.get(&image_key) {
            let src_rect = Rect::from_wh(image.width() as f32, image.height() as f32);
            let dst_rect = Rect::from_xywh(
                element.position.x,
                element.position.y,
                element.size.width,
                element.size.height,
            );

            let mut paint = Paint::default();
            paint.set_anti_alias(true);
            // FilterQuality is removed in newer skia-safe versions
            // paint.set_filter_quality(FilterQuality::High);

            canvas.draw_image_rect(image, Some((&src_rect, SkPoint::default())), &dst_rect, &paint);
        } else {
            // 绘制占位符
            self.render_image_placeholder(canvas, element);
        }

        Ok(())
    }

    /// 渲染图片占位符
    fn render_image_placeholder(&self, canvas: &Canvas, element: &RenderElement) {
        let rect = Rect::from_xywh(
            element.position.x,
            element.position.y,
            element.size.width,
            element.size.height,
        );

        let mut paint = Paint::default();
        paint.set_style(PaintStyle::Fill);
        paint.set_color(Color::from_rgb(240, 240, 240));
        canvas.draw_rect(rect, &paint);

        // 绘制边框
        paint.set_style(PaintStyle::Stroke);
        paint.set_color(Color::from_rgb(200, 200, 200));
        paint.set_stroke_width(1.0);
        canvas.draw_rect(rect, &paint);

        // 绘制文字
        let typeface = self.font_mgr.match_family_style("Arial", FontStyle::normal())
            .unwrap_or_else(|| self.font_mgr.legacy_make_typeface(None, FontStyle::normal()).unwrap());
        let font = Font::from_typeface(typeface, 12.0);
        paint.set_style(PaintStyle::Fill);
        paint.set_color(Color::from_rgb(128, 128, 128));

        canvas.draw_str(
            "[Image]",
            SkPoint::new(
                rect.x() + rect.width() / 2.0 - 20.0,
                rect.y() + rect.height() / 2.0,
            ),
            &font,
            &paint,
        );
    }

    /// 加载图片
    fn load_image(&self, src: &str) -> Result<Option<Image>> {
        if src.starts_with("data:") {
            // Base64 编码的图片
            self.load_base64_image(src)
        } else if src.starts_with("http://") || src.starts_with("https://") {
            // 网络图片（暂不支持）
            Ok(None)
        } else {
            // 本地文件
            self.load_file_image(src)
        }
    }

    /// 加载 Base64 图片
    fn load_base64_image(&self, data_uri: &str) -> Result<Option<Image>> {
        if let Some(comma_pos) = data_uri.find(',') {
            let base64_data = &data_uri[comma_pos + 1..];
            if let Ok(decoded) = general_purpose::STANDARD.decode(base64_data) {
                let data = Data::new_copy(&decoded);
                Ok(Image::from_encoded(data))
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    /// 加载文件图片
    fn load_file_image(&self, path: &str) -> Result<Option<Image>> {
        let path = PathBuf::from(path);
        if path.exists() {
            let bytes = fs::read(&path)?;
            let data = Data::new_copy(&bytes);
            Ok(Image::from_encoded(data))
        } else {
            Ok(None)
        }
    }

    /// 渲染网格
    fn render_grid(&self, canvas: &Canvas, grid_size: i32) {
        let mut paint = Paint::default();
        paint.set_style(PaintStyle::Stroke);
        paint.set_color(Color::from_argb(40, 128, 128, 128));
        paint.set_stroke_width(0.5);
        paint.set_anti_alias(false);

        // 绘制垂直线
        for x in (0..self.width).step_by(grid_size as usize) {
            canvas.draw_line(
                SkPoint::new(x as f32, 0.0),
                SkPoint::new(x as f32, self.height as f32),
                &paint,
            );
        }

        // 绘制水平线
        for y in (0..self.height).step_by(grid_size as usize) {
            canvas.draw_line(
                SkPoint::new(0.0, y as f32),
                SkPoint::new(self.width as f32, y as f32),
                &paint,
            );
        }
    }

    /// 渲染水印
    fn render_watermark(&self, canvas: &Canvas, watermark: &str) {
        canvas.save();

        // 旋转水印
        canvas.rotate(45.0, Some(SkPoint::new(self.width as f32 / 2.0, self.height as f32 / 2.0)));

        let typeface = self.font_mgr.match_family_style("Arial", FontStyle::normal())
            .unwrap_or_else(|| self.font_mgr.legacy_make_typeface(None, FontStyle::normal()).unwrap());
        let font = Font::from_typeface(typeface, 48.0);

        let mut paint = Paint::default();
        paint.set_anti_alias(true);
        paint.set_color(Color::from_argb(30, 0, 0, 0));

        canvas.draw_str(
            watermark,
            SkPoint::new(self.width as f32 / 2.0 - 100.0, self.height as f32 / 2.0),
            &font,
            &paint,
        );

        canvas.restore();
    }

    /// 应用变换
    fn apply_transform(&self, canvas: &Canvas, transform: &Transform) {
        if let Some(translate) = &transform.translate {
            canvas.translate((translate.x, translate.y));
        }
        if let Some(scale) = &transform.scale {
            canvas.scale((scale.x, scale.y));
        }
        if let Some(rotate) = transform.rotate {
            if let Some(origin) = &transform.origin {
                canvas.rotate(rotate, Some(SkPoint::new(origin.x, origin.y)));
            } else {
                canvas.rotate(rotate, None);
            }
        }
    }

    /// 应用阴影
    fn apply_shadow(&self, _canvas: &Canvas, _shadow: &Shadow) {
        // TODO: 实现阴影效果
        // Skia 的阴影需要使用 ImageFilter
    }

    /// 应用渐变
    fn apply_gradient(&self, paint: &mut Paint, gradient_str: &str, rect: &Rect) {
        // 简单的线性渐变示例
        let colors = vec![
            Color::from_rgb(255, 0, 0),
            Color::from_rgb(0, 0, 255),
        ];

        let positions = vec![0.0, 1.0];

        let shader = gradient_shader::linear(
            (
                SkPoint::new(rect.x(), rect.y()),
                SkPoint::new(rect.x() + rect.width(), rect.y()),
            ),
            colors.as_slice(),
            Some(positions.as_slice()),
            TileMode::Clamp,
            None,
            None,
        );

        paint.set_shader(shader);
    }

    /// 应用虚线效果
    fn apply_dash_effect(&self, paint: &mut Paint, dash_array: &[f32]) {
        let effect = PathEffect::dash(dash_array, 0.0);
        paint.set_path_effect(effect);
    }

    /// 渲染文本装饰
    fn render_text_decoration(
        &self,
        canvas: &Canvas,
        element: &RenderElement,
        font: &Font,
        paint: &Paint,
        decoration: &str,
    ) {
        let metrics = font.metrics();
        let y_base = element.position.y;

        match decoration {
            "underline" => {
                let y = y_base + metrics.1.descent;
                canvas.draw_line(
                    SkPoint::new(element.position.x, y),
                    SkPoint::new(element.position.x + element.size.width, y),
                    paint,
                );
            }
            "line-through" => {
                let y = y_base - metrics.1.ascent / 2.0;
                canvas.draw_line(
                    SkPoint::new(element.position.x, y),
                    SkPoint::new(element.position.x + element.size.width, y),
                    paint,
                );
            }
            _ => {}
        }
    }

    /// 获取或创建字体
    fn get_or_create_typeface(&mut self, family: &str, weight: &str) -> Typeface {
        let key = format!("{}-{}", family, weight);

        if let Some(typeface) = self.font_cache.get(&key) {
            return typeface.clone();
        }

        let style = match weight {
            "bold" => FontStyle::bold(),
            "italic" => FontStyle::italic(),
            "bold-italic" => FontStyle::bold_italic(),
            _ => FontStyle::normal(),
        };

        let typeface = self.font_mgr
            .match_family_style(family, style)
            .unwrap_or_else(|| self.font_mgr.legacy_make_typeface(None, style).unwrap());

        self.font_cache.insert(key, typeface.clone());
        typeface
    }

    /// 解析颜色
    fn parse_color(&self, color: &str) -> Color {
        if color.starts_with('#') {
            let hex = color.trim_start_matches('#');
            let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
            let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
            let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
            let a = if hex.len() > 6 {
                u8::from_str_radix(&hex[6..8], 16).unwrap_or(255)
            } else {
                255
            };
            Color::from_argb(a, r, g, b)
        } else if color.starts_with("rgb") {
            // 解析 rgb(r, g, b) 或 rgba(r, g, b, a)
            self.parse_rgb_color(color)
        } else {
            // 预定义颜色
            self.parse_named_color(color)
        }
    }

    /// 解析 RGB 颜色
    fn parse_rgb_color(&self, color: &str) -> Color {
        // 简单实现，实际应该更健壮
        Color::BLACK
    }

    /// 解析命名颜色
    fn parse_named_color(&self, name: &str) -> Color {
        match name.to_lowercase().as_str() {
            "black" => Color::BLACK,
            "white" => Color::WHITE,
            "red" => Color::RED,
            "green" => Color::GREEN,
            "blue" => Color::BLUE,
            "yellow" => Color::YELLOW,
            "cyan" => Color::CYAN,
            "magenta" => Color::MAGENTA,
            "transparent" => Color::TRANSPARENT,
            _ => Color::BLACK,
        }
    }

    /// 解析线条端点样式
    fn parse_stroke_cap(&self, cap: &str) -> StrokeCap {
        match cap {
            "round" => StrokeCap::Round,
            "square" => StrokeCap::Square,
            _ => StrokeCap::Butt,
        }
    }

    /// 解析 SVG 路径
    fn parse_svg_path(&self, path: &mut Path, path_data: &str) {
        // 简化的 SVG 路径解析
        // 实际应该使用完整的 SVG 路径解析器
        let commands = path_data.split_whitespace();
        let mut current_x = 0.0;
        let mut current_y = 0.0;

        for cmd in commands {
            match cmd.chars().next() {
                Some('M') => {
                    // MoveTo
                    path.move_to((current_x, current_y));
                }
                Some('L') => {
                    // LineTo
                    path.line_to((current_x, current_y));
                }
                Some('Z') => {
                    // Close
                    path.close();
                }
                _ => {}
            }
        }
    }

    // ===== 导出功能 =====

    /// 导出为 PNG
    pub fn export_png(&mut self, elements: &[RenderElement]) -> Result<Vec<u8>> {
        self.render(elements)?;

        let image = self.surface.image_snapshot();
        let data = image.encode_to_data(EncodedImageFormat::PNG)
            .ok_or_else(|| anyhow!("Failed to encode PNG"))?;

        Ok(data.as_bytes().to_vec())
    }

    /// 导出为 JPEG
    pub fn export_jpg(&mut self, elements: &[RenderElement], quality: u8) -> Result<Vec<u8>> {
        self.render(elements)?;

        let image = self.surface.image_snapshot();
        let data = image.encode_to_data_with_quality(EncodedImageFormat::JPEG, quality as i32)
            .ok_or_else(|| anyhow!("Failed to encode JPEG"))?;

        Ok(data.as_bytes().to_vec())
    }

    /// 导出为 WebP
    pub fn export_webp(&mut self, elements: &[RenderElement], quality: u8) -> Result<Vec<u8>> {
        self.render(elements)?;

        let image = self.surface.image_snapshot();
        let data = image.encode_to_data_with_quality(EncodedImageFormat::WEBP, quality as i32)
            .ok_or_else(|| anyhow!("Failed to encode WebP"))?;

        Ok(data.as_bytes().to_vec())
    }

    /// 导出为 PDF（修复版）
    pub fn export_pdf(&mut self, elements: &[RenderElement]) -> Result<Vec<u8>> {
        use std::io::Cursor;

        let mut pdf_bytes = Vec::new();
        {
            let mut document = pdf::new_document(&mut pdf_bytes);

            // 创建页面
            if let Some(mut canvas) = document.begin_page((self.width as f32, self.height as f32), None) {
                // 渲染元素到 PDF canvas
                for element in elements {
                    if element.visible {
                        let _ = self.render_element(&mut canvas, element);
                    }
                }

                document.end_page();
            }

            document.close();
        }

        Ok(pdf_bytes)
    }

    /// 导出为 SVG（修复版）
    pub fn export_svg(&mut self, elements: &[RenderElement]) -> Result<String> {
        use std::io::Cursor;

        let bounds = Rect::from_wh(self.width as f32, self.height as f32);
        let mut svg_bytes = Vec::new();

        {
            let mut canvas = svg::Canvas::new(bounds, Some(&mut svg_bytes));

            // 渲染元素到 SVG canvas
            for element in elements {
                if element.visible {
                    let _ = self.render_element(&mut canvas, element);
                }
            }
        }

        // 转换为字符串
        String::from_utf8(svg_bytes).map_err(|e| anyhow!("Failed to convert SVG to string: {}", e))
    }
}