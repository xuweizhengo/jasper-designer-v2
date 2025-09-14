use skia_safe::{*, surfaces, pdf, svg};
use crate::renderer::types::*;
use anyhow::{Result, anyhow};
use std::collections::HashMap;

pub struct SkiaRenderer {
    surface: Surface,
    width: i32,
    height: i32,
    font_mgr: FontMgr,
    image_cache: HashMap<String, Data>,
}

impl SkiaRenderer {
    pub fn new(width: i32, height: i32) -> Result<Self> {
        let surface = surfaces::raster_n32_premul((width, height))
            .ok_or_else(|| anyhow!("Failed to create surface"))?;

        Ok(Self {
            surface,
            width,
            height,
            font_mgr: FontMgr::new(),
            image_cache: HashMap::new(),
        })
    }

    /// 主渲染函数
    pub fn render(&mut self, elements: &[RenderElement]) -> Result<()> {
        let canvas = self.surface.canvas();
        canvas.clear(Color::WHITE);

        for element in elements {
            if element.visible {
                self.render_element(canvas, element)?;
            }
        }

        Ok(())
    }

    /// 渲染单个元素
    fn render_element(&self, canvas: &mut Canvas, element: &RenderElement) -> Result<()> {
        canvas.save();

        // 应用变换
        self.apply_transform(canvas, &element.transform);

        // 应用透明度
        if let Some(opacity) = element.style.opacity {
            if opacity < 1.0 {
                canvas.save_layer_alpha(None, (opacity * 255.0) as u8);
            }
        }

        // 根据类型渲染
        match element.element_type {
            ElementType::Text => self.render_text(canvas, element)?,
            ElementType::Rect => self.render_rect(canvas, element)?,
            ElementType::Circle => self.render_circle(canvas, element)?,
            ElementType::Path => self.render_path(canvas, element)?,
            ElementType::Image => self.render_image(canvas, element)?,
            ElementType::Group => {
                if let Some(children) = &element.children {
                    for child in children {
                        self.render_element(canvas, child)?;
                    }
                }
            }
        }

        // 恢复透明度层
        if let Some(opacity) = element.style.opacity {
            if opacity < 1.0 {
                canvas.restore();
            }
        }

        canvas.restore();
        Ok(())
    }

    /// 渲染文本
    fn render_text(&self, canvas: &mut Canvas, element: &RenderElement) -> Result<()> {
        let data = &element.data;
        let content = data["content"].as_str().unwrap_or("");
        let font_size = data["fontSize"].as_f64().unwrap_or(14.0) as scalar;
        let font_family = data["fontFamily"].as_str().unwrap_or("Arial");
        let color = data["color"].as_str().unwrap_or("#000000");

        let mut paint = Paint::default();
        paint.set_anti_alias(true);
        paint.set_color(self.parse_color(color));

        // 创建字体
        let typeface = self.font_mgr
            .match_family_style(font_family, FontStyle::normal())
            .unwrap_or_else(|| Typeface::default());
        let font = Font::from_typeface(typeface, font_size);

        // 处理多行文本
        if content.contains('\n') {
            let lines: Vec<&str> = content.split('\n').collect();
            let mut y = font_size;
            for line in lines {
                canvas.draw_str(line, Point::new(0.0, y), &font, &paint);
                y += font_size * 1.2; // 行高
            }
        } else {
            canvas.draw_str(content, Point::new(0.0, font_size), &font, &paint);
        }

        Ok(())
    }

    /// 渲染矩形
    fn render_rect(&self, canvas: &mut Canvas, element: &RenderElement) -> Result<()> {
        let rect = Rect::from_xywh(
            0.0, 0.0,
            element.style.width.unwrap_or(100.0),
            element.style.height.unwrap_or(100.0),
        );

        let mut paint = Paint::default();
        paint.set_anti_alias(true);

        // 填充
        if let Some(fill) = &element.style.fill {
            paint.set_style(PaintStyle::Fill);
            paint.set_color(self.parse_color(fill));
            canvas.draw_rect(rect, &paint);
        }

        // 描边
        if let Some(stroke) = &element.style.stroke {
            paint.set_style(PaintStyle::Stroke);
            paint.set_color(self.parse_color(stroke));
            paint.set_stroke_width(element.style.stroke_width.unwrap_or(1.0));
            canvas.draw_rect(rect, &paint);
        }

        Ok(())
    }

