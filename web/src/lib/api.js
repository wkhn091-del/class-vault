const raw = import.meta.env.VITE_API_URL;
// Empty string = same-origin (Vite proxies /api → Render in local dev).
const BASE = (raw === undefined ? 'http://localhost:4000' : String(raw)).replace(/\/$/, '');
const TOKEN_KEY = 'class-vault-admin-token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/**
 * Office/Google viewers must fetch the file from the public internet.
 * Localhost (and empty same-origin proxy) cannot be reached by those viewers.
 */
export const apiIsPubliclyReachable = (() => {
  try {
    const target = BASE || (typeof window !== 'undefined' ? window.location.origin : '');
    const { hostname: host, protocol } = new URL(target);
    if (protocol !== 'https:') return false;
    return !(
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.local') ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    );
  } catch {
    return false;
  }
})();

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('אין חיבור לשרת. בדקו את החיבור לאינטרנט.');
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'הבקשה נכשלה.');
  return payload;
}

export const api = {
  unlock: (passcode) => request('/api/auth/unlock', { method: 'POST', body: { passcode } }),
  checkSession: () => request('/api/auth/session', { auth: true }),
  listFolders: () => request('/api/folders'),
  getFolder: (id) => request(`/api/folders/${id}`),
  createFolder: (name, description) =>
    request('/api/folders', { method: 'POST', body: { name, description }, auth: true }),
  updateFolder: (id, patch) =>
    request(`/api/folders/${id}`, { method: 'PATCH', body: patch, auth: true }),
  deleteFolder: (id) => request(`/api/folders/${id}`, { method: 'DELETE', auth: true }),
  fileLink: (id) => request(`/api/files/${id}/link`),
  renameFile: (id, name) =>
    request(`/api/files/${id}`, { method: 'PATCH', body: { name }, auth: true }),
  deleteFile: (id) => request(`/api/files/${id}`, { method: 'DELETE', auth: true }),
  downloadUrl: (id) => `${BASE}/api/files/${id}/download`,
  rawUrl(id, name = '') {
    const match = /\.([A-Za-z0-9]{1,10})$/.exec(name);
    return match
      ? `${BASE}/api/files/${id}/raw/file.${match[1].toLowerCase()}`
      : `${BASE}/api/files/${id}/raw`;
  },
  uploadFiles(folderId, files, onProgress) {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      for (const file of files) form.append('files', file, file.name);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE}/api/files/folder/${folderId}`);
      const token = tokenStore.get();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        let payload = {};
        try {
          payload = JSON.parse(xhr.responseText);
        } catch {
          /* ignore */
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ uploaded: payload.uploaded ?? [], failed: payload.failed ?? [] });
        } else {
          reject(new Error(payload.error || 'ההעלאה נכשלה.'));
        }
      };
      xhr.onerror = () => reject(new Error('ההעלאה נכשלה. בדקו את החיבור.'));
      xhr.send(form);
    });
  },
};
