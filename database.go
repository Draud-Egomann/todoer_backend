package main

import (
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitDB initializes the database
func InitDB() error {
	var err error
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "todoer.db"
	}

	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return err
	}

	// Auto migrate tables
	if err := DB.AutoMigrate(
		&Todo{},
		&Tag{},
		&TodoCompletion{},
		&ChecklistItem{},
		&TodoTag{},
	); err != nil {
		return err
	}

	log.Println("✅ Database initialized successfully")
	return nil
}

// Helper functions for common queries

// GetAllTodosDB fetches all todos from database
func GetAllTodosDB() ([]Todo, error) {
	var todos []Todo
	result := DB.Order("date DESC, time DESC").Find(&todos)
	return todos, result.Error
}

// GetTodoByIDB fetches a single todo by ID
func GetTodoByIDB(id string) (*Todo, error) {
	var todo Todo
	result := DB.First(&todo, "id = ?", id)
	if result.Error == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &todo, result.Error
}

// CreateTodoDB creates a new todo
func CreateTodoDB(todo *Todo) error {
	return DB.Create(todo).Error
}

// UpdateTodoDB updates a todo
func UpdateTodoDB(todo *Todo) error {
	return DB.Save(todo).Error
}

// DeleteTodoDB deletes a todo and related data
func DeleteTodoDB(id string) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		// Delete checklist items
		if err := tx.Where("todo_id = ?", id).Delete(&ChecklistItem{}).Error; err != nil {
			return err
		}
		// Delete completions
		if err := tx.Where("todo_id = ?", id).Delete(&TodoCompletion{}).Error; err != nil {
			return err
		}
		// Delete todo-tag relationships
		if err := tx.Where("todo_id = ?", id).Delete(&TodoTag{}).Error; err != nil {
			return err
		}
		// Delete todo
		return tx.Delete(&Todo{}, "id = ?", id).Error
	})
}

// GetAllTagsDB fetches all tags
func GetAllTagsDB() ([]Tag, error) {
	var tags []Tag
	result := DB.Order("created_at DESC").Find(&tags)
	return tags, result.Error
}

// GetTagByIDB fetches a single tag
func GetTagByIDB(id string) (*Tag, error) {
	var tag Tag
	result := DB.First(&tag, "id = ?", id)
	if result.Error == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &tag, result.Error
}

// CreateTagDB creates a new tag
func CreateTagDB(tag *Tag) error {
	return DB.Create(tag).Error
}

// UpdateTagDB updates a tag
func UpdateTagDB(tag *Tag) error {
	return DB.Save(tag).Error
}

// DeleteTagDB deletes a tag
func DeleteTagDB(id string) error {
	return DB.Delete(&Tag{}, "id = ?", id).Error
}

// GetChecklistItemsForTodoDB gets checklist items for a todo
func GetChecklistItemsForTodoDB(todoID string) ([]ChecklistItem, error) {
	var items []ChecklistItem
	result := DB.Where("todo_id = ?", todoID).Order("created_at ASC").Find(&items)
	return items, result.Error
}

// GetChecklistItemByIDB gets a single checklist item
func GetChecklistItemByIDB(id string) (*ChecklistItem, error) {
	var item ChecklistItem
	result := DB.First(&item, "id = ?", id)
	if result.Error == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &item, result.Error
}

// CreateChecklistItemDB creates a checklist item
func CreateChecklistItemDB(item *ChecklistItem) error {
	return DB.Create(item).Error
}

// UpdateChecklistItemDB updates a checklist item
func UpdateChecklistItemDB(item *ChecklistItem) error {
	return DB.Save(item).Error
}

// DeleteChecklistItemDB deletes a checklist item
func DeleteChecklistItemDB(id string) error {
	return DB.Delete(&ChecklistItem{}, "id = ?", id).Error
}

// GetCompletionsByTodoIDB gets completions for a specific todo
func GetCompletionsByTodoIDB(todoID string) ([]TodoCompletion, error) {
	var completions []TodoCompletion
	result := DB.Where("todo_id = ?", todoID).Order("date DESC").Find(&completions)
	return completions, result.Error
}

// GetCompletionDB gets a specific completion record
func GetCompletionDB(todoID, date string) (*TodoCompletion, error) {
	var completion TodoCompletion
	result := DB.Where("todo_id = ? AND DATE(date) = ?", todoID, date).First(&completion)
	if result.Error == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &completion, result.Error
}

// CreateOrUpdateCompletionDB creates or updates a completion record
func CreateOrUpdateCompletionDB(completion *TodoCompletion) error {
	var existing TodoCompletion
	result := DB.Where("todo_id = ? AND DATE(date) = ?", completion.TodoID, completion.Date.Format("2006-01-02")).First(&existing)
	
	if result.Error == gorm.ErrRecordNotFound {
		return DB.Create(completion).Error
	}
	
	completion.ID = existing.ID
	return DB.Save(completion).Error
}

// DeleteCompletionDB deletes a completion record
func DeleteCompletionDB(todoID, date string) error {
	return DB.Where("todo_id = ? AND DATE(date) = ?", todoID, date).Delete(&TodoCompletion{}).Error
}

// Helper to serialize repeat days
func SerializeRepeatDays(days []int) string {
	data, _ := json.Marshal(days)
	return string(data)
}

// Helper to deserialize repeat days
func DeserializeRepeatDays(data string) []int {
	if data == "" || data == "null" {
		return []int{}
	}
	var days []int
	json.Unmarshal([]byte(data), &days)
	return days
}

// GetTagsForTodoDB gets all tags for a specific todo
func GetTagsForTodoDB(todoID string) ([]Tag, error) {
	var tags []Tag
	result := DB.Where("id IN (SELECT tag_id FROM todo_tags WHERE todo_id = ?)", todoID).Find(&tags)
	return tags, result.Error
}

// CreateTodoTagsDB creates tag relationships for a todo
func CreateTodoTagsDB(todoID string, tagIDs []string) error {
	if len(tagIDs) == 0 {
		return nil
	}
	return DB.Transaction(func(tx *gorm.DB) error {
		for _, tagID := range tagIDs {
			todoTag := &TodoTag{
				ID:        uuid.New().String(),
				TodoID:    todoID,
				TagID:     tagID,
				CreatedAt: time.Now(),
			}
			if err := tx.Create(todoTag).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// UpdateTodoTagsDB updates tag relationships for a todo (replaces all tags)
func UpdateTodoTagsDB(todoID string, tagIDs []string) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		// Delete existing tags
		if err := tx.Where("todo_id = ?", todoID).Delete(&TodoTag{}).Error; err != nil {
			return err
		}
		// Create new tags
		if len(tagIDs) == 0 {
			return nil
		}
		for _, tagID := range tagIDs {
			todoTag := &TodoTag{
				ID:        uuid.New().String(),
				TodoID:    todoID,
				TagID:     tagID,
				CreatedAt: time.Now(),
			}
			if err := tx.Create(todoTag).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
