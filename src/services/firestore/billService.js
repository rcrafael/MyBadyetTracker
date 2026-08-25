import { getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { getUserCollection, getUserDoc, getRetentionExpiryDate } from './firestoreBase';

/**
 * Computes the final installment end date based on start date and total months.
 * e.g. 1st payment on 2026-09-15 for 6 months -> ends on 2027-02-15 (6 payments total: Sept, Oct, Nov, Dec, Jan, Feb)
 */
export function computeInstallmentEndDate(startDateStr, totalMonths) {
  if (!startDateStr || !totalMonths) return '';
  const months = parseInt(totalMonths, 10);
  if (isNaN(months) || months <= 0) return startDateStr;
  
  const [y, m, d] = startDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setMonth(date.getMonth() + (months - 1));
  
  const endYear = date.getFullYear();
  const endMonth = String(date.getMonth() + 1).padStart(2, '0');
  const endDay = String(date.getDate()).padStart(2, '0');
  return `${endYear}-${endMonth}-${endDay}`;
}

/**
 * Generates an array of scheduled payment timeline items for an installment plan.
 */
export function generateInstallmentSchedule(startDateStr, totalMonths, monthlyAmount, paidInstallments = 0) {
  if (!startDateStr || !totalMonths) return [];
  const months = parseInt(totalMonths, 10);
  const amount = parseFloat(monthlyAmount) || 0;
  const paidCount = parseInt(paidInstallments, 10) || 0;
  const schedule = [];

  const [y, m, d] = startDateStr.split('-').map(Number);

  for (let i = 0; i < months; i++) {
    const dObj = new Date(y, m - 1 + i, d);
    const dueDateStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
    const installmentNum = i + 1;
    const isPaid = installmentNum <= paidCount;
    const isCurrent = installmentNum === paidCount + 1;

    schedule.push({
      installmentNumber: installmentNum,
      dueDate: dueDateStr,
      amount: amount,
      isPaid: isPaid,
      isCurrent: isCurrent,
      isUpcoming: installmentNum > paidCount + 1,
    });
  }

  return schedule;
}

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
      } else if (status === 'paid') {
        items = items.filter((b) => b.status === 'paid');
      } else if (status === 'recurring') {
        items = items.filter((b) => b.recurring && !b.isInstallment);
      } else if (status === 'installment' || status === 'installments') {
        items = items.filter((b) => b.isInstallment);
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
 * Add a new bill with support for recurring schedules and installment plans.
 */
export async function addBillToFirestore(data, userId = null) {
  try {
    const colRef = getUserCollection('bills', userId);
    const isInstallment = Boolean(data.isInstallment);
    const totalMonths = isInstallment ? parseInt(data.totalMonths, 10) || 1 : null;
    const currentInstallment = isInstallment ? parseInt(data.currentInstallment, 10) || 1 : null;
    const paidInstallments = isInstallment ? parseInt(data.paidInstallments, 10) || 0 : 0;
    const startDate = data.startDate || data.dueDate || new Date().toISOString().split('T')[0];
    const computedEnd = isInstallment ? computeInstallmentEndDate(startDate, totalMonths) : null;
    const monthlyAmt = parseFloat(data.monthlyAmount || data.amount) || 0;
    const totalAmt = isInstallment ? (parseFloat(data.totalAmount) || (monthlyAmt * totalMonths)) : monthlyAmt;

    const docData = {
      name: data.name,
      amount: monthlyAmt,
      dueDate: data.dueDate || startDate,
      status: data.status || 'upcoming',
      category: data.category || (isInstallment ? 'installment' : 'bills'),
      recurring: isInstallment ? false : Boolean(data.recurring),
      autopay: Boolean(data.autopay),
      note: data.note || '',
      
      // Installment Plan Fields
      isInstallment: isInstallment,
      bankOrMerchant: data.bankOrMerchant || '',
      totalMonths: totalMonths,
      currentInstallment: currentInstallment,
      paidInstallments: paidInstallments,
      startDate: isInstallment ? startDate : null,
      endDate: isInstallment ? (data.endDate || computedEnd) : null,
      monthlyAmount: isInstallment ? monthlyAmt : null,
      totalAmount: isInstallment ? totalAmt : null,
      planId: data.planId || null,

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
 * Pay a bill.
 * - If standard recurring: schedules the next month's bill (+1 month).
 * - If installment: increments paid count and schedules the next month until totalMonths is reached.
 *   Once all installments are paid, no further bills are scheduled and the plan is completed.
 */
export async function payBillInFirestore(bill, userId = null) {
  try {
    const billId = typeof bill === 'object' ? bill.id : bill;
    const isRecurring = typeof bill === 'object' ? Boolean(bill.recurring) : false;
    const isInstallment = typeof bill === 'object' ? Boolean(bill.isInstallment) : false;

    // 1. Mark current as paid
    await updateBillInFirestore(
      billId,
      {
        status: 'paid',
        note: typeof bill === 'object' && bill.isInstallment
          ? `Paid (Month ${bill.currentInstallment || 1} of ${bill.totalMonths || 1})`
          : 'Paid successfully',
        paidAt: new Date().toISOString(),
      },
      userId
    );

    // 2. Handle Installment Plan Progression
    if (isInstallment && typeof bill === 'object') {
      const totalMonths = parseInt(bill.totalMonths, 10) || 1;
      const currentInstallment = parseInt(bill.currentInstallment, 10) || 1;
      const newPaidCount = (parseInt(bill.paidInstallments, 10) || (currentInstallment - 1)) + 1;

      // If more installments remain, automatically schedule next month's installment
      if (newPaidCount < totalMonths) {
        const [y, m, d] = (bill.dueDate || bill.startDate || new Date().toISOString().split('T')[0]).split('-').map(Number);
        const nextDueDateObj = new Date(y, m, d); // +1 month
        const nextDueDateStr = `${nextDueDateObj.getFullYear()}-${String(nextDueDateObj.getMonth() + 1).padStart(2, '0')}-${String(nextDueDateObj.getDate()).padStart(2, '0')}`;

        await addBillToFirestore(
          {
            name: bill.name,
            amount: bill.monthlyAmount || bill.amount,
            monthlyAmount: bill.monthlyAmount || bill.amount,
            totalAmount: bill.totalAmount,
            dueDate: nextDueDateStr,
            startDate: bill.startDate,
            endDate: bill.endDate,
            status: 'upcoming',
            category: bill.category || 'installment',
            isInstallment: true,
            bankOrMerchant: bill.bankOrMerchant || '',
            totalMonths: totalMonths,
            currentInstallment: currentInstallment + 1,
            paidInstallments: newPaidCount,
            recurring: false,
            autopay: bill.autopay || false,
            note: `${bill.bankOrMerchant ? `${bill.bankOrMerchant} • ` : ''}Installment ${currentInstallment + 1} of ${totalMonths}`,
            planId: bill.planId || bill.id,
          },
          userId
        );
      }
      // If newPaidCount >= totalMonths: The plan is complete! No further bills created.
    } 
    // 3. Handle Standard Recurring Bill
    else if (isRecurring && typeof bill === 'object') {
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
