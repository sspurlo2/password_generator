/* Kate Spencer
Based on the Pwned API https://haveibeenpwned.com/api/v3 */



// DEPRECATED -> KEEP FOR NOW

// let crackedPasswords = null;
// async function loadCrackedPasswords() { 
//   if (crackedPasswords) return crackedPasswords;

//   try {
//     const path_to_file = "src/test.txt";
//     const resolved_URL = chrome.runtime.getURL(path_to_file);
//     const response = await fetch(resolved_URL);
//     const text = await response.text();
//     crackedPasswords = text.split('\n').map(pw => pw.trim()).filter(pw => pw.length > 0); // trim by line
//     return crackedPasswords;
  
//   } catch (error) { // error shows up even though it does fetch
//     console.error('Failed to load cracked passwords:', error);
//     return [];
//   }
// }

async function SHA1_hash(password) {
  const encoded_password = new TextEncoder().encode(password);
  const hash_buff = await crypto.subtle.digest('SHA-1', encoded_password); // crypto does not need to be imported
  const hash_array = Array.from(new Uint8Array(hash_buff));

  return hash_array.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export async function leakedPasswordCheck(password) {
    const hash = await SHA1_hash(password); // generate hash based on password
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`); // result in form HASH:INT
    const response_text = await response.text(); 
    const hashes = {};
    
    response_text.split('\n').forEach(line => {
      const [hash_suffix, count] = line.split(':'); // split the response by 
      if (hash_suffix && count) {
        hashes[hash.trim().toUpperCase()] = Number(count, 10);
      }
    });
    
    if (hashes[suffix]) { return hashes[suffix]; } // check if the suffix matches
    else { return null; } // not leaked
  }
  
