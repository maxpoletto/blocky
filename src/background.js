const isFirefox = typeof browser !== "undefined";
if (!isFirefox) {
    var browser = chrome;
}

let queue = Promise.resolve(); // Use a queue as a synchronization mechanism.

browser.runtime.onInstalled.addListener(() => {
    queue = queue.then(() => updateDynamicRules());
    browser.alarms.create('updateRulesPeriodically', { delayInMinutes: 1, periodInMinutes: 1 });
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.updateRules) {
        queue = queue.then(() => updateDynamicRules());
    }
});

browser.storage.onChanged.addListener((changes) => {
    if (changes.rules) {
        queue = queue.then(() => updateDynamicRules());
    }
});

browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateRulesPeriodically') {
      queue = queue.then(() => updateDynamicRules());
    }
  });

async function updateDynamicRules() {
    const result = await browser.storage.sync.get(["rules"]);
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
                    "action": { "type": "redirect", "redirect": { "extensionPath": "/blocked.html" } },
                    "condition": { "urlFilter": rule.pattern, "resourceTypes": ["main_frame"] }
                });
            }
        } else {
            dynamicRules.push({
                "id": index + 1,
                "priority": 1,
                "action": { "type": "redirect", "redirect": { "extensionPath": "/blocked.html" } },
                "condition": { "urlFilter": rule.pattern, "resourceTypes": ["main_frame"] }
            });
        }
    });

    const existingIds = (await browser.declarativeNetRequest.getDynamicRules()).map(r => r.id);
    await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingIds,
        addRules: dynamicRules
    }).then(() => {}, (msg) => { console.error(msg); });
}
