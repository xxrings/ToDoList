// views.js

import { Task, Category } from './models.js';

export function displayCurrentDate() {
  const today = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent =
    `Today is ${today.toLocaleDateString('en-US', opts)}`;
}

export function swap(arr, i, j) {
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

export function createTaskItem(task, container, idx, renderAll, saveData, tm) {
  const li = document.createElement('li');
  li.classList.add('task-item');

  const chk = document.createElement('input');
  chk.type = 'checkbox'; chk.checked = task.completed;
  chk.onchange = () => {
    if (container.autoDelete) container.removeTask(idx);
    else task.completed = chk.checked;
    saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message));
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
  ip.onclick = () => { task.inProcess = !task.inProcess; saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message)); renderAll(); };
  if (task.inProcess) ip.style.backgroundColor = 'green';
  li.appendChild(ip);

  const up = document.createElement('button');
  up.textContent = '↑'; up.disabled = idx === 0;
  up.onclick = () => { swap(container.tasks, idx, idx - 1); saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message)); renderAll(); };
  li.appendChild(up);

  const dn = document.createElement('button');
  dn.textContent = '↓'; dn.disabled = idx === container.tasks.length - 1;
  dn.onclick = () => { swap(container.tasks, idx, idx + 1); saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message)); renderAll(); };
  li.appendChild(dn);

  if (!container.autoDelete) {
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.onclick = () => { container.removeTask(idx); saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message)); renderAll(); };
    li.appendChild(del);
  }

  return li;
}

export function renderTabBar(tm, renderAll, { onDeleteList, onRenameList }) {
  const bar = document.getElementById('tab-bar');
  bar.innerHTML = '';
  tm.lists.forEach((lst, i) => {
    const btn = document.createElement('button');
    btn.textContent = lst.name;
    if (i === tm.currentListIndex) btn.classList.add('active-tab');
    btn.onclick = () => { tm.currentListIndex = i; renderAll(); };
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = '✎';
    editBtn.title = 'Rename List';
    editBtn.style.marginLeft = '4px';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      onRenameList(i);
    };
    // Delete button
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑';
    delBtn.title = 'Delete List';
    delBtn.style.marginLeft = '2px';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      onDeleteList(i);
    };
    bar.appendChild(btn);
    bar.appendChild(editBtn);
    bar.appendChild(delBtn);
  });
}

