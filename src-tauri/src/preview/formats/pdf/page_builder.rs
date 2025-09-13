use crate::preview::{PreviewError, PreviewResult};
use crate::types::preview_types::{PdfOptions, PageSize, Orientation, Margins};
use printpdf::*;

/// PDF页面构建器
pub struct PageBuilder {
    options: PdfOptions,
}

impl PageBuilder {
    pub fn new(options: PdfOptions) -> Self {
        Self { options }
    }

    /// 创建PDF文档
    pub fn create_document(&self, title: &str) -> PreviewResult<(PdfDocumentReference, PdfPageIndex)> {
        let (width, height) = self.calculate_page_dimensions();
        
        let (doc, page1, layer1) = PdfDocument::new(
            title,
            Mm(width as f32),
            Mm(height as f32),
            "Main Layer"
        );

        Ok((doc, page1))
    }

    /// 计算页面尺寸（毫米）
    pub fn calculate_page_dimensions(&self) -> (f64, f64) {
        let (base_width, base_height) = match &self.options.page_size {
            PageSize::A4 => (210.0, 297.0),
            PageSize::A3 => (297.0, 420.0),
            PageSize::A5 => (148.0, 210.0),
            PageSize::Letter => (215.9, 279.4),
            PageSize::Legal => (215.9, 355.6),
            PageSize::Custom { width, height } => (*width, *height),
        };

        match self.options.orientation {
            Orientation::Portrait => (base_width, base_height),
            Orientation::Landscape => (base_height, base_width),
        }
    }

    /// 计算内容区域（考虑边距）
    pub fn calculate_content_area(&self) -> (f64, f64, f64, f64) {
        let (page_width, page_height) = self.calculate_page_dimensions();
        let margins = &self.options.margins;
        
        let content_x = margins.left;
        let content_y = margins.bottom;
        let content_width = page_width - margins.left - margins.right;
        let content_height = page_height - margins.top - margins.bottom;
        
        (content_x, content_y, content_width, content_height)
    }

    /// 获取默认PDF选项
    pub fn default_options() -> PdfOptions {
        PdfOptions {
            page_size: PageSize::A4,
            orientation: Orientation::Portrait,
            margins: Margins {
                top: 20.0,
                right: 20.0,
                bottom: 20.0,
                left: 20.0,
            },
            embed_fonts: true,
            compress_images: true,
            pdf_version: "1.7".to_string(),
        }
    }

    /// 添加新页面
    pub fn add_page(&self, doc: &PdfDocumentReference) -> PreviewResult<(PdfPageIndex, PdfLayerIndex)> {
        let (width, height) = self.calculate_page_dimensions();
        
        let (page_index, layer_index) = doc.add_page(
            Mm(width as f32),
            Mm(height as f32),
            "Additional Page"
        );

        Ok((page_index, layer_index))
    }
}