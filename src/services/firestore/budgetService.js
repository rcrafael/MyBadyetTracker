import { getDocs, setDoc } from 'firebase/firestore';
import { getUserCollection, getUserDoc, INITIAL_BUDGETS } from './firestoreBase';

/**
 * Fetch all category budgets for the active user.
 */
export async function getBudgetsFromFirestore(userId = null) {
  try {
    const colRef = getUserCollection('budgets', userId);
    const snapshot = await getDocs(colRef);
    let items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (items.length === 0) {
      for (const bg of INITIAL_BUDGETS) {
        await setDoc(getUserDoc('budgets', bg.id, userId), {
          ...bg,
          updatedAt: new Date().toISOString(),
        });
      }
      return INITIAL_BUDGETS;
    }
    return items;
  } catch (error) {
    console.error('Firestore getBudgets error:', error);
    return INITIAL_BUDGETS;
  }
}

/**
 * Save or update a category budget limit.
 */
export async function saveBudgetToFirestore(budget, userId = null) {
  try {
    const docId = budget.id || `bg_${budget.category}`;
    const docRef = getUserDoc('budgets', docId, userId);
    const data = {
      category: budget.category,
      limit: parseFloat(budget.limit) || 0,
      period: budget.period || 'monthly',
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, data, { merge: true });
    return { id: docId, ...data };
  } catch (error) {
    console.error('Error saving budget to Firestore:', error);
    throw error;
  }
}
