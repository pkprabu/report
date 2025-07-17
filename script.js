document.addEventListener('DOMContentLoaded', function () {
const STORAGE_KEY = 'emailBuilderState';

const defaultState = {
    metrics: [
        { region: 'EMEA', deployed: '4', production: '0', followup: '1', listupdated: '0', landingpage: '0', qualtrics: '0', pathfactory: '0', adhoc: '0' },
        { region: 'LATAM', deployed: '1', production: '0', followup: '0', listupdated: '0', landingpage: '0', qualtrics: '0', pathfactory: '0', adhoc: '0' },
        { region: 'NA', deployed: '7', production: '0', followup: '0', listupdated: '0', landingpage: '0', qualtrics: '0', pathfactory: '0', adhoc: '0' },
        { region: 'GLOBAL', deployed: '0', production: '2', followup: '0', listupdated: '0', landingpage: '0', qualtrics: '0', pathfactory: '0', adhoc: '0' }
    ],
    deployed: [], production: [], followup: [],
    headers: {
        deployed: 'Deployed Campaigns',
        production: 'Production Campaigns',
        followup: 'Follow Up Campaigns'
    },
    wip_link: 'https://docs.google.com/spreadsheets/d/1GTLyTLl7SJDwWB-FeKkUGPErqPFkJn09-T3Szilyzg/edit?pli=1&gid=90158843#gid=90158843',
    sections: { deployed: true, production: true, followup: true }
};

function saveState() {
    const currentState = {
        metrics: [], deployed: [], production: [], followup: [],
        headers: {},
        wip_link: document.querySelector('[data-id="wip_link"] a')?.href || '',
        sections: {
            deployed: document.getElementById('deployed-campaigns-section').style.display !== 'none',
            production: document.getElementById('production-campaigns-section').style.display !== 'none',
            followup: document.getElementById('followup-campaigns-section').style.display !== 'none'
        }
    };
    document.querySelectorAll('#main-metrics-tbody tr').forEach(row => {
        currentState.metrics.push({
            region: row.cells[0].textContent.trim(), deployed: row.cells[1].textContent.trim(), production: row.cells[2].textContent.trim(),
            followup: row.cells[3].textContent.trim(), listupdated: row.cells[4].textContent.trim(), landingpage: row.cells[5].textContent.trim(),
            qualtrics: row.cells[6].textContent.trim(), pathfactory: row.cells[7].textContent.trim(), adhoc: row.cells[8].textContent.trim()
        });
    });
    ['deployed', 'production', 'followup'].forEach(type => {
        currentState.headers[type] = document.querySelector(`[data-id="header_${type}"]`)?.textContent.trim() || defaultState.headers[type];
        if (currentState.sections[type]) {
            document.querySelectorAll(`#${type}-campaigns-tbody tr`).forEach(row => {
                currentState[type].push({ name: row.cells[0].textContent.trim(), url: row.cells[1].querySelector('a')?.href || '' });
            });
        }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
}

function loadState() {
    // --- THIS IS THE CRITICAL FIX ---
    // Get the saved state, or an empty object if nothing is saved.
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    // Merge the saved state with the default state. This ensures all properties exist.
    // Nested objects like 'headers' and 'sections' are also merged safely.
    const state = {
        ...defaultState,
        ...savedState,
        headers: { ...defaultState.headers, ...(savedState.headers || {}) },
        sections: { ...defaultState.sections, ...(savedState.sections || {}) }
    };
    // --- END OF FIX ---

    const metricsTbody = document.getElementById('main-metrics-tbody');
    metricsTbody.innerHTML = '';
    state.metrics.forEach((d, i) => {
        const r = metricsTbody.insertRow(), alt = i % 2 !== 0;
        r.style.backgroundColor = alt ? '#f9f9f9' : '#ffffff';
        Object.entries(d).forEach(([k, v]) => {
            const c = r.insertCell(); c.textContent = v;
            c.style.cssText = `padding:12px 15px;text-align:left;border-bottom:1px solid #e9f5ed;background-color:${alt ? '#f9f9f9' : '#ffffff'};color:#333;font-family:'Segoe UI',Arial,sans-serif;`;
            if (k !== 'region') { c.className = 'editable-cell'; c.dataset.id = `metrics_${i}_${k}`; }
        });
    });
    ['deployed', 'production', 'followup'].forEach(type => {
        const section = document.getElementById(`${type}-campaigns-section`);
        const header = document.querySelector(`[data-id="header_${type}"]`);
        if (header) header.textContent = state.headers[type];
        section.style.display = state.sections[type] ? 'block' : 'none';
        if (state.sections[type]) {
            const tbody = document.getElementById(`${type}-campaigns-tbody`);
            tbody.innerHTML = '';
            state[type].forEach((d, i) => tbody.appendChild(createCampaignRow(type, i, d)));
        }
    });
    const wipLink = document.querySelector('[data-id="wip_link"] a');
    if (wipLink) wipLink.href = state.wip_link;
    attachAllListeners();
}

function createCampaignRow(type, index, data = { name: 'New Campaign', url: '#' }) {
    const row = document.createElement('tr');
    const isAlt = index % 2 !== 0;
    row.style.backgroundColor = isAlt ? '#f9f9f9' : '#ffffff';
    row.innerHTML = `<td class="editable-cell" data-id="${type}_${index}_name" style="padding:12px 15px;text-align:left;border-bottom:1px solid #eee;background-color:${isAlt ? '#f9f9f9' : '#fff'};color:#333;font-family:'Segoe UI',Arial,sans-serif;">${data.name}</td><td class="editable-cell link-cell" data-id="${type}_${index}_url" align="right" style="padding:12px 15px;text-align:right;border-bottom:1px solid #eee;background-color:${isAlt ? '#f9f9f9' : '#fff'};color:#333;font-family:'Segoe UI',Arial,sans-serif;"><a href="${data.url}" target="_blank" style="color:#0078d4;text-decoration:none;font-weight:500;">Link</a></td>`;
    return row;
}

function attachEditableListeners() {
    document.querySelectorAll('.editable-cell').forEach(cell => {
        cell.replaceWith(cell.cloneNode(true));
    });
    document.querySelectorAll('.editable-cell').forEach(cell => {
        cell.addEventListener('click', function handler(e) {
            if (cell.querySelector('input') || e.target.tagName === 'A') return;
            const isLink = cell.classList.contains('link-cell'), originalHTML = cell.innerHTML;
            const originalValue = isLink ? cell.querySelector('a')?.href : cell.textContent.trim();
            cell.innerHTML = '';
            const input = document.createElement('input');
            input.type = 'text'; input.value = originalValue;
            cell.appendChild(input); input.focus();
            const save = () => {
                if (isLink) { cell.innerHTML = originalHTML; cell.querySelector('a').href = input.value.trim(); }
                else { cell.textContent = input.value.trim(); }
                saveState();
            };
            input.addEventListener('blur', save);
            input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') save(); if (ev.key === 'Escape') cell.innerHTML = originalHTML; });
        });
    });
}

function attachAllListeners() {
    attachEditableListeners();
    document.getElementById('addDeployedRow').onclick = () => addRow('deployed');
    document.getElementById('deleteDeployedRow').onclick = () => deleteRow('deployed');
    document.getElementById('addProdRow').onclick = () => addRow('production');
    document.getElementById('deleteProdRow').onclick = () => deleteRow('production');
    document.getElementById('addFollowUpRow').onclick = () => addRow('followup');
    document.getElementById('deleteFollowUpRow').onclick = () => deleteRow('followup');
    document.getElementById('removeDeployedSection').onclick = () => removeSection('deployed');
    document.getElementById('removeProdSection').onclick = () => removeSection('production');
    document.getElementById('removeFollowUpSection').onclick = () => removeSection('followup');
    document.getElementById('resetButton').onclick = () => {
        if (confirm('Are you sure? This will reset all content and restore any removed sections.')) {
            localStorage.removeItem(STORAGE_KEY);
            loadState();
        }
    };
    document.getElementById('copyButton').onclick = handleManualCopy;
    const bulkInputs = ['bulk-names', 'bulk-urls', 'bulk-category'];
    bulkInputs.forEach(id => document.getElementById(id).addEventListener('input', validateBulkForm));
    document.getElementById('bulk-add-btn').onclick = handleBulkAdd;
}

function addRow(type) {
    const tbody = document.getElementById(`${type}-campaigns-tbody`);
    tbody.appendChild(createCampaignRow(type, tbody.rows.length));
    attachEditableListeners(); saveState();
}

function deleteRow(type) {
    const tbody = document.getElementById(`${type}-campaigns-tbody`);
    if (tbody.rows.length > 0) { tbody.deleteRow(-1); saveState(); }
    else { alert(`No rows to delete in the ${type} section.`); }
}

function removeSection(type) {
    if (confirm(`Remove the ${type} section?`)) {
        document.getElementById(`${type}-campaigns-section`).style.display = 'none';
        saveState();
    }
}

const bulkNamesInput = document.getElementById('bulk-names');
const bulkUrlsInput = document.getElementById('bulk-urls');
const bulkCategorySelect = document.getElementById('bulk-category');
const bulkAddBtn = document.getElementById('bulk-add-btn');
const validationMsg = document.getElementById('bulk-validation-msg');
const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

function validateBulkForm() {
    bulkNamesInput.classList.remove('invalid');
    bulkUrlsInput.classList.remove('invalid');
    const names = bulkNamesInput.value.split(/,|\n/).map(s => s.trim()).filter(Boolean);
    const urls = bulkUrlsInput.value.split(/,|\n/).map(s => s.trim()).filter(Boolean);
    const category = bulkCategorySelect.value;
    let msg = '', isValid = true;

    if (names.length === 0 && urls.length === 0 && !category) {
        validationMsg.textContent = ''; bulkAddBtn.disabled = true; return;
    }
    const allUrlsValid = urls.every(url => urlRegex.test(url));
    if (!allUrlsValid && urls.length > 0) {
        msg = 'One or more entries in URLS is not a valid URL.';
        bulkUrlsInput.classList.add('invalid'); isValid = false;
    } else if (names.length !== urls.length) {
        msg = `Found ${names.length} names and ${urls.length} URLs. Counts must match.`; isValid = false;
    } else if (names.length === 0) {
        msg = 'Campaign Names cannot be empty.'; isValid = false;
    } else if (!category) {
        msg = 'Please select a target section.'; isValid = false;
    } else {
        msg = `Ready to add ${names.length} campaign(s).`;
    }
    validationMsg.textContent = msg;
    validationMsg.style.color = isValid ? '#28a745' : '#dc3545';
    bulkAddBtn.disabled = !isValid;
}

function handleBulkAdd() {
    const names = bulkNamesInput.value.split(/,|\n/).map(s => s.trim()).filter(Boolean);
    const urls = bulkUrlsInput.value.split(/,|\n/).map(s => s.trim()).filter(Boolean);
    const type = bulkCategorySelect.value;
    if (!type || names.length !== urls.length || names.length === 0) return;
    const tbody = document.getElementById(`${type}-campaigns-tbody`);
    names.forEach((name, i) => {
        tbody.appendChild(createCampaignRow(type, tbody.rows.length, { name, url: urls[i] }));
    });
    attachEditableListeners(); saveState();
    alert(`${names.length} campaign(s) successfully added!`);
    bulkNamesInput.value = ''; bulkUrlsInput.value = ''; bulkCategorySelect.value = '';
    validateBulkForm();
}

function handleManualCopy() {
    const reportContainer = document.getElementById('interactive-container');
    try {
        const range = document.createRange();
        range.selectNode(reportContainer);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        alert('The entire report has been copied to your clipboard!\nYou can now paste it into Outlook.');
    } catch (err) {
        alert('Could not automatically copy the report. Please select it manually (Ctrl+A) and copy.');
        console.error('Copy failed:', err);
    }
}

loadState();
});
