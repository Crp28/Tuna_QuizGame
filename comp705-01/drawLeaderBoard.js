function renderMainLeaderboard() {
  let medal = ['🥇','🥈','🥉'];
  const loggedInUser = getCookie('username'); // ✅ Get username from cookie
  let html = `
    <div style="font-size:1.5em; margin-bottom:12px; font-weight:700; color:#ffe082; letter-spacing:1px;">
      🏆 Top Players Leaderboard
      <a href="analytics.php" target="_blank" style="font-size:0.8em; font-weight:400; color:#90caf9; margin-left:15px; text-decoration:underline;">
        See more leaders?
      </a>
    </div>

    <div id="leaderboardScrollBox" style="
      width:100%; 
      max-width:100%;
      background:#21293a;
      border-radius:18px; 
      padding:18px 16px 8px 16px;
      box-shadow:0 6px 24px #1b2235b3;
      margin:0 auto 10px auto;
      overflow-x:auto;
    ">
      <div style="
        width:100%;
        max-height:30vh;
        overflow-y:auto;
        overflow-x:hidden;
        border-radius:11px;
        background:none;
      ">
      <table style="
        width:100%; 
        min-width:440px; 
        color:#fff; 
        border-collapse:separate; 
        border-spacing:0;
        font-size:1.18em;
      ">
        <thead>
          <tr style="background:#2c3b55;">
            <th style="color:#ffe082; padding:10px 6px 10px 0; text-align:center; font-weight:700;">#</th>
            <th style="color:#81ff81; text-align:center; font-weight:700;">Name</th>
            <th style="color:#60e8fe; text-align:center; font-weight:700;">Level</th>
            <th style="color:#ffd580; text-align:center; font-weight:700;">Time (s)</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (!leaderboard.length) {
    html += `<tr>
      <td colspan="4" style="color:#aaa;padding:24px 0;text-align:center;font-size:1.13em;">No entries yet.</td>
    </tr>`;
  } else {
    leaderboard.forEach((row, i) => {
      const isUser = loggedInUser && row.name === loggedInUser;
      html += `
        <tr id="${isUser ? 'highlightUserRow' : ''}" style="
          background:${isUser ? '#004d40' : (i%2==0?'#23324a':'#23233a')};
          ${i<3?'font-weight:700;':''}
          ${isUser ? 'border: 2px solid #00ffc3;' : ''}
        ">
          <td style="color:#ffe082; padding:8px 6px 8px 0; text-align:center;">
            ${i < 3 ? medal[i] : (i + 1)}
          </td>
          <td style="color:#81ff81; font-weight:600; letter-spacing:0.5px; text-align:center;">
            ${row.name}
          </td>
          <td style="color:#60e8fe; text-align:center; font-size:1.12em;">
            ${row.level}
          </td>
          <td style="color:#ffd580; text-align:center; font-family:monospace;">
            ${row.time}
          </td>
        </tr>
      `;
    });
  }

  html += `
        </tbody>
      </table>
      </div>
    </div>
  `;

  document.getElementById('mainLeaderboard').innerHTML = html;
  
    // ✅ Check if logged-in user qualifies for next level
  if (loggedInUser && questions.length > 0) {
    const userEntry = leaderboard.find(entry => entry.name === loggedInUser);
    if (userEntry && userEntry.level >= Math.ceil(questions.length / 2)) {
      showNextLevelButton();
    }
  }


  // ✅ After rendering, scroll to and highlight the logged-in user
  setTimeout(() => {
    const userRow = document.getElementById('highlightUserRow');
    if (userRow) {
      userRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      userRow.style.transition = 'background 1s';
      userRow.style.background = '#004d40';
      
      userRow.style.animation = 'flash 1.5s ease-in-out 2';
    }
  }, 100);
}
