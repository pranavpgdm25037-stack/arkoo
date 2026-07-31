import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lbvltsahxiavgvnzgqon.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxidmx0c2FoeGlhdmd2bnpncW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MDYxMDAsImV4cCI6MjA5NDQ4MjEwMH0.exLWc8K2kmH5aSKFxXJRCfcuh4lyEGjpcmCoPJQqCgw';

const realSupabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom local storage key for mock session
const MOCK_SESSION_KEY = 'arkoo_mock_session';

// Helper to get mock user/session
const getMockSession = () => {
  const stored = localStorage.getItem(MOCK_SESSION_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  return null;
};

let authChangeCallback: any = null;

// Custom mock auth implementation
const mockAuth = {
  async signInWithPassword({ email, password }: any) {
    console.log('[MOCK AUTH] Attempting sign in for:', email);
    if (email === 'arkooprebuildai@gmail.com' && password === 'arkooprebuildai123') {
      const mockSession = {
        access_token: 'mock-jwt-token-12345',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token-12345',
        user: {
          id: 'mock-user-uuid-1111-2222',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'arkooprebuildai@gmail.com',
          email_confirmed_at: new Date().toISOString(),
          phone: '',
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: {},
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockSession));
      if (authChangeCallback) {
        authChangeCallback('SIGNED_IN', mockSession);
      }
      return { data: { user: mockSession.user, session: mockSession }, error: null };
    }
    return { data: { user: null, session: null }, error: new Error('Invalid email or password') };
  },

  async signOut() {
    console.log('[MOCK AUTH] Signing out');
    localStorage.removeItem(MOCK_SESSION_KEY);
    if (authChangeCallback) {
      authChangeCallback('SIGNED_OUT', null);
    }
    return { error: null };
  },

  async getSession() {
    const session = getMockSession();
    return { data: { session }, error: null };
  },

  getUser() {
    const session = getMockSession();
    return { data: { user: session?.user ?? null }, error: null };
  },

  onAuthStateChange(callback: any) {
    authChangeCallback = callback;
    const session = getMockSession();
    callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session);
    return {
      data: {
        subscription: {
          unsubscribe() {
            authChangeCallback = null;
          }
        }
      }
    };
  }
};

// Mock Realtime Channel
const mockChannel = {
  on() { return this; },
  subscribe() { return this; }
};

// Create a proxy/wrapper for Supabase client
export const supabase = new Proxy(realSupabase, {
  get(target, prop, receiver) {
    if (prop === 'auth') {
      return new Proxy(target.auth, {
        get(authTarget, authProp) {
          if (authProp === 'signInWithPassword') {
            return async (...args: any[]) => {
              try {
                const res = await target.auth.signInWithPassword(args[0]);
                if (res.error && (res.error.message?.includes('fetch') || res.error.message?.includes('network'))) {
                  console.warn('[Supabase Client] Real auth failed to fetch, falling back to Mock Auth.');
                  return mockAuth.signInWithPassword(args[0]);
                }
                return res;
              } catch (err: any) {
                if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch') || err.message?.includes('getaddrinfo')) {
                  console.warn('[Supabase Client] Real auth threw fetch error, falling back to Mock Auth.');
                  return mockAuth.signInWithPassword(args[0]);
                }
                return { data: { user: null, session: null }, error: err };
              }
            };
          }
          if (authProp === 'getSession') {
            return async () => {
              const session = getMockSession();
              if (session) {
                return { data: { session }, error: null };
              }
              try {
                return await target.auth.getSession();
              } catch (e) {
                return { data: { session: null }, error: null };
              }
            };
          }
          if (authProp === 'onAuthStateChange') {
            return (callback: any) => {
              authChangeCallback = callback;
              let realSub: any = null;
              try {
                realSub = target.auth.onAuthStateChange((event, session) => {
                  if (session) {
                    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
                  }
                  callback(event, session);
                });
              } catch (e) {
                const session = getMockSession();
                callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session);
              }

              return {
                data: {
                  subscription: {
                    unsubscribe() {
                      if (realSub?.data?.subscription) {
                        realSub.data.subscription.unsubscribe();
                      }
                      authChangeCallback = null;
                    }
                  }
                }
              };
            };
          }
          if (authProp === 'signOut') {
            return async () => {
              localStorage.removeItem(MOCK_SESSION_KEY);
              if (authChangeCallback) {
                authChangeCallback('SIGNED_OUT', null);
              }
              try {
                return await target.auth.signOut();
              } catch (e) {
                return { error: null };
              }
            };
          }
          return Reflect.get(authTarget, authProp, authTarget);
        }
      });
    }
    if (prop === 'channel') {
      return (name: string) => {
        try {
          return target.channel(name);
        } catch (e) {
          console.warn('[Supabase Client] Failed to subscribe to real-time channel, using mock channel.');
          return mockChannel;
        }
      };
    }
    if (prop === 'removeChannel') {
      return (channel: any) => {
        try {
          return target.removeChannel(channel);
        } catch (e) {
          return;
        }
      };
    }
    return Reflect.get(target, prop, receiver);
  }
});
