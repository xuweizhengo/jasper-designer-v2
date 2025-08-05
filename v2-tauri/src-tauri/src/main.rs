// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod core;
mod commands;
mod errors;

use tauri::Manager;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::core::state::AppState;

#[tokio::main]
async fn main() {
    // Initialize application state
    let app_state = Arc::new(RwLock::new(AppState::new()));

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::element::create_element,
            commands::element::update_element,
            commands::element::delete_element,
            commands::element::select_element,
            commands::element::clear_selection,
            commands::canvas::get_canvas_config,
            commands::canvas::update_canvas_config,
            commands::history::undo,
            commands::history::redo,
            commands::file::save_template,
            commands::file::load_template,
        ])
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            
            // Set minimum window size
            let _ = window.set_min_size(Some(tauri::Size::Physical(tauri::PhysicalSize {
                width: 1200,
                height: 700,
            })));
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}