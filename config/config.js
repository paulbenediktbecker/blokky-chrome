import { normalizeDomain } from "../js/domainMatching.js";

// Elemente cachieren
const settingsElements = {
  waitingPeriod: document.getElementById('waitingPeriod'),
  timeSlotsToggle: document.getElementById('timeSlotsToggle'),
  timeSlots: document.getElementById('timeSlots'),
  timeFrom: document.getElementById('timeFrom'),
  timeTo: document.getElementById('timeTo')
};

// Event Listener für Einstellungen
document.getElementById('urlInput').addEventListener("keyup", ({ key }) => {
  if (key === "Enter") addElement();
});
document.getElementById('addBtn').addEventListener('click', addElement);
document.getElementById('settingsBtn').addEventListener('click', toggleSettings);

// Einstellungen automatisch speichern bei Änderungen
Object.values(settingsElements).forEach(element => {
  element.addEventListener('input', saveSettings);
});

// Time Slots Toggle Sichtbarkeit
document.getElementById('timeSlotsToggle').addEventListener('change', () => {
  toggleTimeSlotsVisibility();
  saveSettings();
});

function toggleTimeSlotsVisibility() {
  const isVisible = settingsElements.timeSlotsToggle.checked;
  timeSlots.classList.toggle('hidden', !isVisible);
}

async function loadSettings() {
  const data = await chrome.storage.sync.get({
    settings: {
      waitingPeriod: 2,
      timeSlotsEnabled: false,
      timeFrom: '08:00',
      timeTo: '18:00'
    }
  });
  
  const { settings } = data;
  
  // Werte setzen
  settingsElements.waitingPeriod.value = settings.waitingPeriod;
  settingsElements.timeSlotsToggle.checked = settings.timeSlotsEnabled;
  settingsElements.timeFrom.value = settings.timeFrom;
  settingsElements.timeTo.value = settings.timeTo;

  // Sichtbarkeit initial setzen
  toggleTimeSlotsVisibility();
}

function saveSettings() {
  const settings = {
    waitingPeriod: parseInt(settingsElements.waitingPeriod.value),
    timeSlotsEnabled: settingsElements.timeSlotsToggle.checked,
    timeFrom: settingsElements.timeFrom.value,
    timeTo: settingsElements.timeTo.value
  };
  
  chrome.storage.sync.set({ settings });
}

// Restliche Funktionen bleiben wie vorhanden
function addElement() {
  const url = document.getElementById('urlInput').value;
  document.getElementById('urlInput').value = '';
  chrome.storage.sync.get({ blockedSites: [] }, data => {
    const blocked = data.blockedSites;
    blocked.push(normalizeDomain(url));
    chrome.storage.sync.set({ blockedSites: blocked });
    updateList();
  });
}

function updateList() {
  chrome.storage.sync.get({ blockedSites: [] }, data => {
    const list = document.getElementById('blockedList');
    list.innerHTML = data.blockedSites.map(url => `
          <div class="bg-base-100 rounded-xl w-full flex flex-row shadow-xl items-center justify-between my-4 p-4"><h4 class="card-title">${url}</h4><button class="btn btn-error" data-url="${url}"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520q-17 0-28.5-11.5T160-760q0-17 11.5-28.5T200-800h160q0-17 11.5-28.5T400-840h160q17 0 28.5 11.5T600-800h160q17 0 28.5 11.5T800-760q0 17-11.5 28.5T760-720v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM400-280q17 0 28.5-11.5T440-320v-280q0-17-11.5-28.5T400-640q-17 0-28.5 11.5T360-600v280q0 17 11.5 28.5T400-280Zm160 0q17 0 28.5-11.5T600-320v-280q0-17-11.5-28.5T560-640q-17 0-28.5 11.5T520-600v280q0 17 11.5 28.5T560-280ZM280-720v520-520Z"/></svg></button></div>
        `).join('');

    list.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        chrome.storage.sync.get({ blockedSites: [] }, data => {
          const filtered = data.blockedSites.filter(u => u !== url);
          chrome.storage.sync.set({ blockedSites: filtered });
          updateList();
        });
      });
    });
  });
}

function toggleSettings() {
  const settings = document.getElementById('settingsContainer');
  settings.classList.toggle('hidden');
  settings.classList.toggle('block');


  const list = document.getElementById('listContainer');
  list.classList.toggle('hidden');
  list.classList.toggle('block');

  const settingsBtn = document.getElementById('settingsBtn');
  settingsBtn.classList.toggle('btn-ghost');
  settingsBtn.classList.toggle('btn-neutral');
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
  updateList();
  loadSettings();
});