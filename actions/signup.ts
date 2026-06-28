'use server';

import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function signupUser(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username and password are required.' };
  }

  if (username.length < 3) {
    return { error: 'Username must be at least 3 characters long.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  const normalizedUsername = username.toLowerCase().trim();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUser) {
      return { error: 'Username is already taken.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username: normalizedUsername,
        password: hashedPassword,
        totalPoints: 0,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Signup error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
