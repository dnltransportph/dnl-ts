import { createTheme } from '@mantine/core'

/** Coral-red CRM palette — primary accent #ff5252, light pink secondary, dark headings */
const brand: readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
] = [
  '#fff5f5',
  '#ffe8e8',
  '#ffd4d4',
  '#ffb8b8',
  '#ff9a9a',
  '#ff7070',
  '#ff5252',
  '#e84848',
  '#c73838',
  '#2d3436',
]

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 6 },
  colors: {
    brand,
  },
  fontFamily: 'Poppins, ui-sans-serif, system-ui, sans-serif',
  headings: {
    fontFamily: 'Poppins, ui-sans-serif, system-ui, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '1.2' },
      h2: { fontSize: '1.5rem', lineHeight: '1.3' },
      h3: { fontSize: '1.25rem', lineHeight: '1.35' },
      h4: { fontSize: '1.125rem', lineHeight: '1.4' },
      h5: { fontSize: '1rem', lineHeight: '1.45' },
      h6: { fontSize: '0.875rem', lineHeight: '1.5' },
    },
  },
  defaultRadius: 'md',
  shadows: {
    xs: 'none',
    sm: 'none',
    md: 'none',
    lg: 'none',
    xl: 'none',
  },
  components: {
    Paper: {
      defaultProps: {
        withBorder: true,
        radius: 'md',
      },
      styles: {
        root: {
          borderColor: 'var(--mantine-color-default-border)',
          backgroundColor: 'var(--mantine-color-body)',
        },
      },
    },
    Table: {
      styles: {
        table: {
          borderCollapse: 'collapse',
        },
        thead: {
          borderBottom: '1px solid var(--mantine-color-default-border)',
        },
        th: {
          fontWeight: 600,
          color: 'var(--mantine-color-text)',
          fontSize: 'var(--mantine-font-size-sm)',
          borderBottom: '1px solid var(--mantine-color-default-border)',
        },
        td: {
          borderBottom: '1px solid var(--mantine-color-default-border)',
          fontSize: 'var(--mantine-font-size-sm)',
        },
        tr: {
          '&:hover': {
            backgroundColor: 'light-dark(var(--mantine-color-brand-0), var(--mantine-color-dark-6))',
          },
          '&:last-child td': {
            borderBottom: 'none',
          },
        },
      },
    },
    Tabs: {
      styles: {
        tab: {
          fontWeight: 500,
          color: 'var(--mantine-color-dimmed)',
          '&[data-active]': {
            color: 'var(--mantine-color-brand-6)',
            borderColor: 'var(--mantine-color-brand-6)',
          },
        },
      },
    },
    Button: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        root: {
          fontWeight: 500,
        },
      },
    },
    NavLink: {
      styles: {
        root: {
          borderRadius: 'var(--mantine-radius-md)',
          fontWeight: 500,
        },
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Anchor: {
      defaultProps: {
        c: 'brand.6',
      },
    },
    Title: {
      styles: {
        root: {
          color: 'var(--mantine-color-text)',
        },
      },
    },
    TextInput: {
      styles: {
        input: {
          borderColor: 'var(--mantine-color-default-border)',
        },
      },
    },
    NumberInput: {
      styles: {
        input: {
          borderColor: 'var(--mantine-color-default-border)',
        },
      },
    },
    NativeSelect: {
      styles: {
        input: {
          borderColor: 'var(--mantine-color-default-border)',
        },
      },
    },
    Divider: {
      styles: {
        root: {
          borderColor: 'var(--mantine-color-default-border)',
        },
      },
    },
    Alert: {
      styles: {
        root: {
          borderRadius: 'var(--mantine-radius-md)',
        },
      },
    },
  },
})
