import { getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import {
  getUserCollection,
  getUserDoc,
  SIX_MONTHS_MS,
  INITIAL_CATEGORIES,
  INITIAL_BUDGETS,
} from './firestoreBase';

/**
 * Executes 6-month data retention policy by purging all soft-deleted records older than 6 months.
 */
export async function runDataRetentionCleanupInFirestore(userId = null) {
  const collections = ['transactions', 'bills', 'budgets'];
  const now = new Date();
  let purgedCount = 0;
  const purgedItems = [];

  for (const colName of collections) {
    try {
      const colRef = getUserCollection(colName, userId);
      const snapshot = await getDocs(colRef);

      for (const d of snapshot.docs) {
        const item = d.data();
        if (item.isDeleted) {
          let shouldPurge = false;

          if (item.retentionUntil) {
            shouldPurge = new Date(item.retentionUntil) <= now;
          } else if (item.deletedAt) {
            const deletedTime = new Date(item.deletedAt).getTime();
            shouldPurge = now.getTime() - deletedTime >= SIX_MONTHS_MS;
          }

          if (shouldPurge) {
            await deleteDoc(d.ref);
            purgedCount++;
            purgedItems.push({
              collection: colName,
              id: d.id,
              description: item.description || item.name,
            });
          }
        }
      }
    } catch (err) {
      console.error(`Error during retention cleanup on ${colName}:`, err);
    }
  }

  return {
    success: true,
    purgedCount,
    purgedItems,
    timestamp: now.toISOString(),
    message: `Data retention policy executed: ${purgedCount} expired items purged.`,
  };
}

/**
 * Wipes all user transactions & bills, and resets categories & budgets.
 */
export async function clearDatabaseAndStartFresh(userId = null) {
  try {
    // 1. Delete user transactions
    const txSnap = await getDocs(getUserCollection('transactions', userId));
    for (const d of txSnap.docs) {
      await deleteDoc(d.ref);
    }

    // 2. Delete user bills
    const billSnap = await getDocs(getUserCollection('bills', userId));
    for (const d of billSnap.docs) {
      await deleteDoc(d.ref);
    }

    // 3. Reset user categories
    const catSnap = await getDocs(getUserCollection('categories', userId));
    for (const d of catSnap.docs) {
      await deleteDoc(d.ref);
    }
    for (const cat of INITIAL_CATEGORIES) {
      await setDoc(getUserDoc('categories', cat.id, userId), cat);
    }

    // 4. Reset user budgets
    const bgSnap = await getDocs(getUserCollection('budgets', userId));
    for (const d of bgSnap.docs) {
      await deleteDoc(d.ref);
    }
    for (const bg of INITIAL_BUDGETS) {
      await setDoc(getUserDoc('budgets', bg.id, userId), {
        ...bg,
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: 'Your personal finance data has been wiped and reset with clean categories & budgets.',
    };
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}
