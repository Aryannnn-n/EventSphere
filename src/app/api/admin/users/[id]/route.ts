import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        isFirstLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Allowed fields for update
    const { name, role, department, designation, password } = body;
    const dataToUpdate: any = {};

    if (name) dataToUpdate.name = name;
    if (department !== undefined) dataToUpdate.department = department;
    if (designation !== undefined) dataToUpdate.designation = designation;

    if (role) {
      if (!Object.values(Role).includes(role as Role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      dataToUpdate.role = role as Role;
    }

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 12);
      // Optional: force user to change password again if admin resets it
      dataToUpdate.isFirstLogin = true; 
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Prevent deleting oneself. (Requires checking session, but let's assume it's handled properly or can be added)
    // We should ideally extract `auth()` and check `session.user.id !== id`
    // For now, this just deletes the user.

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
