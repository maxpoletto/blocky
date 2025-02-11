let debug = false;
const isFirefox = typeof browser !== "undefined";
let b = isFirefox ? browser : chrome;

function log(...args) {
    if (debug) {
        console.log(...args);
    }
}

let queue = Promise.resolve(); // Use a queue as a synchronization mechanism.

b.runtime.onInstalled.addListener(() => {
    log("Extension installed/updated");
    queue = queue.then(() => updateDynamicRules());
    b.alarms.create('updateRulesPeriodically', { delayInMinutes: 1, periodInMinutes: 1 });
    b.alarms.getAll().then(alarms => {
        log("Current alarms:", alarms);
    });
});

b.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.updateRules) {
        log("updateDynamicRules called from message listener");
        queue = queue.then(() => updateDynamicRules());
    }
});

b.storage.onChanged.addListener((changes) => {
    if (changes.rules) {
        log("updateDynamicRules called from storage listener");
        queue = queue.then(() => updateDynamicRules());
    }
});

b.alarms.onAlarm.addListener((alarm) => {
    log("Alarm fired:", alarm.name, new Date().toISOString());
    if (alarm.name === 'updateRulesPeriodically') {
        log("Running periodic update");
        queue = queue.then(() => updateDynamicRules())
            .catch(err => log("Error in periodic update:", err));
    }
});

async function checkAlarmAndUpdate() {
    const alarms = await b.alarms.getAll();
    const hasUpdateAlarm = alarms.some(a => a.name === 'updateRulesPeriodically');
    if (!hasUpdateAlarm) {
        log("Main alarm missing, recreating");
        b.alarms.create('updateRulesPeriodically', { delayInMinutes: 1, periodInMinutes: 1 });
        queue = queue.then(() => updateDynamicRules());
    }
}

if (isFirefox) {
    b.tabs.onActivated.addListener(() => {
        checkAlarmAndUpdate();
    });
}

async function updateDynamicRules() {
    console.log("Blocky updating dynamic rules"); // Always log to console
    const result = await b.storage.sync.get(["rules"]);
    const rules = result.rules || [];
    log("Rules:", rules);

    const dynamicRules = [];
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    log("Current time:", currentTime);

    rules.forEach((rule, index) => {
        if (rule.timeStart !== undefined && rule.timeEnd !== undefined) {
            const isActive = rule.timeStart <= currentTime && currentTime <= rule.timeEnd;
            log(`Rule ${index}: ${rule.pattern} - window ${rule.timeStart}-${rule.timeEnd}, current: ${currentTime}, active: ${isActive}`);
            if (isActive) {
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

    const existingIds = (await b.declarativeNetRequest.getDynamicRules()).map(r => r.id);
    log("Existing rule IDs:", existingIds);
    log("New dynamic rules:", dynamicRules);
    try {
        await b.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: existingIds,
            addRules: dynamicRules
        });
        log("Dynamic rules updated successfully");
    } catch (err) {
        log("Error in updateDynamicRules:", err);
    }
}
