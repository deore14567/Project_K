/** Tailwind config — scans all frontend HTML/JS for class usage */
module.exports = {
  darkMode: 'class',
  content: [
    './frontend/**/*.html',
    './frontend/js/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
