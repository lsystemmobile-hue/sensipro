import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as auth from '@/lib/auth';

describe('Auth Logic', () => {
    beforeEach(() => {
        localStorage.clear();
        // Reset global crypto if needed for tests
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should seed admin user on first access', () => {
        const users = auth.getAllUsers();
        // getAllUsers filters out admin, so we need to check localStorage directly or via login
        const loginResult = auth.login('admin', 'admin123');
        expect(loginResult.success).toBe(true);
        expect(loginResult.user?.username).toBe('admin');
        expect(loginResult.user?.isAdmin).toBe(true);
    });

    it('should generate a valid ID even if crypto.randomUUID is missing', () => {
        // Force fallback by mocking crypto.randomUUID to undefined
        const originalCrypto = global.crypto;
        Object.defineProperty(global, 'crypto', {
            value: { ...originalCrypto, randomUUID: undefined },
            writable: true,
            configurable: true
        });

        const result = auth.createUser('testuser', 'password', '2025-12-31');
        expect(result.success).toBe(true);

        const users = JSON.parse(localStorage.getItem('gameaccess_users') || '[]');
        const user = users.find((u: any) => u.username === 'testuser');
        expect(user.id).toBeDefined();
        expect(typeof user.id).toBe('string');
    });

    it('should handle login correctly', () => {
        auth.createUser('user1', 'pass1', '2099-12-31');

        // Success
        const res1 = auth.login('user1', 'pass1');
        expect(res1.success).toBe(true);
        expect(res1.user?.username).toBe('user1');

        // Wrong password
        const res2 = auth.login('user1', 'wrong');
        expect(res2.success).toBe(false);
        expect(res2.error).toContain('inválidos');

        // Expired
        auth.createUser('expired_user', 'pass', '2000-01-01');
        const res3 = auth.login('expired_user', 'pass');
        expect(res3.success).toBe(false);
        expect(res3.error).toContain('expirou');
    });

    it('should manage sessions', () => {
        auth.login('admin', 'admin123');
        const user = auth.getCurrentUser();
        expect(user?.username).toBe('admin');

        auth.logout();
        expect(auth.getCurrentUser()).toBeNull();
    });

    it('should update and delete users', () => {
        auth.createUser('to_update', 'old', '2099-12-31');
        const users = JSON.parse(localStorage.getItem('gameaccess_users') || '[]');
        const user = users.find((u: any) => u.username === 'to_update');

        auth.updateUser(user.id, { password: 'new' });
        const res = auth.login('to_update', 'new');
        expect(res.success).toBe(true);

        auth.deleteUser(user.id);
        const res2 = auth.login('to_update', 'new');
        expect(res2.success).toBe(false);
    });
});
