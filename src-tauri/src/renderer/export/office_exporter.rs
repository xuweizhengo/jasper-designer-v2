use anyhow::{Result, anyhow};
use rust_xlsxwriter::{Workbook, Worksheet, Format, Color as XlsxColor};
use crate::renderer::types::{RenderElement, ElementType};
use std::collections::HashMap;

/// Office 格式导出器
/// 支持 Excel、Word、PowerPoint 格式导出
pub struct OfficeExporter;

impl OfficeExporter {
    /// 导出为 Excel (.xlsx)
    pub fn export_excel(elements: &[RenderElement]) -> Result<Vec<u8>> {
        let mut workbook = Workbook::new();
        let worksheet = workbook.add_worksheet();

        // 设置默认列宽
        worksheet.set_column_width(0, 20)?;

        // 按行组织元素
        let mut row_elements: HashMap<i32, Vec<&RenderElement>> = HashMap::new();

        for element in elements {
            if !element.visible {
                continue;
            }

            // 根据 Y 坐标分组到行
            let row = (element.position.y / 20.0) as i32;
            row_elements.entry(row).or_insert_with(Vec::new).push(element);
        }

        // 排序行
        let mut rows: Vec<_> = row_elements.keys().cloned().collect();
        rows.sort();

        // 写入数据
        for (row_idx, row_key) in rows.iter().enumerate() {
            if let Some(elements_in_row) = row_elements.get(row_key) {
                // 按 X 坐标排序元素
                let mut sorted_elements = elements_in_row.clone();
                sorted_elements.sort_by(|a, b| {
                    a.position.x.partial_cmp(&b.position.x).unwrap()
                });

                for (col_idx, element) in sorted_elements.iter().enumerate() {
                    Self::write_element_to_excel(
                        &worksheet,
                        element,
                        row_idx as u32,
                        col_idx as u16,
                    )?;
                }
            }
        }

        // 保存到内存
        let buffer = workbook.save_to_buffer()?;
        Ok(buffer)
    }

    /// 写入单个元素到 Excel
    fn write_element_to_excel(
        worksheet: &Worksheet,
        element: &RenderElement,
        row: u32,
        col: u16,
    ) -> Result<()> {
        match element.element_type {
            ElementType::Text => {
                // 写入文本
                if let Some(content) = &element.content {
                    // 创建格式
                    let mut format = Format::new();

                    // 设置字体
                    if let Some(font_size) = element.style.font_size {
                        format.set_font_size(font_size);
                    }

                    if let Some(font_family) = &element.style.font_family {
                        format.set_font_name(font_family);
                    }

                    // 设置颜色
                    if let Some(color) = &element.style.fill_color {
                        if let Some(xlsx_color) = Self::parse_color_to_xlsx(color) {
                            format.set_font_color(xlsx_color);
                        }
                    }

                    // 设置对齐
                    if let Some(align) = &element.style.text_align {
                        match align.as_str() {
                            "center" => format.set_align(rust_xlsxwriter::FormatAlign::Center),
                            "right" => format.set_align(rust_xlsxwriter::FormatAlign::Right),
                            _ => format.set_align(rust_xlsxwriter::FormatAlign::Left),
                        }
                    }

                    worksheet.write_string_with_format(row, col, content, &format)?;
                }
            }
            ElementType::Rectangle => {
                // 矩形作为单元格背景
                if let Some(fill_color) = &element.style.fill_color {
                    let mut format = Format::new();
                    if let Some(xlsx_color) = Self::parse_color_to_xlsx(fill_color) {
                        format.set_background_color(xlsx_color);
                    }
                    worksheet.write_blank(row, col, &format)?;
                }
            }
            _ => {
                // 其他类型暂时忽略或转换为文本
                if let Some(content) = &element.content {
                    worksheet.write_string(row, col, content)?;
                }
            }
        }

        Ok(())
    }

    /// 导出为 Word (.docx)
    pub fn export_word(elements: &[RenderElement]) -> Result<Vec<u8>> {
        // Word 导出实现
        // 注意：Rust 目前没有成熟的 Word 文档生成库
        // 可以考虑以下方案：
        // 1. 生成 HTML 然后转换
        // 2. 使用 docx-rs 库（如果有）
        // 3. 通过 LibreOffice API
        // 4. 生成 Office Open XML 格式

        let html = Self::generate_html_for_word(elements)?;

        // 这里简化处理，返回 HTML
        // 实际应该转换为 .docx 格式
        Ok(html.into_bytes())
    }

