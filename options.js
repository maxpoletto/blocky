document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("options-form");
    const rulesContainer = document.getElementById("rules-container");
    const addRuleButton = document.getElementById("add-rule-button");
  
    chrome.storage.sync.get(["rules"], function(result) {
      const rules = result.rules || [];
      rules.forEach(rule => addRule(rule.pattern, rule.timeRange));
    });
  
    addRuleButton.addEventListener("click", function() {
      addRule("", "");
    });
  
    form.addEventListener("submit", function(event) {
      event.preventDefault();
      const rules = [];
      const ruleElements = document.querySelectorAll(".rule");
      ruleElements.forEach(ruleElement => {
        const pattern = ruleElement.querySelector(".pattern").value;
        const timeRange = ruleElement.querySelector(".time-range").value;
        if (pattern) {
          rules.push({pattern, timeRange});
        }
      });
      chrome.storage.sync.set({rules}, function() {
        chrome.runtime.sendMessage({updateRules: true});
        alert("Rules saved!");
      });
    });
  
    function addRule(pattern, timeRange) {
      const ruleDiv = document.createElement("div");
      ruleDiv.className = "rule";
      ruleDiv.innerHTML = `
        <input type="text" class="pattern" placeholder="URL pattern" value="${pattern}">
        <input type="text" class="time-range" placeholder="Time range (optional)" value="${timeRange}">
        <button type="button" class="remove-rule-button">Remove</button>
      `;
      ruleDiv.querySelector(".remove-rule-button").addEventListener("click", function() {
        ruleDiv.remove();
      });
      rulesContainer.appendChild(ruleDiv);
    }
  });
  