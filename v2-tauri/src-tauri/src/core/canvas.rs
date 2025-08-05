use serde::{Deserialize, Serialize};
use crate::errors::{AppError, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasConfig {
    pub width: f64,
    pub height: f64,
    pub zoom: f64,
    pub offset_x: f64,
    pub offset_y: f64,
    pub show_grid: bool,
    pub show_rulers: bool,
    pub grid_size: f64,
    pub snap_to_grid: bool,
    pub background_color: String,
}

impl Default for CanvasConfig {
    fn default() -> Self {
        Self {
            width: 595.0,  // A4 width in points
            height: 842.0, // A4 height in points
            zoom: 1.0,
            offset_x: 0.0,
            offset_y: 0.0,
            show_grid: true,
            show_rulers: true,
            grid_size: 10.0,
            snap_to_grid: true,
            background_color: "#ffffff".to_string(),
        }
    }
}

impl CanvasConfig {
    pub fn new(width: f64, height: f64) -> Result<Self> {
        if width <= 0.0 || height <= 0.0 {
            return Err(AppError::CanvasError {
                message: format!("Invalid canvas size: {}x{}", width, height),
            });
        }
        
        Ok(Self {
            width,
            height,
            ..Default::default()
        })
    }
    
    pub fn set_zoom(&mut self, zoom: f64) -> Result<()> {
        if zoom <= 0.0 || zoom > 10.0 {
            return Err(AppError::CanvasError {
                message: format!("Invalid zoom level: {}", zoom),
            });
        }
        self.zoom = zoom;
        Ok(())
    }
    
    pub fn set_offset(&mut self, x: f64, y: f64) {
        self.offset_x = x;
        self.offset_y = y;
    }
    
    pub fn screen_to_canvas(&self, screen_x: f64, screen_y: f64) -> (f64, f64) {
        let canvas_x = (screen_x - self.offset_x) / self.zoom;
        let canvas_y = (screen_y - self.offset_y) / self.zoom;
        (canvas_x, canvas_y)
    }
    
    pub fn canvas_to_screen(&self, canvas_x: f64, canvas_y: f64) -> (f64, f64) {
        let screen_x = canvas_x * self.zoom + self.offset_x;
        let screen_y = canvas_y * self.zoom + self.offset_y;
        (screen_x, screen_y)
    }
    
    pub fn snap_to_grid(&self, x: f64, y: f64) -> (f64, f64) {
        if !self.snap_to_grid {
            return (x, y);
        }
        
        let snapped_x = (x / self.grid_size).round() * self.grid_size;
        let snapped_y = (y / self.grid_size).round() * self.grid_size;
        (snapped_x, snapped_y)
    }
    
    pub fn is_point_in_canvas(&self, x: f64, y: f64) -> bool {
        x >= 0.0 && x <= self.width && y >= 0.0 && y <= self.height
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Viewport {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

impl Viewport {
    pub fn new(x: f64, y: f64, width: f64, height: f64) -> Self {
        Self { x, y, width, height }
    }
    
    pub fn contains_point(&self, x: f64, y: f64) -> bool {
        x >= self.x && x <= self.x + self.width && y >= self.y && y <= self.y + self.height
    }
    
    pub fn intersects_rect(&self, x: f64, y: f64, width: f64, height: f64) -> bool {
        !(x + width < self.x
            || self.x + self.width < x
            || y + height < self.y
            || self.y + self.height < y)
    }
}