const params = new URLSearchParams(location.search);
let buttonsEnabled = false;
const originalUrl = decodeURIComponent(params.get('url'));

const progressBarCirc = document.getElementById("progressBarCirc");
const overlay = document.getElementById("overlay");
let value = 0;

const interval = setInterval(() => {
  value += 0.1;
  progressBarCirc.style.setProperty("--value", value);
  
  if (value >= 100) {
    // Hide overlay and show buttons when progress completes
    overlay.style.display = 'none';
    document.querySelector('.timer-options').style.display = 'grid';
    clearInterval(interval);
  }
}, 10);

document.getElementById("cancel").addEventListener('click', () => {
  window.close();
});

// Rest of your existing JavaScript remains the same
document.querySelectorAll('.timer-options button').forEach(btn => {
  btn.addEventListener('click', async () => {
    const minutes = parseInt(btn.dataset.time);
    const tab = await chrome.tabs.getCurrent();
    
    chrome.runtime.sendMessage({
      action: 'scheduleClose',
      tabId: tab.id,
      originalUrl: originalUrl,
      minutes: minutes
    });
    
    location.href = originalUrl;
  });
});