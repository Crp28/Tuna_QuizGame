

function showNextLevelButton() {	
	
  const btn = document.getElementById("nextLevelBtn");
  if (!btn) return;

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const currentFolder = pathParts[pathParts.length - 1];

  const match = currentFolder.match(/^(.*?)-(\d{2,})$/);
  if (!match) return;

  const prefix = match[1];
  const currentLevelNum = parseInt(match[2], 10);
  const nextLevelNum = currentLevelNum + 1;
  const nextFolder = `${prefix}-${nextLevelNum.toString().padStart(2, '0')}`;
  const basePath = '/' + pathParts.slice(0, -1).join('/');
  const nextURL = `${basePath}/${nextFolder}/`;

  // If current level >= 2, prepare back button
  let backButtonHTML = "";
  if (currentLevelNum > 1) {
    const prevLevelNum = currentLevelNum - 1;
    const prevFolder = `${prefix}-${prevLevelNum.toString().padStart(2, '0')}`;
    const prevURL = `${basePath}/${prevFolder}/`;

    backButtonHTML = `
      <button onclick="window.location.href='${prevURL}'"
        style="
          background-color: #cfd8dc;
          margin-top: 10px;
          margin-right: 6px;
          border: none;
          border-radius: 6px;
          padding: 6px 14px;
          font-weight: bold;
          font-size: 0.88rem;
          cursor: pointer;
          color: #222;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        ">
        🔙 Previous Block
      </button>
    `;
  }

  const checkURL = `check_folder_exists.php?folder=${encodeURIComponent(nextFolder)}`;

  fetch(checkURL)
    .then(res => res.json())
    .then(data => {
      let messageHTML = `
        <div style="
          width: 100%;
          background: linear-gradient(90deg, #546e7a, #78909c);
          color: #fff;
          font-size: 1rem;
          padding: 10px 12px;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          text-align: center;
          line-height: 1.4;
        ">
      `;

      if (data.exists) {
        messageHTML += `
          🎉 <strong>Congratulations!</strong> You’ve passed over <strong>50%</strong> — you can move to the next block.
          <br>
          ${backButtonHTML}
          <button onclick="window.location.href='${nextURL}'"
            style="
              background-color: #fff200;
              margin-top: 8px;
              border: none;
              border-radius: 6px;
              padding: 6px 14px;
              font-weight: bold;
              font-size: 0.9rem;
              cursor: pointer;
              color: #222;
              box-shadow: 0 1px 4px rgba(0,0,0,0.15);
            ">
            ✅ Next Block
          </button>
        `;
      } else {
        messageHTML += `
          🚀 <strong>Great work!</strong> You’ve passed over <strong>50%</strong> of this block, and it’s the <strong>final block</strong>.
          <br>New blocks may be added in the future! Stay tuned.
          <br>
          ${backButtonHTML}
        `;
      }

      messageHTML += `</div>`;
      btn.innerHTML = messageHTML;
      btn.style.display = "block";
      
    })
    .catch(err => {
      console.error('Error checking next folder:', err);
    });
}

