export const formatRevenue = (amount: number): string => {
  if (amount >= 1000000) {
    // On divise par 1 million et on garde un seul chiffre après la virgule
    return `${(amount / 1000000).toFixed(1)}M CFA`;
  }

  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k CFA`;
  }

  // Pour les petits montants, on sépare juste les milliers
  return `${amount.toLocaleString('fr-FR')} CFA`;
};
