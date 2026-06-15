import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    refreshToken,
    fetchMe,
    updateUser,
    clearError,
  } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    refreshToken,
    fetchMe,
    updateUser,
    clearError,
    isAdmin: user?.role === 'admin',
    displayName: user?.name || user?.email || 'User',
    initials: user?.name
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U',
  };
}
