import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      isFirstLogin: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: string;
    isFirstLogin: boolean;
  }
}
