/**
 * AI Query Tool: Classroom Info
 *
 * Lists classrooms with capacity, equipment, status.
 */

import prisma from '../../db/prismaClient.js';

export async function execute(req, params = {}) {
  const classrooms = await prisma.classroom.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      nameEn: true,
      nameAr: true,
      capacity: true,
      equipment: true,
      floor: true,
      roomNumber: true,
      locationEn: true,
      locationAr: true,
      availableDays: true,
      status: true,
    },
    orderBy: { code: 'asc' },
  });

  return {
    success: true,
    data: {
      classrooms: classrooms.map((c) => ({
        id: c.id,
        code: c.code,
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        capacity: c.capacity,
        equipment: c.equipment,
        floor: c.floor,
        roomNumber: c.roomNumber,
        location: c.locationEn || c.locationAr || null,
        availableDays: c.availableDays,
        status: c.status,
      })),
      count: classrooms.length,
    },
  };
}

export default { execute };
