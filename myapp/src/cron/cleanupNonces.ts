import { prisma } from "../prisma/client";

export async function cleanupOldNonces() {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const result = await prisma.attendanceNonce.deleteMany({
    where: {
      expiresAt: {
        lt: tenMinutesAgo,
      },
    },
  });

  console.log(`[cleanupOldNonces] removed ${result.count} expired nonces`);
}
