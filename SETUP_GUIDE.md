# Todoer Backend Setup Guide

Complete guide for setting up and running the Todoer backend with SQLite database.

## Quick Start

### 1. Setup the Backend

Navigate to the backend folder:
```bash
cd todoer_backend
```

Install dependencies:
```bash
npm install
```

Compile TypeScript:
```bash
npm run build
```

### 2. Seed the Database

Populate the database with sample data:
```bash
npm run seed
```

This will create a `data/todoer.db` SQLite database with sample todos, tags, completions, and checklist items.

### 3. Start the Server

For development (with auto-reload):
```bash
npm run dev
```

For production:
```bash
npm start
```

The backend will be available at `http://localhost:3000/api`

### 4. Configure the Frontend

The frontend is already configured with the API service. Make sure the backend URL in `src/environments/environment.ts` matches your backend:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

### 5. Run the Frontend

In a new terminal, navigate to the frontend folder:
```bash
cd todoer
```

Start the Ionic dev server:
```bash
ionic serve
```

The frontend will be available at `http://localhost:8100`

## Backend Structure

### Database (SQLite)
- **Location**: `data/todoer.db`
- **Tables**: todos, tags, todo_tags, todo_completions, checklist_items
- **Automatically created** on first server start

### Services
Located in `src/services/`:
- `TagService.ts` - Tag management
- `TodoService.ts` - Todo CRUD operations
- `CompletionService.ts` - Track todo completions
- `ChecklistService.ts` - Manage checklist items

### API Routes
Located in `src/routes/`:
- `tags.ts` - Tag endpoints
- `todos.ts` - Todo endpoints
- `completions.ts` - Completion tracking endpoints
- `checklists.ts` - Checklist endpoints
- `status.ts` - Status and analytics endpoints

## Using the API Service in Frontend Components

The `ApiService` is already set up and ready to use. Some examples:

### Get All Todos
```typescript
import { ApiService } from './services/api.service';

constructor(private apiService: ApiService) {}

ngOnInit() {
  this.apiService.getAllTodos().subscribe(todos => {
    console.log('Todos:', todos);
  });
}
```

### Listen to Todos Changes (Reactive)
```typescript
constructor(private apiService: ApiService) {}

ngOnInit() {
  this.apiService.todos$.subscribe(todos => {
    this.todos = todos;
  });
}
```

### Create a New Todo
```typescript
createTodo(title: string, date: string) {
  this.apiService.createTodo({
    title,
    date,
    time: '10:00',
    repeatType: 'WEEKLY',
    repeatDays: [1, 3, 5],
    tagIds: ['1', '2']
  }).subscribe(todo => {
    console.log('Todo created:', todo);
  });
}
```

### Mark Todo as Complete
```typescript
markComplete(todoId: string, date: string) {
  this.apiService.setCompletion(todoId, date, true).subscribe(completion => {
    console.log('Marked as complete:', completion);
  });
}
```

### Get Today's Status (for Home Assistant)
```typescript
getStatus() {
  this.apiService.getStatusToday().subscribe(status => {
    console.log(`Today: ${status.completed_todos}/${status.total_todos} completed`);
  });
}
```

## Home Assistant Integration

The backend has dedicated endpoints for Home Assistant integration. Example Home Assistant configuration:

```yaml
homeassistant:
  customizations:
    sensor.todoer_status:
      friendly_name: "Todoer Status"

rest:
  - resource: http://localhost:3000/api/status/today
    scan_interval: 300
    sensor:
      name: Todoer Today
      value_template: "{{ value_json.completion_percentage }}"
      unique_id: todoer_today
      device_class: temperature
      unit_of_measurement: "%"

  - resource: http://localhost:3000/api/status/today
    scan_interval: 300
    sensor:
      name: Todoer Completed
      value_template: "{{ value_json.completed_todos }}/{{ value_json.total_todos }}"
      unique_id: todoer_completed
```

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, change it in `.env`:
```env
PORT=3001
```

### Database Issues
If you get database errors, delete the `data/` folder and reseed:
```bash
rm -rf data/
npm run seed
```

### CORS Issues
If the frontend can't reach the backend, check the CORS configuration in `server.ts`. The default allows `http://localhost:8100`:

```typescript
app.use(cors());
```

### API Not Responding
Check that:
1. Backend is running: `npm run dev`
2. Backend is on the right port (default 3000)
3. Frontend environment has correct API URL
4. No firewall is blocking port 3000

## API Endpoints Reference

### Todos
- `GET /api/todos` - All todos
- `GET /api/todos/:id` - Specific todo
- `GET /api/todos/by-date/:date` - Todos for date
- `POST /api/todos` - Create todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

### Tags
- `GET /api/tags` - All tags
- `POST /api/tags` - Create tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Completions
- `POST /api/completions/todo/:todoId/date/:date` - Mark complete
- `GET /api/completions/todo/:todoId/date/:date` - Check completion status
- `GET /api/completions/date/:date` - Completions for date

### Status (Home Assistant)
- `GET /api/status/today` - Today's status
- `GET /api/status/summary?date=YYYY-MM-DD` - Date-specific status
- `GET /api/status/range/:startDate/:endDate` - Date range status
- `GET /api/status/by-tag` - Status grouped by tags

## Next Steps

1. ✅ Backend running and seeded
2. ✅ Frontend configured with API service
3. 📱 Start building features using the API
4. 🏠 Integrate with Home Assistant (optional)
5. 🚀 Deploy to production

## Production Deployment

When deploying to production:

1. Update `.env`:
```env
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

2. Build frontend:
```bash
ionic build --prod
```

3. Serve frontend from backend:
```bash
# Copy built frontend to backend/public or use nginx reverse proxy
```

4. Update `environment.prod.ts`:
```typescript
apiUrl: 'https://your-domain.com/api'
```

## Support

For issues with the API service integration, check:
- Backend logs: `npm run dev` output
- Browser console: Check for CORS errors
- Network tab: Verify requests are reaching the backend
