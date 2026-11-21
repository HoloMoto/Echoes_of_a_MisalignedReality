/* Apply saved theme & easter-egg layer state before first paint */
(function () {
  try {
    var saved = localStorage.getItem('hs-theme');
    var theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
    document.documentElement.setAttribute('data-theme', theme);

    if (sessionStorage.getItem('hs-raw-vision') === '1') {
      document.documentElement.classList.add('raw-vision');
    }
    if (sessionStorage.getItem('hs-analog-hatch') === '1') {
      document.documentElement.classList.add('analog-hatch');
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
