import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { adminUser, currentUser, salesExecutives } from "./mock-data";

export const { handlers, signIn, signOut, auth } = NextAuth({
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

        // --- DUMMY CHECK (matches your existing mock-data) ---
        if (email === adminUser.email && password === adminUser.password)
          return adminUser;
        
        const salesUser = salesExecutives.find((u) => u.email === email);
        if (salesUser && password === salesUser.password) return salesUser;

        // --- REAL DB CHECK (NileDB — uncomment when ready) ---
        // const sql = neon(process.env.NILEDB_URL!)
        // const [user] = await sql`
        //   SELECT id, email, name, role FROM users
        //   WHERE email = ${email}
        //   AND password_hash = crypt(${password}, password_hash)
        // `
        // if (user) return user

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
