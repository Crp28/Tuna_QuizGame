(function checkPreviousLevel() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const currentFolder = pathParts[pathParts.length - 1];

  const match = currentFolder.match(/^(.*?)-(\d{2,})$/);
  if (!match) return;

  const prefix = match[1];
  const currentLevel = parseInt(match[2], 10);
  if (currentLevel <= 1) return;

  const previousLevel = `${prefix}-${String(currentLevel - 1).padStart(2, '0')}`;
  const checkURL = `../${previousLevel}/check_pass_status.php?username=${encodeURIComponent(USERNAME)}`;

  // Alert the URL before fetching (for debugging)
  //alert(`Debug URL:\n${checkURL}`);

  fetch(checkURL)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (!data.passed) {
        alert(`You must complete at least 50% of ${previousLevel}\n(${data.answered}/${data.total}) before continuing.\n\nChecked via:\n${checkURL}`);
        window.location.href = `../${previousLevel}/`;
      }
    })
    .catch(err => {
      console.error('Failed to verify previous level progress:', err);
      alert(`Error checking previous level:\n${err.message}\n\nTried:\n${checkURL}`);
    });
})();
