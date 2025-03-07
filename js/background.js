// background.js
import { isMatchingDomain, normalizeDomain } from './domainMatching.js';

let blockedSites = [];
let whitelist = [];
const BLOCK_PAGE = chrome.runtime.getURL('block/block.html');
const CONFIG_PAGE = chrome.runtime.getURL('config/config.html');

// Hilfsfunktionen

const shouldBlockUrl = (url) => {
  if (!url || url.startsWith(BLOCK_PAGE)) return false;
  for (const domain of blockedSites) {
    if (isMatchingDomain(url, domain)) return true;
  }
  return false;
};

const isWhitelisted = (url, tabId) => {
  const now = Date.now();
  return whitelist.some(entry => 
    isMatchingDomain(url, entry.domain) && entry.expire > now && entry.tabId === tabId
  );
};

// Storage Handlers
const updateBlockList = async () => {
  const { blockedSites: stored } = await chrome.storage.sync.get({ blockedSites: [] });
  blockedSites = stored;
};

const updateWhitelist = async () => {
  const { whitelist: stored = [] } = await chrome.storage.sync.get('whitelist');
  const now = Date.now();
  whitelist = stored.filter((entry) => entry.expire > now);
  await chrome.storage.sync.set({ whitelist });
};

const addToWhitelist = async (url, tabId, minutes) => {
  const domain = normalizeDomain(url);
  if (!domain) return;

  const expire = Date.now() + minutes * 60 * 1000;
  const newEntry = { domain, expire, tabId };

  whitelist = [...whitelist.filter(e => e.domain !== domain || e.tabId !== tabId), newEntry];
  await chrome.storage.sync.set({ whitelist });
};

// Event Listeners

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading') return;
  if (!tab.url || tab.url.startsWith(BLOCK_PAGE)) return;

  await updateWhitelist();

  if (isWhitelisted(tab.url, tabId)) return;
  if (!shouldBlockUrl(tab.url)) return;

  chrome.tabs.update(tabId, {
    url: `${BLOCK_PAGE}?url=${encodeURIComponent(tab.url)}`
  });
});

chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === 'scheduleClose' && sender.tab) {
    const { id: tabId } = sender.tab;
    await addToWhitelist(message.originalUrl, tabId, message.minutes);
    await chrome.alarms.create(`closeTab-${tabId}`, {
      delayInMinutes: message.minutes
    });
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  // Whitelist Bereinigung
  if (alarm.name === 'whitelistCleanup') {
    await updateWhitelist();
    return;
  }

  // Tab-Schließung
  if (alarm.name.startsWith('closeTab-')) {
    const tabId = Number(alarm.name.split('-')[1]);
    try {
      await chrome.tabs.remove(tabId);
    } catch (error) {
      console.log('Tab bereits geschlossen:', error);
    }
  }
});

// Initialisierung
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockedSites) {
    blockedSites = changes.blockedSites.newValue;
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: CONFIG_PAGE });
});

chrome.alarms.create('whitelistCleanup', { periodInMinutes: 5 });

(async () => {
  await updateBlockList();
  await updateWhitelist();
})();