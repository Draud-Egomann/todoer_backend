package main

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// ============ TODOS ============

// @Summary Get all todos
// @Description Get all todos from the database
// @Tags Todos
// @Security ApiKeyAuth
// @Success 200 {array} Todo
// @Router /todos [get]
func GetAllTodos(c *fiber.Ctx) error {
	todos, err := GetAllTodosDB()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch todos",
		})
	}
	return c.JSON(todos)
}

// @Summary Get todo by ID
// @Description Get a specific todo by its ID
// @Tags Todos
// @Security ApiKeyAuth
// @Param id path string true "Todo ID"
// @Success 200 {object} Todo
// @Router /todos/{id} [get]
func GetTodoByID(c *fiber.Ctx) error {
	id := c.Params("id")
	todo, err := GetTodoByIDB(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch todo",
		})
	}
	if todo == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Todo not found",
		})
	}
	return c.JSON(todo)
}

// @Summary Get todos by date
// @Description Get all todos for a specific date
// @Tags Todos
// @Security ApiKeyAuth
// @Param date path string true "Date in YYYY-MM-DD format"
// @Success 200 {array} Todo
// @Router /todos/by-date/{date} [get]
func GetTodosByDate(c *fiber.Ctx) error {
	dateStr := c.Params("date")
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid date format, use YYYY-MM-DD",
		})
	}

	var todos []Todo
	result := DB.Where("DATE(date) = ?", date.Format("2006-01-02")).
		Order("time DESC").Find(&todos)
	
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch todos",
		})
	}
	return c.JSON(todos)
}

// @Summary Get todos for date range
// @Description Get all todos between two dates
// @Tags Todos
// @Security ApiKeyAuth
// @Param startDate path string true "Start date in YYYY-MM-DD format"
// @Param endDate path string true "End date in YYYY-MM-DD format"
// @Success 200 {array} Todo
// @Router /todos/range/{startDate}/{endDate} [get]
func GetTodosForDateRange(c *fiber.Ctx) error {
	startStr := c.Params("startDate")
	endStr := c.Params("endDate")

	start, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid startDate format, use YYYY-MM-DD",
		})
	}

	end, err := time.Parse("2006-01-02", endStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid endDate format, use YYYY-MM-DD",
		})
	}

	var todos []Todo
	result := DB.Where("DATE(date) BETWEEN ? AND ?", start.Format("2006-01-02"), end.Format("2006-01-02")).
		Order("date DESC, time DESC").Find(&todos)
	
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch todos",
		})
	}
	return c.JSON(todos)
}

// @Summary Create a new todo
// @Description Create a new todo item
// @Tags Todos
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Param request body CreateTodoRequest true "Todo data"
// @Success 201 {object} Todo
// @Router /todos [post]
func CreateTodo(c *fiber.Ctx) error {
	var req CreateTodoRequest
	if err := json.Unmarshal(c.Body(), &req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	todo := &Todo{
		ID:        uuid.New().String(),
		Title:     req.Title,
		Notes:     req.Notes,
		Date:      req.Date,
		Time:      req.Time,
		RepeatType: req.RepeatType,
		RepeatDays: SerializeRepeatDays(req.RepeatDays),
		Important: req.Important,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := CreateTodoDB(todo); err != nil {
		log.Println("Error creating todo:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create todo",
		})
	}

	// Create tag relationships
	if err := CreateTodoTagsDB(todo.ID, req.TagIDs); err != nil {
		log.Println("Error creating todo tags:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create todo tags",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(todo)
}

// @Summary Update a todo
// @Description Update an existing todo
// @Tags Todos
// @Security ApiKeyAuth
// @Param id path string true "Todo ID"
// @Accept json
// @Param request body UpdateTodoRequest true "Todo data"
// @Success 200 {object} Todo
// @Router /todos/{id} [put]
func UpdateTodo(c *fiber.Ctx) error {
	id := c.Params("id")
	var req UpdateTodoRequest
	if err := json.Unmarshal(c.Body(), &req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	todo, err := GetTodoByIDB(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch todo",
		})
	}
	if todo == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Todo not found",
		})
	}

	// Update fields if provided
	if req.Title != "" {
		todo.Title = req.Title
	}
	if req.Notes != "" {
		todo.Notes = req.Notes
	}
	if !req.Date.IsZero() {
		todo.Date = req.Date
	}
	if req.Time != "" {
		todo.Time = req.Time
	}
	if req.RepeatType != "" {
		todo.RepeatType = req.RepeatType
	}
	if len(req.RepeatDays) > 0 {
		todo.RepeatDays = SerializeRepeatDays(req.RepeatDays)
	}
	if req.Important != nil {
		todo.Important = *req.Important
	}
	todo.UpdatedAt = time.Now()

	if err := UpdateTodoDB(todo); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update todo",
		})
	}

	// Update tag relationships if provided
	if len(req.TagIDs) > 0 || (len(req.TagIDs) == 0 && req.TagIDs != nil) {
		if err := UpdateTodoTagsDB(id, req.TagIDs); err != nil {
			log.Println("Error updating todo tags:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to update todo tags",
			})
		}
	}

	return c.JSON(todo)
}

