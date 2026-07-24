/* Apply saved theme before paint to avoid flash */
(function () {
  try {
    var key = 'hs-theme';
    var saved = localStorage.getItem(key);
    var theme = saved;
    if (!theme) {
      theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
