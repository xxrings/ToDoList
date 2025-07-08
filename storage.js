// storage.js

import { db } from './firebase.js';
import {
  collection,
  doc,
  getDocs,
  setDoc
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const LOCAL_KEY = 'todoData';

// ── LocalStorage-backed methods ─────────────────────────────────────────────
export async function loadLocal() {
  const json = localStorage.getItem(LOCAL_KEY);
  return json ? JSON.parse(json) : { lists: [] };
}

export async function saveLocal(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

// ── Firestore-backed methods ────────────────────────────────────────────────
export async function loadRemote(uid) {
  const colRef = collection(db, 'users', uid, 'lists');
  const snap   = await getDocs(colRef);
  return {
    lists: snap.docs.map(d => ({ id: d.id, ...d.data() }))
  };
}

export async function saveRemote(uid, data) {
  const colRef = collection(db, 'users', uid, 'lists');

  for (const list of data.lists) {
    let ref;
    if (list.id) {
      // Existing list → use its ID
      ref = doc(db, 'users', uid, 'lists', list.id);
    } else {
      // New list → auto-generate an ID and assign it
      ref = doc(colRef);
      list.id = ref.id;
    }

    // Convert to plain object (strip out class prototypes)
    const plain = JSON.parse(JSON.stringify(list));

    // Now write only plain data
    await setDoc(ref, plain);
  }
}

// ── Dispatcher (choose Local vs Remote) ─────────────────────────────────────
let current = { load: loadLocal, save: saveLocal };

export function useLocal() {
  current = { load: loadLocal, save: saveLocal };
}

export function useRemote(uid) {
  current = {
    load: () => loadRemote(uid),
    save: data => saveRemote(uid, data)
  };
}

// ── Public API ───────────────────────────────────────────────────────────────
export const loadData = () => current.load();
export const saveData = data => current.save(data);
