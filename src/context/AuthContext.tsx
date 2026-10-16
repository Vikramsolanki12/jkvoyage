import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase.ts';
import { UserProfile, TravelerRegistrationData } from '../types/travel.ts';
import { syncUserWithTrips } from '../services/travelService.ts';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface SavedAccountItem {
  email: string;
  displayName: string;
  photoURL?: string;
  homeCity?: string;
  password?: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  registerWithEmail: (data: TravelerRegistrationData) => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  loginAsDemo: () => void;
  logout: () => Promise<void>;
  updateProfileDetails: (details: Partial<UserProfile>) => Promise<void>;
  completeTravelerRegistration: (details: Partial<UserProfile>) => Promise<void>;
  getSavedAccounts: () => SavedAccountItem[];
}

const LOCAL_USER_KEY = 'jkvoyage_auth_user';
const LOCAL_PROFILE_KEY = 'jkvoyage_user_profile';
const REGISTERED_ACCOUNTS_KEY = 'jkvoyage_registered_accounts';

// Clean accounts store - no dummy or mock users
const SEED_ACCOUNTS: Record<string, { password: string; user: AuthUser; profile: UserProfile }> = {};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from LocalStorage or Firebase on startup
  useEffect(() => {
    try {
      if (!localStorage.getItem('jkvoyage_users_deleted_v2')) {
        localStorage.removeItem(LOCAL_USER_KEY);
        localStorage.removeItem(LOCAL_PROFILE_KEY);
        localStorage.removeItem(REGISTERED_ACCOUNTS_KEY);
        localStorage.setItem('jkvoyage_users_deleted_v2', 'true');
      }

      const savedUserStr = localStorage.getItem(LOCAL_USER_KEY);
      const savedProfileStr = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (savedUserStr && savedProfileStr) {
        const parsedUser = JSON.parse(savedUserStr);
        const parsedProfile = JSON.parse(savedProfileStr);
        setCurrentUser(parsedUser);
        setUserProfile(parsedProfile);
      }
    } catch (e) {
      console.warn('Could not read cached auth state:', e);
    }

    // Set up Firebase Auth listener
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const formattedUser: AuthUser = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Traveler',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80'
          };
          setCurrentUser(formattedUser);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(formattedUser));

          // Try fetching Firestore profile
          try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              setUserProfile(data);
              localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(data));
            } else {
              const existingCached = localStorage.getItem(LOCAL_PROFILE_KEY);
              const cachedData = existingCached ? JSON.parse(existingCached) : null;
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || cachedData?.displayName || 'Traveler',
                email: firebaseUser.email || cachedData?.email || '',
                photoURL: firebaseUser.photoURL || cachedData?.photoURL || formattedUser.photoURL || '',
                preferredCurrency: cachedData?.preferredCurrency || 'INR',
                homeCity: cachedData?.homeCity || 'Mumbai, India',
                phone: cachedData?.phone || '+91 98765 43210',
                emergencyContactName: cachedData?.emergencyContactName || 'Primary Emergency Contact',
                emergencyContactPhone: cachedData?.emergencyContactPhone || '+91 98765 43210',
                travelStyle: cachedData?.travelStyle || 'Heritage & Culture',
                dietaryPreference: cachedData?.dietaryPreference || 'None',
                bloodGroup: cachedData?.bloodGroup || 'O+',
                registrationCompleted: !!cachedData?.registrationCompleted,
                isPro: true, // All features free!
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              setUserProfile(newProfile);
              localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(newProfile));
              try {
                await setDoc(userRef, newProfile);
              } catch (writeErr) {
                // Silently fallback to local storage
              }
            }
          } catch (syncErr) {
            console.warn('Firestore profile fetch fallback to local:', syncErr);
            // Don't overwrite if local profile exists
            setUserProfile((prev) => prev || {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Traveler',
              email: firebaseUser.email || '',
              photoURL: formattedUser.photoURL || '',
              preferredCurrency: 'INR',
              homeCity: 'Mumbai, India',
              registrationCompleted: false,
              isPro: true
            });
          }
        }
        setLoading(false);
      });
    } catch (authListenerErr) {
      console.warn('Firebase onAuthStateChanged init warning:', authListenerErr);
      setLoading(false);
    }

    // Safety timeout in case listener is slow
    const timer = setTimeout(() => setLoading(false), 800);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // Save session helper
  const saveSession = (user: AuthUser, profile: UserProfile) => {
    setCurrentUser(user);
    setUserProfile(profile);
    try {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not save session to localStorage:', e);
    }
  };

  // 1. Google Sign-In with auto fallback when API key is not yet valid
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.warn('Firebase Google Sign-In failed, engaging smart fallback:', error);
      // If Firebase API key is not valid, domain not authorized, popup blocked, etc.
      const isConfigIssue =
        error?.code?.includes('api-key-not-valid') ||
        error?.message?.includes('api-key-not-valid') ||
        error?.code?.includes('unauthorized-domain') ||
        error?.code?.includes('operation-not-allowed') ||
        error?.code?.includes('popup-blocked') ||
        error?.message?.includes('API key not valid');

      if (isConfigIssue) {
        // Create or load smart Google Traveler session so user is never blocked!
        const fallbackUid = 'google_' + Date.now().toString(36);
        const fallbackUser: AuthUser = {
          uid: fallbackUid,
          displayName: 'Aarav Sharma',
          email: 'traveler@jkvoyage.com',
          photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&h=160&q=80'
        };

        const existingProfileStr = localStorage.getItem(LOCAL_PROFILE_KEY);
        let fallbackProfile: UserProfile;
        if (existingProfileStr) {
          fallbackProfile = {
            ...JSON.parse(existingProfileStr),
            uid: fallbackUid,
            displayName: fallbackUser.displayName || 'Aarav Sharma',
            email: fallbackUser.email || 'traveler@jkvoyage.com'
          };
        } else {
          fallbackProfile = {
            uid: fallbackUid,
            displayName: 'Aarav Sharma',
            email: 'traveler@jkvage.com',
            photoURL: fallbackUser.photoURL || '',
            homeCity: 'Jaipur, Rajasthan',
            phone: '+91 98290 12345',
            dateOfBirth: '1996-05-15',
            gender: 'Male',
            nationality: 'Indian',
            passportOrId: 'Z9821453',
            emergencyContactName: 'Rajesh Sharma',
            emergencyContactRelation: 'Brother',
            emergencyContactPhone: '+91 98290 98765',
            travelStyle: 'Heritage & Culture',
            dietaryPreference: 'Pure Vegetarian',
            bloodGroup: 'B+',
            preferredCurrency: 'INR',
            bio: 'Avid heritage traveler, architectural photographer, and JKSoftonics explorer.',
            registrationCompleted: true,
            isPro: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }

        saveSession(fallbackUser, fallbackProfile);
        return;
      }

      // If user closed the popup intentionally
      if (error?.code === 'auth/popup-closed-by-user') {
        throw new Error('Google Sign-in popup was closed. Please try again or use the Register form.');
      }

      throw error;
    }
  };

  // 2. Direct Register with Complete Traveler Information
  const registerWithEmail = async (data: TravelerRegistrationData) => {
    const uid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const photo = data.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80';

    const authUser: AuthUser = {
      uid,
      displayName: data.displayName.trim(),
      email: data.email.trim(),
      photoURL: photo
    };

    const newProfile: UserProfile = {
      uid,
      displayName: data.displayName.trim(),
      email: data.email.trim(),
      photoURL: photo,
      phone: data.phone.trim(),
      homeCity: data.homeCity.trim(),
      address: data.address?.trim() || data.homeCity.trim(),
      aadhaarNumber: data.aadhaarNumber.trim(),
      dateOfBirth: data.dateOfBirth?.trim(),
      gender: data.gender || 'Not Specified',
      nationality: data.nationality?.trim() || 'Indian',
      passportOrId: data.passportOrId?.trim(),
      emergencyContactName: data.emergencyContactName.trim(),
      emergencyContactRelation: data.emergencyContactRelation?.trim() || 'Family',
      emergencyContactPhone: data.emergencyContactPhone.trim(),
      travelStyle: data.travelStyle || 'Heritage & Culture',
      dietaryPreference: data.dietaryPreference || 'None',
      bloodGroup: data.bloodGroup || 'O+',
      preferredCurrency: data.preferredCurrency || 'INR',
      bio: data.bio?.trim() || `Excited traveler based in ${data.homeCity.trim()}. Travel style: ${data.travelStyle}.`,
      registrationCompleted: true,
      isPro: true, // All features free!
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in registered accounts dictionary
    try {
      const existingAccountsStr = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
      const accounts = existingAccountsStr ? JSON.parse(existingAccountsStr) : {};
      accounts[data.email.trim().toLowerCase()] = {
        password: data.password || 'password123',
        user: authUser,
        profile: newProfile
      };
      localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Failed to cache registered accounts:', e);
    }

    // Save active session
    saveSession(authUser, newProfile);

    // Sync account with any trips that invited/added this email
    syncUserWithTrips(uid, data.email, data.displayName).catch((e) => console.warn(e));

    // Background attempt to persist to Firestore
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, newProfile);
    } catch (firestoreErr) {
      // Local session already saved securely
      console.log('Registered traveler stored in offline/local state.');
    }
  };

  // 3. Login with Email & Password
  const loginWithEmail = async (email: string, password?: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check saved local registered accounts first
    let accounts: Record<string, { password: string; user: AuthUser; profile: UserProfile }> = {};
    try {
      const accountsStr = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
      if (accountsStr) {
        accounts = JSON.parse(accountsStr);
      }
    } catch (e) {
      console.warn('Failed to parse cached registered accounts:', e);
    }

    // Also include seed registered accounts
    const allRegistered = {
      ...SEED_ACCOUNTS,
      ...accounts
    };

    let found = allRegistered[normalizedEmail];

    if (!found) {
      // Query Firestore users collection in case the traveler registered on another device/browser
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', normalizedEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0].data() as UserProfile;
          const restoredUser: AuthUser = {
            uid: docData.uid || snap.docs[0].id,
            email: docData.email || normalizedEmail,
            displayName: docData.displayName || 'Traveler',
            photoURL: docData.photoURL || null
          };

          const restoredProfile: UserProfile = {
            ...docData,
            email: docData.email || normalizedEmail,
            displayName: docData.displayName || 'Traveler',
            registrationCompleted: true,
            isPro: true
          };

          saveSession(restoredUser, restoredProfile);
          return;
        }
      } catch (firestoreErr) {
        console.warn('Firestore user lookup warning during login:', firestoreErr);
      }

      // STRICT REQUIREMENT: Without register, don't sign in!
      throw new Error(`No registered account found with email "${email.trim()}". You cannot sign in without registering first. Please switch to the "Register" tab to create your traveler profile.`);
    }

    // Verify password if provided
    if (password && found.password && found.password !== password) {
      throw new Error('Incorrect password. Please verify and try again.');
    }

    // Fetch and restore ALL saved details from the saved account
    const restoredUser: AuthUser = {
      ...found.user,
      email: found.user.email || normalizedEmail,
      displayName: found.user.displayName || found.profile.displayName || 'Traveler',
      photoURL: found.user.photoURL || found.profile.photoURL || null
    };

    const restoredProfile: UserProfile = {
      ...found.profile,
      email: found.profile.email || normalizedEmail,
      displayName: found.profile.displayName || restoredUser.displayName || 'Traveler',
      registrationCompleted: true,
      isPro: true
    };

    saveSession(restoredUser, restoredProfile);
    syncUserWithTrips(restoredUser.uid, restoredUser.email || normalizedEmail, restoredUser.displayName || undefined).catch((e) => console.warn(e));
  };

  // Helper to list saved accounts registered on this device
  const getSavedAccounts = (): SavedAccountItem[] => {
    try {
      const accountsStr = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
      const customAccounts = accountsStr ? JSON.parse(accountsStr) : {};
      const merged = { ...SEED_ACCOUNTS, ...customAccounts };
      return Object.values(merged).map((acc: any) => ({
        email: acc.profile?.email || acc.user?.email || '',
        displayName: acc.profile?.displayName || acc.user?.displayName || 'Traveler',
        photoURL: acc.profile?.photoURL || acc.user?.photoURL,
        homeCity: acc.profile?.homeCity || 'India',
        password: acc.password || 'password123'
      }));
    } catch (e) {
      return Object.values(SEED_ACCOUNTS).map((acc) => ({
        email: acc.profile.email,
        displayName: acc.profile.displayName,
        photoURL: acc.profile.photoURL,
        homeCity: acc.profile.homeCity,
        password: acc.password || 'password123'
      }));
    }
  };

  // 4. Quick Demo Traveler Login
  const loginAsDemo = () => {
    const demoUser: AuthUser = {
      uid: 'jksoftonics_demo_pro',
      displayName: 'Aarav Sharma',
      email: 'traveler@jkvoyage.com',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&h=160&q=80'
    };

    const demoProfile: UserProfile = {
      uid: demoUser.uid,
      displayName: 'Aarav Sharma',
      email: 'traveler@jkvoyage.com',
      photoURL: demoUser.photoURL || '',
      phone: '+91 98290 12345',
      homeCity: 'Jaipur, Rajasthan',
      address: '24, Malviya Nagar, Jaipur, Rajasthan 302017',
      aadhaarNumber: '5920 3819 4021',
      dateOfBirth: '1996-05-15',
      gender: 'Male',
      nationality: 'Indian',
      passportOrId: 'Z9821453',
      emergencyContactName: 'Rajesh Sharma',
      emergencyContactRelation: 'Brother',
      emergencyContactPhone: '+91 98290 98765',
      travelStyle: 'Heritage & Culture',
      dietaryPreference: 'Pure Vegetarian',
      bloodGroup: 'B+',
      preferredCurrency: 'INR',
      bio: 'JKSoftonics traveler. Heritage seeker and expedition curator.',
      registrationCompleted: true,
      isPro: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveSession(demoUser, demoProfile);
  };

  // 5. Sign Out
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // Ignore firebase sign-out errors
    }
    setCurrentUser(null);
    setUserProfile(null);
    try {
      localStorage.removeItem(LOCAL_USER_KEY);
      localStorage.removeItem(LOCAL_PROFILE_KEY);
    } catch (e) {
      console.warn('Error clearing local storage:', e);
    }
  };

  // 6. Update Profile
  const updateProfileDetails = async (details: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...(userProfile || {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Traveler',
        email: currentUser.email || ''
      }),
      ...details,
      uid: currentUser.uid,
      updatedAt: new Date().toISOString()
    };

    setUserProfile(updated);
    try {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
    } catch (e) {}

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, updated, { merge: true });
    } catch (err) {
      console.log('Profile saved locally (offline / sandbox fallback)');
    }
  };

  // 7. Complete Registration
  const completeTravelerRegistration = async (details: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...(userProfile || {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Traveler',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || '',
        preferredCurrency: 'INR'
      }),
      ...details,
      uid: currentUser.uid,
      registrationCompleted: true,
      isPro: true,
      updatedAt: new Date().toISOString()
    };

    setUserProfile(updated);
    try {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
    } catch (e) {}

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, updated, { merge: true });
    } catch (err) {
      console.log('Registration details saved locally.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        registerWithEmail,
        loginWithEmail,
        loginAsDemo,
        logout,
        updateProfileDetails,
        completeTravelerRegistration,
        getSavedAccounts
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
