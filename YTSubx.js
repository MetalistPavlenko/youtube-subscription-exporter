// ==UserScript==
// @name        YouTube Subscription Exporter
// @namespace   https://github.com/MetalistPavlenko
// @match       https://www.youtube.com/feed/channels
// @grant       none
// @version     1.0
// @icon        https://www.youtube.com/s/desktop/33ae93e9/img/logos/favicon_96x96.png
// @author      METALiST
// @run-at      document-idle
// @description Exports a list of YouTube subscriptions to a csv file
// ==/UserScript==

(function () {
  'use strict';

  const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const CSV_HEADER = 'Channel ID,Channel URL,Channel Title';

  function addButton(text, func) {
    const button = document.createElement('button');
    button.classList.add(
      'yt-spec-button-shape-next', 'yt-spec-button-shape-next--tonal',
      'yt-spec-button-shape-next--mono', 'yt-spec-button-shape-next--size-m'
    );
    button.style.maxWidth = '200px';
    button.style.margin = '4px';
    button.innerText = text;
    button.addEventListener('click', func);
    document.getElementById('center').appendChild(button);
  }

  async function fetchChannelId(url) {
    const text = await fetch(url).then(resp => resp.text());
    const match = text.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/);
    return match ? match[1] : 'unknown';
  }

  async function parseChannelLink(link) {
    const href = link.href;
    const fullUrl = href.startsWith('http') ? href : 'https://www.youtube.com' + href;
    const channelId = await fetchChannelId(fullUrl);
    const channelUrl = `https://www.youtube.com/channel/${channelId}`;
    const title = link.children[0]?.children[0]?.innerText || link.innerText || '';
    return [channelId, channelUrl, title].join(',');
  }

  async function exportSubscriptions() {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    let prevHeight = 0;
    while (true) {
      window.scrollTo(0, document.documentElement.scrollHeight);
      await delay(100);
      const currHeight = document.documentElement.scrollHeight;
      if (currHeight === prevHeight) break;
      prevHeight = currHeight;
    }
    const elements = Array.from(document.querySelectorAll('.channel-link#main-link'));
    const results = await Promise.all(elements.map(parseChannelLink));
    const csvContent = [CSV_HEADER, ...results].join('\n');
    const blob = new Blob([BOM, csvContent], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'subscriptions.csv';
    a.click();
  }

  addButton('Export subscriptions', exportSubscriptions);
})();
