import { getDatabase, initDatabase, initializeSchema } from '../database';
import { TagService } from '../services/TagService';
import { TodoService } from '../services/TodoService';
import { CompletionService } from '../services/CompletionService';
import { ChecklistService } from '../services/ChecklistService';

// Seed data matching the Angular seeding.service
const seedData = {
  tags: [
    { id: '1', name: 'Work', color: '#3498db' },
    { id: '2', name: 'Health', color: '#e74c3c' },
    { id: '3', name: 'Study', color: '#9b59b6' },
    { id: '4', name: 'Private', color: '#2ecc71' },
    { id: '5', name: 'Errands', color: '#f39c12' },
    { id: '6', name: 'Daily', color: '#95a5a6' },
    { id: '7', name: 'Fitness', color: '#e67e22' },
    { id: '8', name: 'Social', color: '#1abc9c' }
  ],
  todos: [
    // Today's todos - morning
    {
      id: 'todo-1',
      title: 'Gym Training',
      notes: 'Leg day workout - squats, deadlifts, lunges',
      date: new Date().toISOString().split('T')[0],
      time: '07:00',
      repeatType: 'WEEKLY',
      repeatDays: [1, 3, 5],
      tagIds: ['2', '7']
    },
    {
      id: 'todo-2',
      title: 'Wasser trinken',
      notes: '2 Liter Wasser über den Tag verteilt',
      date: new Date().toISOString().split('T')[0],
      time: '06:30',
      repeatType: 'DAILY',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      tagIds: ['2', '6']
    },
    // Today's todos - noon
    {
      id: 'todo-3',
      title: 'Projektplan überarbeiten',
      notes: 'Zeitpläne anpassen und Meilensteine definieren',
      date: new Date().toISOString().split('T')[0],
      time: '13:30',
      repeatType: 'NONE',
      repeatDays: [],
      tagIds: ['1']
    },
    {
      id: 'todo-4',
      title: 'Mittagspause',
      notes: 'Gesundes Mittagessen und kurzer Spaziergang',
      date: new Date().toISOString().split('T')[0],
      time: '12:00',
      repeatType: 'DAILY',
      repeatDays: [1, 2, 3, 4, 5],
      tagIds: ['2', '6']
    },
    // Today's todos - afternoon
    {
      id: 'todo-5',
      title: 'Uni Vorlesung',
      notes: 'Softwarearchitektur Vorlesung und Notizen nacharbeiten',
      date: new Date().toISOString().split('T')[0],
      time: '15:00',
      repeatType: 'WEEKLY',
      repeatDays: [2, 4],
      tagIds: ['3']
    },
    {
      id: 'todo-6',
      title: 'Einkaufen',
      notes: 'Milch, Brot, Obst, Gemüse besorgen',
      date: new Date().toISOString().split('T')[0],
      time: '16:30',
      repeatType: 'NONE',
      repeatDays: [],
      tagIds: ['5']
    },
    // Today's todos - evening
    {
      id: 'todo-7',
      title: 'Code Review',
      notes: 'Pull Request von Max durchgehen und feedback geben',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      repeatType: 'NONE',
      repeatDays: [],
      tagIds: ['1']
    },
    {
      id: 'todo-8',
      title: 'Freunde anrufen',
      notes: 'Lisa und Tom anrufen - schon lange nicht mehr gesprochen',
      date: new Date().toISOString().split('T')[0],
      time: '20:30',
      repeatType: 'NONE',
      repeatDays: [],
      tagIds: ['4', '8']
    },
    // Today's todos - night
    {
      id: 'todo-9',
      title: 'Lesen',
      notes: '30 Minuten in "Clean Architecture" lesen',
      date: new Date().toISOString().split('T')[0],
      time: '23:15',
      repeatType: 'DAILY',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      tagIds: ['3', '6']
    },
    // Tomorrow's todos
    {
      id: 'todo-10',
      title: 'Arzttermin',
      notes: 'Zahnarzttermin um 10:00 - Kontrolle',
      date: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00',
      repeatType: 'NONE',
      repeatDays: [],
      tagIds: ['2']
    },
    {
      id: 'todo-11',
      title: 'Präsentation vorbereiten',
      notes: 'Folien für Kundenpräsentation fertigstellen',
      date: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '14:00',
      repeatType: 'NONE',
      repeatDays: [],
      tagIds: ['1']
    },
    // Overdue todo (yesterday)
    {
      id: 'todo-12',
      title: 'Wohnung putzen',
      notes: 'Küche, Bad und Wohnzimmer gründlich reinigen',
      date: new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00',
      repeatType: 'WEEKLY',
      repeatDays: [6],
      tagIds: ['4', '5']
    }
  ],
  completions: [
    {
      id: 'completion-1',
      todoId: 'todo-2',
      date: new Date().toISOString().split('T')[0],
      completed: true
    },
    {
      id: 'completion-2',
      todoId: 'todo-4',
      date: new Date().toISOString().split('T')[0],
      completed: true
    }
  ],
  checklistItems: [
    // Checklist for project plan todo
    { id: 'checklist-1', todoId: 'todo-3', text: 'Aktuelle Zeitpläne analysieren', completed: true },
    { id: 'checklist-2', todoId: 'todo-3', text: 'Neue Meilensteine definieren', completed: false },
    { id: 'checklist-3', todoId: 'todo-3', text: 'Ressourcen zuweisen', completed: false },
    { id: 'checklist-4', todoId: 'todo-3', text: 'Plan mit Team besprechen', completed: false },
    // Checklist for shopping todo
    { id: 'checklist-5', todoId: 'todo-6', text: 'Milch (1L)', completed: false },
    { id: 'checklist-6', todoId: 'todo-6', text: 'Vollkornbrot', completed: false },
    { id: 'checklist-7', todoId: 'todo-6', text: 'Äpfel und Bananen', completed: false },
    { id: 'checklist-8', todoId: 'todo-6', text: 'Brokkoli und Karotten', completed: false },
    // Checklist for presentation todo
    { id: 'checklist-9', todoId: 'todo-11', text: 'Aktuelle Daten sammeln', completed: true },
    { id: 'checklist-10', todoId: 'todo-11', text: 'Folien überarbeiten', completed: false },
    { id: 'checklist-11', todoId: 'todo-11', text: 'Präsentation testen', completed: false },
    { id: 'checklist-12', todoId: 'todo-11', text: 'Backup erstellen', completed: false },
    // Checklist for apartment cleaning
    { id: 'checklist-13', todoId: 'todo-12', text: 'Küche wischen und aufräumen', completed: false },
    { id: 'checklist-14', todoId: 'todo-12', text: 'Badezimmer putzen', completed: false },
    { id: 'checklist-15', todoId: 'todo-12', text: 'Staubsaugen im Wohnzimmer', completed: false },
    { id: 'checklist-16', todoId: 'todo-12', text: 'Oberflächen abstauben', completed: false }
  ]
};

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // Initialize database
    await initDatabase();
    await initializeSchema();

    const tagService = new TagService();
    const todoService = new TodoService();
    const completionService = new CompletionService();
    const checklistService = new ChecklistService();

    // Seed tags
    console.log('📌 Seeding tags...');
    for (const tag of seedData.tags) {
      await tagService.createTag(tag.name, tag.color);
    }
    console.log(`✓ Created ${seedData.tags.length} tags`);

    // Seed todos
    console.log('📝 Seeding todos...');
    for (const todo of seedData.todos) {
      await todoService.createTodo(
        todo.title,
        todo.notes,
        todo.date,
        todo.time,
        todo.repeatType,
        todo.repeatDays,
        todo.tagIds
      );
    }
    console.log(`✓ Created ${seedData.todos.length} todos`);

    // Seed completions
    console.log('✅ Seeding completions...');
    for (const completion of seedData.completions) {
      await completionService.setCompletion(completion.todoId, completion.date, completion.completed);
    }
    console.log(`✓ Created ${seedData.completions.length} completions`);

    // Seed checklist items
    console.log('☐ Seeding checklist items...');
    for (const item of seedData.checklistItems) {
      const created = await checklistService.createChecklistItem(item.todoId, item.text);
      if (item.completed) {
        await checklistService.updateChecklistItem(created.id, item.text, true);
      }
    }
    console.log(`✓ Created ${seedData.checklistItems.length} checklist items`);

    console.log('✨ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
