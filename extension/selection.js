/* Nothing to see here */

chrome.contextMenus.onClicked.addListener((item, tab) => {
        chrome.sidePanel.open({ windowId: tab.windowId }, () => {
            console.log("Context clicked")
            setTimeout(() => {
                var port = chrome.runtime.connect({name: "fakeai_port"});

                port.postMessage({text: item.selectionText}, function(){
                    void chrome.runtime.lastError
                });
            }, 100);
        });
});

chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        "id": "selectionContext",
        "title": "Send to FakeAI",
        "contexts": ["selection"]
    });
});
