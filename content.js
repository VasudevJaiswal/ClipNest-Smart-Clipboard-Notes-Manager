function saveClipboardText(text) {
  if (!text || !text.trim()) return;
  chrome.storage.local.get(['clipboardHistory'], ({ clipboardHistory }) => {
    clipboardHistory = clipboardHistory || [];
    if (!clipboardHistory.length || clipboardHistory[0].text !== text) {
      clipboardHistory.unshift({ text, time: Date.now(), pinned: false });
      clipboardHistory = clipboardHistory.filter((item, idx, arr) =>
        arr.findIndex(x => x.text === item.text) === idx
      );
      if (clipboardHistory.length > 80) clipboardHistory.pop();
      chrome.storage.local.set({ clipboardHistory });
    }
  });
}

document.addEventListener('copy', (e) => {
  let selected = document.getSelection();
  if (selected && selected.toString().trim()) {
    saveClipboardText(selected.toString());
  }
});

document.addEventListener('paste', (e) => {
  let pasted = (e.clipboardData || window.clipboardData).getData('text');
  if (pasted && pasted.trim()) {
    saveClipboardText(pasted);
  }
});
