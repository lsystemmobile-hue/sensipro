export interface User {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
  isActive: boolean;
  expiresAt: string; // ISO date
  currentIp: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

const SESSION_KEY = 'gameaccess_session';
const USERS_KEY = 'gameaccess_users';

export function generateId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {
    // Fallback if crypto is restricted
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    // Seed admin
    const admin: User = {
      id: generateId(),
      username: 'admin',
      password: 'admin123',
      isAdmin: true,
      isActive: true,
      expiresAt: '2099-12-31',
      currentIp: null,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([admin]));
    return [admin];
  }
  return JSON.parse(data);
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getAllUsers(): User[] {
  return getUsers().filter(u => !u.isAdmin);
}

export function login(username: string, password: string): { success: boolean; error?: string; user?: User } {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return { success: false, error: 'Usuário ou senha inválidos.' };
  if (!user.isActive) return { success: false, error: 'Conta desativada. Contate o administrador.' };
  if (!user.isAdmin && new Date(user.expiresAt) < new Date()) {
    return { success: false, error: 'Seu acesso expirou. Contate o administrador.' };
  }

  // Simulate IP
  const ip = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

  user.currentIp = ip;
  user.lastLoginAt = new Date().toISOString();
  saveUsers(users);

  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, ip }));
  return { success: true, user };
}

export function logout() {
  const session = getSession();
  if (session) {
    const users = getUsers();
    const user = users.find(u => u.id === session.userId);
    if (user) {
      user.currentIp = null;
      saveUsers(users);
    }
  }
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): { userId: string; ip: string } | null {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

export function getCurrentUser(): User | null {
  const session = getSession();
  if (!session) return null;
  const users = getUsers();
  return users.find(u => u.id === session.userId) || null;
}

export function isAccessValid(user: User): boolean {
  if (user.isAdmin) return true;
  if (!user.isActive) return false;
  return new Date(user.expiresAt) >= new Date();
}

// Admin functions
export function createUser(username: string, password: string, expiresAt: string): { success: boolean; error?: string } {
  const users = getUsers();
  if (users.find(u => u.username === username)) {
    return { success: false, error: 'Usuário já existe.' };
  }
  const newUser: User = {
    id: generateId(),
    username,
    password,
    isAdmin: false,
    isActive: true,
    expiresAt,
    currentIp: null,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return { success: true };
}

export function updateUser(id: string, data: Partial<Pick<User, 'username' | 'password' | 'expiresAt' | 'isActive'>>) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return;
  Object.assign(users[idx], data);
  saveUsers(users);
}

export function deleteUser(id: string) {
  const users = getUsers().filter(u => u.id !== id);
  saveUsers(users);
}

export function toggleUserActive(id: string) {
  const users = getUsers();
  const user = users.find(u => u.id === id);
  if (user) {
    user.isActive = !user.isActive;
    if (!user.isActive) user.currentIp = null;
    saveUsers(users);
  }
}
