# Todoer Backend API

A fast and neat Go + Fiber backend for the Todoer todo management application with SQLite database, API key authentication, and automatic Swagger documentation.

## Features

✅ **Fast Framework**: Built with Go + Fiber for high-performance HTTP handling  
✅ **SQLite Database**: Lightweight, file-based database for easy deployment  
✅ **API Key Authentication**: All endpoints (except `/health`) protected with API key  
✅ **Swagger Documentation**: Auto-generated API docs at `/swagger/index.html`  
✅ **Docker Ready**: Includes Dockerfile and Docker Compose for quick deployment  
✅ **Complete CRUD**: Full API for Todos, Tags, Completions, and Checklist Items  

## Quick Start

### Prerequisites

- Go 1.23+ (for local development)
- Docker & Docker Compose (for containerized deployment)

### Local Development

1. **Navigate to the backend directory**
   ```bash
   cd todoer_backend
   ```

2. **Install dependencies**
   ```bash
   go mod download
   ```

3. **Create/update .env file**
   ```bash
   cp .env.example .env  # If available, otherwise edit .env
   ```

4. **Run the server**
   ```bash
   go run main.go database.go models.go handlers.go middleware.go
   ```

   Or using `go build` and then running the binary:
   ```bash
   go build -o todoer-backend
   ./todoer-backend
   ```

5. **Access the API**
   - API Base: `http://localhost:3000/api`
   - Health Check: `http://localhost:3000/health`
   - Swagger Docs: `http://localhost:3000/swagger/index.html`

### Docker Compose (Recommended)

The easiest way to run both backend and frontend:

```bash
# From the root directory
docker-compose -f todoer_backend/docker-compose.yml up -d
```

This will:
- Start the Go backend on `http://localhost:3000`
- Start the Angular frontend on `http://localhost:4200`
- Create a persistent volume for the SQLite database

To stop:
```bash
docker-compose -f todoer_backend/docker-compose.yml down
```

## Environment Variables

Create a `.env` file in the `todoer_backend` directory:

```env
# Server Configuration
PORT=3000
ENV=development

# Database Configuration
DB_PATH=todoer.db

# Authentication
API_KEY=todo-secret-api-key-change-in-production
```

**Important**: Change the `API_KEY` in production! Use a strong, random string.

## API Authentication

All API endpoints (except `/health`) require an `Authorization` header with a Bearer token:

```bash
curl -H "Authorization: Bearer todo-secret-api-key-change-in-production" \
  http://localhost:3000/api/todos
```

Alternatively with `ApiKey` prefix:

```bash
curl -H "Authorization: ApiKey todo-secret-api-key-change-in-production" \
  http://localhost:3000/api/todos
```

## API Endpoints

### Health Check (Public)
- `GET /health` - Check if API is running

### Todos
- `GET /api/todos` - Get all todos
- `GET /api/todos/:id` - Get specific todo
- `GET /api/todos/by-date/:date` - Get todos for a date (YYYY-MM-DD)
- `GET /api/todos/range/:startDate/:endDate` - Get todos for a date range
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

### Tags
- `GET /api/tags` - Get all tags
- `GET /api/tags/:id` - Get specific tag
- `POST /api/tags` - Create new tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Completions
- `GET /api/completions/todo/:todoId` - Get completions for a todo
- `GET /api/completions/todo/:todoId/date/:date` - Get completion for specific date
- `GET /api/completions/date/:date` - Get completions for a date
- `GET /api/completions/range/:startDate/:endDate` - Get completions for date range
- `POST /api/completions/todo/:todoId/date/:date` - Set completion status
- `DELETE /api/completions/todo/:todoId/date/:date` - Delete completion

### Checklist Items
- `GET /api/checklists/todo/:todoId` - Get checklist items for a todo
- `GET /api/checklists/todo/:todoId/stats` - Get checklist statistics
- `GET /api/checklists/:id` - Get specific checklist item
- `POST /api/checklists` - Create checklist item
- `PUT /api/checklists/:id` - Update checklist item
- `PATCH /api/checklists/:id/toggle` - Toggle checklist item completion
- `DELETE /api/checklists/:id` - Delete checklist item

### Status & Statistics
- `GET /api/status/today` - Get status for today
- `GET /api/status/summary?date=YYYY-MM-DD` - Get status summary
- `GET /api/status/range/:startDate/:endDate` - Get status for date range
- `GET /api/status/by-tag?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get status grouped by tags

## Example Requests

### Create a Todo

```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Authorization: Bearer todo-secret-api-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Buy groceries",
    "notes": "Milk, bread, eggs",
    "date": "2026-03-14T00:00:00Z",
    "time": "14:30",
    "repeatType": "daily",
    "repeatDays": [0, 1, 2, 3, 4]
  }'
```

### Get All Todos

```bash
curl http://localhost:3000/api/todos \
  -H "Authorization: Bearer todo-secret-api-key-change-in-production"
```

### Create a Tag

```bash
curl -X POST http://localhost:3000/api/tags \
  -H "Authorization: Bearer todo-secret-api-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Work",
    "color": "#3498db"
  }'
```

## Database Schema

The SQLite database includes the following tables:

- **todos**: Main todo items
- **tags**: Tags/categories
- **todo_completions**: Completion status of todos on specific dates
- **checklist_items**: Checklist items for todos
- **todo_tags**: Many-to-many relationship between todos and tags

## Development

### Project Structure

```
todoer_backend/
├── main.go              # Entry point and route setup
├── models.go            # Database models and request/response structs
├── database.go          # Database initialization and helpers
├── handlers.go          # API endpoint handlers
├── middleware.go        # Authentication middleware
├── Dockerfile           # Docker image definition
├── docker-compose.yml   # Docker Compose configuration
├── go.mod              # Go module definition
├── .env                # Environment variables
└── docs/
    ├── swagger.go      # Swagger API documentation
    └── docs.go         # Swagger info
```

### Adding New Endpoints

1. Add handler function in `handlers.go`
2. Add route in `main.go`
3. Add Swagger annotations to the handler
4. Add request/response types in `models.go` if needed

### Building for Production

```bash
# Build the binary
go build -o todoer-backend

# Build Docker image
docker build -t todoer-backend:latest -f Dockerfile .

# Run with Docker
docker run -p 3000:3000 \
  -e API_KEY=your-secure-key \
  -e DB_PATH=/data/todoer.db \
  -v todoer-data:/data \
  todoer-backend:latest
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Issues
Delete the `todoer.db` file to reset the database:
```bash
rm todoer.db
```

### Authentication Errors
Make sure your `Authorization` header includes the correct API key:
```bash
# Check the .env file
cat .env | grep API_KEY
```

## Security Notes

⚠️ **Important for Production**:

1. Change the default `API_KEY` in `.env`
2. Use HTTPS in production
3. Implement rate limiting if needed
4. Consider adding database encryption
5. Set appropriate CORS origins
6. Use environment-specific configurations

## License

MIT

## Support

For documentation and more information, check the Swagger UI at:
`http://localhost:3000/swagger/index.html`
