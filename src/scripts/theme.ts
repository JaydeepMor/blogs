const root = document.documentElement;

document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage can be blocked; the toggle still works for this page view.
    }
    document.dispatchEvent(new CustomEvent('themechange', { detail: next }));
  });
});
