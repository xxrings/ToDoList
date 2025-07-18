// controllers.js

import { tm, Category, rehydrateLists } from './models.js';
import { displayCurrentDate, renderTabBar, renderCategories, showModalDialog } from './views.js';
import { useLocal, useRemote, loadData, saveData } from './storage.js';
import { registerUser, loginUser, logoutUser, monitorAuthState } from './auth.js';
import { db } from './firebase.js';
import { collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

let unsubscribeRealtime = null;

function updateSyncStatus(state, text) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = `sync-status ${state}`;
  el.textContent = text;
}

// Utility: ensure URGENT category exists and move urgent tasks
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
        const parts = t.dueDate.split('/');
        if (parts.length === 3) {
          let [mm, dd, yyyy] = parts;
          if (yyyy.length === 2) yyyy = '20' + yyyy;
          const d = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
          if (!isNaN(d) && d - today <= 3 * 24 * 60 * 60 * 1000) {
            cat.tasks.splice(i, 1);
            urgent.tasks.push(t);
          }
        }
      }
    }
  });
}

function renderAll() {
  renderTabBar(tm, renderAll, {
    onDeleteList: async (idx) => {
      const list = tm.lists[idx];
      const confirmDelete = await showModalDialog({
        title: 'Delete List',
        fields: [],
        okText: 'Delete',
        cancelText: 'Cancel',
        validate: null
      });
      if (confirmDelete !== null) {
        if (tm.lists.length === 1) {
          alert('You must have at least one list.');
          return;
        }
        tm.lists.splice(idx, 1);
        if (tm.currentListIndex >= tm.lists.length) tm.currentListIndex = tm.lists.length - 1;
        saveData({ lists: tm.lists });
        renderAll();
      }
    },
    onRenameList: async (idx) => {
      const list = tm.lists[idx];
      const result = await showModalDialog({
        title: 'Rename List',
        fields: [
          { label: 'List name', name: 'name', value: list.name, required: true }
        ],
        validate: v => v.name.trim() === '' ? 'List name required' : null
      });
      if (result && result.name.trim() !== '') {
        list.name = result.name.trim();
        saveData({ lists: tm.lists });
        renderAll();
      }
    }
  });
  ensureUrgentCategory();
  renderCategories(tm, renderAll, saveData, showModalDialog, {
    onRenameCategory: async (cidx) => {
      const cat = tm.getCurrentList().categories[cidx];
      const result = await showModalDialog({
        title: 'Rename Category',
        fields: [
          { label: 'Category name', name: 'name', value: cat.name, required: true }
        ],
        validate: v => v.name.trim() === '' ? 'Category name required' : null
      });
      if (result && result.name.trim() !== '') {
        cat.name = result.name.trim();
        saveData({ lists: tm.lists });
        renderAll();
      }
    },
    onRenameSubcategory: async (cidx, sidx) => {
      const sub = tm.getCurrentList().categories[cidx].subcategories[sidx];
      const result = await showModalDialog({
        title: 'Rename Subcategory',
        fields: [
          { label: 'Subcategory name', name: 'name', value: sub.name, required: true }
        ],
        validate: v => v.name.trim() === '' ? 'Subcategory name required' : null
      });
      if (result && result.name.trim() !== '') {
        sub.name = result.name.trim();
        saveData({ lists: tm.lists });
        renderAll();
      }
    },
    onRenameTask: async (cidx, sidx, ti) => {
      let task;
      if (sidx !== null) {
        task = tm.getCurrentList().categories[cidx].subcategories[sidx].tasks[ti];
      } else {
        task = tm.getCurrentList().categories[cidx].tasks[ti];
      }
      const result = await showModalDialog({
        title: 'Rename Task',
        fields: [
          { label: 'Task name', name: 'name', value: task.name, required: true }
        ],
        validate: v => v.name.trim() === '' ? 'Task name required' : null
      });
      if (result && result.name.trim() !== '') {
        task.name = result.name.trim();
        saveData({ lists: tm.lists });
        renderAll();
      }
    }
  });
}

function removeDuplicateLists() {
  if (!tm.lists || tm.lists.length === 0) {
    alert("No lists to clean up!");
    return;
  }
  const seen = new Set();
  const originalCount = tm.lists.length;
  tm.lists = tm.lists.filter(list => {
    if (seen.has(list.name)) {
      return false;
    }
    seen.add(list.name);
    return true;
  });
  const removed = originalCount - tm.lists.length;
  if (removed > 0) {
    alert(`Removed ${removed} duplicate list(s).`);
    renderAll();
    saveData({ lists: tm.lists });
  } else {
    alert("No duplicate lists found!");
  }
}