// @Summary Delete a todo
// @Description Delete a todo and its related data
// @Tags Todos
// @Security ApiKeyAuth
// @Param id path string true "Todo ID"
// @Success 204
// @Router /todos/{id} [delete]
func DeleteTodo(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := DeleteTodoDB(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete todo",
		})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// ============ TAGS ============

// @Summary Get all tags
// @Description Get all available tags
// @Tags Tags
// @Security ApiKeyAuth
// @Success 200 {array} Tag
// @Router /tags [get]
func GetAllTags(c *fiber.Ctx) error {
	tags, err := GetAllTagsDB()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch tags",
		})
	}
	return c.JSON(tags)
}

// @Summary Get tag by ID
// @Description Get a specific tag by its ID
// @Tags Tags
// @Security ApiKeyAuth
// @Param id path string true "Tag ID"
// @Success 200 {object} Tag
// @Router /tags/{id} [get]
func GetTagByID(c *fiber.Ctx) error {
	id := c.Params("id")
	tag, err := GetTagByIDB(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch tag",
		})
	}
	if tag == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Tag not found",
		})
	}
	return c.JSON(tag)
}

// @Summary Create a new tag
// @Description Create a new tag
// @Tags Tags
// @Security ApiKeyAuth
// @Accept json
// @Param request body CreateTagRequest true "Tag data"
// @Success 201 {object} Tag
// @Router /tags [post]
func CreateTag(c *fiber.Ctx) error {
	var req CreateTagRequest
	if err := json.Unmarshal(c.Body(), &req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	tag := &Tag{
		ID:        uuid.New().String(),
		Name:      req.Name,
		Color:     req.Color,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := CreateTagDB(tag); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create tag",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(tag)
}

// @Summary Update a tag
// @Description Update an existing tag
// @Tags Tags
// @Security ApiKeyAuth
// @Param id path string true "Tag ID"
// @Accept json
// @Param request body UpdateTagRequest true "Tag data"
// @Success 200 {object} Tag
// @Router /tags/{id} [put]
func UpdateTag(c *fiber.Ctx) error {
	id := c.Params("id")
	var req UpdateTagRequest
	if err := json.Unmarshal(c.Body(), &req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	tag, err := GetTagByIDB(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch tag",
		})
	}
	if tag == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Tag not found",
		})
	}

	if req.Name != "" {
		tag.Name = req.Name
	}
	if req.Color != "" {
		tag.Color = req.Color
	}
	tag.UpdatedAt = time.Now()

	if err := UpdateTagDB(tag); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update tag",
		})
	}

	return c.JSON(tag)
}

// @Summary Delete a tag
// @Description Delete a tag
// @Tags Tags
// @Security ApiKeyAuth
// @Param id path string true "Tag ID"
// @Success 204
// @Router /tags/{id} [delete]
func DeleteTag(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := DeleteTagDB(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete tag",
		})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// ============ COMPLETIONS ============

// @Summary Get completions by todo ID
// @Description Get all completions for a specific todo
// @Tags Completions
// @Security ApiKeyAuth
// @Param todoId path string true "Todo ID"
// @Success 200 {array} TodoCompletion
// @Router /completions/todo/{todoId} [get]
func GetCompletionsByTodoID(c *fiber.Ctx) error {
	todoID := c.Params("todoId")
	completions, err := GetCompletionsByTodoIDB(todoID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch completions",
		})
	}
	return c.JSON(completions)
}

// @Summary Get completion for specific date
// @Description Get completion status for a todo on a specific date
// @Tags Completions
// @Security ApiKeyAuth
// @Param todoId path string true "Todo ID"
// @Param date path string true "Date in YYYY-MM-DD format"
// @Success 200 {object} TodoCompletion
// @Router /completions/todo/{todoId}/date/{date} [get]
func GetCompletion(c *fiber.Ctx) error {
	todoID := c.Params("todoId")
	dateStr := c.Params("date")

	completion, err := GetCompletionDB(todoID, dateStr)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch completion",
		})
	}
	if completion == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Completion not found",
		})
	}
	return c.JSON(completion)
}

