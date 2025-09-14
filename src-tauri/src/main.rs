// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod core;
mod commands;
mod errors;
mod data;
mod preview;
mod types;
mod renderer;

use tauri::Manager;
use std::sync::Arc;
use tokio::sync::{RwLock, Mutex};
use crate::core::state::AppState;
use crate::data::DataSourceRegistry;

#[tokio::main]
async fn main() {
    // Initialize application state
    let app_state = Arc::new(RwLock::new(AppState::new()));
    
    // Initialize data source registry with file storage
    let app_data_dir = tauri::api::path::app_data_dir(&tauri::Config::default())
        .unwrap_or_else(|| std::env::current_dir().unwrap().join(".jasper-data"));
    
    // 确保数据目录存在
    if let Err(e) = std::fs::create_dir_all(&app_data_dir) {
        eprintln!("Warning: Failed to create app data directory: {}", e);
    }
    
    let config_file = app_data_dir.join("data_sources.json");
    println!("📁 数据源配置文件路径: {:?}", config_file);
    
    let storage = Box::new(crate::data::storage::FileConfigStorage::new(config_file));
    let mut data_registry = DataSourceRegistry::new(storage);
    
    // Load existing data sources from storage
    if let Err(e) = data_registry.load_from_storage().await {
        eprintln!("Warning: Failed to load data sources from storage: {}", e);
    }
    
    // Use unified type definition to match commands.rs expectations
    let data_registry = Mutex::new(data_registry);

    tauri::Builder::default()
        .manage(app_state)
        .manage(data_registry)
        .invoke_handler(tauri::generate_handler![
            commands::element::create_element,
            commands::element::update_element,
            commands::element::delete_element,
            commands::element::select_element,
            commands::element::select_multiple,
            commands::element::add_to_selection,
            commands::element::remove_from_selection,
            commands::element::toggle_selection,
            commands::element::batch_update_positions,
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
            commands::toggle_devtools,
            // Preview commands
            preview::commands::generate_preview,
            preview::commands::batch_render,
            preview::commands::generate_thumbnail,
            preview::commands::get_supported_formats,
            preview::commands::get_default_render_options,
            preview::commands::validate_render_options,
            preview::commands::get_render_stats,
            preview::commands::clear_render_cache,
            preview::commands::export_to_file,
            preview::commands::get_render_progress,
            preview::commands::cancel_render_task,
            // Data source management commands
            data::commands::get_available_data_source_types,
            data::commands::create_data_source,
            data::commands::test_data_source_connection,
            data::commands::list_data_sources,
            data::commands::delete_data_source,
            data::commands::update_data_source_config,
            // Data query commands
            data::commands::query_data_source,
            data::commands::get_data_preview,
            data::commands::evaluate_expression,
            data::commands::evaluate_expressions_batch,
            data::commands::search_data,
            // Schema management commands
            data::commands::get_data_source_schema,
            data::commands::refresh_data_source_schema,
            data::commands::discover_schema,
            // Configuration commands
            data::commands::get_config_schema,
            data::commands::validate_config,
            data::commands::get_default_config,
            data::commands::get_example_configs,
            // Template management commands
            commands::template::load_jasper_template,
            commands::template::save_jasper_template,
            commands::template::save_template_as,
            commands::template::validate_template,
            commands::template::create_empty_template,
            commands::template::get_template_info,
            commands::template::detect_template_format,
            commands::template::export_template_json,
            commands::template::import_template_json,
            commands::template::clone_template,
            commands::template::generate_template_preview,
            commands::template::merge_templates,
            commands::template::extract_template_elements,
            // Database-specific commands
            data::commands::test_database_connection,
            data::commands::load_database_schema,
            data::commands::discover_database_schema,
            data::commands::create_database_source,
            data::commands::format_sql,
            data::commands::validate_sql_syntax,
            data::commands::execute_database_preview,
            data::commands::explain_query,
            data::commands::get_table_sample,
            // Skia rendering commands
            commands::render::export_with_skia,
            commands::render::render_preview_skia,
            // data::commands::get_table_sample,
        ])
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            
            // Set minimum window size
            let _ = window.set_min_size(Some(tauri::Size::Physical(tauri::PhysicalSize {
                width: 1200,
                height: 700,
            })));
            
            // Enable devtools for debugging (always open for this version)
            window.open_devtools();
            println!("🔧 DevTools opened automatically");
            println!("💡 You can also use F12 or Ctrl+Shift+I to toggle DevTools");
            println!("🎯 Jasper Designer V2.0 with Drag & Drop support ready!");
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}