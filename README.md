# Todoer Backend

A Node.js/Express backend with SQLite database for the Todoer app. Provides REST API for managing todos, tags, completions, and checklists.

## Features

- ✅ Complete CRUD operations for todos, tags, and checklists
- 📊 Status and statistics endpoints for Home Assistant integration
- 🗄️ SQLite database for persistent data storage
- 📱 Fully compatible with the Angular Ionic frontend
- 🔄 Data synchronization support
- 📈 Daily/weekly/monthly analytics

## Prerequisites

- Node.js (v16+)
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
```

2. Build the TypeScript:

```bash
npm run build
```

3. Seed the database with sample data:

```bash
npm run seed
```

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000` (or the PORT specified in `.env`)

## API Endpoints

### Health Check
- `GET /api/health` - Server status

### Todos
- `GET /api/todos` - Get all todos
- `GET /api/todos/:id` - Get todo by ID
- `GET /api/todos/by-date/:date` - Get todos for a specific date (YYYY-MM-DD format)
- `GET /api/todos/range/:startDate/:endDate` - Get todos for date range
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

### Tags
- `GET /api/tags` - Get all tags
- `GET /api/tags/:id` - Get tag by ID
- `POST /api/tags` - Create new tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Completions
- `GET /api/completions/todo/:todoId` - Get completions for a todo
- `GET /api/completions/date/:date` - Get completions for a date
- `GET /api/completions/range/:startDate/:endDate` - Get completions for date range
- `GET /api/completions/stats/summary` - Get completion statistics
- `POST /api/completions/todo/:todoId/date/:date` - Set completion status
- `DELETE /api/completions/todo/:todoId/date/:date` - Delete completion

### Checklists
- `GET /api/checklists/todo/:todoId` - Get checklist items for todo
- `GET /api/checklists/todo/:todoId/stats` - Get checklist stats
- `GET /api/checklists/:id` - Get checklist item by ID
- `POST /api/checklists` - Create checklist item
- `PUT /api/checklists/:id` - Update checklist item
- `PATCH /api/checklists/:id/toggle` - Toggle checklist item
- `DELETE /api/checklists/:id` - Delete checklist item

### Status (for Home Assistant integration)
- `GET /api/status/today` - Get today's status
- `GET /api/status/summary?date=YYYY-MM-DD` - Get status for a specific date
- `GET /api/status/range/:startDate/:endDate` - Get status for date range
- `GET /api/status/by-tag?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get status by tags

## Example Requests

### Create a Todo
```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Buy groceries",
    "notes": "Milk, bread, vegetables",
    "date": "2026-03-13",
    "time": "10:00",
    "repeatType": "WEEKLY",
    "repeatDays": [6],
    "tagIds": ["5"]
  }'
```

### Get Today's Status (Home Assistant)
```bash
curl http://localhost:3000/api/status/today
```

Response example:
```json
{
  "date": "2026-03-13",
  "total_todos": 5,
  "completed_todos": 2,
  "pending_todos": 3,
  "completion_percentage": 40,
  "todos": [
    {
      "id": "todo-1",
      "title": "Gym Training",
      "time": "07:00",
      "completed": false,
      "tags": ["2", "7"]
    }
  ]
}
```

### Mark a Todo as Complete
```bash
curl -X POST http://localhost:3000/api/completions/todo/todo-1/date/2026-03-13 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

## Database Schema

### Tables
- `tags` - Tag definitions (Work, Health, etc.)
- `todos` - Todo items with dates and repeat configurations
- `todo_tags` - Junction table for many-to-many tag relationships
- `todo_completions` - Completion status for each todo on each date
- `checklist_items` - Individual checklist items within a todo

## Home Assistant Integration

The `/api/status` endpoints are designed for easy Home Assistant integration:

```yaml
# example sensor configuration
- platform: rest
  resource: http://localhost:3000/api/status/today
  name: Todos Today
  value_template: "{{ value_json.total_todos }}"
```

## Directory Structure

```
src/
├── server.ts              # Main server entry point
├── database.ts            # SQLite database initialization
├── services/              # Business logic
│   ├── TagService.ts
│   ├── TodoService.ts
│   ├── CompletionService.ts
│   └── ChecklistService.ts
├── routes/                # API route handlers
│   ├── tags.ts
│   ├── todos.ts
│   ├── completions.ts
│   ├── checklists.ts
│   └── status.ts
└── scripts/
    └── seed.ts            # Database seeding script
```

## Development

### TypeScript Compilation

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8100
```

## License

ISC
