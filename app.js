// app.js (ES-module)

class Task {
  constructor(name, dueDate = null) {
    this.name = name;
    this.dueDate = dueDate; // 'MM/DD/YYYY' or null
    this.completed = false;
    this.inProcess = false;
  }
}

class Category {
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

class TaskManager {
  constructor() {
    this.lists = [];
    this.currentListIndex = 0;
  }
  addList(name) {
    this.lists.push({ name, categories: [] });
    this.currentListIndex = this.lists.length - 1;
  }
  getCurrentList() {
    return this.lists[this.currentListIndex];
  }
}

const tm = new TaskManager();

function displayCurrentDate() {
  const today = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent =
    `Today is ${today.toLocaleDateString('en-US', opts)}`;
}

function swap(arr, i, j) {
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

function ensureUrgentCategory() {
  const list = tm.getCurrentList();
  let urgent = list.categories.find(c => c.name === 'URGENT');
  if (!urgent) {
    urgent = new Category('URGENT', false);
    list.categories.unshift(urgent);
  }
  const today = new Date();
  list.categories.forEach(cat => {
    if (cat.name === 'URGENT') return;
    for (let i = cat.tasks.length - 1; i >= 0; i--) {
      const t = cat.tasks[i];
      if (t.dueDate) {
        const [mm, dd, yy] = t.dueDate.split('/');
        const d = new Date(`${yy}-${mm}-${dd}`);
        if (d - today <= 3 * 24 * 60 * 60 * 1000) {
          cat.tasks.splice(i, 1);
          urgent.tasks.push(t);
        }
      }
    }
  });
}

function saveTasks() {
  localStorage.setItem('todoData', JSON.stringify(tm));
  alert('Lists saved!');
}

function loadTasks() {
  const data = localStorage.getItem('todoData');
  if (data) {
    Object.assign(tm, JSON.parse(data));
    renderAll();
    alert('Lists loaded!');
  }
}

function createTaskItem(task, container, idx) {
  const li = document.createElement('li');
  li.classList.add('task-item');

  const chk = document.createElement('input');
  chk.type = 'checkbox'; chk.checked = task.completed;
  chk.onchange = () => {
    if (container.autoDelete) container.removeTask(idx);
    else task.completed = chk.checked;
    renderAll();
  };
  li.appendChild(chk);

  const span = document.createElement('span');
  span.textContent = task.name;
  if (!container.autoDelete && task.completed) span.style.textDecoration = 'line-through';
  li.appendChild(span);

  if (task.dueDate) {
    const dd = document.createElement('span');
    dd.classList.add('due-date');
    dd.textContent = ` (due ${task.dueDate})`;
    li.appendChild(dd);
  }

  const ip = document.createElement('button');
  ip.textContent = task.inProcess ? 'In Process' : 'Not In Process';
  ip.onclick = () => { task.inProcess = !task.inProcess; renderAll(); };
  if (task.inProcess) ip.style.backgroundColor = 'green';
  li.appendChild(ip);

  const up = document.createElement('button');
  up.textContent = '↑'; up.disabled = idx === 0;
  up.onclick = () => { swap(container.tasks, idx, idx - 1); renderAll(); };
  li.appendChild(up);

  const dn = document.createElement('button');
  dn.textContent = '↓'; dn.disabled = idx === container.tasks.length - 1;
  dn.onclick = () => { swap(container.tasks, idx, idx + 1); renderAll(); };
  li.appendChild(dn);

  if (!container.autoDelete) {
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.onclick = () => { container.removeTask(idx); renderAll(); };
    li.appendChild(del);
  }

  return li;
}

function renderTabBar() {
  const bar = document.getElementById('tab-bar');
  bar.innerHTML = '';
  tm.lists.forEach((lst, i) => {
    const btn = document.createElement('button');
    btn.textContent = lst.name;
    if (i === tm.currentListIndex) btn.classList.add('active-tab');
    btn.onclick = () => { tm.currentListIndex = i; renderAll(); };
    bar.appendChild(btn);
  });
}

function renderCategories() {
  ensureUrgentCategory();
  const cont = document.getElementById('categories-container');
  cont.innerHTML = '';
  const list = tm.getCurrentList();

  list.categories.forEach((cat, cidx) => {
    const card = document.createElement('div');
    card.classList.add('card', 'category-card');
    if (cat.name === 'URGENT') card.classList.add('urgent-card');

    // Header
    const hdr = document.createElement('div'); hdr.classList.add('card-header');
    const title = document.createElement('h3'); title.textContent = cat.name; hdr.appendChild(title);
    const upC = document.createElement('button'); upC.textContent = '↑'; upC.disabled = cidx === 0;
    upC.onclick = () => { swap(list.categories, cidx, cidx - 1); renderAll(); };
    hdr.appendChild(upC);
    const dnC = document.createElement('button'); dnC.textContent = '↓'; dnC.disabled = cidx === list.categories.length - 1;
    dnC.onclick = () => { swap(list.categories, cidx, cidx + 1); renderAll(); };
    hdr.appendChild(dnC);
    if (!cat.autoDelete) {
      const resetC = document.createElement('button'); resetC.textContent = 'Reset';
      resetC.onclick = () => { cat.tasks.forEach(t => t.completed = false); renderAll(); };
      hdr.appendChild(resetC);
    }
    card.appendChild(hdr);

    // Body
    const bd = document.createElement('div'); bd.classList.add('card-body');

    // Subcategories (two-per-row grid)
    if (cat.name !== 'URGENT' && cat.subcategories.length) {
      const subCont = document.createElement('div'); subCont.classList.add('subcategories-container');
      cat.subcategories.forEach((sub, sidx) => {
        const scard = document.createElement('div'); scard.classList.add('card', 'subcategory-card');
        const shdr = document.createElement('div'); shdr.classList.add('card-header');
        const st = document.createElement('h4'); st.textContent = sub.name; shdr.appendChild(st);
        const upS = document.createElement('button'); upS.textContent = '↑'; upS.disabled = sidx === 0;
        upS.onclick = () => { swap(cat.subcategories, sidx, sidx - 1); renderAll(); };
        shdr.appendChild(upS);
        const dnS = document.createElement('button'); dnS.textContent = '↓'; dnS.disabled = sidx === cat.subcategories.length - 1;
        dnS.onclick = () => { swap(cat.subcategories, sidx, sidx + 1); renderAll(); };
        shdr.appendChild(dnS);
        const rmS = document.createElement('button'); rmS.textContent = '✕';
        rmS.onclick = () => { cat.removeSubcategory(sidx); renderAll(); };
        shdr.appendChild(rmS);
        const resetS = document.createElement('button'); resetS.textContent = 'Reset';
        resetS.onclick = () => { sub.tasks.forEach(t => t.completed = false); renderAll(); };
        shdr.appendChild(resetS);
        scard.appendChild(shdr);

        const sbd = document.createElement('div'); sbd.classList.add('card-body');
        const sul = document.createElement('ul');
        sub.tasks.forEach((t, ti) => sul.appendChild(createTaskItem(t, sub, ti)));
        sbd.appendChild(sul);
        scard.appendChild(sbd);

        const sft = document.createElement('div'); sft.classList.add('card-footer');
        const sbtn = document.createElement('button'); sbtn.textContent = 'Add Task';
        sbtn.onclick = () => {
          const n = prompt('Subcategory Task name?'); if (!n) return;
          let d = prompt('Due date (MM/DD/YYYY)?', ''); if (d === '') d = null;
          const ip = confirm('Tag as In Process? OK=Yes');
          const t = new Task(n, d); t.inProcess = ip;
          sub.addTask(t); renderAll();
        };
        sft.appendChild(sbtn);
        scard.appendChild(sft);

        subCont.appendChild(scard);
      });
      bd.appendChild(subCont);
    }

    // Main tasks
    const ul = document.createElement('ul');
    cat.tasks.forEach((t, ti) => ul.appendChild(createTaskItem(t, cat, ti)));
    bd.appendChild(ul);
    card.appendChild(bd);

    // Footer
    const ftr = document.createElement('div'); ftr.classList.add('card-footer');
    const addBtn = document.createElement('button'); addBtn.textContent = 'Add Task';
    addBtn.onclick = () => {
      const n = prompt('Task name?'); if (!n) return;
      let d = prompt('Due date (MM/DD/YYYY)?', ''); if (d === '') d = null;
      const ip = confirm('Tag as In Process? OK=Yes');
      const t = new Task(n, d); t.inProcess = ip;
      cat.addTask(t); renderAll();
    };
    ftr.appendChild(addBtn);
    if (cat.name !== 'URGENT') {
      const asc = document.createElement('button'); asc.textContent = 'Add Subcategory';
      asc.onclick = () => {
        const n = prompt('Subcategory name?'); if (!n) return;
        const ad = confirm('Auto-delete? OK=Yes');
        cat.addSubcategory(n, ad); renderAll();
      };
      ftr.appendChild(asc);
    }
    card.appendChild(ftr);
    cont.appendChild(card);
  });
}

function renderAll() {
  renderTabBar();
  renderCategories();
}

window.addEventListener('DOMContentLoaded', () => {
  displayCurrentDate();
  document.getElementById('add-list-button').onclick = () => {
    const n = prompt('List name?'); if (n) { tm.addList(n); renderAll(); }
  };
  document.getElementById('save-tasks-top').onclick = saveTasks;
  document.getElementById('load-tasks-top').onclick = loadTasks;
  document.getElementById('add-category').onclick = () => {
    const n = prompt('Category name?'); if (!n) return;
    const ad = confirm('Auto-delete? OK=Yes');
    tm.getCurrentList().categories.push(new Category(n, ad));
    renderAll();
  };

  // Default initialization
  tm.addList('Default List');
  tm.getCurrentList().categories.push(new Category('General', false));
  renderAll();
});