export function initApp() {
  window.removeDuplicateLists = removeDuplicateLists;
  window.addEventListener('DOMContentLoaded', () => {
    // Auth UI logic
    const emailInput   = document.getElementById('email');
    const passwordInput= document.getElementById('password');
    const loginBtn     = document.getElementById('login-btn');
    const signupBtn    = document.getElementById('signup-btn');
    const logoutBtn    = document.getElementById('logout-btn');
    const userStatus   = document.getElementById('user-status');
    const topControls  = document.getElementById('top-controls');
    const tabBar       = document.getElementById('tab-bar');
    const categoriesContainer = document.getElementById('categories-container');

    function setAppUIEnabled(enabled) {
      if (topControls) topControls.style.display = enabled ? '' : 'none';
      if (tabBar) tabBar.style.display = enabled ? '' : 'none';
      if (categoriesContainer) categoriesContainer.style.display = enabled ? '' : 'none';
    }

    loginBtn.addEventListener('click', async () => {
      const email    = emailInput.value;
      const password = passwordInput.value;
      if (!email || !password) {
        alert('Please enter both email and password');
        return;
      }
      loginBtn.textContent = 'Logging in...';
      loginBtn.disabled = true;
      await loginUser(email, password);
      loginBtn.textContent = 'Log In';
      loginBtn.disabled = false;
    });

    signupBtn.addEventListener('click', async () => {
      const email    = emailInput.value;
      const password = passwordInput.value;
      if (!email || !password) {
        alert('Please enter both email and password');
        return;
      }
      if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }
      signupBtn.textContent = 'Creating Account...';
      signupBtn.disabled = true;
      await registerUser(email, password);
      signupBtn.textContent = 'Sign Up';
      signupBtn.disabled = false;
    });

    logoutBtn.addEventListener('click', async () => {
      await logoutUser();
    });

    monitorAuthState(user => {
      if (user) {
        userStatus.textContent    = `Logged in as: ${user.email}`;
        logoutBtn.style.display   = 'inline-block';
        emailInput.style.display  = 'none';
        passwordInput.style.display = 'none';
        loginBtn.style.display    = 'none';
        signupBtn.style.display   = 'none';
        setAppUIEnabled(true);
        useRemote(user.uid);
        updateSyncStatus('syncing', 'Loading…');
        // Set up real-time listener
        if (unsubscribeRealtime) unsubscribeRealtime();
        unsubscribeRealtime = onSnapshot(
          collection(db, 'users', user.uid, 'lists'),
          snap => {
            // Preserve current list selection by ID
            const prevList = tm.lists[tm.currentListIndex];
            const prevId = prevList ? prevList.id : null;
            tm.lists = rehydrateLists(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            let idx = 0;
            if (prevId) {
              idx = tm.lists.findIndex(l => l.id === prevId);
              if (idx === -1) idx = 0;
            }
            tm.currentListIndex = idx;
            renderAll();
            updateSyncStatus('success', 'Synced (live)');
          },
          err => {
            console.error('Realtime listener error', err);
            updateSyncStatus('error', 'Sync error');
          }
        );
        // Initial load (in case no real-time data yet)
        loadData().then(data => {
          const prevList = tm.lists[tm.currentListIndex];
          const prevId = prevList ? prevList.id : null;
          tm.lists = rehydrateLists(Array.isArray(data.lists) ? data.lists : []);
          let idx = 0;
          if (prevId) {
            idx = tm.lists.findIndex(l => l.id === prevId);
            if (idx === -1) idx = 0;
          }
          tm.currentListIndex = idx;
          updateSyncStatus('success', 'Synced');
          renderAll();
        }).catch(e => {
          updateSyncStatus('error', 'Load failed');
          renderAll();
        });
      } else {
        if (unsubscribeRealtime) {
          unsubscribeRealtime();
          unsubscribeRealtime = null;
        }
        useLocal();
        updateSyncStatus('offline', 'Not logged in');
        renderAll();
      }
    });

    // Main app event listeners (only enabled when logged in)
    const addListBtn = document.getElementById('add-list-button');
    if (addListBtn) {
      addListBtn.onclick = async () => {
        const result = await showModalDialog({
          title: 'Add New List',
          fields: [
            { label: 'List name', name: 'name', required: true }
          ],
          validate: v => v.name.trim() === '' ? 'List name required' : null
        });
        if (!result) return;
        tm.addList(result.name);
        renderAll();
      };
    }
    const addCategoryBtn = document.getElementById('add-category');
    if (addCategoryBtn) {
      addCategoryBtn.onclick = async () => {
        const result = await showModalDialog({
          title: 'Add Category',
          fields: [
            { label: 'Category name', name: 'name', required: true },
            { label: 'Auto-delete?', name: 'autoDelete', type: 'checkbox' }
          ],
          validate: v => v.name.trim() === '' ? 'Category name required' : null
        });
        if (!result) return;
        const list = tm.getCurrentList();
        list.categories.push(new Category(result.name, !!result.autoDelete));
        saveData({ lists: tm.lists });
        renderAll();
      };
    }
    // Settings menu logic
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const removeDuplicatesMenu = document.getElementById('remove-duplicates-menu');
    if (settingsBtn && settingsMenu) {
      settingsBtn.onclick = (e) => {
        e.stopPropagation();
        settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
      };
      document.addEventListener('click', (e) => {
        if (settingsMenu.style.display === 'block' && !settingsMenu.contains(e.target) && e.target !== settingsBtn) {
          settingsMenu.style.display = 'none';
        }
      });
    }
    if (removeDuplicatesMenu) {
      removeDuplicatesMenu.onclick = () => {
        settingsMenu.style.display = 'none';
        removeDuplicateLists();
      };
    }
  }, { once: true });
} 