// @Summary Get completions for date
// @Description Get all completions for a specific date
// @Tags Completions
// @Security ApiKeyAuth
// @Param date path string true "Date in YYYY-MM-DD format"
// @Success 200 {array} TodoCompletion
// @Router /completions/date/{date} [get]
func GetCompletionsForDate(c *fiber.Ctx) error {
	dateStr := c.Params("date")
	_, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid date format, use YYYY-MM-DD",
		})
	}

	var completions []TodoCompletion
	result := DB.Where("DATE(date) = ?", dateStr).Order("created_at DESC").Find(&completions)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch completions",
		})
	}
	return c.JSON(completions)
}

// @Summary Get completions for date range
// @Description Get all completions between two dates
// @Tags Completions
// @Security ApiKeyAuth
// @Param startDate path string true "Start date in YYYY-MM-DD format"
// @Param endDate path string true "End date in YYYY-MM-DD format"
// @Success 200 {array} TodoCompletion
// @Router /completions/range/{startDate}/{endDate} [get]
func GetCompletionsForDateRange(c *fiber.Ctx) error {
	startStr := c.Params("startDate")
	endStr := c.Params("endDate")

	_, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid startDate format, use YYYY-MM-DD",
		})
	}
	_, err = time.Parse("2006-01-02", endStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid endDate format, use YYYY-MM-DD",
		})
	}

	var completions []TodoCompletion
	result := DB.Where("DATE(date) BETWEEN ? AND ?", startStr, endStr).
		Order("date DESC").Find(&completions)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch completions",
		})
	}
	return c.JSON(completions)
}

// @Summary Set completion status
// @Description Set or update completion status for a todo on a specific date
// @Tags Completions
// @Security ApiKeyAuth
// @Param todoId path string true "Todo ID"
// @Param date path string true "Date in YYYY-MM-DD format"
// @Accept json
// @Param request body SetCompletionRequest true "Completion data"
// @Success 201 {object} TodoCompletion
// @Router /completions/todo/{todoId}/date/{date} [post]
func SetCompletion(c *fiber.Ctx) error {
	todoID := c.Params("todoId")
	dateStr := c.Params("date")

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid date format, use YYYY-MM-DD",
		})
	}

	var req SetCompletionRequest
	if err := json.Unmarshal(c.Body(), &req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	completion := &TodoCompletion{
		ID:        uuid.New().String(),
		TodoID:    todoID,
		Date:      date,
		Completed: req.Completed,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := CreateOrUpdateCompletionDB(completion); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to set completion",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(completion)
}

// @Summary Delete completion
// @Description Delete a completion record
// @Tags Completions
// @Security ApiKeyAuth
// @Param todoId path string true "Todo ID"
// @Param date path string true "Date in YYYY-MM-DD format"
// @Success 204
// @Router /completions/todo/{todoId}/date/{date} [delete]
func DeleteCompletion(c *fiber.Ctx) error {
	todoID := c.Params("todoId")
	dateStr := c.Params("date")

	if err := DeleteCompletionDB(todoID, dateStr); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete completion",
		})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// ============ CHECKLISTS ============

// @Summary Get checklist items for a todo
// @Description Get all checklist items for a specific todo
// @Tags Checklists
// @Security ApiKeyAuth
// @Param todoId path string true "Todo ID"
// @Success 200 {array} ChecklistItem
// @Router /checklists/todo/{todoId} [get]
func GetChecklistItems(c *fiber.Ctx) error {
	todoID := c.Params("todoId")
	items, err := GetChecklistItemsForTodoDB(todoID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch checklist items",
		})
	}
	return c.JSON(items)
}

// @Summary Get checklist statistics
// @Description Get statistics for a todo's checklist
// @Tags Checklists
// @Security ApiKeyAuth
// @Param todoId path string true "Todo ID"
// @Success 200 {object} map[string]interface{}
// @Router /checklists/todo/{todoId}/stats [get]
func GetChecklistStats(c *fiber.Ctx) error {
	todoID := c.Params("todoId")
	items, err := GetChecklistItemsForTodoDB(todoID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch checklist items",
		})
	}

	total := len(items)
	completed := 0
	for _, item := range items {
		if item.Completed {
			completed++
		}
	}

	progress := 0.0
	if total > 0 {
		progress = float64(completed) / float64(total)
	}

	return c.JSON(fiber.Map{
		"total":      total,
		"completed":  completed,
		"progress":   progress,
	})
}

