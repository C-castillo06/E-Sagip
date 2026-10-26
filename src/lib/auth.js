import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const OPERATOR_COLLECTION = 'operators';

function cleanRole(role) {
  const value = String(role || '').trim().toLowerCase();
  return ['fire', 'medical', 'rescue'].includes(value) ? value : '';
}

function profileToSession(uid, data, email) {
  return {
    uid,
    email: email || data.email || '',
    name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Operator',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    role: data.role || 'operator',
    department: data.department || '',
    station: data.station || null,
    approvalStatus: String(data.approvalStatus || 'PENDING').toUpperCase()
  };
}

export async function registerUser({ firstName, lastName, email, password, role, station }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const department = cleanRole(role);
  if (!department) return { error: 'Please choose a valid dispatch department.' };
  if (!firstName?.trim() || !lastName?.trim()) return { error: 'Enter your first and last name.' };
  if (String(password || '').length < 6) return { error: 'Password must be at least 6 characters.' };

  let credential;
  try {
    credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const name = `${firstName.trim()} ${lastName.trim()}`;
    await updateProfile(credential.user, { displayName: name });

    const operatorProfile = {
      uid: credential.user.uid,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name,
      email: normalizedEmail,
      role: 'operator',
      department,
      station: station ? {
        name: String(station.name || `${department} Station`),
        address: String(station.address || ''),
        lat: Number(station.lat),
        lng: Number(station.lng),
        radius: Number(station.radius)
      } : null,
      approvalStatus: 'PENDING',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, OPERATOR_COLLECTION, credential.user.uid), operatorProfile);
    await signOut(auth);
    return { pending: true };
  } catch (error) {
    // If profile creation fails, do not leave a half-created signed-in account.
    if (credential?.user) {
      try { await deleteUser(credential.user); } catch {}
      try { await signOut(auth); } catch {}
    }
    const code = error?.code || '';
    const messages = {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'Enter a valid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/network-request-failed': 'Network error. Check your connection and try again.'
    };
    return { error: messages[code] || error?.message || 'Unable to create the operator account.' };
  }
}

export async function loginUser({ email, password, role }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const department = cleanRole(role);
  try {
    const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const snapshot = await getDoc(doc(db, OPERATOR_COLLECTION, credential.user.uid));

    if (!snapshot.exists()) {
      await signOut(auth);
      return { error: 'This account is not registered as an E-Sagip operator.' };
    }

    const session = profileToSession(credential.user.uid, snapshot.data(), credential.user.email);
    if (session.approvalStatus !== 'APPROVED' && session.approvalStatus !== 'ACTIVE') {
      await signOut(auth);
      return { error: 'Your operator account is awaiting approval. Please contact the system administrator.' };
    }
    if (session.role !== 'operator' || !session.department) {
      await signOut(auth);
      return { error: 'This account is not authorized for the operator console.' };
    }
    if (session.department && department !== session.department) {
      await signOut(auth);
      return { error: 'The selected department does not match this operator account.' };
    }
    return { session: { ...session, role: session.department || department } };
  } catch (error) {
    const code = error?.code || '';
    const messages = {
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/user-not-found': 'No account was found for this email.',
      'auth/wrong-password': 'Invalid email or password.',
      'auth/invalid-email': 'Enter a valid email address.',
      'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
      'auth/network-request-failed': 'Network error. Check your connection and try again.'
    };
    return { error: messages[code] || error?.message || 'Unable to sign in.' };
  }
}

export async function getOperatorProfile(uid) {
  if (!uid) return null;
  const snapshot = await getDoc(doc(db, OPERATOR_COLLECTION, uid));
  if (!snapshot.exists()) return null;
  return profileToSession(uid, snapshot.data(), auth.currentUser?.email);
}

export async function getSession() {
  const user = auth.currentUser;
  if (!user) return null;
  const profile = await getOperatorProfile(user.uid);
  if (!profile || !['APPROVED', 'ACTIVE'].includes(profile.approvalStatus)) return null;
  return { ...profile, role: profile.department || profile.role };
}

export async function clearSession() {
  try { await signOut(auth); } catch (error) { console.error('Unable to sign out:', error); }
}
