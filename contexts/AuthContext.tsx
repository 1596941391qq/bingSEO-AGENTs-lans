import React, { createContext, useContext, useState, useEffect } from "react";

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    // 获取主应用 URL，并验证其有效性
    let mainAppUrl =
      import.meta.env.VITE_MAIN_APP_URL || "https://www.nichedigger.ai";

    // 验证 URL 格式
    if (
      !mainAppUrl ||
      mainAppUrl === "undefined" ||
      mainAppUrl.includes("localhost")
    ) {
      console.warn(
        "[AuthContext] Invalid or localhost URL detected, using default production URL"
      );
      mainAppUrl = "https://www.nichedigger.ai";
    }

    // 确保 URL 以 https:// 或 http:// 开头
    if (
      !mainAppUrl.startsWith("http://") &&
      !mainAppUrl.startsWith("https://")
    ) {
      mainAppUrl = `https://${mainAppUrl}`;
    }

    // 移除末尾的斜杠
    mainAppUrl = mainAppUrl.replace(/\/$/, "");

    console.log("[AuthContext] Main app URL:", mainAppUrl);
    console.log(
      "[AuthContext] VITE_MAIN_APP_URL env:",
      import.meta.env.VITE_MAIN_APP_URL
    );

    try {
      // 1. 检查 URL 中是否有 Transfer Token (支持 tt 或 token 参数)
      const urlParams = new URLSearchParams(window.location.search);
      const transferToken = urlParams.get("tt") || urlParams.get("token");

      if (transferToken) {
        console.log("[AuthContext] Found transfer token, exchanging...");
        console.log(
          "[AuthContext] Target API:",
          `${mainAppUrl}/api/auth/exchange-transfer-token`
        );

        // 立即清除 URL 参数（防止被记录）
        window.history.replaceState({}, "", window.location.pathname);

        // 兑换 Transfer Token 为 JWT Token（调用主应用API）
        const apiUrl = `${mainAppUrl}/api/auth/exchange-transfer-token`;

        let response;
        try {
          response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transferToken }),
          });
        } catch (fetchError: any) {
          console.error("[AuthContext] Fetch error:", fetchError);
          console.error("[AuthContext] Error details:", {
            message: fetchError.message,
            name: fetchError.name,
            apiUrl: apiUrl,
            mainAppUrl: mainAppUrl,
          });

          // 如果是连接错误，尝试使用本地 API 作为后备
          if (
            fetchError.message?.includes("Failed to fetch") ||
            fetchError.message?.includes("ERR_CONNECTION_REFUSED") ||
            fetchError.name === "TypeError"
          ) {
            console.log(
              "[AuthContext] Connection failed, trying local API as fallback..."
            );
            try {
              const localResponse = await fetch("/api/auth/verify-transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transferToken }),
              });

              if (localResponse.ok) {
                const localData = await localResponse.json();
                console.log("[AuthContext] Local API fallback successful");
                localStorage.setItem("auth_token", localData.token);
                const user = {
                  userId: localData.user?.id || localData.user?.userId,
                  email: localData.user?.email,
                  name: localData.user?.name,
                  picture: localData.user?.picture,
                };
                localStorage.setItem("user", JSON.stringify(user));
                setUser(user);
                setLoading(false);
                return;
              }
            } catch (localError) {
              console.error(
                "[AuthContext] Local API fallback also failed:",
                localError
              );
            }
          }

          // 如果所有尝试都失败，继续执行后续逻辑（检查本地 token）
          throw fetchError;
        }

        console.log("[AuthContext] Exchange response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log(
            "[AuthContext] Login successful:",
            data.user?.email || data.user?.userId
          );

          // 保存长期 JWT 到 localStorage
          localStorage.setItem("auth_token", data.token);

          // 保存用户信息（转换为统一格式）
          // 兼容两种响应格式：主应用返回 user.id，本地 API 返回 user.userId
          const user = {
            userId: data.user?.id || data.user?.userId,
            email: data.user?.email,
            name: data.user?.name,
            picture: data.user?.picture,
          };
          console.log("[AuthContext] Saving user to localStorage:", user);
          localStorage.setItem("user", JSON.stringify(user));

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
          console.error("[AuthContext] Exchange failed:", {
            status: response.status,
            statusText: response.statusText,
            error: error,
            apiUrl: apiUrl,
          });

          // 如果是服务器错误，尝试使用本地 API 作为后备
          if (response.status >= 500) {
            console.log(
              "[AuthContext] Server error, trying local API as fallback..."
            );
            try {
              const localResponse = await fetch("/api/auth/verify-transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transferToken }),
              });

              if (localResponse.ok) {
                const localData = await localResponse.json();
                console.log("[AuthContext] Local API fallback successful");
                localStorage.setItem("auth_token", localData.token);
                const user = {
                  userId: localData.user?.id || localData.user?.userId,
                  email: localData.user?.email,
                  name: localData.user?.name,
                  picture: localData.user?.picture,
                };
                localStorage.setItem("user", JSON.stringify(user));
                setUser(user);
                setLoading(false);
                return;
              }
            } catch (localError) {
              console.error(
                "[AuthContext] Local API fallback also failed:",
                localError
              );
            }
          }
        }
      }

      // 2. 检查本地是否已有 JWT Token
      const storedToken = localStorage.getItem("auth_token");
      if (storedToken) {
        // 优先从 localStorage 加载用户信息
        const storedUser = localStorage.getItem("user");
        console.log(
          "[AuthContext] Stored user string from localStorage:",
          storedUser
        );
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log("[AuthContext] Parsed user data:", userData);
            setUser(userData);
            console.log(
              "[AuthContext] Loaded user from localStorage:",
              userData.email
            );
          } catch (error) {
            console.error("[AuthContext] Failed to parse stored user:", error);
            localStorage.removeItem("user");
            localStorage.removeItem("auth_token");
          }
        } else {
          console.log(
            "[AuthContext] No stored user found, clearing auth_token"
          );
          // 如果没有本地用户信息，清除token
          localStorage.removeItem("auth_token");
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    const mainAppUrl =
      import.meta.env.VITE_MAIN_APP_URL || "https://www.nichedigger.ai";
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
