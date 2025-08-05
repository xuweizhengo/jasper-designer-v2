use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::{command, State};
use serde::{Deserialize, Serialize};

use crate::core::state::{AppState, AppStateDto};
use crate::core::canvas::CanvasConfig;
use crate::errors::Result;

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCanvasConfigRequest {
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub zoom: Option<f64>,
    pub offset_x: Option<f64>,
    pub offset_y: Option<f64>,
    pub show_grid: Option<bool>,
    pub show_rulers: Option<bool>,
    pub grid_size: Option<f64>,
    pub snap_to_grid: Option<bool>,
    pub background_color: Option<String>,
}

#[command]
pub async fn get_canvas_config(
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<CanvasConfig> {
    let app_state = state.read().await;
    Ok(app_state.canvas.clone())
}

#[command]
pub async fn update_canvas_config(
    request: UpdateCanvasConfigRequest,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    let mut config = app_state.canvas.clone();
    
    if let Some(width) = request.width {
        if width > 0.0 {
            config.width = width;
        }
    }
    
    if let Some(height) = request.height {
        if height > 0.0 {
            config.height = height;
        }
    }
    
    if let Some(zoom) = request.zoom {
        config.set_zoom(zoom)?;
    }
    
    if let Some(offset_x) = request.offset_x {
        config.offset_x = offset_x;
    }
    
    if let Some(offset_y) = request.offset_y {
        config.offset_y = offset_y;
    }
    
    if let Some(show_grid) = request.show_grid {
        config.show_grid = show_grid;
    }
    
    if let Some(show_rulers) = request.show_rulers {
        config.show_rulers = show_rulers;
    }
    
    if let Some(grid_size) = request.grid_size {
        if grid_size > 0.0 {
            config.grid_size = grid_size;
        }
    }
    
    if let Some(snap_to_grid) = request.snap_to_grid {
        config.snap_to_grid = snap_to_grid;
    }
    
    if let Some(background_color) = request.background_color {
        config.background_color = background_color;
    }
    
    app_state.update_canvas_config(config);
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(())
}

#[command]
pub async fn screen_to_canvas(
    screen_x: f64,
    screen_y: f64,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<(f64, f64)> {
    let app_state = state.read().await;
    let (canvas_x, canvas_y) = app_state.canvas.screen_to_canvas(screen_x, screen_y);
    Ok((canvas_x, canvas_y))
}

#[command]
pub async fn canvas_to_screen(
    canvas_x: f64,
    canvas_y: f64,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<(f64, f64)> {
    let app_state = state.read().await;
    let (screen_x, screen_y) = app_state.canvas.canvas_to_screen(canvas_x, canvas_y);
    Ok((screen_x, screen_y))
}

#[command]
pub async fn snap_to_grid(
    x: f64,
    y: f64,
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<(f64, f64)> {
    let app_state = state.read().await;
    let (snapped_x, snapped_y) = app_state.canvas.snap_to_grid(x, y);
    Ok((snapped_x, snapped_y))
}

#[command]
pub async fn get_app_state(
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<AppStateDto> {
    let app_state = state.read().await;
    Ok(AppStateDto::from(&*app_state))
}

// Helper function to emit state changes
async fn emit_state_change(app_state: &AppState) {
    let dto = AppStateDto::from(app_state);
    println!("Canvas config updated: {}x{}", dto.canvas_config.width, dto.canvas_config.height);
}