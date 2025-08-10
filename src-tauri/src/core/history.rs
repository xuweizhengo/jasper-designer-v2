use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use crate::core::element::{ElementId, ReportElement};
use crate::errors::{AppError, Result};

const MAX_HISTORY_SIZE: usize = 50;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Operation {
    CreateElement {
        element: ReportElement,
    },
    UpdateElement {
        id: ElementId,
        old_element: ReportElement,
        new_element: ReportElement,
    },
    DeleteElement {
        element: ReportElement,
    },
    MoveElements {
        ids: Vec<ElementId>,
        old_positions: Vec<(f64, f64)>,
        new_positions: Vec<(f64, f64)>,
    },
    BatchOperation {
        operations: Vec<Operation>,
    },
}

impl Operation {
    pub fn get_affected_elements(&self) -> Vec<ElementId> {
        match self {
            Operation::CreateElement { element } => vec![element.id.clone()],
            Operation::UpdateElement { id, .. } => vec![id.clone()],
            Operation::DeleteElement { element } => vec![element.id.clone()],
            Operation::MoveElements { ids, .. } => ids.clone(),
            Operation::BatchOperation { operations } => {
                operations
                    .iter()
                    .flat_map(|op| op.get_affected_elements())
                    .collect()
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub operation: Operation,
    pub timestamp: u64,
    pub description: String,
}

impl HistoryEntry {
    pub fn new(operation: Operation, description: String) -> Self {
        Self {
            operation,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64,
            description,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct History {
    undo_stack: VecDeque<HistoryEntry>,
    redo_stack: VecDeque<HistoryEntry>,
}

impl Default for History {
    fn default() -> Self {
        Self::new()
    }
}

impl History {
    pub fn new() -> Self {
        Self {
            undo_stack: VecDeque::new(),
            redo_stack: VecDeque::new(),
        }
    }
    
    pub fn push(&mut self, operation: Operation, description: String) {
        let entry = HistoryEntry::new(operation, description);
        
        self.undo_stack.push_back(entry);
        
        // Clear redo stack when new operation is added
        self.redo_stack.clear();
        
        // Limit history size
        while self.undo_stack.len() > MAX_HISTORY_SIZE {
            self.undo_stack.pop_front();
        }
    }
    
    pub fn can_undo(&self) -> bool {
        !self.undo_stack.is_empty()
    }
    
    pub fn can_redo(&self) -> bool {
        !self.redo_stack.is_empty()
    }
    
    pub fn undo(&mut self) -> Result<Operation> {
        let entry = self.undo_stack.pop_back()
            .ok_or_else(|| AppError::HistoryError {
                message: "Nothing to undo".to_string(),
            })?;
        
        let reverse_operation = self.create_reverse_operation(&entry.operation)?;
        self.redo_stack.push_back(entry);
        
        Ok(reverse_operation)
    }
    
    pub fn redo(&mut self) -> Result<Operation> {
        let entry = self.redo_stack.pop_back()
            .ok_or_else(|| AppError::HistoryError {
                message: "Nothing to redo".to_string(),
            })?;
        
        let operation = entry.operation.clone();
        self.undo_stack.push_back(entry);
        
        Ok(operation)
    }
    
    pub fn clear(&mut self) {
        self.undo_stack.clear();
        self.redo_stack.clear();
    }
    
    pub fn get_undo_description(&self) -> Option<&str> {
        self.undo_stack.back().map(|entry| entry.description.as_str())
    }
    
    pub fn get_redo_description(&self) -> Option<&str> {
        self.redo_stack.back().map(|entry| entry.description.as_str())
    }
    
    fn create_reverse_operation(&self, operation: &Operation) -> Result<Operation> {
        match operation {
            Operation::CreateElement { element } => {
                Ok(Operation::DeleteElement {
                    element: element.clone(),
                })
            }
            Operation::DeleteElement { element } => {
                Ok(Operation::CreateElement {
                    element: element.clone(),
                })
            }
            Operation::UpdateElement { id, old_element, new_element } => {
                Ok(Operation::UpdateElement {
                    id: id.clone(),
                    old_element: new_element.clone(),
                    new_element: old_element.clone(),
                })
            }
            Operation::MoveElements { ids, old_positions, new_positions } => {
                Ok(Operation::MoveElements {
                    ids: ids.clone(),
                    old_positions: new_positions.clone(),
                    new_positions: old_positions.clone(),
                })
            }
            Operation::BatchOperation { operations } => {
                let reverse_ops: Result<Vec<Operation>> = operations
                    .iter()
                    .rev()
                    .map(|op| self.create_reverse_operation(op))
                    .collect();
                
                Ok(Operation::BatchOperation {
                    operations: reverse_ops?,
                })
            }
        }
    }
}