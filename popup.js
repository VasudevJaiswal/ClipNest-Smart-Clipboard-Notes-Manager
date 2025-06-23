const historyList = document.getElementById('history');
const searchInput = document.getElementById('search');
const clearBtn = document.getElementById('clear');
const downloadBtn = document.getElementById('download');
const tipRow = document.getElementById('tipRow');
const hideTip = document.getElementById('hideTip');

if (localStorage.getItem('chm_tip_hide')) {
  tipRow.style.display = 'none';
} else {
  hideTip.onclick = () => {
    tipRow.style.display = 'none';
    localStorage.setItem('chm_tip_hide', '1');
  };
}

function renderHistory(items) {
  historyList.innerHTML = '';
  if (!items.length) {
    const emptyMsg = document.createElement('li');
    emptyMsg.textContent = "No clipboard history yet.";
    emptyMsg.style.color = "#aac7e9";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.padding = "18px";
    historyList.appendChild(emptyMsg);
    return;
  }
  items.forEach((item, idx) => {
    const li = document.createElement('li');
    if (item.pinned) li.classList.add('pinned');
    const snippet = document.createElement('span');
    snippet.className = "snippet";
    snippet.textContent = item.text.length > 70 ? item.text.slice(0,70) + "…" : item.text;
    snippet.title = item.text;
    snippet.onclick = async () => {
      try {
        await navigator.clipboard.writeText(item.text);
        snippet.classList.add('copied');
        setTimeout(() => snippet.classList.remove('copied'), 400);
      } catch (e) {
        alert("Copy failed: " + e.message);
      }
    };
    const iconWrap = document.createElement('div');
    iconWrap.className = 'icon-action';
    const pinBtn = document.createElement('button');
    pinBtn.title = item.pinned ? "Unpin" : "Pin";
    pinBtn.className = "pin-btn" + (item.pinned ? " pinned" : "");
    pinBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 3L12 9H17L13 13L14 19L10 16L6 19L7 13L3 9H8L10 3Z"/></svg>`;
    pinBtn.onclick = (e) => {
      e.stopPropagation();
      chrome.storage.local.get(['clipboardHistory'], ({ clipboardHistory }) => {
        clipboardHistory = clipboardHistory || [];
        clipboardHistory[idx].pinned = !clipboardHistory[idx].pinned;
        clipboardHistory = [
          ...clipboardHistory.filter(x => x.pinned),
          ...clipboardHistory.filter(x => !x.pinned)
        ];
        chrome.storage.local.set({ clipboardHistory }, loadHistory);
      });
    };
    const copyBtn = document.createElement('button');
    copyBtn.title = "Copy";
    copyBtn.className = "copy-btn";
    copyBtn.innerHTML = `<svg width="18" height="18" fill="none" viewBox="0 0 20 20"><rect x="5" y="5" width="10" height="10" rx="2" stroke-width="1.6"/><rect x="8" y="2" width="8" height="8" rx="2" stroke-width="1.2"/></svg>`;
    copyBtn.onclick = async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(item.text);
        copyBtn.innerHTML = "✔";
        setTimeout(() => (copyBtn.innerHTML = `<svg width="18" height="18" fill="none" viewBox="0 0 20 20"><rect x="5" y="5" width="10" height="10" rx="2" stroke-width="1.6"/><rect x="8" y="2" width="8" height="8" rx="2" stroke-width="1.2"/></svg>`), 850);
      } catch (e) {
        copyBtn.innerHTML = "Err";
        setTimeout(() => (copyBtn.innerHTML = `<svg width="18" height="18" fill="none" viewBox="0 0 20 20"><rect x="5" y="5" width="10" height="10" rx="2" stroke-width="1.6"/><rect x="8" y="2" width="8" height="8" rx="2" stroke-width="1.2"/></svg>`), 1100);
      }
    };
    const delBtn = document.createElement('button');
    delBtn.title = "Delete";
    delBtn.className = "del-btn";
    delBtn.innerHTML = `<svg width="17" height="17" fill="none" viewBox="0 0 20 20"><path d="M5 6h10M9 6V4h2v2m-7 2h12l-1 10a2 2 0 01-2 2H8a2 2 0 01-2-2L5 8z"/></svg>`;
    delBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Delete this snippet?")) {
        chrome.storage.local.get(['clipboardHistory'], ({ clipboardHistory }) => {
          clipboardHistory = clipboardHistory || [];
          clipboardHistory.splice(idx, 1);
          chrome.storage.local.set({ clipboardHistory }, loadHistory);
        });
      }
    };
    iconWrap.appendChild(pinBtn);
    iconWrap.appendChild(copyBtn);
    iconWrap.appendChild(delBtn);
    const time = document.createElement('span');
    time.className = "time";
    time.textContent = new Date(item.time).toLocaleTimeString();
    li.appendChild(snippet);
    li.appendChild(iconWrap);
    li.appendChild(time);
    historyList.appendChild(li);
  });
}

function loadHistory() {
  chrome.storage.local.get(['clipboardHistory'], ({ clipboardHistory }) => {
    clipboardHistory = clipboardHistory || [];
    clipboardHistory = [
      ...clipboardHistory.filter(x => x.pinned),
      ...clipboardHistory.filter(x => !x.pinned)
    ];
    renderHistory(clipboardHistory);
  });
}

loadHistory();

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  chrome.storage.local.get(['clipboardHistory'], ({ clipboardHistory }) => {
    clipboardHistory = clipboardHistory || [];
    clipboardHistory = [
      ...clipboardHistory.filter(x => x.pinned),
      ...clipboardHistory.filter(x => !x.pinned)
    ];
    const filtered = clipboardHistory.filter(item =>
      item.text.toLowerCase().includes(query)
    );
    renderHistory(filtered);
  });
});

clearBtn.addEventListener('click', () => {
  if (confirm("Clear all clipboard history?")) {
    chrome.storage.local.set({ clipboardHistory: [] }, loadHistory);
  }
});

downloadBtn.addEventListener('click', () => {
  chrome.storage.local.get(['clipboardHistory'], ({ clipboardHistory }) => {
    clipboardHistory = clipboardHistory || [];
    if (!clipboardHistory.length) {
      alert('No clipboard history to download.');
      return;
    }
    clipboardHistory = [
      ...clipboardHistory.filter(x => x.pinned),
      ...clipboardHistory.filter(x => !x.pinned)
    ];
    const text = clipboardHistory.map(item => item.text).join('\n\n-----\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clipboard_history.txt';
    a.click();
    URL.revokeObjectURL(url);
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text && text.trim()) {
      chrome.storage.local.get(['clipboardHistory'], ({ clipboardHistory }) => {
        clipboardHistory = clipboardHistory || [];
        if (!clipboardHistory.length || clipboardHistory[0].text !== text) {
          clipboardHistory.unshift({ text, time: Date.now(), pinned: false });
          clipboardHistory = clipboardHistory.filter((item, idx, arr) =>
            arr.findIndex(x => x.text === item.text) === idx
          );
          if (clipboardHistory.length > 80) clipboardHistory.pop();
          chrome.storage.local.set({ clipboardHistory }, loadHistory);
        } else {
          loadHistory();
        }
      });
    } else {
      loadHistory();
    }
  } catch (e) {
    loadHistory();
  }
});
