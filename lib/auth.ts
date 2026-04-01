import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        if (!email || !password) return null;

        try {
          console.log("Attempting login for:", email);
          // Fetch user from real DB
          const users = await sql`
            SELECT id, email, name, role, phone, avatar, password, created_at 
            FROM users 
            WHERE email = ${email}
            LIMIT 1
          `;
          
          console.log("User found in DB:", users.length > 0 ? "Yes" : "No");
          const user = users[0];

          if (user) {
            const isPasswordCorrect = await bcrypt.compare(password, user.password);
            console.log("Password correct:", isPasswordCorrect ? "Yes" : "No");
            
            if (isPasswordCorrect) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
                avatar: user.avatar,
                createdAt: user.created_at
              };
            }
          }
        } catch (error) {
          console.error("Database auth error:", error);
        }

        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.phone = (user as any).phone;
        token.avatar = (user as any).avatar;
        token.createdAt = (user as any).createdAt;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.phone = token.phone as string;
        session.user.avatar = token.avatar as string;
        session.user.createdAt = token.createdAt as string;
      }
      return session;
    },
  },
  pages: { signIn: "/" },
});
