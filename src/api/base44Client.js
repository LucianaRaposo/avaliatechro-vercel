const DB_KEY = 'avaliatechro_local_db_v1';
const SESSION_KEY = 'avaliatechro_session_user_v1';

const now = () => new Date().toISOString();
const uid = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const defaultAdmin = {
  id: 'admin-local',
  email: 'admin@avaliatechro.local',
  full_name: 'Administrador',
  role: 'admin',
  phone: '',
  whatsapp: '',
  created_date: now(),
  updated_date: now(),
};

const defaults = {
  User: [defaultAdmin],
  SERTIC: [
    {
      id: 'sertic-local',
      name: 'SERTIC RO',
      title: 'AvaliaTech RO',
      is_active: true,
      banner_url: '/assets/banner.svg',
      logo_url: '/assets/logo.svg',
      created_date: now(),
      updated_date: now(),
    }
  ],
  Project: [],
  Evaluation: [],
  EvaluationCriteria: [
    { id: 'crit-1', name: 'Criatividade e Inovação', description: 'Originalidade da proposta.', max_score: 10, weight: 1, is_active: true, created_date: now(), updated_date: now() },
    { id: 'crit-2', name: 'Metodologia', description: 'Clareza e coerência metodológica.', max_score: 10, weight: 1, is_active: true, created_date: now(), updated_date: now() },
    { id: 'crit-3', name: 'Apresentação', description: 'Comunicação e organização.', max_score: 10, weight: 1, is_active: true, created_date: now(), updated_date: now() },
  ],
  CategoryConfig: [],
  StateFairConfig: [],
  CertificateTemplate: [],
  RegionalFair: [],
};

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    const db = raw ? JSON.parse(raw) : {};
    const merged = { ...defaults, ...db };
    for (const key of Object.keys(defaults)) {
      if (!Array.isArray(merged[key])) merged[key] = defaults[key];
    }
    saveDb(merged);
    return merged;
  } catch {
    saveDb(defaults);
    return structuredClone(defaults);
  }
}

function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getCurrentUser() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function setCurrentUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function createEntityApi(name) {
  const ensure = (db) => {
    if (!Array.isArray(db[name])) db[name] = [];
    return db[name];
  };
  return {
    async list(sort = '') {
      const db = loadDb();
      const items = [...ensure(db)];
      if (typeof sort === 'string' && sort) {
        const desc = sort.startsWith('-');
        const field = desc ? sort.slice(1) : sort;
        items.sort((a, b) => {
          const av = a?.[field] ?? '';
          const bv = b?.[field] ?? '';
          return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
        });
      }
      return items;
    },
    async filter(criteria = {}, sort = '') {
      const all = await this.list(sort);
      return all.filter(item => Object.entries(criteria || {}).every(([k, v]) => item?.[k] === v));
    },
    async get(id) {
      const db = loadDb();
      return ensure(db).find(item => item.id === id) || null;
    },
    async create(data = {}) {
      const db = loadDb();
      const item = { ...data, id: data.id || uid(name.toLowerCase()), created_date: data.created_date || now(), updated_date: now() };
      ensure(db).push(item);
      saveDb(db);
      return item;
    },
    async update(id, data = {}) {
      const db = loadDb();
      const arr = ensure(db);
      const index = arr.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`${name} não encontrado`);
      arr[index] = { ...arr[index], ...data, id, updated_date: now() };
      saveDb(db);
      return arr[index];
    },
    async delete(id) {
      const db = loadDb();
      db[name] = ensure(db).filter(item => item.id !== id);
      saveDb(db);
      return { success: true };
    }
  };
}

const entityNames = ['User','SERTIC','Project','Evaluation','EvaluationCriteria','CategoryConfig','StateFairConfig','CertificateTemplate','RegionalFair'];
const entities = Object.fromEntries(entityNames.map(name => [name, createEntityApi(name)]));

export const base44 = {
  entities,
  auth: {
    async me() {
      let user = getCurrentUser();
      if (!user) {
        user = defaultAdmin;
        setCurrentUser(user);
      }
      return user;
    },
    async loginViaEmailPassword(email, password) {
      const normalized = String(email || '').trim().toLowerCase();
      if (normalized === 'admin@avaliatechro.local' && String(password) === 'admin123') {
        setCurrentUser(defaultAdmin);
        return { access_token: 'local-admin-token', user: defaultAdmin };
      }
      const db = loadDb();
      const user = (db.User || []).find(u => String(u.email).toLowerCase() === normalized);
      if (!user) throw new Error('Email ou senha inválidos. Use admin@avaliatechro.local / admin123 para o primeiro acesso.');
      setCurrentUser(user);
      return { access_token: `local-token-${user.id}`, user };
    },
    async register({ email }) {
      const db = loadDb();
      const normalized = String(email || '').trim().toLowerCase();
      if ((db.User || []).some(u => String(u.email).toLowerCase() === normalized)) throw new Error('Usuário já cadastrado');
      return { success: true };
    },
    async verifyOtp({ email }) {
      const db = loadDb();
      const normalized = String(email || '').trim().toLowerCase();
      let user = (db.User || []).find(u => String(u.email).toLowerCase() === normalized);
      if (!user) {
        user = { id: uid('user'), email: normalized, full_name: normalized, role: 'user', created_date: now(), updated_date: now() };
        db.User.push(user);
        saveDb(db);
      }
      setCurrentUser(user);
      return { access_token: `local-token-${user.id}`, user };
    },
    setToken() {},
    async updateMe(data = {}) {
      const current = await this.me();
      const updated = { ...current, ...data, updated_date: now() };
      setCurrentUser(updated);
      const db = loadDb();
      const idx = db.User.findIndex(u => u.id === current.id);
      if (idx >= 0) db.User[idx] = updated; else db.User.push(updated);
      saveDb(db);
      return updated;
    },
    logout(redirectUrl) {
      localStorage.removeItem(SESSION_KEY);
      if (redirectUrl) window.location.href = '/login';
    },
    redirectToLogin() { window.location.href = '/login'; },
    loginWithProvider() { window.location.href = '/login'; },
    async resendOtp() { return { success: true }; },
    async resetPasswordRequest() { return { success: true }; },
    async resetPassword() { return { success: true }; },
  },
  users: {
    async inviteUser(email, role = 'user') {
      const db = loadDb();
      const normalized = String(email || '').trim().toLowerCase();
      let user = db.User.find(u => String(u.email).toLowerCase() === normalized);
      if (!user) {
        user = { id: uid('user'), email: normalized, full_name: normalized, role, created_date: now(), updated_date: now() };
        db.User.push(user);
        saveDb(db);
      }
      return user;
    }
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const file_url = file ? URL.createObjectURL(file) : '';
        return { file_url };
      }
    }
  },
  connectors: {
    async getAppUserConnectionStatus() { return { connected: false, status: 'disconnected' }; },
    async connectAppUser() { return '#'; },
    async disconnectAppUser() { return { success: true }; }
  },
  functions: {
    async invoke(name, payload) {
      if (name === 'generateCertificate') {
        return { data: { success: true, message: 'Certificado gerado localmente.', payload }, success: true };
      }
      return { data: { success: true, payload }, success: true };
    }
  }
};
