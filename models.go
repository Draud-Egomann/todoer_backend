package main

import (
	"time"
)

type RepeatType string

const (
	RepeatTypeNone     RepeatType = "none"
	RepeatTypeDaily    RepeatType = "daily"
	RepeatTypeWeekly   RepeatType = "weekly"
	RepeatTypeMonthly  RepeatType = "monthly"
)

// Todo represents a todo item
type Todo struct {
	ID        string `gorm:"primaryKey" json:"id"`
	Title     string `json:"title"`
	Notes     string `json:"notes"`
	Date      time.Time `json:"date"`
	Time      string `json:"time"`
	RepeatType RepeatType `json:"repeatType"`
	RepeatDays string `json:"repeatDays"` // JSON array stored as string
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Tag represents a tag/category
type Tag struct {
	ID        string `gorm:"primaryKey" json:"id"`
	Name      string `json:"name"`
	Color     string `json:"color"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// TodoCompletion represents the completion status of a todo on a specific date
type TodoCompletion struct {
	ID        string `gorm:"primaryKey" json:"id"`
	TodoID    string `json:"todoId"`
	Date      time.Time `json:"date"`
	Completed bool `json:"completed"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// ChecklistItem represents an item in a todo's checklist
type ChecklistItem struct {
	ID        string `gorm:"primaryKey" json:"id"`
	TodoID    string `json:"todoId"`
	Text      string `json:"text"`
	Completed bool `json:"completed"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// TodoTag represents a many-to-many relationship between todos and tags
type TodoTag struct {
	ID        string `gorm:"primaryKey" json:"id"`
	TodoID    string `json:"todoId"`
	TagID     string `json:"tagId"`
	CreatedAt time.Time `json:"createdAt"`
}

// CreateTodoRequest is the request structure for creating a todo
type CreateTodoRequest struct {
	Title      string `json:"title" validate:"required"`
	Notes      string `json:"notes"`
	Date       time.Time `json:"date" validate:"required"`
	Time       string `json:"time" validate:"required"`
	RepeatType RepeatType `json:"repeatType"`
	RepeatDays []int `json:"repeatDays"`
}

// UpdateTodoRequest is the request structure for updating a todo
type UpdateTodoRequest struct {
	Title      string `json:"title"`
	Notes      string `json:"notes"`
	Date       time.Time `json:"date"`
	Time       string `json:"time"`
	RepeatType RepeatType `json:"repeatType"`
	RepeatDays []int `json:"repeatDays"`
}

// CreateTagRequest is the request structure for creating a tag
type CreateTagRequest struct {
	Name  string `json:"name" validate:"required"`
	Color string `json:"color" validate:"required"`
}

// UpdateTagRequest is the request structure for updating a tag
type UpdateTagRequest struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

// CreateChecklistItemRequest is the request structure for creating a checklist item
type CreateChecklistItemRequest struct {
	TodoID string `json:"todoId" validate:"required"`
	Text   string `json:"text" validate:"required"`
}

// UpdateChecklistItemRequest is the request structure for updating a checklist item
type UpdateChecklistItemRequest struct {
	Text      string `json:"text"`
	Completed bool `json:"completed"`
}

// SetCompletionRequest is the request structure for setting a todo completion status
type SetCompletionRequest struct {
	Completed bool `json:"completed"`
}

// StatusResponse represents status information
type StatusResponse struct {
	Date           time.Time `json:"date"`
	TotalTodos     int `json:"totalTodos"`
	CompletedTodos int `json:"completedTodos"`
	CompletionRate float64 `json:"completionRate"`
}

// StatusByTagResponse represents status grouped by tags
type StatusByTagResponse struct {
	TagID          string `json:"tagId"`
	TagName        string `json:"tagName"`
	TotalTodos     int `json:"totalTodos"`
	CompletedTodos int `json:"completedTodos"`
	CompletionRate float64 `json:"completionRate"`
}

// Pagination helper
type PaginationRequest struct {
	Page  int `query:"page"`
	Limit int `query:"limit"`
}

// TableName specifies table names
func (Todo) TableName() string { return "todos" }
func (Tag) TableName() string { return "tags" }
func (TodoCompletion) TableName() string { return "todo_completions" }
func (ChecklistItem) TableName() string { return "checklist_items" }
func (TodoTag) TableName() string { return "todo_tags" }