    /// 渲染圆形
    fn render_circle(&self, canvas: &mut Canvas, element: &RenderElement) -> Result<()> {
        let radius = (element.style.width.unwrap_or(100.0).min(
            element.style.height.unwrap_or(100.0)
        )) / 2.0;

        let center = Point::new(
            element.style.width.unwrap_or(100.0) / 2.0,
            element.style.height.unwrap_or(100.0) / 2.0,
        );

        let mut paint = Paint::default();
        paint.set_anti_alias(true);

        // 填充
        if let Some(fill) = &element.style.fill {
            paint.set_style(PaintStyle::Fill);
            paint.set_color(self.parse_color(fill));
            canvas.draw_circle(center, radius, &paint);
        }

        // 描边
        if let Some(stroke) = &element.style.stroke {
            paint.set_style(PaintStyle::Stroke);
            paint.set_color(self.parse_color(stroke));
            paint.set_stroke_width(element.style.stroke_width.unwrap_or(1.0));
            canvas.draw_circle(center, radius, &paint);
        }

        Ok(())
    }

    /// 渲染路径
    fn render_path(&self, canvas: &mut Canvas, element: &RenderElement) -> Result<()> {
        let mut path = Path::new();

        if let Some(commands) = element.data["commands"].as_array() {
            for cmd in commands {
                let cmd_type = cmd["type"].as_str().unwrap_or("");
                match cmd_type {
                    "M" => {
                        let x = cmd["x"].as_f64().unwrap_or(0.0) as scalar;
                        let y = cmd["y"].as_f64().unwrap_or(0.0) as scalar;
                        path.move_to((x, y));
                    }
                    "L" => {
                        let x = cmd["x"].as_f64().unwrap_or(0.0) as scalar;
                        let y = cmd["y"].as_f64().unwrap_or(0.0) as scalar;
                        path.line_to((x, y));
                    }
                    "Q" => {
                        let x1 = cmd["x1"].as_f64().unwrap_or(0.0) as scalar;
                        let y1 = cmd["y1"].as_f64().unwrap_or(0.0) as scalar;
                        let x = cmd["x"].as_f64().unwrap_or(0.0) as scalar;
                        let y = cmd["y"].as_f64().unwrap_or(0.0) as scalar;
                        path.quad_to((x1, y1), (x, y));
                    }
                    "C" => {
                        let x1 = cmd["x1"].as_f64().unwrap_or(0.0) as scalar;
                        let y1 = cmd["y1"].as_f64().unwrap_or(0.0) as scalar;
                        let x2 = cmd["x2"].as_f64().unwrap_or(0.0) as scalar;
                        let y2 = cmd["y2"].as_f64().unwrap_or(0.0) as scalar;
                        let x = cmd["x"].as_f64().unwrap_or(0.0) as scalar;
                        let y = cmd["y"].as_f64().unwrap_or(0.0) as scalar;
                        path.cubic_to((x1, y1), (x2, y2), (x, y));
                    }
                    "Z" => {
                        path.close();
                    }
                    _ => {}
                }
            }
        }

        let mut paint = Paint::default();
        paint.set_anti_alias(true);

        // 填充
        if let Some(fill) = &element.style.fill {
            paint.set_style(PaintStyle::Fill);
            paint.set_color(self.parse_color(fill));
            canvas.draw_path(&path, &paint);
        }

        // 描边
        if let Some(stroke) = &element.style.stroke {
            paint.set_style(PaintStyle::Stroke);
            paint.set_color(self.parse_color(stroke));
            paint.set_stroke_width(element.style.stroke_width.unwrap_or(1.0));
            canvas.draw_path(&path, &paint);
        }

        Ok(())
    }

