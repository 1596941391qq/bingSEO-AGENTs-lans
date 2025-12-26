import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  userId: string;
  email: string;
  name?: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  authenticated: boolean;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authenticated: false,
  loading: true,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const mainAppUrl = import.meta.env.VITE_MAIN_APP_URL || 'https://niche-mining-web.vercel.app';
    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

    try {
      // 1. 检查 URL 中是否有 Transfer Token (支持 tt 或 token 参数)
      const urlParams = new URLSearchParams(window.location.search);
      const transferToken = urlParams.get('tt') || urlParams.get('token');

      if (transferToken) {
        console.log('[AuthContext] Found transfer token, exchanging...');

        // 立即清除 URL 参数（防止被记录）
        window.history.replaceState({}, '', window.location.pathname);

        // 在开发模式下，优先使用本地 API（支持开发模式自动登录）
        // 在生产模式下，使用主应用的 API
        const apiUrl = isDevelopment 
          ? '/api/auth/verify-transfer' 
          : `${mainAppUrl}/api/auth/exchange-transfer-token`;

        console.log('[AuthContext] Using API:', apiUrl, 'isDevelopment:', isDevelopment);
        console.log('[AuthContext] Main app URL:', mainAppUrl);
        console.log('[AuthContext] Transfer token length:', transferToken.length);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transferToken }),
        });

        console.log('[AuthContext] Exchange response status:', response.status);
        console.log('[AuthContext] Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const data = await response.json();
          console.log('[AuthContext] Login successful:', data.user?.email || data.user?.userId);

          // 保存长期 JWT 到 localStorage
          localStorage.setItem('auth_token', data.token);

          // 保存用户信息（转换为统一格式）
          // 兼容两种响应格式：主应用返回 user.id，本地 API 返回 user.userId
          const user = {
            userId: data.user?.id || data.user?.userId,
            email: data.user?.email,
            name: data.user?.name,
            picture: data.user?.picture,
          };
          console.log('[AuthContext] Saving user to localStorage:', user);
          localStorage.setItem('user', JSON.stringify(user));

          setUser(user);
          setLoading(false);
          return;
        } else {
          const errorText = await response.text();
          let error;
          try {
            error = JSON.parse(errorText);
          } catch (e) {
            error = { error: errorText || `HTTP ${response.status}` };
          }
          
          console.error('[AuthContext] Exchange failed:', {
            status: response.status,
            statusText: response.statusText,
            error: error,
            apiUrl: apiUrl,
            mainAppUrl: mainAppUrl
          });

          // 如果是生产环境且主应用 API 失败，尝试使用本地 API 作为后备
          // 这可以处理主应用暂时不可用的情况
          if (!isDevelopment && (error.error === 'Transfer token expired' || response.status >= 500)) {
            console.log('[AuthContext] Main app API failed, trying local API as fallback...');
            try {
              const localResponse = await fetch('/api/auth/verify-transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transferToken }),
              });
              if (localResponse.ok) {
                const localData = await localResponse.json();
                console.log('[AuthContext] Local API fallback successful');
                localStorage.setItem('auth_token', localData.token);
                const user = {
                  userId: localData.user?.id || localData.user?.userId,
                  email: localData.user?.email,
                  name: localData.user?.name,
                  picture: localData.user?.picture,
                };
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                setLoading(false);
                return;
              } else {
                const localError = await localResponse.json().catch(() => ({ error: 'Unknown error' }));
                console.error('[AuthContext] Local API fallback also failed:', localError);
              }
            } catch (fallbackError) {
              console.error('[AuthContext] Local API fallback error:', fallbackError);
            }
          }

          // 显示用户友好的错误信息
          if (error.error === 'Transfer token expired') {
            console.warn('[AuthContext] Transfer token expired - user should re-authenticate from main app');
            // 可以在这里添加用户提示，比如显示一个错误消息
          }
        }
      }

      // 2. 检查本地是否已有 JWT Token
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        // 优先从 localStorage 加载用户信息
        const storedUser = localStorage.getItem('user');
        console.log('[AuthContext] Stored user string from localStorage:', storedUser);
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('[AuthContext] Parsed user data:', userData);
            setUser(userData);
            console.log('[AuthContext] Loaded user from localStorage:', userData.email);
          } catch (error) {
            console.error('[AuthContext] Failed to parse stored user:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('auth_token');
          }
        } else {
          console.log('[AuthContext] No stored user found, clearing auth_token');
          // 如果没有本地用户信息，清除token
          localStorage.removeItem('auth_token');
        }
      }

    } catch (error) {
      console.error('Auth initialization error:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    const mainAppUrl = import.meta.env.VITE_MAIN_APP_URL || 'https://niche-mining-web.vercel.app';
    window.location.href = mainAppUrl;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authenticated: !!user,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
