import { normalizeDomain } from "../js/domainMatching.js";

export function initConfig() {
  document.getElementById('addBtn').addEventListener('click', () => {
    const url = document.getElementById('urlInput').value;
    chrome.storage.sync.get({ blockedSites: [] }, data => {
      const blocked = data.blockedSites;
      blocked.push(normalizeDomain(url));
      chrome.storage.sync.set({ blockedSites: blocked });
      updateList();
    });
  });

  function updateList() {
    chrome.storage.sync.get({ blockedSites: [] }, data => {
      const list = document.getElementById('blockedList');
      list.innerHTML = data.blockedSites.map(url => `
          <div>${url} <button data-url="${url}">Entfernen</button></div>
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

  updateList();
}

document.addEventListener('DOMContentLoaded', initConfig);