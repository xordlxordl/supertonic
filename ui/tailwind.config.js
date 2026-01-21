/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'sonic-black': '#121212',
                'sonic-gray': '#1E1E1E',
                'sonic-accent': '#00FFA3', // Energetic green/cyan
                'sonic-text': '#E0E0E0',
            },
            fontFamily: {
                'sans': ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
