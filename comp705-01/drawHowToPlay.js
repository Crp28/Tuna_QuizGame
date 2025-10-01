function getHowToPlayHTML() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const currentFolder = pathParts[pathParts.length - 1];
  const match = currentFolder.match(/^(.*?)-(\d{2,})$/);

  let backTo01HTML = '';
  if (match) {
    const prefix = match[1];
    const level = parseInt(match[2], 10);
    if (level >= 2) {
      const level01 = `${prefix}-01`;
      backTo01HTML = `
        <div style="margin-top: 16px; font-size: 0.95rem;">
          ⏪ <a href="../${level01}/" style="color: #81ff81; text-decoration: underline;">Back to Level 01 (${level01})</a>
        </div>
      `;
    }
  }

  return `
    <div class="how-to" style="line-height: 1.6; font-size: 1rem;">
      <div style="color: #ffe082; font-weight: bold; font-size: 1.1rem; margin-bottom: 8px;">
        🕹️ How to Play
      </div>

      <div>
        🎮 Use <b>arrow keys</b> or <b>WASD</b> to <span style="color:#60e8fe;">move the snake</span> toward the correct answer.
        <br>⚠️ Press a direction key to start.
      </div>

      <div style="margin-top: 10px;">
        ✅ <b>Correct:</b> Snake grows + score up.
        <br>❌ <b>Wrong / crash:</b> <span style="color:#ff7675;">Game over</span>.
      </div>

      <div style="margin-top: 10px; color: #ffe082;">
        💡 Read the question, think fast, and play smart!
      </div>

      <div style="margin-top: 12px;">
        📚 Want to review and learn the lesson?
        <br>
        <a href="https://www.geeksforgeeks.org/software-engineering/software-engineering-introduction-to-software-engineering/" target="_blank">Introduction to Software Engineering</a><br>
        <a href="https://www.geeksforgeeks.org/software-engineering/software-engineering-software-quality/" target="_blank">Software Quality</a><br>
        <a href="https://www.geeksforgeeks.org/software-engineering/software-development-life-cycle-sdlc/" target="_blank">Software Development Life Cycle (SDLC)</a>
      </div>

      <div style="margin-top: 12px; font-weight: bold;">
        Good luck!
      </div>

      ${backTo01HTML}
    </div>
  `;
}