// @Summary Get checklist item by ID
// @Description Get a specific checklist item
// @Tags Checklists
// @Security ApiKeyAuth
// @Param id path string true "Checklist Item ID"
// @Success 200 {object} ChecklistItem
// @Router /checklists/{id} [get]
func GetChecklistItem(c *fiber.Ctx) error {
	id := c.Params("id")
	item, err := GetChecklistItemByIDB(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch checklist item",
		})
	}
	if item == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Checklist item not found",
		})
	}
	return c.JSON(item)
}

// @Summary Create checklist item
// @Description Create a new checklist item for a todo
// @Tags Checklists
// @Security ApiKeyAuth
// @Accept json
// @Param request body CreateChecklistItemRequest true "Checklist item data"
// @Success 201 {object} ChecklistItem
// @Router /checklists [post]
func CreateChecklistItem(c *fiber.Ctx) error {
	var req CreateChecklistItemRequest
	if err := json.Unmarshal(c.Body(), &req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	item := &ChecklistItem{
		ID:        uuid.New().String(),
		TodoID:    req.TodoID,
		Text:      req.Text,
		Completed: false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := CreateChecklistItemDB(item); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create checklist item",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(item)
}

// @Summary Update checklist item
// @Description Update a checklist item
// @Tags Checklists
// @Security ApiKeyAuth
// @Param id path string true "Checklist Item ID"
// @Accept json
// @Param request body UpdateChecklistItemRequest true "Checklist item data"
// @Success 200 {object} ChecklistItem
// @Router /checklists/{id} [put]
func UpdateChecklistItem(c *fiber.Ctx) error {
	id := c.Params("id")
	var req UpdateChecklistItemRequest
	if err := json.Unmarshal(c.Body(), &req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	item, err := GetChecklistItemByIDB(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch checklist item",
		})
	}
	if item == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Checklist item not found",
		})
	}

	if req.Text != "" {
		item.Text = req.Text
	}
	item.Completed = req.Completed
	item.UpdatedAt = time.Now()

	if err := UpdateChecklistItemDB(item); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update checklist item",
		})
	}

	return c.JSON(item)
}

// @Summary Toggle checklist item
// @Description Toggle the completion status of a checklist item
// @Tags Checklists
// @Security ApiKeyAuth
// @Param id path string true "Checklist Item ID"
// @Success 200 {object} ChecklistItem
// @Router /checklists/{id}/toggle [patch]
func ToggleChecklistItem(c *fiber.Ctx) error {
	id := c.Params("id")
	item, err := GetChecklistItemByIDB(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch checklist item",
		})
	}
	if item == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Checklist item not found",
		})
	}

	item.Completed = !item.Completed
	item.UpdatedAt = time.Now()

	if err := UpdateChecklistItemDB(item); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to toggle checklist item",
		})
	}

	return c.JSON(item)
}

// @Summary Delete checklist item
// @Description Delete a checklist item
// @Tags Checklists
// @Security ApiKeyAuth
// @Param id path string true "Checklist Item ID"
// @Success 204
// @Router /checklists/{id} [delete]
func DeleteChecklistItem(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := DeleteChecklistItemDB(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete checklist item",
		})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// ============ STATUS & STATISTICS ============

// @Summary Get status for today
// @Description Get completion status for today
// @Tags Status
// @Security ApiKeyAuth
// @Success 200 {object} StatusResponse
// @Router /status/today [get]
func GetStatusToday(c *fiber.Ctx) error {
	today := time.Now()
	dateStr := today.Format("2006-01-02")

	var todos []Todo
	var completions []TodoCompletion

	DB.Where("DATE(date) = ?", dateStr).Find(&todos)
	DB.Where("DATE(date) = ?", dateStr).Find(&completions)

	totalTodos := len(todos)
	completedTodos := len(completions)

	completionRate := 0.0
	if totalTodos > 0 {
		completionRate = float64(completedTodos) / float64(totalTodos)
	}

	return c.JSON(StatusResponse{
		Date:           today,
		TotalTodos:     totalTodos,
		CompletedTodos: completedTodos,
		CompletionRate: completionRate,
	})
}

// @Summary Get status summary
// @Description Get status summary for a specific date
// @Tags Status
// @Security ApiKeyAuth
// @Param date query string false "Date in YYYY-MM-DD format"
// @Success 200 {object} StatusResponse
// @Router /status/summary [get]
func GetStatusSummary(c *fiber.Ctx) error {
	dateStr := c.Query("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	_, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid date format, use YYYY-MM-DD",
		})
	}

	var todos []Todo
	var completions []TodoCompletion

	DB.Where("DATE(date) = ?", dateStr).Find(&todos)
	DB.Where("DATE(date) = ?", dateStr).Find(&completions)

	totalTodos := len(todos)
	completedTodos := len(completions)

	completionRate := 0.0
	if totalTodos > 0 {
		completionRate = float64(completedTodos) / float64(totalTodos)
	}

	date, _ := time.Parse("2006-01-02", dateStr)
	return c.JSON(StatusResponse{
		Date:           date,
		TotalTodos:     totalTodos,
		CompletedTodos: completedTodos,
		CompletionRate: completionRate,
	})
}

