import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Login attempt for:', credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          const email = (credentials.email as string).toLowerCase();
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log('User not found in DB');
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password,
          );

          if (!passwordMatch) {
            console.log('Password mismatch');
            return null;
          }

          console.log('Login successful for user:', user.email);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isFirstLogin: user.isFirstLogin,
          };
        } catch (error) {
          console.error('Error in authorize:', error);
          return null;
        }
      },
    }),
  ],
});
