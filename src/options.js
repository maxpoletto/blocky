document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("options-form");
    const rulesContainer = document.getElementById("rules-container");
    const addRuleButton = document.getElementById("add-rule-button");
    const exportButton = document.getElementById("export-button");
    const importButton = document.getElementById("import-button");
    const importFile = document.getElementById("import-file");
    const successMessage = document.getElementById("success-message");

    chrome.storage.sync.get(["rules"], function (result) {
        const rules = result.rules || [];
        rules.forEach(rule => addRule(rule.pattern, rule.timeStart, rule.timeEnd));
    });

    addRuleButton.addEventListener("click", function () {
        addRule("", undefined, undefined);
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        saveRules();
    });

    exportButton.addEventListener("click", function () {
        chrome.storage.sync.get(["rules"], function (result) {
            const rules = result.rules || [];
            const blob = new Blob([JSON.stringify(rules, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "rules.json";
            a.click();
            URL.revokeObjectURL(url);
        });
    });

    importButton.addEventListener("click", function () {
        importFile.click();
    });

    importFile.addEventListener("change", function () {
        const file = importFile.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                // TODO: better check for corrupted data (not critical).
                const importedRules = JSON.parse(e.target.result);
                if (Array.isArray(importedRules)) {
                    chrome.storage.sync.set({ rules: importedRules }, function () {
                        rulesContainer.innerHTML = "";
                        importedRules.forEach(rule => addRule(rule.pattern, rule.timeStart, rule.timeEnd));
                    });
                } else {
                    alert("Invalid rules format.");
                }
            } catch (error) {
                alert("Failed to import rules. Please ensure the file is in the correct format.");
            }
        };
        reader.readAsText(file);
    });

    function saveRules() {
        const rules = [];
        const ruleElements = document.querySelectorAll(".rule");
        let valid = true;

        ruleElements.forEach(ruleElement => {
            const pattern = ruleElement.querySelector(".pattern").value.trim();
            const timeStart = ruleElement.querySelector(".time-start").value.trim();
            const timeEnd = ruleElement.querySelector(".time-end").value.trim();
            const errorElement = ruleElement.querySelector(".error");

            const parsedStart = parseTime(timeStart);
            const parsedEnd = parseTime(timeEnd);

            if (pattern.length == 0) {
                ruleElement.remove();
                return;
            }
            if (parsedStart === null || parsedEnd === null
                || typeof parsedStart == 'undefined' && typeof parsedEnd != 'undefined'
                || typeof parsedStart != 'undefined' && typeof parsedEnd == 'undefined') {
                errorElement.textContent = "Invalid time format. Use HH:MM and specify both start and end or neither.";
                valid = false;
            } else {
                errorElement.textContent = "";
                rules.push({
                    pattern: pattern,
                    timeStart: parsedStart,
                    timeEnd: parsedEnd
                });
            }
        });

        if (valid) {
            chrome.storage.sync.set({ rules }, function () {
                showSuccessMessage();
            });
        }
    }

    function showSuccessMessage() {
        successMessage.style.opacity = 1;
        setTimeout(() => {
            successMessage.style.opacity = 0;
        }, 2000);
    }

    function addRule(pattern, timeStart, timeEnd) {
        const ruleDiv = document.createElement("div");
        ruleDiv.className = "rule";

        const patternInput = document.createElement("input");
        patternInput.type = "text";
        patternInput.className = "pattern";
        patternInput.placeholder = "URL pattern";
        patternInput.value = pattern;

        const timeStartInput = document.createElement("input");
        timeStartInput.type = "text";
        timeStartInput.className = "time-start";
        timeStartInput.placeholder = "Start time (HH:MM)";
        timeStartInput.value = unparseTime(timeStart);

        const timeEndInput = document.createElement("input");
        timeEndInput.type = "text";
        timeEndInput.className = "time-end";
        timeEndInput.placeholder = "End time (HH:MM)";
        timeEndInput.value = unparseTime(timeEnd);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-rule-button";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", function () {
            ruleDiv.remove();
        });

        const errorSpan = document.createElement("span");
        errorSpan.className = "error";

        ruleDiv.appendChild(patternInput);
        ruleDiv.appendChild(timeStartInput);
        ruleDiv.appendChild(timeEndInput);
        ruleDiv.appendChild(removeButton);
        ruleDiv.appendChild(errorSpan);

        rulesContainer.appendChild(ruleDiv);
    }

    function parseTime(ts) {
        if (ts.length == 0) return undefined;
        const parts = ts.split(":");
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
        const h = (t - m) / 60;
        return `${h.toFixed(0)}:${m.toFixed(0).padStart(2, '0')}`;
    }
});
