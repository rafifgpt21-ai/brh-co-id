import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("Missing AUTH_SECRET environment variable.");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
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
        const { prisma } = await import("@/lib/prisma");
        const { checkRateLimit } = await import("@/lib/rate-limit");
        
        // Rate Limiting Check
        const limit = await checkRateLimit(identifier);
        if (!limit.success) {
          const waitMinutes = limit.resetTime 
            ? Math.ceil((limit.resetTime.getTime() - new Date().getTime()) / 60000)
            : 15;
          throw new Error(`Terlalu banyak percobaan login. Silakan coba lagi dalam ${waitMinutes} menit.`);
        }

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
      const role = auth?.user?.role;
      const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
      const isSuperAdmin = role === 'SUPER_ADMIN';
      
      const isProtectedPath = nextUrl.pathname.startsWith('/admin') && nextUrl.pathname !== '/admin/login';
      const isSettingsPath = nextUrl.pathname.startsWith('/admin/settings');

      if (isSettingsPath) {
        if (isLoggedIn && isSuperAdmin) return true;
        return Response.redirect(new URL('/admin', nextUrl));
      }

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
