/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#fcf8fb",
        surface: "#fcf8fb",
        "surface-lowest": "#ffffff",
        "surface-low": "#f6f3f5",
        "surface-container": "#f0edef",
        "surface-high": "#eae7ea",
        "surface-highest": "#e4e2e4",
        "on-surface": "#1b1b1d",
        "on-surface-variant": "#414755",
        outline: "#717786",
        "outline-variant": "#c1c6d7",
        primary: "#0058bc",
        "primary-container": "#0070eb",
        "primary-soft": "#d8e2ff",
        secondary: "#8c5000",
        error: "#ba1a1a",
        "error-soft": "#ffdad6"
      },
      fontFamily: {
        serif: ["Newsreader", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        spatial: "0 4px 12px rgba(0,0,0,0.05), 0 12px 24px rgba(0,0,0,0.03), 0 24px 48px rgba(0,0,0,0.02)",
        floating: "0 20px 50px rgba(0,0,0,0.04), 0 30px 70px rgba(0,0,0,0.06)"
      }
    }
  },
  plugins: []
};
