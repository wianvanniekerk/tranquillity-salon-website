/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./build/frontend/views/**/*.ejs"],
  theme: {
    extend: {
      colors: {
        'black': '#000000',
      },
      fontFamily: { 
        "dancing": ['Dancing Script', 'cursive'] 
     },
    },
  },
  plugins: [],
}