export function renderCategories(tm, renderAll, saveData, showModalDialog, callbacks = {}) {
  const { onRenameCategory, onRenameSubcategory, onRenameTask } = callbacks;
  // ensureUrgentCategory must be provided by the caller (controller)
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
    // Edit button for category
    if (onRenameCategory && cat.name !== 'URGENT') {
      const editCatBtn = document.createElement('button');
      editCatBtn.textContent = '✎';
      editCatBtn.title = 'Rename Category';
      editCatBtn.style.marginLeft = '4px';
      editCatBtn.onclick = (e) => { e.stopPropagation(); onRenameCategory(cidx); };
      hdr.appendChild(editCatBtn);
    }
    const upC = document.createElement('button'); upC.textContent = '↑'; upC.disabled = cidx === 0;
    upC.onclick = () => { swap(list.categories, cidx, cidx - 1); saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message)); renderAll(); };
    hdr.appendChild(upC);
    const dnC = document.createElement('button'); dnC.textContent = '↓'; dnC.disabled = cidx === list.categories.length - 1;
    dnC.onclick = () => { swap(list.categories, cidx, cidx + 1); saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message)); renderAll(); };
    hdr.appendChild(dnC);
    if (!cat.autoDelete) {
      const resetC = document.createElement('button'); resetC.textContent = 'Reset';
      resetC.onclick = () => { cat.tasks.forEach(t => t.completed = false); saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message)); renderAll(); };
      hdr.appendChild(resetC);
    }
    card.appendChild(hdr);

    // Body
    const bd = document.createElement('div'); bd.classList.add('card-body');

    // Subcategories
    if (cat.name !== 'URGENT' && cat.subcategories.length) {
      const subCont = document.createElement('div'); subCont.classList.add('subcategories-container');
      cat.subcategories.forEach((sub, sidx) => {
        const scard = document.createElement('div'); scard.classList.add('card', 'subcategory-card');
        const shdr = document.createElement('div'); shdr.classList.add('card-header');
        const st = document.createElement('h4'); st.textContent = sub.name; shdr.appendChild(st);
        // Edit button for subcategory
        if (onRenameSubcategory) {
          const editSubBtn = document.createElement('button');
          editSubBtn.textContent = '✎';
          editSubBtn.title = 'Rename Subcategory';
          editSubBtn.style.marginLeft = '4px';
          editSubBtn.onclick = (e) => { e.stopPropagation(); onRenameSubcategory(cidx, sidx); };
          shdr.appendChild(editSubBtn);
        }
        const upS = document.createElement('button'); upS.textContent = '↑'; upS.disabled = sidx === 0;
        upS.onclick = () => { swap(cat.subcategories, sidx, sidx - 1); saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message)); renderAll(); };
        shdr.appendChild(upS);
        const dnS = document.createElement('button'); dnS.textContent = '↓'; dnS.disabled = sidx === cat.subcategories.length - 1;
        dnS.onclick = () => { swap(cat.subcategories, sidx, sidx + 1); saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message)); renderAll(); };
        shdr.appendChild(dnS);
        const rmS = document.createElement('button'); rmS.textContent = '✕';
        rmS.onclick = () => { cat.removeSubcategory(sidx); saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message)); renderAll(); };
        shdr.appendChild(rmS);
        if (!sub.autoDelete) {
          const resetS = document.createElement('button'); resetS.textContent = 'Reset';
          resetS.onclick = () => { sub.tasks.forEach(t => t.completed = false); saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message)); renderAll(); };
          shdr.appendChild(resetS);
        }
        scard.appendChild(shdr);

        const sbd = document.createElement('div'); sbd.classList.add('card-body');
        const sul = document.createElement('ul');
        sub.tasks.forEach((t, ti) => {
          const taskLi = createTaskItem(t, sub, ti, renderAll, saveData, tm);
          // Edit button for task
          if (onRenameTask) {
            const editTaskBtn = document.createElement('button');
            editTaskBtn.textContent = '✎';
            editTaskBtn.title = 'Rename Task';
            editTaskBtn.style.marginLeft = '4px';
            editTaskBtn.onclick = (e) => { e.stopPropagation(); onRenameTask(cidx, sidx, ti); };
            taskLi.appendChild(editTaskBtn);
          }
          sul.appendChild(taskLi);
        });
        sbd.appendChild(sul);
        scard.appendChild(sbd);

        const sft = document.createElement('div'); sft.classList.add('card-footer');
        const sbtn = document.createElement('button'); sbtn.textContent = 'Add Task';
        sbtn.onclick = async () => {
          const result = await showModalDialog({
            title: 'Add Subcategory Task',
            fields: [
              { label: 'Task name', name: 'name', required: true },
              { label: 'Due date (MM/DD/YYYY)', name: 'due', pattern: '^\\d{2}/\\d{2}/\\d{4}$', required: false },
              { label: 'In Process?', name: 'inProcess', type: 'checkbox' }
            ],
            validate: v => {
              if (v.name.trim() === '') return 'Task name required';
              if (v.due && !(new RegExp('^\\d{2}/\\d{2}/\\d{4}$')).test(v.due)) return 'Invalid date format';
              return null;
            }
          });
          if (!result) return;
          const t = new Task(result.name, result.due || null);
          t.inProcess = !!result.inProcess;
          sub.addTask(t); saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message)); renderAll();
        };
        sft.appendChild(sbtn);
        scard.appendChild(sft);

        subCont.appendChild(scard);
      });
      bd.appendChild(subCont);
    }

    // Main tasks
    const ul = document.createElement('ul');
    cat.tasks.forEach((t, ti) => {
      const taskLi = createTaskItem(t, cat, ti, renderAll, saveData, tm);
      // Edit button for task
      if (onRenameTask) {
        const editTaskBtn = document.createElement('button');
        editTaskBtn.textContent = '✎';
        editTaskBtn.title = 'Rename Task';
        editTaskBtn.style.marginLeft = '4px';
        editTaskBtn.onclick = (e) => { e.stopPropagation(); onRenameTask(cidx, null, ti); };
        taskLi.appendChild(editTaskBtn);
      }
      ul.appendChild(taskLi);
    });
    bd.appendChild(ul);
    card.appendChild(bd);

    // Footer
    const ftr = document.createElement('div'); ftr.classList.add('card-footer');
    const addBtn = document.createElement('button'); addBtn.textContent = 'Add Task';
    addBtn.onclick = async () => {
      const result = await showModalDialog({
        title: 'Add Task',
        fields: [
          { label: 'Task name', name: 'name', required: true },
          { label: 'Due date (MM/DD/YYYY)', name: 'due', pattern: '^\\d{2}/\\d{2}/\\d{4}$', required: false },
          { label: 'In Process?', name: 'inProcess', type: 'checkbox' }
        ],
        validate: v => {
          if (v.name.trim() === '') return 'Task name required';
          if (v.due && !(new RegExp('^\\d{2}/\\d{2}/\\d{4}$')).test(v.due)) return 'Invalid date format';
          return null;
        }
      });
      if (!result) return;
      const t = new Task(result.name, result.due || null);
      t.inProcess = !!result.inProcess;
      cat.addTask(t); saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message)); renderAll();
    };
    ftr.appendChild(addBtn);
    if (cat.name !== 'URGENT') {
      const asc = document.createElement('button'); asc.textContent = 'Add Subcategory';
      asc.onclick = async () => {
        const result = await showModalDialog({
          title: 'Add Subcategory',
          fields: [
            { label: 'Subcategory name', name: 'name', required: true },
            { label: 'Auto-delete?', name: 'autoDelete', type: 'checkbox' }
          ],
          validate: v => v.name.trim() === '' ? 'Subcategory name required' : null
        });
        if (!result) return;
        cat.addSubcategory(result.name, !!result.autoDelete); saveData({ lists: tm.lists }).catch(e => alert('Failed to save: ' + e.message)); renderAll();
      };
      ftr.appendChild(asc);
    }
    card.appendChild(ftr);
    cont.appendChild(card);
  });
}

