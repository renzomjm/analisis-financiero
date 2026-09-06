import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Holding, Transaction, WatchlistItem } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore (with databaseId specified if provided in config)
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Authentication Functions
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Persist basic user profile
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Notice: saving user profile to Firestore:', err);
    }

    return user;
  } catch (err: any) {
    // When the user dismisses or closes the popup window, or cancels the request
    if (
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request'
    ) {
      // Intentional user cancellation, do not throw or log console error
      return null;
    }
    throw err;
  }
};

export const logout = async (): Promise<void> => {
  await fbSignOut(auth);
};

export { onAuthStateChanged };
export type { User };

// Firestore Portfolio Sync Functions
export async function loadUserPortfolio(userId: string): Promise<{
  holdings: Holding[];
  transactions: Transaction[];
  watchlist: WatchlistItem[];
  isNewUser: boolean;
}> {
  try {
    const holdingsRef = collection(db, 'users', userId, 'holdings');
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const watchlistRef = collection(db, 'users', userId, 'watchlist');

    const [holdingsSnap, transactionsSnap, watchlistSnap] = await Promise.all([
      getDocs(holdingsRef),
      getDocs(transactionsRef),
      getDocs(watchlistRef)
    ]);

    const holdings: Holding[] = holdingsSnap.docs.map(d => ({
      ...d.data()
    } as Holding));

    const transactions: Transaction[] = transactionsSnap.docs.map(d => ({
      ...d.data()
    } as Transaction));

    const watchlist: WatchlistItem[] = watchlistSnap.docs.map(d => ({
      ...d.data()
    } as WatchlistItem));

    // Sort transactions by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const isNewUser = holdingsSnap.empty && transactionsSnap.empty && watchlistSnap.empty;

    return { holdings, transactions, watchlist, isNewUser };
  } catch (error) {
    console.error('Error loading portfolio from Firestore:', error);
    throw error;
  }
}

export async function saveUserHoldings(userId: string, holdings: Holding[]): Promise<void> {
  try {
    const holdingsRef = collection(db, 'users', userId, 'holdings');
    const existingSnap = await getDocs(holdingsRef);
    
    const batch = writeBatch(db);

    // Delete any existing holding not in current list
    const currentIds = new Set(holdings.map(h => h.id));
    existingSnap.docs.forEach(d => {
      if (!currentIds.has(d.id)) {
        batch.delete(d.ref);
      }
    });

    // Write all current holdings
    holdings.forEach(h => {
      const docRef = doc(db, 'users', userId, 'holdings', h.id);
      batch.set(docRef, {
        ...h,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error saving holdings to Firestore:', error);
    throw error;
  }
}

export async function saveUserTransactions(userId: string, transactions: Transaction[]): Promise<void> {
  try {
    const transRef = collection(db, 'users', userId, 'transactions');
    const existingSnap = await getDocs(transRef);

    const batch = writeBatch(db);

    // Delete removed transactions
    const currentIds = new Set(transactions.map(t => t.id));
    existingSnap.docs.forEach(d => {
      if (!currentIds.has(d.id)) {
        batch.delete(d.ref);
      }
    });

    // Write all current transactions
    transactions.forEach(t => {
      const docRef = doc(db, 'users', userId, 'transactions', t.id);
      batch.set(docRef, {
        ...t,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error saving transactions to Firestore:', error);
    throw error;
  }
}

export async function saveUserWatchlist(userId: string, watchlist: WatchlistItem[]): Promise<void> {
  try {
    const watchRef = collection(db, 'users', userId, 'watchlist');
    const existingSnap = await getDocs(watchRef);

    const batch = writeBatch(db);

    // Delete removed watchlist items
    const currentIds = new Set(watchlist.map(w => w.id));
    existingSnap.docs.forEach(d => {
      if (!currentIds.has(d.id)) {
        batch.delete(d.ref);
      }
    });

    // Write all current watchlist items
    watchlist.forEach(w => {
      const docRef = doc(db, 'users', userId, 'watchlist', w.id);
      batch.set(docRef, {
        ...w,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error saving watchlist to Firestore:', error);
    throw error;
  }
}
