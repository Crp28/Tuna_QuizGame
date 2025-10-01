function updateQuestionPanel() {
  if (!question || !question.options || !worms || worms.length !== 4) {
    questionPanel.innerHTML = getHowToPlayHTML();
    return;
  }

  // Inject animation styles once
  if (!document.getElementById("animStyle")) {
    const style = document.createElement("style");
    style.id = "animStyle";
    style.textContent = `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes zoomIn {
        from { opacity: 0; transform: scale(0.9); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-20px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes bounceIn {
        0%   { opacity: 0; transform: scale(0.3); }
        50%  { opacity: 1; transform: scale(1.05); }
        70%  { transform: scale(0.95); }
        100% { transform: scale(1); }
      }
      .fade-in      { animation: fadeInUp 0.4s ease-out; }
      .zoom-in      { animation: zoomIn 0.4s ease-out; }
      .slide-left   { animation: slideInLeft 0.4s ease-out; }
      .bounce-in    { animation: bounceIn 0.5s ease-out; }
    `;
    document.head.appendChild(style);
  }

  // Choose a random animation class
  const animations = ["fade-in", "zoom-in", "slide-left", "bounce-in"];
  const animClass = animations[Math.floor(Math.random() * animations.length)];

  const colorMap = {};
  worms.forEach(w => { colorMap[w.label] = w.color; });

  let html = `<div id="questionBox" class="${animClass}" style="margin-bottom:7px; font-size:1.15em;"><b>Q:</b> ${question.question}</div>`;
  html += `<div id="choicesBox" class="choices-row ${animClass}" style="display:flex; flex-direction:column; gap:3px;">`;
  for (let i = 0; i < 4; ++i) {
    html += drawWorm(i, colorMap);
  }
  html += `</div>`;

  questionPanel.innerHTML = html;

  // Optional: re-trigger animation (if same question shows again)
  ["questionBox", "choicesBox"].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove(animClass);
    void el.offsetWidth; // force reflow
    el.classList.add(animClass);
  });
}
