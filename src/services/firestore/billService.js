import { getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { getUserCollection, getUserDoc, getRetentionExpiryDate } from './firestoreBase';

/**
 * Fetch bills with status filtering and data separation.
 */
export async function getBillsFromFirestore({ status = 'all', includeDeleted = false, userId = null } = {}) {
  try {
    const colRef = getUserCollection('bills', userId);
    const snapshot = await getDocs(colRef);
    let items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (!includeDeleted) {
      items = items.filter((item) => !item.isDeleted);
    }

    if (status && status !== 'all') {
      if (status === 'unpaid') {
        items = items.filter((b) => b.status !== 'paid');
      } else if (status === 'recurring') {
        items = items.filter((b) => b.recurring);
      } else {
        items = items.filter((b) => b.status === status);
      }
    }

    items.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
    return items;
  } catch (error) {
    console.error('Firestore getBills error:', error);
    return [];
  }
}

/**
 * Add a new bill with support for recurring schedules.
 */
export async function addBillToFirestore(data, userId = null) {
  try {
    const colRef = getUserCollection('bills', userId);
    const docData = {
      name: data.name,
      amount: parseFloat(data.amount) || 0,
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      status: data.status || 'upcoming',
      category: data.category || 'bills',
      recurring: Boolean(data.recurring),
      autopay: Boolean(data.autopay),
      note: data.note || '',
      isDeleted: false,
      deletedAt: null,
      retentionUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(colRef, docData);
    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error('Error adding bill to Firestore:', error);
    throw error;
  }
}

/**
 * Update an existing bill in Firestore.
 */
export async function updateBillInFirestore(id, updates, userId = null) {
  try {
    const docRef = getUserDoc('bills', id, userId);
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
    console.error('Error updating bill in Firestore:', error);
    throw error;
  }
}

/**
 * Pay a bill. If recurring, automatically schedule the next month's bill (+1 month).
 */
export async function payBillInFirestore(bill, userId = null) {
  try {
    const billId = typeof bill === 'object' ? bill.id : bill;
    const isRecurring = typeof bill === 'object' ? Boolean(bill.recurring) : false;

    // 1. Mark current as paid
    await updateBillInFirestore(
      billId,
      {
        status: 'paid',
        note: 'Paid successfully',
        paidAt: new Date().toISOString(),
      },
      userId
    );

    // 2. If recurring, schedule next month's bill
    if (isRecurring && typeof bill === 'object') {
      const currentDueDate = new Date(bill.dueDate || Date.now());
      const nextDueDate = new Date(currentDueDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      await addBillToFirestore(
        {
          name: bill.name,
          amount: bill.amount,
          dueDate: nextDueDate.toISOString().split('T')[0],
          status: 'upcoming',
          category: bill.category || 'bills',
          recurring: true,
          autopay: bill.autopay || false,
          note: `Next cycle (${nextDueDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`,
        },
        userId
      );
    }

    return { id: billId, status: 'paid' };
  } catch (error) {
    console.error('Error paying bill:', error);
    throw error;
  }
}

/**
 * Soft delete a bill (retained for 6 months).
 */
export async function softDeleteBillInFirestore(id, userId = null) {
  try {
    const docRef = getUserDoc('bills', id, userId);
    const deletedAt = new Date().toISOString();
    const retentionUntil = getRetentionExpiryDate();

    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt,
      retentionUntil,
      updatedAt: deletedAt,
    });
    return { id, isDeleted: true };
  } catch (error) {
    console.error('Error soft deleting bill:', error);
    throw error;
  }
}
