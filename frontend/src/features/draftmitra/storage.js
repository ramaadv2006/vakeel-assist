/* ---------------------------------------------------------------
   Storage adapter for DraftMitra.

   Default implementation uses the browser's localStorage, namespaced
   under "draftmitra::". This keeps saved drafts and AI-imported
   templates on the advocate's own device — no backend required to
   get started.

   TO SWITCH TO A REAL BACKEND LATER (recommended once you have
   multiple devices / a team using AdvoBuddy):
   Replace the three functions below with calls to your own API
   (e.g. POST /api/drafts, GET /api/drafts, DELETE /api/drafts/:id)
   backed by a database per logged-in advocate. Keep the same
   function signatures so DraftMitra.jsx doesn't need to change.
 ----------------------------------------------------------------*/

const NS = "draftmitra::";

function keyFor(key) {
  return `${NS}${key}`;
}

export async function storageGet(key) {
  try {
    const raw = window.localStorage.getItem(keyFor(key));
    if (raw === null) return null;
    return { key, value: raw };
  } catch (e) {
    console.error("draftmitra storage get failed", e);
    return null;
  }
}

export async function storageSet(key, value) {
  try {
    window.localStorage.setItem(keyFor(key), value);
    return { key, value };
  } catch (e) {
    console.error("draftmitra storage set failed", e);
    return null;
  }
}

export async function storageDelete(key) {
  try {
    window.localStorage.removeItem(keyFor(key));
    return { key, deleted: true };
  } catch (e) {
    console.error("draftmitra storage delete failed", e);
    return null;
  }
}

export async function storageList(prefix = "") {
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(NS) && k.slice(NS.length).startsWith(prefix)) {
        keys.push(k.slice(NS.length));
      }
    }
    return { keys, prefix };
  } catch (e) {
    console.error("draftmitra storage list failed", e);
    return { keys: [], prefix };
  }
}
