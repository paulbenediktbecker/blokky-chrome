// background.js
let blockedSites = [];
let whitelist = [];
const BLOCK_PAGE = chrome.runtime.getURL('block.html');

// Hilfsfunktionen
const getMainDomain = (url) => {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.').reverse();
    return parts.length >= 2 
      ? `${parts[1]}.${parts[0]}` 
      : hostname;
  } catch {
    return null;
  }
};

const isSubdomain = (domain, mainDomain) => {
  return domain === mainDomain || domain.endsWith(`.${mainDomain}`);
};

const shouldBlockUrl = (url) => {
  if (!url || url.startsWith(BLOCK_PAGE)) return false;
  
  const targetDomain = getMainDomain(url);
  if (!targetDomain) return false;

  return blockedSites.some(blockedUrl => {
    const blockedDomain = getMainDomain(blockedUrl);
    return blockedDomain && isSubdomain(targetDomain, blockedDomain);
  });
};

const isWhitelisted = (url) => {
  const domain = getMainDomain(url);
  const now = Date.now();
  return whitelist.some(entry => 
    entry.domain === domain && entry.expire > now
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
  whitelist = stored.filter(entry => entry.expire > now);
  await chrome.storage.sync.set({ whitelist });
};

const addToWhitelist = async (url, minutes) => {
  const domain = getMainDomain(url);
  if (!domain) return;

  const expire = Date.now() + minutes * 60 * 1000;
  const newEntry = { domain, expire };
  
  whitelist = [...whitelist.filter(e => e.domain !== domain), newEntry];
  await chrome.storage.sync.set({ whitelist });
};

// Event Listeners
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading') return;
  if (!tab.url || tab.url.startsWith(BLOCK_PAGE)) return;

  await updateWhitelist();
  
  if (isWhitelisted(tab.url)) return;
  if (!shouldBlockUrl(tab.url)) return;

  chrome.tabs.update(tabId, {
    url: `${BLOCK_PAGE}?url=${encodeURIComponent(tab.url)}`
  });
});

chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === 'scheduleClose' && sender.tab) {
    const { url, id: tabId } = sender.tab;
    await addToWhitelist(url, message.minutes);
    
    chrome.alarms.create(`closeTab-${tabId}`, {
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

chrome.alarms.create('whitelistCleanup', { periodInMinutes: 5 });

(async () => {
  await updateBlockList();
  await updateWhitelist();
})();