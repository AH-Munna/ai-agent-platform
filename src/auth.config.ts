import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/chat") || 
                            nextUrl.pathname.startsWith("/characters") || 
                            nextUrl.pathname.startsWith("/settings") ||
                             nextUrl.pathname.startsWith("/rooms") || // Legacy, will rename
                            nextUrl.pathname === "/"; 
                            
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        // Redirect authenticated users to home if they hit login
        if (nextUrl.pathname === "/login") {
            return Response.redirect(new URL("/", nextUrl));
        }
      }
      return true;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
