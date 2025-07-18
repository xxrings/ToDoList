// models.js

// ── Task & Category Classes ─────────────────────────────────────────────────
export class Task {
  constructor(name, dueDate = null) {
    this.name = name;
    this.dueDate = dueDate; // 'MM/DD/YYYY' or null
    this.completed = false;
    this.inProcess = false;
  }
}

export class Category {
  constructor(name, autoDelete = false) {
    this.name = name;
    this.autoDelete = autoDelete;
    this.tasks = [];
    this.subcategories = [];
  }
  addTask(task) { this.tasks.push(task); }
  removeTask(index) { this.tasks.splice(index, 1); }
  addSubcategory(name, autoDelete = false) {
    this.subcategories.push(new Category(name, autoDelete));
  }
  removeSubcategory(index) { this.subcategories.splice(index, 1); }
}

export class TaskManager {
  constructor() {
    this.lists = [];
    this.currentListIndex = 0;
  }
  addList(name) {
    // Add unique ID to each list
    const id = crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).substr(2, 5));
    this.lists.push({ id, name, categories: [] });
    this.currentListIndex = this.lists.length - 1;
    // saveData({ lists: this.lists }).catch(e => alert('Failed to save: ' + e.message));
  }
  getCurrentList() {
    return this.lists[this.currentListIndex];
  }
}

export function rehydrateLists(lists) {
  return lists.map(list => ({
    ...list,
    categories: (list.categories || []).map(cat => {
      const category = Object.assign(new Category(cat.name, cat.autoDelete), cat);
      category.tasks = (cat.tasks || []).map(t => Object.assign(new Task(t.name, t.dueDate), t));
      category.subcategories = (cat.subcategories || []).map(sub => {
        const subcat = Object.assign(new Category(sub.name, sub.autoDelete), sub);
        subcat.tasks = (sub.tasks || []).map(t => Object.assign(new Task(t.name, t.dueDate), t));
        return subcat;
      });
      return category;
    })
  }));
}

export const tm = new TaskManager(); 