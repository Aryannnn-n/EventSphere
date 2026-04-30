import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileContent = await file.text();
    
    // Parse CSV
    const { data, errors } = Papa.parse<any>(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      console.error('CSV Parsing errors:', errors);
      return NextResponse.json({ error: 'Failed to parse CSV', details: errors }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Process records
    const defaultPasswordHash = await bcrypt.hash('College@123', 12);
    
    let successCount = 0;
    let failCount = 0;
    const failures = [];

    // We process sequentially or in chunks. Sequential is fine for small/medium files.
    for (const [index, row] of data.entries()) {
      try {
        const email = row.email?.trim().toLowerCase();
        const name = row.name?.trim();
        const roleString = row.role?.trim().toUpperCase();
        const department = row.department?.trim() || null;
        const designation = row.designation?.trim() || null;

        if (!email || !name || !roleString) {
          failures.push({ row: index + 2, reason: 'Missing required fields (email, name, role)' });
          failCount++;
          continue;
        }

        if (!Object.values(Role).includes(roleString as Role)) {
          failures.push({ row: index + 2, reason: `Invalid role: ${roleString}` });
          failCount++;
          continue;
        }

        // Use upsert to create or update existing (or just create and ignore if exists)
        // Let's use findUnique and create to keep track of duplicates
        const existing = await prisma.user.findUnique({
          where: { email },
        });

        if (existing) {
          failures.push({ row: index + 2, reason: `User with email ${email} already exists` });
          failCount++;
          continue;
        }

        await prisma.user.create({
          data: {
            email,
            name,
            role: roleString as Role,
            department,
            designation,
            password: defaultPasswordHash,
            isFirstLogin: true,
          },
        });

        successCount++;
      } catch (err: any) {
        failures.push({ row: index + 2, reason: err.message });
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed. Successfully imported ${successCount} users. Failed: ${failCount}`,
      details: {
        successCount,
        failCount,
        failures,
      },
    });
  } catch (error) {
    console.error('Error importing users:', error);
    return NextResponse.json({ error: 'Internal server error during import' }, { status: 500 });
  }
}
