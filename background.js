let queue = Promise.resolve(); // Use a queue as a synchronization mechanism.
const CHECK_INTERVAL = 60 * 1000; // Check rules every minute.

chrome.runtime.onInstalled.addListener(() => {
    queue = queue.then(() => updateDynamicRules());
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

async function updateRulesPeriodically() {
    queue = queue.then(() => updateDynamicRules());
}
setInterval(updateRulesPeriodically, CHECK_INTERVAL);

const DEBUG = true;
async function updateDynamicRules() {
    const result = await chrome.storage.sync.get(["rules"]);
    const rules = result.rules || [];
    if (DEBUG) console.log("Current rules:", rules);

    const dynamicRules = [];
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    rules.forEach((rule, index) => {
        if (rule.timeRangeStart !== undefined && rule.timeRangeEnd !== undefined) {
            if (rule.timeRangeStart <= currentTime && currentTime <= rule.timeRangeEnd) {
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
    console.log("Dynamic rules to set:", dynamicRules.map(r => `(${r.id}, ${r.condition.urlFilter})`));

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingIds,
        addRules: dynamicRules
    }).then(() => { if (DEBUG) console.log("success"); }, (msg) => { console.error(msg); });
}
