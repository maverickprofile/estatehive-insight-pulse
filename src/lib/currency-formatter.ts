/**
 * Currency formatting utilities for Indian numbering system
 */

export interface FormatCurrencyOptions {
  compact?: boolean;
  showDecimal?: boolean;
  showCurrency?: boolean;
}

/**
 * Format number to Indian currency format
 * @param value - The numeric value to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatIndianCurrency(
  value: number | string | null | undefined,
  options: FormatCurrencyOptions = {}
): string {
  const {
    compact = false,
    showDecimal = true,
    showCurrency = true,
  } = options;

  // Handle null/undefined/empty values
  if (value === null || value === undefined || value === '') {
    return showCurrency ? '₹0' : '0';
  }

  // Convert to number
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle invalid numbers
  if (isNaN(numValue)) {
    return showCurrency ? '₹0' : '0';
  }

  // For compact format (e.g., ₹59.04 Cr, ₹452 L)
  if (compact) {
    let formattedValue: string;
    let suffix: string;

    if (numValue >= 10000000) {
      // Crores
      const croreValue = numValue / 10000000;
      // Avoid showing .0 for whole numbers
      if (showDecimal && croreValue % 1 !== 0) {
        formattedValue = croreValue.toFixed(2).replace(/\.?0+$/, '');
      } else {
        formattedValue = Math.floor(croreValue).toString();
      }
      suffix = ' Cr';
    } else if (numValue >= 100000) {
      // Lakhs
      const lakhValue = numValue / 100000;
      // Avoid showing .0 for whole numbers
      if (showDecimal && lakhValue % 1 !== 0) {
        formattedValue = lakhValue.toFixed(1).replace(/\.?0+$/, '');
      } else {
        formattedValue = Math.floor(lakhValue).toString();
      }
      suffix = ' L';
    } else if (numValue >= 1000) {
      // Thousands
      const thousandValue = numValue / 1000;
      if (showDecimal && thousandValue % 1 !== 0) {
        formattedValue = thousandValue.toFixed(1).replace(/\.?0+$/, '');
      } else {
        formattedValue = Math.floor(thousandValue).toString();
      }
      suffix = ' K';
    } else {
      // Less than 1000
      formattedValue = showDecimal && numValue % 1 !== 0 
        ? numValue.toFixed(2).replace(/\.?0+$/, '') 
        : Math.floor(numValue).toString();
      suffix = '';
    }

    return showCurrency ? `₹${formattedValue}${suffix}` : `${formattedValue}${suffix}`;
  }

  // For full format with Indian grouping (e.g., ₹59,04,00,000)
  const formatter = new Intl.NumberFormat('en-IN', {
    style: showCurrency ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: showDecimal ? 2 : 0,
  });

  return formatter.format(numValue);
}

/**
 * Format percentage with consistent styling
 */
export function formatPercentage(
  value: number | string | null | undefined,
  showSign: boolean = true
): string {
  if (value === null || value === undefined || value === '') {
    return '0%';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0%';
  }

  const formatted = numValue % 1 !== 0 
    ? numValue.toFixed(1).replace(/\.?0+$/, '') 
    : Math.floor(numValue).toString();

  if (showSign && numValue > 0) {
    return `+${formatted}%`;
  }

  return `${formatted}%`;
}

/**
 * Get trend indicator for values
 */
export function getTrendIndicator(
  current: number,
  previous: number
): {
  trend: 'up' | 'down' | 'neutral';
  percentage: number;
  formatted: string;
} {
  if (!previous || previous === 0) {
    return {
      trend: 'neutral',
      percentage: 0,
      formatted: '0%',
    };
  }

  const percentageChange = ((current - previous) / previous) * 100;
  
  return {
    trend: percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'neutral',
    percentage: percentageChange,
    formatted: formatPercentage(percentageChange, true),
  };
}

/**
 * Format large numbers with abbreviations
 */
export function formatLargeNumber(value: number): string {
  if (value >= 10000000) {
    return `${(value / 10000000).toFixed(1)} Cr`;
  } else if (value >= 100000) {
    return `${(value / 100000).toFixed(1)} L`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} K`;
  }
  return value.toString();
}