import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "./firebase";
import type { Settings } from "@/types";

const googleProvider = new GoogleAuthProvider();

/** Trigger Google sign-in popup. Returns the signed-in User. */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(getFirebaseAuth(), googleProvider);
  return result.user;
}

/** Sign the current user out. */
export async function signOut(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
}

/**
 * Check whether the given email is in the adminEmails allow-list.
 *
 * Bootstrap rule: if the settings doc doesn't exist, or if adminEmails is
 * empty, the current user is automatically promoted to admin and persisted
 * to Firestore so subsequent checks work normally.
 */
export async function isAdmin(email: string | null): Promise<boolean> {
  if (!email) return false;
  const settingsRef = doc(getFirebaseDb(), "settings", "global");
  const snap = await getDoc(settingsRef);

  if (!snap.exists()) {
    // No settings at all — bootstrap: create settings with this user as admin
    await setDoc(settingsRef, {
      activeYear: new Date().getFullYear(),
      meetingDay: "Sunday",
      meetingDays: {},
      localCongregation: "",
      adminEmails: [email.toLowerCase()],
    } satisfies Settings);
    return true;
  }

  const settings = snap.data() as Settings;

  if (!settings.adminEmails || settings.adminEmails.length === 0) {
    // Settings exist but no admins configured — bootstrap this user
    await setDoc(
      settingsRef,
      { adminEmails: [email.toLowerCase()] },
      { merge: true },
    );
    return true;
  }

  return settings.adminEmails.includes(email.toLowerCase());
}

/** Subscribe to auth state changes (wrapper for convenience). */
export function onAuthChange(cb: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), cb);
}
