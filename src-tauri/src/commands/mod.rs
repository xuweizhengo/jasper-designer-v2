pub mod element;
pub mod canvas;
pub mod history;
pub mod file;

// Debug commands
#[tauri::command]
pub async fn toggle_devtools(window: tauri::Window) -> Result<(), String> {
    #[cfg(debug_assertions)]
    {
        if window.is_devtools_open() {
            window.close_devtools();
        } else {
            window.open_devtools();
        }
        Ok(())
    }
    #[cfg(not(debug_assertions))]
    {
        window.open_devtools();
        Ok(())
    }
}