import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, User } from '../firebase';

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

/**
 * Hook oficial para escuchar y persistir el estado de sesión de Firebase Authentication.
 * Mantiene la sesión del usuario intacta al recargar la página gracias a la persistencia
 * nativa de Firebase (IndexedDB/LocalPersistence) sin almacenar contraseñas en ningún lugar.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [loading, setLoading] = useState<boolean>(!auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      },
      (error) => {
        console.error('Error en listener de autenticación:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      // Limpiar datos en caché no sensibles
      try {
        localStorage.removeItem('alix_customer_session');
      } catch {}
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    logout,
  };
}
