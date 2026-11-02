const raw = import.meta.env.VITE_API_URL;
// Empty string = same-origin (Vite proxies /api in local dev; Vercel serves /api in prod).
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

function putWithProgress(url, file, contentType, onFileProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    if (contentType) xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onFileProgress) {
        onFileProgress(event.loaded, event.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`העלאה נכשלה (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error('ההעלאה נכשלה. בדקו את החיבור.'));
    xhr.send(file);
  });
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
  fileLink: (id, { download = false } = {}) =>
    request(`/api/files/${id}/link${download ? '?download=1' : ''}`),
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
  /**
   * Resolve a Supabase signed URL via JSON, then click / navigate to it.
   * Avoids same-origin /api navigations that Chrome's service worker breaks.
   * Open-in-tab opens a blank window synchronously so Chrome still treats it
   * as a user gesture after the await.
   */
  async download(id) {
    const { url, name } = await this.fileLink(id, { download: true });
    clickAnchor(url, { downloadName: name });
  },
  async openInTab(id) {
    // Must open synchronously inside the click handler — after await, Chrome
    // treats target=_blank as a blocked popup.
    const tab = window.open('about:blank', '_blank');
    try {
      const { url } = await this.fileLink(id);
      if (tab) tab.location.replace(url);
      else clickAnchor(url, { newTab: true });
    } catch (err) {
      if (tab) tab.close();
      throw err;
    }
  },
  /**
   * Sign → PUT straight to Supabase → complete DB rows.
   * Progress is overall bytes across the batch.
   */
  async uploadFiles(folderId, files, onProgress) {
    const list = Array.from(files || []);
    const signed = await request(`/api/files/folder/${folderId}/sign`, {
      method: 'POST',
      auth: true,
      body: {
        files: list.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      },
    });

    const prepared = signed.uploads || [];
    const failed = [...(signed.failed || [])];
    const completed = [];

    const totalBytes = prepared.reduce((sum, u) => sum + (u.size || 0), 0) || 1;
    const loadedByPath = new Map(prepared.map((u) => [u.storagePath, 0]));

    const report = () => {
      if (!onProgress) return;
      let loaded = 0;
      for (const v of loadedByPath.values()) loaded += v;
      onProgress(Math.min(100, Math.round((loaded / totalBytes) * 100)));
    };

    await mapPool(prepared, 3, async (item) => {
      const file = list[item.index];
      if (!file) {
        failed.push({ name: item.name, reason: 'File missing from selection.' });
        return;
      }
      try {
        await putWithProgress(item.signedUrl, file, item.contentType, (loaded) => {
          loadedByPath.set(item.storagePath, loaded);
          report();
        });
        loadedByPath.set(item.storagePath, item.size || file.size);
        report();
        completed.push({
          name: item.name,
          storagePath: item.storagePath,
          size: item.size || file.size,
          contentType: item.contentType,
        });
      } catch (err) {
        failed.push({ name: item.name, reason: err.message || 'Upload failed.' });
      }
    });

    if (completed.length === 0) {
      throw new Error(failed[0]?.reason || 'ההעלאה נכשלה.');
    }

    const result = await request(`/api/files/folder/${folderId}/complete`, {
      method: 'POST',
      auth: true,
      body: { files: completed },
    });

    return {
      uploaded: result.uploaded ?? [],
      failed: [...failed, ...(result.failed ?? [])],
    };
  },
};

async function mapPool(items, limit, task) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, items.length) || 0 }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await task(item);
    }
  });
  await Promise.all(workers);
}

function clickAnchor(url, { downloadName, newTab } = {}) {
  const a = document.createElement('a');
  a.href = url;
  if (downloadName) a.setAttribute('download', downloadName);
  if (newTab) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  document.body.appendChild(a);
  a.click();
  a.remove();
}
