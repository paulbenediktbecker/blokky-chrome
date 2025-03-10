const params = new URLSearchParams(location.search);
let buttonsEnabled = false;
const originalUrl = decodeURIComponent(params.get('url'));

const progressBarCirc = document.getElementById("progressBarCirc");
const overlay = document.getElementById("overlay");
let value = 0;

// Neue Funktion zum Berechnen der Wartezeit
async function getWaitingTime() {
  const { settings } = await chrome.storage.sync.get({
    settings: { waitingPeriod: 2, colorfulMode: true }
  });
  
  // Mapping der Slider-Werte auf Sekunden
  const waitingTimes = {
    1: 5,
    2: 10,
    3: 20,
    4: 60
  };

  if (settings.colorfulMode) {
    enableColorfulMode();
  }
  
  return waitingTimes[settings.waitingPeriod] * 1000; // in ms
}

function enableColorfulMode(){
  document.querySelectorAll('.timer-options button').forEach(btn => {
    btn.classList.add("btn-neutral");
  })
  document.getElementById("to-btn-1").classList.add("btn-success");
  document.getElementById("to-btn-2").classList.add("btn-info");
  document.getElementById("to-btn-3").classList.add("btn-warning");
  document.getElementById("to-btn-4").classList.add("btn-neutral");

  document.getElementById("text-title").classList.add("text-primary")
  document.getElementById("cancel").classList.add("btn-error");
  progressBarCirc.classList.add("text-primary");
}

// Progress Bar mit dynamischer Geschwindigkeit
async function startProgressBar() {
  const totalTime = await getWaitingTime();
  const intervalStep = totalTime / 1000;
  
  const interval = setInterval(() => {
    value += 0.1;
    progressBarCirc.style.setProperty("--value", value);
    
    if (value >= 100) {
      overlay.style.display = 'none';
      document.querySelector('.timer-options').style.display = 'grid';
      clearInterval(interval);
    }
  }, intervalStep);
}

// Starte den Timer
startProgressBar();

/* Der Rest bleibt unverändert */
document.getElementById("cancel").addEventListener('click', () => {
  window.close();
});

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