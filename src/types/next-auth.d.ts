import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    username?: string | null;
    isAdmin?: boolean;
    profileImage?: string | null;
    image?: string | null;
  }

  interface Session {
    user: {
      id: string;
      username?: string | null;
      isAdmin?: boolean;
      profileImage?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string | null;
    isAdmin?: boolean;
    profileImage?: string | null;
  }
}