// @Summary Get status for date range
// @Description Get status information for a range of dates
// @Tags Status
// @Security ApiKeyAuth
// @Param startDate path string true "Start date in YYYY-MM-DD format"
// @Param endDate path string true "End date in YYYY-MM-DD format"
// @Success 200 {array} StatusResponse
// @Router /status/range/{startDate}/{endDate} [get]
func GetStatusRange(c *fiber.Ctx) error {
	startStr := c.Params("startDate")
	endStr := c.Params("endDate")

	startDate, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid startDate format, use YYYY-MM-DD",
		})
	}
	_, err = time.Parse("2006-01-02", endStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid endDate format, use YYYY-MM-DD",
		})
	}

	var todos []Todo
	var completions []TodoCompletion

	DB.Where("DATE(date) BETWEEN ? AND ?", startStr, endStr).Find(&todos)
	DB.Where("DATE(date) BETWEEN ? AND ?", startStr, endStr).Find(&completions)

	totalTodos := len(todos)
	completedTodos := len(completions)

	completionRate := 0.0
	if totalTodos > 0 {
		completionRate = float64(completedTodos) / float64(totalTodos)
	}

	return c.JSON(StatusResponse{
		Date:           startDate,
		TotalTodos:     totalTodos,
		CompletedTodos: completedTodos,
		CompletionRate: completionRate,
	})
}

// @Summary Get status grouped by tags
// @Description Get completion status grouped by tags
// @Tags Status
// @Security ApiKeyAuth
// @Param startDate query string false "Start date in YYYY-MM-DD format"
// @Param endDate query string false "End date in YYYY-MM-DD format"
// @Success 200 {array} StatusByTagResponse
// @Router /status/by-tag [get]
func GetStatusByTag(c *fiber.Ctx) error {
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	var tags []Tag
	DB.Find(&tags)

	response := make([]StatusByTagResponse, 0)

	for _, tag := range tags {
		var todos []Todo
		queryTodos := DB.Where("todo_id IN (SELECT todo_id FROM todo_tags WHERE tag_id = ?)", tag.ID)
		
		if startDate != "" && endDate != "" {
			queryTodos = queryTodos.Where("DATE(date) BETWEEN ? AND ?", startDate, endDate)
		}
		queryTodos.Find(&todos)

		// Count completions
		var completions []TodoCompletion
		queryCompletions := DB.Where("todo_id IN (SELECT todo_id FROM todo_tags WHERE tag_id = ?)", tag.ID)
		
		if startDate != "" && endDate != "" {
			queryCompletions = queryCompletions.Where("DATE(date) BETWEEN ? AND ?", startDate, endDate)
		}
		queryCompletions.Where("completed = ?", true).Find(&completions)

		totalTodos := len(todos)
		completedTodos := len(completions)
		completionRate := 0.0

		if totalTodos > 0 {
			completionRate = float64(completedTodos) / float64(totalTodos)
		}

		response = append(response, StatusByTagResponse{
			TagID:          tag.ID,
			TagName:        tag.Name,
			TotalTodos:     totalTodos,
			CompletedTodos: completedTodos,
			CompletionRate: completionRate,
		})
	}

	return c.JSON(response)
}

// @Summary Get day completion status
// @Description Get completion status for a specific day, including whether all todos are completed and count of uncompleted todos
// @Tags Status
// @Security ApiKeyAuth
// @Param date path string true "Date in YYYY-MM-DD format"
// @Success 200 {object} DayCompletionResponse
// @Router /status/day/{date} [get]
func GetDayCompletionStatus(c *fiber.Ctx) error {
	dateStr := c.Params("date")
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid date format, use YYYY-MM-DD",
		})
	}

	var todos []Todo
	var completions []TodoCompletion

	DB.Where("DATE(date) = ?", dateStr).Find(&todos)
	DB.Where("DATE(date) = ? AND completed = ?", dateStr, true).Find(&completions)

	totalTodos := len(todos)
	completedTodos := len(completions)
	uncompletedCount := totalTodos - completedTodos
	allCompleted := uncompletedCount == 0 && totalTodos > 0

	return c.JSON(DayCompletionResponse{
		Date:             date,
		AllCompleted:     allCompleted,
		UncompletedCount: uncompletedCount,
		TotalTodos:       totalTodos,
	})
}
