// /contexts/AuthContext.tsx
"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  // TODO: Add other auth methods like signInWithOAuth if needed
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        setError(sessionError);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (profileError) {
        // It's possible a profile doesn't exist yet if the trigger is slow or failed
        // Or if it's an old user before the profile trigger was set up.
        console.warn("Error fetching profile or profile not found:", profileError.message);
        setProfile(null); // Explicitly set to null if not found or error
      } else {
        setProfile(data as Profile);
      }
    } catch (e) {
      console.error("Exception fetching profile:", e);
      setProfile(null);
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      // Session and user state will be updated by onAuthStateChange listener
    } catch (e: any) {
      console.error("Error signing in:", e);
      setError(e);
      // Ensure user/profile are cleared if sign-in fails badly
      setUser(null);
      setProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithPassword = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            // This data is passed to the new user in auth.users table
            // The handle_new_user trigger will then create the profile.
            // If you want to pass full_name to the trigger, you might need to adjust the trigger
            // or update the profile separately after sign up.
            // For now, we rely on the trigger to create a basic profile.
          }
        }
      });
      if (signUpError) throw signUpError;
      if (newUser && fullName) {
        // Update the profile with full_name if provided
        // This is an additional step because signUp options.data doesn't directly populate profiles table fields other than id.
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ full_name: fullName })
          .eq("id", newUser.id);
        if (updateError) {
          console.warn("Error updating profile with full_name after signup:", updateError);
        }
      }
      // Session and user state will be updated by onAuthStateChange listener
    } catch (e: any) {
      console.error("Error signing up:", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      // User, profile, session will be cleared by onAuthStateChange listener
    } catch (e: any) {
      console.error("Error signing out:", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    error,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

