// utils.js

// Swap two elements in an array
export function swap(arr, i, j) {
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

// Parse MM/DD/YYYY to Date object
export function parseDate(mmddyyyy) {
  const parts = mmddyyyy.split('/');
  if (parts.length === 3) {
    let [mm, dd, yyyy] = parts;
    if (yyyy.length === 2) yyyy = '20' + yyyy;
    return new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
  }
  return null;
} 