    /// 渲染图片
    fn render_image(&self, canvas: &mut Canvas, element: &RenderElement) -> Result<()> {
        // 简化实现：暂时显示占位符
        let rect = Rect::from_xywh(
            0.0, 0.0,
            element.style.width.unwrap_or(100.0),
            element.style.height.unwrap_or(100.0),
        );

        let mut paint = Paint::default();
        paint.set_style(PaintStyle::Fill);
        paint.set_color(Color::from_rgb(240, 240, 240));
        canvas.draw_rect(rect, &paint);

        // 绘制占位文字
        paint.set_color(Color::from_rgb(128, 128, 128));
        let font = Font::from_typeface(Typeface::default(), 12.0);
        canvas.draw_str(
            "[Image]",
            Point::new(rect.width() / 2.0 - 20.0, rect.height() / 2.0),
            &font,
            &paint,
        );

        Ok(())
    }

    /// 应用变换
    fn apply_transform(&self, canvas: &mut Canvas, transform: &Transform) {
        if let Some(translate) = &transform.translate {
            canvas.translate((translate.x, translate.y));
        }
        if let Some(scale) = &transform.scale {
            canvas.scale((scale.x, scale.y));
        }
        if let Some(rotate) = transform.rotate {
            let origin = transform.origin.as_ref().map(|p| Point::new(p.x, p.y));
            canvas.rotate(rotate, origin);
        }
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
        } else {
            Color::BLACK
        }
    }

    // === 导出功能 ===

    /// 导出为 PNG
    pub fn export_png(&mut self, elements: &[RenderElement]) -> Result<Vec<u8>> {
        self.render(elements)?;

        let image = self.surface.image_snapshot();
        let data = image.encode_to_data(EncodedImageFormat::PNG)
            .ok_or_else(|| anyhow!("Failed to encode PNG"))?;

        Ok(data.as_bytes().to_vec())
    }

    /// 导出为 JPEG
    pub fn export_jpg(&mut self, elements: &[RenderElement], quality: u32) -> Result<Vec<u8>> {
        self.render(elements)?;

        let image = self.surface.image_snapshot();
        let data = image.encode_to_data_with_quality(EncodedImageFormat::JPEG, quality as i32)
            .ok_or_else(|| anyhow!("Failed to encode JPEG"))?;

        Ok(data.as_bytes().to_vec())
    }

    /// 导出为 PDF
    pub fn export_pdf(&mut self, elements: &[RenderElement]) -> Result<Vec<u8>> {
        let mut document = pdf::new_document();
        let page_size = (self.width as scalar, self.height as scalar);

        let mut canvas = document.begin_page(page_size, None);

        // 渲染所有元素到 PDF
        for element in elements {
            if element.visible {
                self.render_element(&mut canvas, element)?;
            }
        }

        document.end_page();
        let data = document.close();

        Ok(data.as_bytes().to_vec())
    }

    /// 导出为 SVG
    pub fn export_svg(&mut self, elements: &[RenderElement]) -> Result<String> {
        let bounds = Rect::from_wh(self.width as scalar, self.height as scalar);
        let mut svg_canvas = svg::Canvas::new(bounds, None);

        // 渲染所有元素到 SVG
        for element in elements {
            if element.visible {
                self.render_element(&mut svg_canvas, element)?;
            }
        }

        Ok(svg_canvas.end())
    }

    /// 导出为 WebP
    pub fn export_webp(&mut self, elements: &[RenderElement], quality: u32) -> Result<Vec<u8>> {
        self.render(elements)?;

        let image = self.surface.image_snapshot();
        let data = image.encode_to_data_with_quality(EncodedImageFormat::WEBP, quality as i32)
            .ok_or_else(|| anyhow!("Failed to encode WebP"))?;

        Ok(data.as_bytes().to_vec())
    }
}