use serde::{Deserialize, Serialize};
use std::collections::{HashSet, HashMap};
use crate::core::element::{ElementId, ReportElement};
use crate::core::canvas::CanvasConfig;
use crate::core::history::{History, Operation};
use crate::errors::{AppError, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppState {
    pub canvas: CanvasConfig,
    pub elements: HashMap<ElementId, ReportElement>,
    pub selected_ids: HashSet<ElementId>,
    pub clipboard: Vec<ReportElement>,
    pub history: History,
    pub dirty: bool,
    pub template_name: Option<String>,
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

impl AppState {
    pub fn new() -> Self {
        Self {
            canvas: CanvasConfig::default(),
            elements: HashMap::new(),
            selected_ids: HashSet::new(),
            clipboard: Vec::new(),
            history: History::new(),
            dirty: false,
            template_name: None,
        }
    }
    
    // Element operations
    pub fn add_element(&mut self, element: ReportElement) -> Result<()> {
        if self.elements.contains_key(&element.id) {
            return Err(AppError::ElementAlreadyExists {
                id: element.id.to_string(),
            });
        }
        
        let operation = Operation::CreateElement {
            element: element.clone(),
        };
        
        self.elements.insert(element.id.clone(), element);
        self.history.push(operation, "Create element".to_string());
        self.set_dirty(true);
        
        Ok(())
    }
    
    pub fn update_element(&mut self, id: &ElementId, updated_element: ReportElement) -> Result<()> {
        let old_element = self.elements.get(id)
            .ok_or_else(|| AppError::ElementNotFound {
                id: id.to_string(),
            })?
            .clone();
        
        let operation = Operation::UpdateElement {
            id: id.clone(),
            old_element,
            new_element: updated_element.clone(),
        };
        
        self.elements.insert(id.clone(), updated_element);
        self.history.push(operation, "Update element".to_string());
        self.set_dirty(true);
        
        Ok(())
    }
    
    pub fn delete_element(&mut self, id: &ElementId) -> Result<()> {
        let element = self.elements.remove(id)
            .ok_or_else(|| AppError::ElementNotFound {
                id: id.to_string(),
            })?;
        
        let operation = Operation::DeleteElement { element };
        
        self.selected_ids.remove(id);
        self.history.push(operation, "Delete element".to_string());
        self.set_dirty(true);
        
        Ok(())
    }
    
    pub fn get_element(&self, id: &ElementId) -> Option<&ReportElement> {
        self.elements.get(id)
    }
    
    pub fn get_element_mut(&mut self, id: &ElementId) -> Option<&mut ReportElement> {
        self.elements.get_mut(id)
    }
    
    pub fn get_elements_at_point(&self, x: f64, y: f64) -> Vec<&ReportElement> {
        self.elements
            .values()
            .filter(|element| element.visible && element.contains_point(x, y))
            .collect()
    }
    
    pub fn get_all_elements(&self) -> Vec<&ReportElement> {
        self.elements.values().collect()
    }
    
    pub fn get_elements_by_ids(&self, ids: &[ElementId]) -> Vec<&ReportElement> {
        ids.iter()
            .filter_map(|id| self.elements.get(id))
            .collect()
    }
    
    // Selection operations
    pub fn select_element(&mut self, id: ElementId) -> Result<()> {
        if !self.elements.contains_key(&id) {
            return Err(AppError::ElementNotFound {
                id: id.to_string(),
            });
        }
        
        self.selected_ids.clear();
        self.selected_ids.insert(id);
        Ok(())
    }
    
    pub fn add_to_selection(&mut self, id: ElementId) -> Result<()> {
        if !self.elements.contains_key(&id) {
            return Err(AppError::ElementNotFound {
                id: id.to_string(),
            });
        }
        
        self.selected_ids.insert(id);
        Ok(())
    }
    
    pub fn remove_from_selection(&mut self, id: &ElementId) {
        self.selected_ids.remove(id);
    }
    
    pub fn clear_selection(&mut self) {
        self.selected_ids.clear();
    }
    
    pub fn select_multiple(&mut self, ids: Vec<ElementId>) -> Result<()> {
        self.selected_ids.clear();
        
        for id in ids {
            if !self.elements.contains_key(&id) {
                return Err(AppError::ElementNotFound {
                    id: id.to_string(),
                });
            }
            self.selected_ids.insert(id);
        }
        
        Ok(())
    }
    
    pub fn get_selected_elements(&self) -> Vec<&ReportElement> {
        self.selected_ids
            .iter()
            .filter_map(|id| self.elements.get(id))
            .collect()
    }
    
    pub fn has_selection(&self) -> bool {
        !self.selected_ids.is_empty()
    }
    
    // Clipboard operations
    pub fn copy_selected(&mut self) {
        self.clipboard = self.get_selected_elements()
            .into_iter()
            .cloned()
            .collect();
    }
    
    pub fn paste(&mut self, offset_x: f64, offset_y: f64) -> Result<Vec<ElementId>> {
        if self.clipboard.is_empty() {
            return Ok(Vec::new());
        }
        
        let mut new_ids = Vec::new();
        let mut operations = Vec::new();
        
        for element in &self.clipboard {
            let mut new_element = element.clone();
            new_element.id = ElementId::new();
            new_element.position.x += offset_x;
            new_element.position.y += offset_y;
            
            new_element.position.validate()?;
            
            operations.push(Operation::CreateElement {
                element: new_element.clone(),
            });
            
            new_ids.push(new_element.id.clone());
            self.elements.insert(new_element.id.clone(), new_element);
        }
        
        if !operations.is_empty() {
            self.history.push(
                Operation::BatchOperation { operations },
                format!("Paste {} elements", self.clipboard.len()),
            );
            self.set_dirty(true);
        }
        
        Ok(new_ids)
    }
    
    // History operations
    pub fn undo(&mut self) -> Result<()> {
        let operation = self.history.undo()?;
        self.apply_operation(&operation)?;
        self.set_dirty(true);
        Ok(())
    }
    
    pub fn redo(&mut self) -> Result<()> {
        let operation = self.history.redo()?;
        self.apply_operation(&operation)?;
        self.set_dirty(true);
        Ok(())
    }
    
    pub fn can_undo(&self) -> bool {
        self.history.can_undo()
    }
    
    pub fn can_redo(&self) -> bool {
        self.history.can_redo()
    }
    
    // Canvas operations
    pub fn update_canvas_config(&mut self, config: CanvasConfig) {
        self.canvas = config;
        self.set_dirty(true);
    }
    
    // State management
    pub fn set_dirty(&mut self, dirty: bool) {
        self.dirty = dirty;
    }
    
    pub fn is_dirty(&self) -> bool {
        self.dirty
    }
    
    pub fn clear(&mut self) {
        self.elements.clear();
        self.selected_ids.clear();
        self.clipboard.clear();
        self.history.clear();
        self.canvas = CanvasConfig::default();
        self.dirty = false;
        self.template_name = None;
    }
    
    // Private helper methods
    fn apply_operation(&mut self, operation: &Operation) -> Result<()> {
        match operation {
            Operation::CreateElement { element } => {
                self.elements.insert(element.id.clone(), element.clone());
            }
            Operation::DeleteElement { element } => {
                self.elements.remove(&element.id);
                self.selected_ids.remove(&element.id);
            }
            Operation::UpdateElement { id, new_element, .. } => {
                self.elements.insert(id.clone(), new_element.clone());
            }
            Operation::MoveElements { ids, new_positions, .. } => {
                for (id, (x, y)) in ids.iter().zip(new_positions.iter()) {
                    if let Some(element) = self.elements.get_mut(id) {
                        element.position.x = *x;
                        element.position.y = *y;
                    }
                }
            }
            Operation::BatchOperation { operations } => {
                for op in operations {
                    self.apply_operation(op)?;
                }
            }
        }
        Ok(())
    }
}

// DTO for frontend communication
#[derive(Debug, Serialize, Deserialize)]
pub struct AppStateDto {
    pub elements: Vec<ReportElement>,
    pub selected_ids: Vec<String>,
    pub canvas_config: CanvasConfig,
    pub can_undo: bool,
    pub can_redo: bool,
    pub undo_description: Option<String>,
    pub redo_description: Option<String>,
    pub dirty: bool,
    pub template_name: Option<String>,
}

impl From<&AppState> for AppStateDto {
    fn from(state: &AppState) -> Self {
        Self {
            elements: state.elements.values().cloned().collect(),
            selected_ids: state.selected_ids.iter().map(|id| id.to_string()).collect(),
            canvas_config: state.canvas.clone(),
            can_undo: state.can_undo(),
            can_redo: state.can_redo(),
            undo_description: state.history.get_undo_description().map(|s| s.to_string()),
            redo_description: state.history.get_redo_description().map(|s| s.to_string()),
            dirty: state.dirty,
            template_name: state.template_name.clone(),
        }
    }
}