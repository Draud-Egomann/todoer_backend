package main

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// APIKeyMiddleware checks for valid API key in Authorization header
func APIKeyMiddleware(c *fiber.Ctx) error {
	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		apiKey = "default-api-key-change-in-production"
	}

	// Get Authorization header
	auth := c.Get("Authorization")
	if auth == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Missing Authorization header",
		})
	}

	// Check for Bearer token or direct API key
	var providedKey string
	if strings.HasPrefix(auth, "Bearer ") {
		providedKey = strings.TrimPrefix(auth, "Bearer ")
	} else if strings.HasPrefix(auth, "ApiKey ") {
		providedKey = strings.TrimPrefix(auth, "ApiKey ")
	} else {
		providedKey = auth
	}

	// Validate API key
	if providedKey != apiKey {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid API key",
		})
	}

	return c.Next()
}
