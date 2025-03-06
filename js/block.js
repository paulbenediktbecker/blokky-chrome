const params = new URLSearchParams(location.search);
const originalUrl = decodeURIComponent(params.get('url'));

document.querySelector('.progress').style.width = '100%';

setTimeout(() => {
  document.querySelector('.timer-options').style.display = 'block';
}, 2000);

// In block.js:
document.querySelectorAll('.timer-options button').forEach(btn => {
  btn.addEventListener('click', async () => {
    const minutes = parseInt(btn.dataset.time);
    const tab = await chrome.tabs.getCurrent();
    
    chrome.runtime.sendMessage({
      action: 'scheduleClose',
      tabId: tab.id,
      originalUrl: originalUrl,
      minutes: minutes // Umrechnung in Sekunden
    });
    
    location.href = originalUrl;
  });
});