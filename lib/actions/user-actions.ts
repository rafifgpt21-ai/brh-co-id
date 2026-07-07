"use server";
// Force refresh user actions schema definition

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import type { Prisma, Role } from "@prisma/client";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function getSession() {
  const { auth } = await import("@/auth");
  return auth();
}

async function isSuperAdmin() {
  const session = await getSession();
  return session?.user?.role === "SUPER_ADMIN";
}

export async function getUsers() {
  if (!(await isSuperAdmin())) {
    throw new Error("Unauthorized");
  }

  const prisma = await getPrisma();
  return await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "SUPER_ADMIN"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
    },
  });
}

export async function createUser(formData: FormData) {
  if (!(await isSuperAdmin())) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as Role;

  if (!username || !password || !role) {
    return { error: "Username, password, and role are required" };
  }

  // Check if username already exists
  const prisma = await getPrisma();
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return { error: "Username already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const data: Prisma.UserCreateInput = {
        name,
        username,
        email: email || undefined,
        phone: phone || undefined,
        password: hashedPassword,
        role,
    };

    await prisma.user.create({ data });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Create User Error:", error);
    return { error: "Failed to create user" };
  }
}

export async function updateUser(id: string, formData: FormData) {
  if (!(await isSuperAdmin())) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as Role;

  const data: Prisma.UserUpdateInput = {
    name,
    username,
    email: email || undefined,
    phone: phone || undefined,
    role,
  };

  if (password && password.trim() !== "") {
    data.password = await bcrypt.hash(password, 10);
  }

  try {
    const prisma = await getPrisma();
    await prisma.user.update({
      where: { id },
      data,
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Update User Error:", error);
    return { error: "Failed to update user" };
  }
}

export async function deleteUser(id: string) {
  if (!(await isSuperAdmin())) {
    throw new Error("Unauthorized");
  }

  // Prevent deleting self
  const session = await getSession();
  if (session?.user?.id === id) {
    return { error: "Cannot delete yourself" };
  }

  try {
    const prisma = await getPrisma();
    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Delete User Error:", error);
    return { error: "Failed to delete user" };
  }
}

export async function getContactsForDropdown(): Promise<{ id: string, name: string | null, phone: string | null }[]> {
  const session = await getSession();
  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  const prisma = await getPrisma();
  const result = await prisma.user.findMany({
    where: {
      phone: { not: null },
      role: { in: ["ADMIN", "SUPER_ADMIN"] },
    },
    select: {
      id: true,
      name: true,
      phone: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return result.filter((user) => user.phone?.trim());
}
