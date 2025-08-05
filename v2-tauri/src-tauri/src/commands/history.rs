use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::{command, State};

use crate::core::state::{AppState, AppStateDto};
use crate::errors::Result;

#[command]
pub async fn undo(
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    
    app_state.undo()?;
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(())
}

#[command]
pub async fn redo(
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    
    app_state.redo()?;
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(())
}

#[command]
pub async fn can_undo(
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<bool> {
    let app_state = state.read().await;
    Ok(app_state.can_undo())
}

#[command]
pub async fn can_redo(
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<bool> {
    let app_state = state.read().await;
    Ok(app_state.can_redo())
}

#[command]
pub async fn get_undo_description(
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<Option<String>> {
    let app_state = state.read().await;
    Ok(app_state.history.get_undo_description().map(|s| s.to_string()))
}

#[command]
pub async fn get_redo_description(
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<Option<String>> {
    let app_state = state.read().await;
    Ok(app_state.history.get_redo_description().map(|s| s.to_string()))
}

#[command]
pub async fn clear_history(
    state: State<'_, Arc<RwLock<AppState>>>,
) -> Result<()> {
    let mut app_state = state.write().await;
    app_state.history.clear();
    app_state.set_dirty(true);
    
    // Emit state change event
    emit_state_change(&app_state).await;
    
    Ok(())
}

// Helper function to emit state changes
async fn emit_state_change(app_state: &AppState) {
    let dto = AppStateDto::from(app_state);
    println!("History changed: can_undo={}, can_redo={}", dto.can_undo, dto.can_redo);
}