    /// 生成 Word 用的 HTML
    fn generate_html_for_word(elements: &[RenderElement]) -> Result<String> {
        let mut html = String::new();

        html.push_str(r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .element { position: absolute; }
    </style>
</head>
<body>
"#);

        // 渲染元素
        for element in elements {
            if !element.visible {
                continue;
            }

            match element.element_type {
                ElementType::Text => {
                    if let Some(content) = &element.content {
                        html.push_str(&format!(
                            r#"<div class="element" style="left:{}px; top:{}px; font-size:{}px; color:{};">{}</div>"#,
                            element.position.x,
                            element.position.y,
                            element.style.font_size.unwrap_or(14.0),
                            element.style.fill_color.as_deref().unwrap_or("#000000"),
                            content
                        ));
                    }
                }
                ElementType::Rectangle => {
                    html.push_str(&format!(
                        r#"<div class="element" style="left:{}px; top:{}px; width:{}px; height:{}px; background-color:{}; border: 1px solid {};"></div>"#,
                        element.position.x,
                        element.position.y,
                        element.size.width,
                        element.size.height,
                        element.style.fill_color.as_deref().unwrap_or("transparent"),
                        element.style.stroke_color.as_deref().unwrap_or("transparent")
                    ));
                }
                ElementType::Image => {
                    if let Some(src) = element.custom_properties.get("src") {
                        if let Some(src_str) = src.as_str() {
                            html.push_str(&format!(
                                r#"<img class="element" src="{}" style="left:{}px; top:{}px; width:{}px; height:{}px;" />"#,
                                src_str,
                                element.position.x,
                                element.position.y,
                                element.size.width,
                                element.size.height
                            ));
                        }
                    }
                }
                _ => {}
            }
        }

        html.push_str("</body></html>");
        Ok(html)
    }

    /// 导出为 PowerPoint (.pptx)
    pub fn export_powerpoint(elements: &[RenderElement]) -> Result<Vec<u8>> {
        // PowerPoint 导出实现
        // 类似 Word，需要生成 Office Open XML 格式
        // 或使用第三方库

        let pptx_data = Self::generate_pptx_placeholder(elements)?;
        Ok(pptx_data)
    }

    /// 生成 PowerPoint 占位数据
    fn generate_pptx_placeholder(elements: &[RenderElement]) -> Result<Vec<u8>> {
        // 这是一个简化的实现
        // 实际需要生成完整的 PPTX 文件结构

        let mut content = String::from("PowerPoint Presentation\n\n");

        for element in elements {
            if !element.visible {
                continue;
            }

            if let Some(text_content) = &element.content {
                content.push_str(&format!("- {}\n", text_content));
            }
        }

        Ok(content.into_bytes())
    }

    /// 解析颜色到 Excel 格式
    fn parse_color_to_xlsx(color: &str) -> Option<XlsxColor> {
        if color.starts_with('#') {
            let hex = color.trim_start_matches('#');
            if hex.len() >= 6 {
                let r = u8::from_str_radix(&hex[0..2], 16).ok()?;
                let g = u8::from_str_radix(&hex[2..4], 16).ok()?;
                let b = u8::from_str_radix(&hex[4..6], 16).ok()?;
                return Some(XlsxColor::RGB(r, g, b));
            }
        }
        None
    }
}

/// 表格数据导出助手
pub struct TableExporter;

impl TableExporter {
    /// 将元素转换为表格数据
    pub fn elements_to_table_data(elements: &[RenderElement]) -> Vec<Vec<String>> {
        let mut table: Vec<Vec<String>> = Vec::new();
        let mut current_row: Vec<String> = Vec::new();
        let mut last_y = 0.0;

        // 按位置排序元素
        let mut sorted_elements = elements.to_vec();
        sorted_elements.sort_by(|a, b| {
            if (a.position.y - b.position.y).abs() < 5.0 {
                // 同一行，按 X 排序
                a.position.x.partial_cmp(&b.position.x).unwrap()
            } else {
                // 不同行，按 Y 排序
                a.position.y.partial_cmp(&b.position.y).unwrap()
            }
        });

        for element in sorted_elements {
            if !element.visible {
                continue;
            }

            // 检查是否换行
            if (element.position.y - last_y).abs() > 20.0 && !current_row.is_empty() {
                table.push(current_row.clone());
                current_row.clear();
            }

            // 添加内容到当前行
            if let Some(content) = &element.content {
                current_row.push(content.clone());
            } else {
                current_row.push(String::new());
            }

            last_y = element.position.y;
        }

        // 添加最后一行
        if !current_row.is_empty() {
            table.push(current_row);
        }

        table
    }

    /// 导出为 CSV
    pub fn export_csv(elements: &[RenderElement]) -> Result<String> {
        let table_data = Self::elements_to_table_data(elements);
        let mut csv = String::new();

        for row in table_data {
            let escaped_row: Vec<String> = row.iter().map(|cell| {
                if cell.contains(',') || cell.contains('"') || cell.contains('\n') {
                    format!("\"{}\"", cell.replace('"', "\"\""))
                } else {
                    cell.clone()
                }
            }).collect();

            csv.push_str(&escaped_row.join(","));
            csv.push('\n');
        }

        Ok(csv)
    }

    /// 导出为 TSV
    pub fn export_tsv(elements: &[RenderElement]) -> Result<String> {
        let table_data = Self::elements_to_table_data(elements);
        let mut tsv = String::new();

        for row in table_data {
            tsv.push_str(&row.join("\t"));
            tsv.push('\n');
        }

        Ok(tsv)
    }
}