'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteUser } from '@/lib/actions/user-actions';
import { UserForm } from './UserForm';
import { Role } from "@prisma/client";

export type AdminUserRow = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  role: Role;
  createdAt: Date;
};

export function UserTable({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [deleteModal, setDeleteModal] = useState<{ id: string, username: string } | null>(null);
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredUsers = users.filter((u) => {
    const matchSearch = 
      (u.name?.toLowerCase().includes(search.toLowerCase()) || 
       u.username?.toLowerCase().includes(search.toLowerCase()) ||
       u.email?.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  const handleDelete = (id: string, username: string) => {
    setDeleteModal({ id, username });
  };

  const confirmDelete = () => {
    if (!deleteModal) return;
    const { id } = deleteModal;
    setDeleteModal(null);
    
    startTransition(async () => {
      const result = await deleteUser(id);
      if (result.success) {
        setUsers(users.filter((u) => u.id !== id));
      } else {
        alert(result.error || 'Gagal menghapus');
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full pb-24 mx-auto">
      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
        <div className="relative w-full md:w-96">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">search</span>
          <input
            type="text"
            placeholder="Cari user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-outline/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-primary transition-all text-on-surface shadow-sm"
          />
        </div>

        <Button 
          onClick={() => setShowAddForm(true)}
          className="w-full md:w-auto rounded-full bg-primary text-on-primary hover:bg-primary/90 px-8 py-3 h-12 text-sm font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          <span>Tambah User</span>
        </Button>
      </div>

      {/* Table Container */}
      <div className={`bg-white border border-gray-100 rounded-4xl overflow-hidden shadow-sm ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
        
        {/* Desktop Header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          <div className="col-span-3">User / Pengelola</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">WhatsApp / HP</div>
          <div className="col-span-2">Dibuat Pada</div>
          <div className="col-span-1 text-center">Role</div>
          <div className="col-span-1 text-right">Aksi</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50">
          {filteredUsers.map((user) => (
            <div key={user.id} className="group grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-center px-6 lg:px-8 py-6 hover:bg-gray-50/30 transition-colors">
              
              <div className="col-span-1 lg:col-span-3 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-[24px]">account_circle</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">
                    {user.name || 'Admin'}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium tracking-tight">
                    @{user.username}
                  </p>
                </div>
              </div>

              <div className="col-span-1 lg:col-span-3 text-sm font-medium text-gray-500">
                {user.email || '-'}
                <div className="lg:hidden mt-1 flex flex-col gap-1 text-[10px] text-gray-400">
                  {user.phone && <span>WA: {user.phone}</span>}
                  <div className="flex items-center gap-2">
                    <span>{formatDate(user.createdAt)}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                    <span className="uppercase font-bold text-primary">Admin</span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block col-span-2 text-sm font-medium text-gray-500">
                {user.phone || '-'}
              </div>

              <div className="hidden lg:block col-span-2 text-sm text-gray-500">
                {formatDate(user.createdAt)}
              </div>

              <div className="hidden lg:flex col-span-1 items-center justify-center">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  user.role === 'SUPER_ADMIN' ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
                }`}>
                  Admin
                </span>
              </div>

              <div className="col-span-1 lg:col-span-1 flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditUser(user)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                  title="Edit User"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button
                  onClick={() => handleDelete(user.id, user.username || '')}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Hapus User"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="py-24 text-center">
              <div className="inline-flex w-20 h-20 items-center justify-center rounded-4xl bg-gray-50 mb-5 text-gray-300">
                <span className="material-symbols-outlined text-4xl">person_search</span>
              </div>
              <p className="text-lg font-bold text-gray-800">
                User tidak ditemukan
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Tidak ada pengelola yang cocok dengan pencarian Anda.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddForm || editUser) && (
          <UserForm 
            user={editUser || undefined}
            onClose={() => {
              setShowAddForm(false);
              setEditUser(null);
            }}
            onSuccess={() => {
              // Re-fetch or update list (already handled by server action redirect/revalidate in most cases, but here we can force refresh if needed or just use the local state update if we didn't use revalidatePath)
              // Since we're using initialUsers from server, a simple window.location.reload() or router.refresh() works.
              window.location.reload();
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModal(null)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-4xl p-8 shadow-2xl border border-outline-variant/20"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center text-red-500 mb-6">
                  <span className="material-symbols-outlined text-4xl">person_remove</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Hapus User?</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
                  Apakah Anda yakin ingin menghapus user <span className="text-gray-800 font-bold">@{deleteModal.username}</span>? Pengelola ini tidak akan bisa lagi mengakses dashboard.
                </p>
                <div className="flex gap-3 w-full">
                  <Button
                    onClick={() => setDeleteModal(null)}
                    variant="outline"
                    className="flex-1 rounded-full h-12 text-sm font-bold border-gray-100 text-gray-500 hover:bg-gray-50"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    className="flex-1 rounded-full h-12 text-sm font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
