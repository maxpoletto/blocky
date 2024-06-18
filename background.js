let queue = Promise.resolve();

chrome.runtime.onInstalled.addListener(() => {
    console.log("onInstalled");
    queue = queue.then(() => updateDynamicRules());
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.updateRules) {
        console.log("onMessage");
        queue = queue.then(() => updateDynamicRules());
    }
  });
  
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.rules) {
      console.log("onChange");
      queue = queue.then(() => updateDynamicRules());
    }
  });
  
  async function updateDynamicRules() {
    console.log("updateDynamicRules called.");

    const result = await chrome.storage.sync.get(["rules"]);
    const rules = result.rules || [];
    console.log("Current rules:", rules);
    const dynamicRules = [];
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
  
    rules.forEach((rule, index) => {
      if (rule.timeRange) {
        console.log(`considering time range ${rule.timeRange} for ${rule.pattern}`);
        const [start, end] = rule.timeRange.split("-").map(t => {
          const [h, m] = t.split(":").map(Number);
          return h * 60 + m;
        });
        if (start <= currentTime && currentTime <= end) {
            console.log(`  adding time range ${rule.timeRange} for ${rule.pattern}`);
            dynamicRules.push({
            "id": index + 1,
            "priority": 1,
            "action": { "type": "redirect", "redirect": { "url": chrome.runtime.getURL("blocked.html") } },
            "condition": { "urlFilter": rule.pattern, "resourceTypes": ["main_frame"] }
          });
        }
      } else {
        console.log(`adding ${rule.pattern}`);
        dynamicRules.push({
          "id": index + 1,
          "priority": 1,
          "action": { "type": "redirect", "redirect": { "url": chrome.runtime.getURL("blocked.html") } },
          "condition": { "urlFilter": rule.pattern, "resourceTypes": ["main_frame"] }
        });
      }
    });
  
    console.log("Dynamic rules to set:", dynamicRules.map(r => `(${r.id}, ${r.condition.urlFilter})`));
  
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingIds = existingRules.map(r => r.id);
  
    console.log("Existing rule IDs:", existingIds);

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingIds,
        addRules: dynamicRules
    }).then(() => { console.log("success"); }, (msg) => { console.error(msg); });
    /*
    // First remove all existing rules
    await new Promise((resolve, reject) => {
        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingIds,
          addRules: dynamicRules
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error removing old dynamic rules:", chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            console.log("Old dynamic rules removed successfully.");
            resolve();
          }
        });
      });
      */
  /*
      // Now add the new rules
      await new Promise((resolve, reject) => {
        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [],
          addRules: dynamicRules
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error adding new dynamic rules:", chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            console.log("New dynamic rules added successfully.");
            resolve();
          }
        });
      });  
      */
}
