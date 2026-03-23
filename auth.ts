import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || "rahasia-super-aman-untuk-dev-12345",
  // @ts-expect-error PrismaAdapter type expects standard @prisma/client
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Email atau Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Kredensial tidak lengkap")
        }
        
        const identifier = credentials.identifier as string
        
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { username: identifier }
            ]
          }
        })

        if (!user || !user.password) {
          throw new Error("Pengguna tidak ditemukan atau kredensial salah")
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValidPassword) {
          throw new Error("Pengguna tidak ditemukan atau kredensial salah")
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === 'ADMIN';
      const isProtectedPath = nextUrl.pathname.startsWith('/admin') && nextUrl.pathname !== '/admin/login';

      if (isProtectedPath) {
        if (isLoggedIn && isAdmin) return true;
        return false; // Redirect to sign in
      }
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session.user && token.role) {
        session.user.role = token.role as string
      }
      return session
    },
  },
})
