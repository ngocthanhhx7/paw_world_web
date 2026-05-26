/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bảng màu Paw World — tone lavender + vàng + pastel theo Figma
        lavender: {
          50: '#F8F4FF',
          100: '#EFE6FF',
          200: '#E0D1FF',
          300: '#CDB6F4',
          400: '#B79CE8', // hero bg
          500: '#9D7AD9', // step 3 number
          600: '#7B57BD',
          700: '#5C3FA0',
        },
        sun: {
          50: '#FFF8E0',
          100: '#FFF0B8',
          200: '#FFE680',
          300: '#FFDA52',
          400: '#FFCB2E', // CTA primary
          500: '#FFB800',
          600: '#E59C00',
        },
        cocoa: {
          50: '#F8F2EC',
          100: '#E9D9C7',
          200: '#C9A988',
          300: '#A37B53',
          400: '#7E5733',
          500: '#3F2A6B', // dùng tím đậm thay thế cho text/heading chính
          600: '#2E1F50',
          700: '#1F1438',
        },
        blush: {
          100: '#FFE5E8',
          200: '#FFD0D5',
          300: '#FFB3BC',
          400: '#FF8C99',
          500: '#FF6477',
        },
        mint: {
          100: '#DDF5E5',
          200: '#BFEBCE',
          300: '#9CDFB6',
          400: '#74CC97',
          500: '#3FB075',
        },
        peach: {
          100: '#FFE8D6',
          200: '#FFD0AC',
          300: '#FFB47A',
          400: '#FF924A',
        },
        cream: {
          50: '#FFFBEF',
          100: '#FFF4D6',
          200: '#FFE6A8',
          300: '#FFD478',
          400: '#FFC04A',
          500: '#FFB022',
          600: '#E8961A',
          700: '#B7720F',
        },
        // alias coral để giữ tương thích
        coral: {
          400: '#FF8E72',
          500: '#FF6B47',
          600: '#E04E2C',
        },
        leaf: {
          400: '#74C68F',
          500: '#3FA268',
          600: '#2C7A4D',
        },
      },
      fontFamily: {
        display: ['"FC DK Cool Crayon"', '"Patrick Hand"', '"Baloo 2"', 'cursive'],
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 35px -18px rgba(63, 42, 107, 0.35)',
        card: '0 14px 28px -14px rgba(63, 42, 107, 0.25)',
        sticker: '0 8px 0 0 rgba(63, 42, 107, 0.18)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      backgroundImage: {
        'paw-pattern':
          "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22 viewBox=%220 0 120 120%22><g fill=%22%23FFD478%22 fill-opacity=%220.18%22><circle cx=%2230%22 cy=%2230%22 r=%226%22/><circle cx=%2280%22 cy=%2270%22 r=%226%22/><circle cx=%22100%22 cy=%2225%22 r=%224%22/><circle cx=%2220%22 cy=%2295%22 r=%224%22/></g></svg>')",
      },
    },
  },
  plugins: [],
};
