/**
 * Touch-Friendly UI Constants for Mobile-First Admin Panel
 * Based on Apple HIG (44x44px minimum) and Google Material Design (48x48px)
 */

export const TOUCH_SIZES = {
  // Minimum touch target
  TOUCH_MIN_HEIGHT: '44px',
  TOUCH_MIN_WIDTH: '44px',

  // Padding constants
  PADDING: {
    MOBILE: 'p-3', // 12px (44px height with 10px border radius)
    TABLET: 'p-3', // 12px
    DESKTOP: 'p-2', // 8px
  },

  // Button sizing
  BUTTON: {
    MOBILE: 'px-4 py-2', // 40px+ height
    TABLET: 'px-4 py-2',
    DESKTOP: 'px-3 py-1', // 32px height
  },

  // Input sizing
  INPUT: {
    MOBILE: 'px-4 py-3', // 44px height
    TABLET: 'px-4 py-3',
    DESKTOP: 'px-4 py-2', // ~40px height
  },

  // Gap/Spacing between elements
  GAP: {
    MOBILE: 'gap-3', // 12px
    COMPACT: 'gap-2', // 8px
    DESKTOP: 'gap-2', // 8px
  },

  // Spacing between sections
  SECTION: {
    MOBILE: 'mb-6 pb-6',
    SEPARATOR: 'border-b-4 border-blue-200',
  },
};

/**
 * Responsive Tailwind class builders
 */
export const RESPONSIVE_CLASSES = {
  // Button wrapper that stacks on mobile
  buttonGroup: 'flex flex-col md:flex-row gap-3 md:gap-2',

  // Input field with consistent sizing
  inputField: 'w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500',

  // Select field with consistent sizing
  selectField: 'w-full px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500',

  // Form label (always block on mobile)
  formLabel: 'block text-sm font-medium mb-1',

  // Grid that's 1 col on mobile, 2 on tablet, 3+ on desktop
  responsiveGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',

  // Grid that's 1 col on mobile, 2 on desktop
  twoColumnGrid: 'grid grid-cols-1 md:grid-cols-2 gap-4',

  // Grid for cards (1 col mobile, 2 tablet, 3 desktop)
  cardGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-4',

  // Section container
  section: 'rounded-lg bg-gray-50 p-4 mb-4 md:mb-6',

  // Primary button
  buttonPrimary: 'w-full md:w-auto px-6 py-3 md:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium',

  // Danger button
  buttonDanger: 'px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium',

  // Secondary button
  buttonSecondary: 'px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition font-medium',

  // Form container with max width
  formContainer: 'w-full mx-auto',

  // Card/Panel container
  card: 'rounded border bg-white p-4 mb-4',

  // Text for instructions (smaller on mobile)
  instructionText: 'text-xs md:text-sm text-gray-600',

  // Mobile-only wrapper
  mobileOnly: 'md:hidden',

  // Desktop-only wrapper
  desktopOnly: 'hidden md:block',
};

/**
 * Helper function to build button classes dynamically
 */
export function buttonClasses(
  variant: 'primary' | 'danger' | 'secondary' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md'
): string {
  const baseClasses = 'rounded font-medium transition';
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 md:py-1 text-sm md:text-base',
    lg: 'px-6 py-3 md:py-2 text-base',
  };
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  };

  return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`;
}

/**
 * Helper function to build input classes dynamically
 */
export function inputClasses(fullWidth: boolean = true): string {
  const width = fullWidth ? 'w-full' : '';
  return `${width} px-4 py-3 md:py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500`;
}
