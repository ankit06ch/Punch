export const getPricingTier = (price: string): string => {
  if (!price) return '';
  
  // Remove non-numeric characters and convert to number
  const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
  
  if (isNaN(numericPrice)) return '';
  
  if (numericPrice <= 15) return '$';
  if (numericPrice <= 30) return '$$';
  if (numericPrice <= 60) return '$$$';
  return '$$$$';
}; 