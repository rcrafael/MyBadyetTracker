import { getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { getUserCollection, getUserDoc, INITIAL_CATEGORIES } from './firestoreBase';

export const DEFAULT_CATEGORY_IDS = [
  'grocery',
  'transport',
  'dining',
  'shopping',
  'entertainment',
  'bills',
  'health',
  'education',
];

/**
 * Checks if a category ID belongs to the system default categories.
 */
export function isDefaultCategoryId(id) {
  if (!id) return false;
  return DEFAULT_CATEGORY_IDS.includes(String(id).toLowerCase());
}

/**
 * Fetch all categories for the active user.
 */
export async function getCategoriesFromFirestore(userId = null) {
  try {
    const colRef = getUserCollection('categories', userId);
    const snapshot = await getDocs(colRef);
    let items = snapshot.docs.map((d) => {
      const data = d.data();
      const catId = d.id;
      const isDefault = isDefaultCategoryId(catId) || data.isDefault === true;
      return {
        id: catId,
        ...data,
        isUserDefined: !isDefault,
      };
    });

    if (items.length === 0) {
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(getUserDoc('categories', cat.id, userId), {
          ...cat,
          isDefault: true,
        });
      }
      return INITIAL_CATEGORIES.map((c) => ({ ...c, isUserDefined: false }));
    }
    return items;
  } catch (error) {
    console.error('Firestore getCategories error:', error);
    return INITIAL_CATEGORIES.map((c) => ({ ...c, isUserDefined: false }));
  }
}

/**
 * Checks if a category is currently assigned to any active transactions.
 */
export async function checkCategoryUsageInFirestore(categoryId, userId = null) {
  try {
    const txColRef = getUserCollection('transactions', userId);
    const snapshot = await getDocs(txColRef);
    const matchingTxs = snapshot.docs.filter((d) => {
      const tx = d.data();
      return !tx.isDeleted && String(tx.category).toLowerCase() === String(categoryId).toLowerCase();
    });

    return {
      isUsed: matchingTxs.length > 0,
      count: matchingTxs.length,
    };
  } catch (error) {
    console.error('Error checking category usage:', error);
    return { isUsed: true, count: 1 }; // fail safe
  }
}

/**
 * Add a custom user-defined category to the user's Firestore workspace.
 */
export async function addCategoryToFirestore(category, userId = null) {
  try {
    const rawId = category.id || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const docId = `custom_${rawId}_${Date.now()}`;
    const docRef = getUserDoc('categories', docId, userId);
    const data = {
      name: category.name.trim(),
      icon: category.icon || 'category',
      color: category.color || 'bg-secondary-container',
      textColor: category.textColor || 'text-on-secondary-container',
      isUserDefined: true,
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, data);

    // Automatically initialize budget document for this category with initial limit 0
    try {
      const budgetDocId = `bg_${docId}`;
      const budgetDocRef = getUserDoc('budgets', budgetDocId, userId);
      await setDoc(
        budgetDocRef,
        {
          category: docId,
          limit: 0,
          period: 'monthly',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (bErr) {
      console.warn('Could not initialize budget for new category:', bErr);
    }

    return { id: docId, ...data };
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
}

/**
 * Updates a user-defined category name/icon if it is unused and not default.
 */
export async function updateCategoryInFirestore(categoryId, updates, userId = null) {
  try {
    if (isDefaultCategoryId(categoryId)) {
      throw new Error('Default system categories cannot be renamed.');
    }

    const usage = await checkCategoryUsageInFirestore(categoryId, userId);
    if (usage.isUsed) {
      throw new Error(
        `Category cannot be renamed because it is currently used in ${usage.count} active transaction(s).`
      );
    }

    const docRef = getUserDoc('categories', categoryId, userId);
    const data = {
      name: updates.name.trim(),
      icon: updates.icon || 'category',
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, data, { merge: true });

    return { id: categoryId, ...data };
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

/**
 * Deletes a user-defined category and its associated budget document if unused and not default.
 */
export async function deleteCategoryFromFirestore(categoryId, userId = null) {
  try {
    if (isDefaultCategoryId(categoryId)) {
      throw new Error('Default system categories cannot be deleted.');
    }

    const usage = await checkCategoryUsageInFirestore(categoryId, userId);
    if (usage.isUsed) {
      throw new Error(
        `Category cannot be deleted because it is currently used in ${usage.count} active transaction(s).`
      );
    }

    // 1. Delete category document
    const catDocRef = getUserDoc('categories', categoryId, userId);
    await deleteDoc(catDocRef);

    // 2. Delete corresponding budget document if exists
    try {
      const budgetDocRef = getUserDoc('budgets', `bg_${categoryId}`, userId);
      await deleteDoc(budgetDocRef);
    } catch (bErr) {
      console.warn('Error cleaning up category budget:', bErr);
    }

    return { success: true, id: categoryId };
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}
