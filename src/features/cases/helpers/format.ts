// src/features/cases/helpers/format.ts

// Cache pour stocker les noms des utilisateurs déjà résolus
const userDisplayNameCache: Record<string, string> = {};

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString() + ' FCFA';
};

export const formatDate = (date: string | null | undefined): string => {
  if (!date) return "Non définie";
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return "Non définie";
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getDisplayName = (user: any, usersList?: any[]): string => {
  if (!user) return "Système";
  
  // Si c'est un objet utilisateur
  if (typeof user === 'object' && user !== null) {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const username = user.username || '';
    
    // Essayer d'abord de combiner prénom et nom
    if (firstName || lastName) {
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName.length > 0) return fullName;
    }
    // Sinon utiliser le username
    if (username) return username;
    return "Utilisateur";
  }
  
  // Si c'est un string (UUID)
  const userId = String(user);
  
  // Vérifier le cache
  if (userDisplayNameCache[userId]) {
    return userDisplayNameCache[userId];
  }
  
  // Si une liste d'utilisateurs est fournie, chercher l'utilisateur
  if (usersList && Array.isArray(usersList)) {
    const foundUser = usersList.find(u => u.id === userId);
    if (foundUser) {
      const firstName = foundUser.first_name || '';
      const lastName = foundUser.last_name || '';
      const username = foundUser.username || '';
      
      let displayName = "Utilisateur";
      if (firstName || lastName) {
        displayName = `${firstName} ${lastName}`.trim();
      } else if (username) {
        displayName = username;
      }
      
      // Mettre en cache
      userDisplayNameCache[userId] = displayName;
      return displayName;
    }
  }
  
  // Si c'est un UUID (36 caractères), on l'affiche tronqué
  if (userId.length === 36) {
    const truncated = `${userId.substring(0, 8)}...`;
    userDisplayNameCache[userId] = truncated;
    return truncated;
  }
  
  return userId;
};

// Fonction pour vider le cache (utile après une mise à jour des utilisateurs)
export const clearUserDisplayNameCache = (): void => {
  Object.keys(userDisplayNameCache).forEach(key => {
    delete userDisplayNameCache[key];
  });
};