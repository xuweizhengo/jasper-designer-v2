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
            commands::element::get_elements_at_point,
            commands::element::copy_selected,
            commands::element::paste_elements,
            commands::canvas::get_canvas_config,
            commands::canvas::update_canvas_config,
            commands::canvas::get_app_state,
            commands::canvas::screen_to_canvas,
            commands::canvas::canvas_to_screen,
            commands::canvas::snap_to_grid,
            commands::history::undo,
            commands::history::redo,
            commands::file::save_template,
            commands::file::load_template,
            commands::file::new_template,
            commands::file::export_json,
            commands::file::get_recent_templates,
        ])
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            
            // Set minimum window size
            let _ = window.set_min_size(Some(tauri::Size::Physical(tauri::PhysicalSize {
                width: 1200,
                height: 700,
            })));
            
            // Enable devtools for debugging
            #[cfg(debug_assertions)]
            {
                println!("Debug mode: DevTools should be available with F12");
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}