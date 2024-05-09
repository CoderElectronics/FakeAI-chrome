module.exports = {
  content: ["./src/**/*.{html,js}", "./node_modules/flowbite/**/*.js"],
  theme: {
    minWidth: {
      '0': '0',
      'popup': '350px',
      full: '100%'
    },
    extend: {}
  },
  variants: {},
  plugins: [
    require('flowbite/plugin')({
        charts: true,
    })
  ],
  darkMode: 'class'
}
