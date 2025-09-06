/**
 * Unified Design Tokens for Estate Hive CRM
 * Following the 8pt spacing system and consistent design patterns
 */

export const designTokens = {
  // Spacing Scale (8pt system)
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '40px',
    '4xl': '48px',
    '5xl': '56px',
    '6xl': '64px',
  },

  // Border Radius
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },

  // Font Sizes
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
    '4xl': '32px',
  },

  // Font Weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Letter Spacing
  letterSpacing: {
    tight: '-0.01em',
    normal: '0',
    wide: '0.01em',
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Shadows
  shadow: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.15)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    // For dark mode
    'dark-sm': '0 1px 3px rgba(0, 0, 0, 0.3)',
    'dark-md': '0 4px 6px rgba(0, 0, 0, 0.3)',
    'dark-lg': '0 10px 15px rgba(0, 0, 0, 0.3)',
  },

  // Transitions
  transition: {
    fast: '120ms ease-out',
    normal: '180ms ease-out',
    slow: '240ms ease-out',
    // Specific transitions
    hover: '120ms ease-out',
    modal: '200ms ease-out',
    drawer: '240ms ease-out',
  },

  // Z-Index Scale
  zIndex: {
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    toast: 60,
    tooltip: 70,
  },

  // Breakpoints
  breakpoint: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Component-specific sizes
  component: {
    // Button sizes
    button: {
      height: {
        sm: '32px',
        md: '40px',
        lg: '48px',
      },
      padding: {
        sm: '0 12px',
        md: '0 16px',
        lg: '0 24px',
      },
    },
    // Avatar sizes
    avatar: {
      sm: '32px',
      md: '40px',
      lg: '48px',
      xl: '56px',
    },
    // Icon sizes
    icon: {
      xs: '16px',
      sm: '18px',
      md: '20px',
      lg: '24px',
      xl: '28px',
    },
    // Hit targets (for accessibility)
    hitTarget: {
      min: '44px', // WCAG minimum
      preferred: '48px',
    },
    // Table row heights
    tableRow: {
      compact: '48px',
      normal: '56px',
      relaxed: '64px',
    },
  },

  // Currency formatting
  currency: {
    locale: 'en-IN',
    options: {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    // Indian number system abbreviations
    abbreviations: {
      thousand: 'K',
      lakh: 'L',
      crore: 'Cr',
    },
  },

  // Animation durations
  duration: {
    instant: '50ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    loader: '1000ms',
  },
} as const;

// Helper function for Indian currency formatting
export const formatIndianCurrency = (value: number, compact = false): string => {
  if (compact) {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)} K`;
    }
  }
  
  // Full Indian grouping (e.g., ₹59,04,00,000)
  return new Intl.NumberFormat('en-IN', designTokens.currency.options).format(value);
};

// Helper function to get consistent spacing
export const getSpacing = (multiplier: number): string => {
  return `${multiplier * 8}px`;
};

// Type exports
export type Spacing = keyof typeof designTokens.spacing;
export type Radius = keyof typeof designTokens.radius;
export type FontSize = keyof typeof designTokens.fontSize;
export type Shadow = keyof typeof designTokens.shadow;
export type Transition = keyof typeof designTokens.transition;