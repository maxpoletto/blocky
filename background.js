let queue = Promise.resolve(); // Use a queue as a synchronization mechanism.

chrome.runtime.onInstalled.addListener(() => {
    queue = queue.then(() => updateDynamicRules());
    chrome.alarms.create('updateRulesPeriodically', { periodInMinutes: 1 });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.updateRules) {
        queue = queue.then(() => updateDynamicRules());
    }
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.rules) {
        queue = queue.then(() => updateDynamicRules());
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateRulesPeriodically') {
      queue = queue.then(() => updateDynamicRules());
    }
  });

async function updateDynamicRules() {
    console.log('updating blocky rules');
    const result = await chrome.storage.sync.get(["rules"]);
    const rules = result.rules || [];

    const dynamicRules = [];
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    rules.forEach((rule, index) => {
        if (rule.timeStart !== undefined && rule.timeEnd !== undefined) {
            if (rule.timeStart <= currentTime && currentTime <= rule.timeEnd) {
                dynamicRules.push({
                    "id": index + 1,
                    "priority": 1,
                    "action": { "type": "redirect", "redirect": { "url": chrome.runtime.getURL("blocked.html") } },
                    "condition": { "urlFilter": rule.pattern, "resourceTypes": ["main_frame"] }
                });
            }
        } else {
            dynamicRules.push({
                "id": index + 1,
                "priority": 1,
                "action": { "type": "redirect", "redirect": { "url": chrome.runtime.getURL("blocked.html") } },
                "condition": { "urlFilter": rule.pattern, "resourceTypes": ["main_frame"] }
            });
        }
    });

    const existingIds = (await chrome.declarativeNetRequest.getDynamicRules()).map(r => r.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingIds,
        addRules: dynamicRules
    }).then(() => {}, (msg) => { console.error(msg); });
}
