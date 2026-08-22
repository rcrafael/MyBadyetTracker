import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// 6 months in milliseconds
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

export async function POST() {
  try {
    const collections = ['transactions', 'bills', 'budgets'];
    const now = new Date();
    let purgedCount = 0;
    const purgedItems = [];

    for (const colName of collections) {
      const snapshot = await db.collection(colName).where('isDeleted', '==', true).get();

      for (const doc of snapshot.docs) {
        const item = doc.data();
        let shouldPurge = false;

        if (item.retentionUntil) {
          shouldPurge = new Date(item.retentionUntil) <= now;
        } else if (item.deletedAt) {
          const deletedTime = new Date(item.deletedAt).getTime();
          shouldPurge = now.getTime() - deletedTime >= SIX_MONTHS_MS;
        }

        if (shouldPurge) {
          await doc.ref.delete();
          purgedCount++;
          purgedItems.push({ collection: colName, id: doc.id });
        }
      }
    }

    return NextResponse.json({
      success: true,
      purgedCount,
      purgedItems,
      executedAt: now.toISOString(),
      message: `Data retention policy executed: ${purgedCount} records older than 6 months were purged.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
