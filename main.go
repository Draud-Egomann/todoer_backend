package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
	"github.com/swaggo/fiber-swagger"
	_ "todoer-backend/docs"
)

// @title Todoer API
// @version 1.0
// @description A simple TODO application API with SQLite backend
// @termsOfService http://swagger.io/terms/
// @contact.name API Support
// @license.name MIT
// @host localhost:3000
// @BasePath /api
// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization
func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize database
	if err := InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Todoer API v1.0.0",
	})

	// Static files
	app.Static("/", "./public")

	// CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:4200,http://localhost:8100",
		AllowMethods:     "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Content-Type,Authorization",
		AllowCredentials: true,
	}))

	// Health check (public endpoint)
	app.Get("/health", HealthCheck)

	// API routes with authentication
	api := app.Group("/api")
	api.Use(APIKeyMiddleware)

	// Todos
	api.Get("/todos", GetAllTodos)
	api.Get("/todos/:id", GetTodoByID)
	api.Get("/todos/by-date/:date", GetTodosByDate)
	api.Get("/todos/range/:startDate/:endDate", GetTodosForDateRange)
	api.Post("/todos", CreateTodo)
	api.Put("/todos/:id", UpdateTodo)
	api.Delete("/todos/:id", DeleteTodo)

	// Tags
	api.Get("/tags", GetAllTags)
	api.Get("/tags/:id", GetTagByID)
	api.Post("/tags", CreateTag)
	api.Put("/tags/:id", UpdateTag)
	api.Delete("/tags/:id", DeleteTag)

	// Completions
	api.Get("/completions/todo/:todoId", GetCompletionsByTodoID)
	api.Get("/completions/todo/:todoId/date/:date", GetCompletion)
	api.Get("/completions/date/:date", GetCompletionsForDate)
	api.Get("/completions/range/:startDate/:endDate", GetCompletionsForDateRange)
	api.Post("/completions/todo/:todoId/date/:date", SetCompletion)
	api.Delete("/completions/todo/:todoId/date/:date", DeleteCompletion)

	// Checklists
	api.Get("/checklists/todo/:todoId", GetChecklistItems)
	api.Get("/checklists/todo/:todoId/stats", GetChecklistStats)
	api.Get("/checklists/:id", GetChecklistItem)
	api.Post("/checklists", CreateChecklistItem)
	api.Put("/checklists/:id", UpdateChecklistItem)
	api.Patch("/checklists/:id/toggle", ToggleChecklistItem)
	api.Delete("/checklists/:id", DeleteChecklistItem)

	// Status endpoints
	api.Get("/status/today", GetStatusToday)
	api.Get("/status/summary", GetStatusSummary)
	api.Get("/status/range/:startDate/:endDate", GetStatusRange)
	api.Get("/status/by-tag", GetStatusByTag)

	// Swagger
	app.Get("/swagger/*", fiberSwagger.WrapHandler)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("🚀 Server running on http://localhost:%s", port)
	log.Printf("📚 Swagger docs on http://localhost:%s/swagger/index.html", port)
	log.Fatal(app.Listen("0.0.0.0:" + port))
}

// @Summary Health check
// @Description Check if the API is running
// @Tags Health
// @Success 200 {object} map[string]string
// @Router /health [get]
func HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status": "ok",
		"message": "Todoer API is running",
	})
}
