// Based on the info Kate found 

let crackedPasswords = null;

async function loadCrackedPasswords() {
  if (crackedPasswords) return crackedPasswords;
  
  try {
    const response = await fetch(chrome.runtime.getURL("../src/crackstation-human-only.txt"));
    const text = await response.text();
    crackedPasswords = text.split('\n').map(pw => pw.trim()).filter(pw => pw.length > 0); // split by newlines
    return crackedPasswords;
  } catch (error) {
    console.error('Failed to load cracked passwords:', error);
    return [];
  }
}

export async function leakedPasswordCheck(password) {
    // Load the cracked passwords list
    const cracked = await loadCrackedPasswords();
    return cracked.includes(password); // checks one-to-one
  }
  