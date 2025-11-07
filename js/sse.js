(() => {
  // Guard: allow disabling SSE from config to reduce server load
  if (!window.APP_CONFIG || window.APP_CONFIG.sseEnabled === false) return;
  try {
    const src = new EventSource('api/sse.php');
    // Ensure the connection is closed when navigating away to avoid lingering processes
    window.addEventListener('beforeunload', () => { try { src.close(); } catch (e) {} });
    src.onopen = () => {
      const el = document.getElementById('connectionStatus');
      if (el) {
        el.textContent = 'Realtime';
        el.style.background = '#6c5ce7';
      }
    };
    src.onmessage = (ev) => {
      // Can handle generic messages
    };
    src.addEventListener('metrics', (ev) => {
      // Optional: could merge into UI, but polling already handles updates
      // Keep minimal to not duplicate logic
    });
  } catch (e) {
    // ignore
  }
})();
