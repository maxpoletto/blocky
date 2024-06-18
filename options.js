document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("options-form");
    const rulesContainer = document.getElementById("rules-container");
    const addRuleButton = document.getElementById("add-rule-button");

    chrome.storage.sync.get(["rules"], function (result) {
        const rules = result.rules || [];
        rules.forEach(rule => addRule(rule.pattern, rule.timeRangeStart, rule.timeRangeEnd));
    });

    addRuleButton.addEventListener("click", function () {
        addRule("", undefined, undefined);
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const rules = [];
        const ruleElements = document.querySelectorAll(".rule");
        let valid = true;

        ruleElements.forEach(ruleElement => {
            const pattern = ruleElement.querySelector(".pattern").value.trim();
            const timeRangeStart = ruleElement.querySelector(".time-range-start").value.trim();
            const timeRangeEnd = ruleElement.querySelector(".time-range-end").value.trim();
            const errorElement = ruleElement.querySelector(".error");

            const parsedStart = parseTime(timeRangeStart);
            const parsedEnd = parseTime(timeRangeEnd);

            if (pattern.length == 0) return;
            if (parsedStart === null || parsedEnd === null
                || typeof parsedStart == 'undefined' && typeof parsedEnd != 'undefined'
                || typeof parsedStart != 'undefined' && typeof parsedEnd == 'undefined') {
                errorElement.textContent = "Invalid time format. Use HH:MM and specify both start and end or neither.";
                valid = false;
            } else {
                errorElement.textContent = "";
                rules.push({
                    pattern: pattern,
                    timeRangeStart: parsedStart,
                    timeRangeEnd: parsedEnd
                });
            }
        });

        if (valid) {
            chrome.storage.sync.set({ rules }, function () {
                chrome.runtime.sendMessage({ updateRules: true });
                alert("Rules saved!");
            });
        }
    });

    function addRule(pattern, timeRangeStart, timeRangeEnd) {
        const ruleDiv = document.createElement("div");
        ruleDiv.className = "rule";
        ruleDiv.innerHTML = `
        <input type="text" class="pattern" placeholder="URL pattern" value="${pattern}">
        <input type="text" class="time-range-start" placeholder="Start time (HH:MM)" value="${unparseTime(timeRangeStart)}">
        <input type="text" class="time-range-end" placeholder="End time (HH:MM)" value="${unparseTime(timeRangeEnd)}">
        <button type="button" class="remove-rule-button">Remove</button>
        <span class="error"></span>
      `;
        ruleDiv.querySelector(".remove-rule-button").addEventListener("click", function () {
            ruleDiv.remove();
        });
        rulesContainer.appendChild(ruleDiv);
    }

    function parseTime(timeStr) {
        if (timeStr.length == 0) return undefined;
        const parts = timeStr.split(":");
        if (parts.length !== 2) return null;
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) {
            return null;
        }
        return hours * 60 + minutes;
    }
    function unparseTime(t) {
        if (typeof t === 'undefined') return "";
        const m = t % 60;
        const h = (t - m)/60;
        return `${h.toFixed(0)}:${m.toFixed(0).padStart(2, '0')}`;
    }
});
