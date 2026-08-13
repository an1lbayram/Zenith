export default {
  content: ['./index.html', './assets/js/**/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // rgb(<channels> / <alpha-value>) lets Tailwind generate opacity
        // modifiers (bg-primary/10, shadow-primary/30, ...) from the
        // RGB-triplet CSS vars defined in style.css per theme.
        primary: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
      },
    },
  },
};
