'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { createUser, updateUser } from '@/lib/actions/user-actions';
import { Role } from "@prisma/client";
interface UserFormProps {
  user?: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    phone: string | null;
    role: Role;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function UserForm({ user, onClose, onSuccess }: UserFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = user 
        ? await updateUser(user.id, formData)
        : await createUser(formData);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Terjadi kesalahan');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-background rounded-4xl p-8 shadow-2xl border border-outline-variant/20"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-tertiary">
            {user ? 'Edit User' : 'Tambah User Baru'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              defaultValue={user?.name || ''}
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary transition-all"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              required
              defaultValue={user?.username || ''}
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary transition-all"
              placeholder="Masukkan username"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              Email (Opsional)
            </label>
            <input
              type="email"
              name="email"
              defaultValue={user?.email || ''}
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary transition-all"
              placeholder="Masukkan email"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              Nomor WhatsApp / HP
            </label>
            <input
              type="text"
              name="phone"
              defaultValue={user?.phone || ''}
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary transition-all"
              placeholder="Contoh: 6281234567890"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              Password {user && '(Kosongkan jika tidak ingin diubah)'}
            </label>
            <input
              type="password"
              name="password"
              required={!user}
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary transition-all"
              placeholder="Masukkan password"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              Role
            </label>
            <select
              name="role"
              required
              defaultValue={user?.role || 'ADMIN'}
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary transition-all appearance-none"
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Admin (Super)</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 rounded-full py-3 h-12 text-sm font-bold border-gray-100 text-gray-500 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-full py-3 h-12 text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
