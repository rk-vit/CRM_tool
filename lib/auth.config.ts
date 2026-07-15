import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.phone = (user as { phone?: string }).phone;
        token.avatar = (user as { avatar?: string }).avatar;
        token.createdAt = (user as { createdAt?: string }).createdAt;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "sales";
        session.user.phone = token.phone as string;
        session.user.avatar = token.avatar as string;
        session.user.createdAt = token.createdAt as string;
      }
      return session;
    },
  },
  pages: { signIn: "/" },
} satisfies NextAuthConfig;
