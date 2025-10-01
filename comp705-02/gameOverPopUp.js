function showGameOverPopup() {
  isExploding = false;
  t1 = Date.now();
  // Add the score to the leaderboard with username
  let nick = (typeof USERNAME !== 'undefined' && USERNAME) ? USERNAME : "Guest";
  const newEntry = {
  name: nick,
  level: level,
  time: t0 ? ((t1 - t0) / 1000).toFixed(2) * 1 : 0
};

// Push to UI leaderboard
leaderboard.push(newEntry);
leaderboard.sort((a, b) => b.level - a.level || a.time - b.time);
//leaderboard = leaderboard.slice(0, 15);

// Save only the new entry to server
saveLeaderboardEntry(newEntry);

  setLeaderboard(leaderboard);
  renderMainLeaderboard();

  setTimeout(() => {
  Swal.fire({
    title: "Game Over! Press ESC to escape.",
    html: `<div>Worms Eaten: <b>${score}</b><br>
      Highest Level: <b>${level}</b></div>`,
    icon: "error",
    confirmButtonText: "Explain to me this question",
    cancelButtonText: "Cancel",
    showCancelButton: true,
    customClass: { popup: 'swal-move-down' },
    allowOutsideClick: false,
    allowEscapeKey: true,
    focusConfirm: true,
    didOpen: () => {
      const btn = Swal.getConfirmButton();
      if (btn) btn.focus();
    }
  }).then((result) => {
    // Only continue if user clicked confirm, not cancel or esc
    if (result.isConfirmed) {
      // Use the current question and options as required
      const qtext = (question && question.question) ? question.question : '';
      const opts = (question && question.options && question.options.length === 4)
        ? question.options
        : ["A", "B", "C", "D"];
      let googleQuery;
      if (qtext) {
        googleQuery = encodeURIComponent(
          `Which is the correct answer for this question: "${qtext}"\nA. ${opts[0]}\nB. ${opts[1]}\nC. ${opts[2]}\nD. ${opts[3]}`
        );
      } else {
        googleQuery = encodeURIComponent('Which is the correct answer for this C programming question?');
      }
      window.open(`https://www.google.com/search?q=${googleQuery}`, '_blank');
    }
    // In any case (confirm or cancel), reset the game UI
    splash.innerHTML = `<div style="font-size:2.1rem; font-weight:600; margin-bottom:12px;">Play again, ${typeof USERNAME !== "undefined" ? USERNAME : "Guest"}?</div>
      <div>Press <b>S</b> to start!</div>
      <div class="hint">Eat the worm with the <span style="color:#81ff81;font-weight:bold;">correct answer (A/B/C/D)</span>!<br>
      Use <b>arrow keys</b> or <b>WASD</b> to guide your snake.<br>
      If you eat a wrong answer or hit wall/self, you lose.</div>`;
    splash.style.display = "";
    updateScore(0);
    isGameRunning = false;
    isGameOver = false;
  });
}, 20);



}
