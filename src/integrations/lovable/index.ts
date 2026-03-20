// Lovable integration removed — using Supabase directly
// This file kept as empty stub to prevent import errors
export const lovable = {
  auth: {
    signInWithOAuth: async () => ({ error: new Error('Use supabase.auth.signInWithOAuth instead') }),
  },
};
