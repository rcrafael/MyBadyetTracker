import { getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getUserCollection, getUserDoc, getRetentionExpiryDate } from './firestoreBase';

/**
 * Fetch all active transactions for the user, with optional search and category filters.
 */
export async function getTransactionsFromFirestore({
  category = 'all',
  search = '',
  includeDeleted = false,
  userId = null,
} = {}) {
  try {
    const colRef = getUserCollection('transactions', userId);
    const snapshot = await getDocs(colRef);

    let items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (!includeDeleted) {
      items = items.filter((item) => !item.isDeleted);
    }

    if (category && category !== 'all') {
      items = items.filter((item) => item.category === category);
    }

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (item) =>
          (item.description || '').toLowerCase().includes(s) ||
          (item.notes || '').toLowerCase().includes(s)
      );
    }

    items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return items;
  } catch (error) {
    console.error('Firestore getTransactions error:', error);
    return [];
  }
}

/**
 * Add a new transaction to the user's Firestore partition.
 */
export async function addTransactionToFirestore(data, userId = null) {
  try {
    const colRef = getUserCollection('transactions', userId);
    const docData = {
      description: data.description || 'Expense',
      amount: parseFloat(data.amount) || 0,
      category: data.category || 'grocery',
      date: data.date || new Date().toISOString().split('T')[0],
      time: data.time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      status: data.status || 'cleared',
      recurring: Boolean(data.recurring),
      notes: data.notes || '',
      isDeleted: false,
      deletedAt: null,
      retentionUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(colRef, docData);
    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error('Error adding transaction to Firestore:', error);
    throw error;
  }
}

/**
 * Update an existing transaction in Firestore.
 */
export async function updateTransactionInFirestore(id, updates, userId = null) {
  try {
    const docRef = getUserDoc('transactions', id, userId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.amount !== undefined) {
      updateData.amount = parseFloat(updates.amount);
    }
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
  } catch (error) {
    console.error('Error updating transaction in Firestore:', error);
    throw error;
  }
}

/**
 * Soft delete a transaction (retained for 6 months).
 */
export async function softDeleteTransactionInFirestore(id, userId = null) {
  try {
    const docRef = getUserDoc('transactions', id, userId);
    const deletedAt = new Date().toISOString();
    const retentionUntil = getRetentionExpiryDate();

    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt,
      retentionUntil,
      updatedAt: deletedAt,
    });

    return { id, isDeleted: true, deletedAt, retentionUntil };
  } catch (error) {
    console.error('Error soft deleting transaction:', error);
    throw error;
  }
}

/**
 * Restore a soft-deleted transaction.
 */
export async function restoreTransactionInFirestore(id, userId = null) {
  try {
    const docRef = getUserDoc('transactions', id, userId);
    await updateDoc(docRef, {
      isDeleted: false,
      deletedAt: null,
      retentionUntil: null,
      updatedAt: new Date().toISOString(),
    });
    return { id, isDeleted: false };
  } catch (error) {
    console.error('Error restoring transaction:', error);
    throw error;
  }
}

/**
 * Hard delete a transaction permanently.
 */
export async function hardDeleteTransactionInFirestore(id, userId = null) {
  try {
    const docRef = getUserDoc('transactions', id, userId);
    await deleteDoc(docRef);
    return { id, deleted: true };
  } catch (error) {
    console.error('Error hard deleting transaction:', error);
    throw error;
  }
}
