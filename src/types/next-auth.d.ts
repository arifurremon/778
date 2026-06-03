import { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    username?: string | null;
    role?: Role;
    profileImage?: string | null;
    image?: string | null;
  }

  interface Session {
    user: {
      id: string;
      username?: string | null;
      role?: Role;
      profileImage?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string | null;
    role?: Role;
    profileImage?: string | null;
  }
}
