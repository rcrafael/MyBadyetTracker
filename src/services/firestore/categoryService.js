import { getDocs, setDoc } from 'firebase/firestore';
import { getUserCollection, getUserDoc, INITIAL_CATEGORIES } from './firestoreBase';

/**
 * Fetch all categories for the active user.
 */
export async function getCategoriesFromFirestore(userId = null) {
  try {
    const colRef = getUserCollection('categories', userId);
    const snapshot = await getDocs(colRef);
    let items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (items.length === 0) {
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(getUserDoc('categories', cat.id, userId), cat);
      }
      return INITIAL_CATEGORIES;
    }
    return items;
  } catch (error) {
    console.error('Firestore getCategories error:', error);
    return INITIAL_CATEGORIES;
  }
}

/**
 * Add a custom category to the user's Firestore workspace.
 */
export async function addCategoryToFirestore(category, userId = null) {
  try {
    const docId = category.id || category.name.toLowerCase().replace(/\s+/g, '-');
    const docRef = getUserDoc('categories', docId, userId);
    const data = {
      name: category.name,
      icon: category.icon || 'category',
      color: category.color || 'bg-surface-container',
      textColor: category.textColor || 'text-on-surface',
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, data);
    return { id: docId, ...data };
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
}