// Modal dialog system
export function showModalDialog({
  title = '',
  fields = [],
  okText = 'OK',
  cancelText = 'Cancel',
  validate = null
}) {
  return new Promise((resolve, reject) => {
    const overlay = document.getElementById('modal-overlay');
    const dialog = document.getElementById('modal-dialog');
    const form = document.getElementById('modal-form');
    const content = document.getElementById('modal-content');
    const errorDiv = document.getElementById('modal-error');
    const okBtn = document.getElementById('modal-ok');
    const cancelBtn = document.getElementById('modal-cancel');
    form.reset();
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    document.getElementById('modal-title').textContent = title;
    content.innerHTML = '';
    fields.forEach(f => {
      const label = document.createElement('label');
      label.textContent = f.label;
      label.setAttribute('for', 'modal-field-' + f.name);
      content.appendChild(label);
      let input;
      if (f.type === 'select') {
        input = document.createElement('select');
        f.options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          input.appendChild(o);
        });
      } else if (f.type === 'checkbox') {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = !!f.value;
      } else {
        input = document.createElement('input');
        input.type = f.type || 'text';
        if (f.value !== undefined) input.value = f.value;
      }
      input.id = 'modal-field-' + f.name;
      input.name = f.name;
      if (f.required) input.required = true;
      if (f.pattern) input.pattern = f.pattern;
      input.setAttribute('aria-label', f.label);
      content.appendChild(input);
    });
    okBtn.textContent = okText;
    cancelBtn.textContent = cancelText;
    overlay.style.display = 'flex';
    setTimeout(() => {
      const first = content.querySelector('input,select');
      if (first) first.focus();
    }, 50);
    overlay.onkeydown = e => {
      if (e.key === 'Escape') { e.preventDefault(); cancelBtn.click(); }
    };
    cancelBtn.onclick = () => {
      overlay.style.display = 'none';
      resolve(null);
    };
    form.onsubmit = e => {
      e.preventDefault();
      const values = {};
      fields.forEach(f => {
        const el = form.querySelector('[name="' + f.name + '"]');
        if (f.type === 'checkbox') {
          values[f.name] = el ? el.checked : false;
        } else {
          values[f.name] = el ? el.value : '';
        }
      });
      let error = null;
      if (validate) error = validate(values);
      if (!error) {
        overlay.style.display = 'none';
        resolve(values);
      } else {
        errorDiv.textContent = error;
        errorDiv.style.display = 'block';
      }
    };
  });
} 