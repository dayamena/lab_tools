document.addEventListener('DOMContentLoaded', () => {
    // --- Access Control Logic ---
    const loginOverlay = document.getElementById('login-overlay');
    const mainApp = document.getElementById('main-app-content');
    const loginBtn = document.getElementById('login-btn');
    const pinInput = document.getElementById('access-pin');
    const errorMsg = document.getElementById('login-error');

    function checkLogin() {
        const pin = pinInput.value;
        if (pin === "2021") {
            loginOverlay.style.opacity = '0';
            setTimeout(() => {
                loginOverlay.style.display = 'none';
                mainApp.classList.add('active');
                mainApp.classList.remove('blur-content');
            }, 500);
        } else {
            errorMsg.innerText = "Incorrect Code";
            pinInput.value = "";
            pinInput.focus();
        }
    }

    loginBtn.addEventListener('click', checkLogin);
    pinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkLogin();
    });

    // Auto focus
    setTimeout(() => pinInput.focus(), 100);


    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.tool-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(s => {
                s.classList.remove('active-section');
                if (s.id === targetId) s.classList.add('active-section');
            });

            if (targetId === 'saved') loadSavedItems();
        });
    });

    // Theme Toggle
    const themeBtn = document.getElementById('theme-btn');
    const body = document.body;
    let isDark = false;

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        isDark = true;
        body.setAttribute('data-theme', 'dark');
        themeBtn.querySelector('i').className = 'ph ph-sun';
    }

    themeBtn.addEventListener('click', () => {
        isDark = !isDark;
        if (isDark) {
            body.setAttribute('data-theme', 'dark');
            themeBtn.querySelector('i').className = 'ph ph-sun';
        } else {
            body.removeAttribute('data-theme');
            themeBtn.querySelector('i').className = 'ph ph-moon';
        }
    });

    // Utility: Format Number
    function formatNumber(num) {
        if (num === 0) return "0";
        if (Math.abs(num) < 0.01 || Math.abs(num) > 10000) {
            return num.toExponential(3);
        }
        return parseFloat(num.toFixed(4));
    }

    // --- Dilution Calculator ---
    const dilInputs = ['dil-c1', 'dil-c2', 'dil-v2', 'dil-c1-unit', 'dil-c2-unit', 'dil-v2-unit'];
    dilInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', calculateDilution);
            el.addEventListener('change', calculateDilution);
        }
    });

    function calculateDilution() {
        const c1 = parseFloat(document.getElementById('dil-c1').value);
        const c2 = parseFloat(document.getElementById('dil-c2').value);
        const v2 = parseFloat(document.getElementById('dil-v2').value);

        const u1 = document.getElementById('dil-c1-unit').value;
        const u2 = document.getElementById('dil-c2-unit').value;
        const uv2 = document.getElementById('dil-v2-unit').value;

        if (isNaN(c1) || isNaN(c2) || isNaN(v2) || c1 === 0) return;

        const unitFactors = {
            'M': 1, 'mM': 1e-3, 'uM': 1e-6, 'nM': 1e-9,
            'mg/mL': 1, '%': 10, 'x': 1
        };

        let ratio = 1;
        if (u1 !== u2 && unitFactors[u1] && unitFactors[u2]) {
            ratio = unitFactors[u2] / unitFactors[u1];
        }

        const c2_normalized = c2 * ratio;
        const v1 = (c2_normalized * v2) / c1;
        const solvent = v2 - v1;

        const resEl = document.getElementById('dil-result');
        if (v1 < 0 || solvent < 0) {
            resEl.innerHTML = '<div class="result-placeholder" style="color:red">Impossible dilution.</div>';
            return;
        }

        resEl.innerHTML = `
            <div>Add <span class="result-value-big">${formatNumber(v1)} ${uv2}</span> of Stock</div>
            <div>to <span class="result-value-big">${formatNumber(solvent)} ${uv2}</span> of Solvent</div>
            <div class="result-detail">Total Volume: ${v2} ${uv2}</div>
        `;
    }

    // --- Molarity Calculator ---
    let molMode = 'mass';
    const molTabs = document.querySelectorAll('.tabs-internal .tab-btn');
    molTabs.forEach(t => {
        t.addEventListener('click', () => {
            molTabs.forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            molMode = t.getAttribute('data-mode');
            updateMolarityUI();
            calculateMolarity();
        });
    });

    const molInputs = ['mol-mw', 'mol-conc', 'mol-vol', 'mol-mass', 'mol-conc-unit', 'mol-vol-unit', 'mol-mass-unit'];
    molInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', calculateMolarity);
            el.addEventListener('change', calculateMolarity);
        }
    });

    function updateMolarityUI() {
        document.getElementById('group-conc').style.display = 'flex';
        document.getElementById('group-vol').style.display = 'flex';
        document.getElementById('group-mass').style.display = 'flex';

        if (molMode === 'mass') document.getElementById('group-mass').style.display = 'none';
        if (molMode === 'conc') document.getElementById('group-conc').style.display = 'none';
        if (molMode === 'vol') document.getElementById('group-vol').style.display = 'none';
    }

    function calculateMolarity() {
        const mw = parseFloat(document.getElementById('mol-mw').value);
        if (isNaN(mw)) return;

        const massUnit = document.getElementById('mol-mass-unit').value;
        const volUnit = document.getElementById('mol-vol-unit').value;
        const concUnit = document.getElementById('mol-conc-unit').value;

        const massFactors = { 'g': 1, 'mg': 1e-3, 'ug': 1e-6 };
        const volFactors = { 'L': 1, 'mL': 1e-3, 'uL': 1e-6 };
        const concFactors = { 'M': 1, 'mM': 1e-3, 'uM': 1e-6 };

        if (molMode === 'mass') {
            const conc = parseFloat(document.getElementById('mol-conc').value);
            const vol = parseFloat(document.getElementById('mol-vol').value);
            if (isNaN(conc) || isNaN(vol)) return;

            const concM = conc * concFactors[concUnit];
            const volL = vol * volFactors[volUnit];
            const massG = concM * volL * mw;
            const massMg = massG * 1000;

            document.getElementById('mol-result').innerHTML = `
                <div>Required Mass:</div>
                <div class="result-value-big">${formatNumber(massG)} g</div>
                <div class="result-detail">or ${formatNumber(massMg)} mg</div>
             `;
        } else if (molMode === 'conc') {
            const mass = parseFloat(document.getElementById('mol-mass').value);
            const vol = parseFloat(document.getElementById('mol-vol').value);
            if (isNaN(mass) || isNaN(vol)) return;

            const massG = mass * massFactors[massUnit];
            const volL = vol * volFactors[volUnit];
            const concM = massG / (volL * mw);
            const concmM = concM * 1000;

            document.getElementById('mol-result').innerHTML = `
                <div>Concentration:</div>
                <div class="result-value-big">${formatNumber(concM)} M</div>
                <div class="result-detail">or ${formatNumber(concmM)} mM</div>
             `;
        } else if (molMode === 'vol') {
            const mass = parseFloat(document.getElementById('mol-mass').value);
            const conc = parseFloat(document.getElementById('mol-conc').value);
            if (isNaN(mass) || isNaN(conc)) return;

            const massG = mass * massFactors[massUnit];
            const concM = conc * concFactors[concUnit];
            const volL = massG / (concM * mw);
            const volmL = volL * 1000;

            document.getElementById('mol-result').innerHTML = `
                <div>Required Volume:</div>
                <div class="result-value-big">${formatNumber(volmL)} mL</div>
                <div class="result-detail">${formatNumber(volL)} L</div>
             `;
        }
    }


    // --- BCA Calculator ---
    document.getElementById('add-std-row').addEventListener('click', () => {
        const tbody = document.querySelector('#std-curve-table tbody');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="number" class="std-conc" value=""></td>
            <td><input type="number" class="std-abs" value=""></td>
            <td><button class="row-btn del-row"><i class="ph ph-x"></i></button></td>
        `;
        tbody.appendChild(tr);
        bindBCAEvents();
    });

    bindBCAEvents();

    function bindBCAEvents() {
        document.querySelectorAll('.std-conc, .std-abs').forEach(i => {
            i.removeEventListener('input', updateCurve);
            i.addEventListener('input', updateCurve);
        });
        document.querySelectorAll('.del-row').forEach(b => {
            b.onclick = (e) => {
                e.target.closest('tr').remove();
                updateCurve();
            }
        });
    }

    document.getElementById('sample-abs').addEventListener('input', calculateSample);

    let curveSlope = 0;
    let curveIntercept = 0;
    let rSquared = 0;

    function updateCurve() {
        const concs = [];
        const abss = [];
        document.querySelectorAll('#std-curve-table tbody tr').forEach(tr => {
            const c = parseFloat(tr.querySelector('.std-conc').value);
            const a = parseFloat(tr.querySelector('.std-abs').value);
            if (!isNaN(c) && !isNaN(a)) {
                concs.push(c);
                abss.push(a);
            }
        });

        if (concs.length < 2) return;

        const n = concs.length;
        const sumX = concs.reduce((a, b) => a + b, 0); // Conc is X? Usually Std Curve plots Abs (y) vs Conc (x).
        const sumY = abss.reduce((a, b) => a + b, 0);
        const sumXY = concs.reduce((sum, x, i) => sum + x * abss[i], 0);
        const sumXX = concs.reduce((sum, x) => sum + x * x, 0);

        // y = mx + b
        curveSlope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        curveIntercept = (sumY - curveSlope * sumX) / n;

        // R2
        const sumYY = abss.reduce((sum, y) => sum + y * y, 0); // Need only for R2 if calculating via Pearson
        const ssTot = abss.reduce((sum, y) => sum + Math.pow(y - (sumY / n), 2), 0);
        const ssRes = concs.reduce((sum, x, i) => {
            const yPred = curveSlope * x + curveIntercept;
            return sum + Math.pow(abss[i] - yPred, 2);
        }, 0);

        rSquared = 1 - (ssRes / ssTot);

        document.getElementById('curve-stats').innerHTML =
            `Fit: y = ${curveSlope.toFixed(4)}x + ${curveIntercept.toFixed(4)} <br> R² = ${rSquared.toFixed(4)}`;

        calculateSample();
    }

    function calculateSample() {
        const abs = parseFloat(document.getElementById('sample-abs').value);
        const resultArea = document.querySelector('#bca-result .value');

        if (isNaN(abs) || curveSlope === 0) {
            resultArea.innerText = "--";
            return;
        }
        // y = mx + b -> x = (y - b) / m
        const conc = (abs - curveIntercept) / curveSlope;
        resultArea.innerText = formatNumber(conc);
    }


    // --- Recipes Calculator ---
    const recipeData = {
        'lb': {
            name: 'LB Broth',
            ingredients: [
                { name: 'Tryptone', amount: 10, unit: 'g' },
                { name: 'NaCl', amount: 10, unit: 'g' }, // Standard is 10g NaCl (Miller) or 5g (Lennox). User said 5g for 500mL => 10g/L.
                { name: 'Yeast Extract', amount: 5, unit: 'g' },
                { name: 'MiliQ H2O', amount: -1, unit: 'L' } // -1 means QS to Volume
            ],
            notes: "Autoclave to sterilize."
        },
        'tb': {
            name: 'TB Broth',
            ingredients: [
                { name: 'TB Powder', amount: 50.8, unit: 'g' },
                { name: 'Glycerol 50%', amount: 8, unit: 'mL' },
                { name: 'MiliQ H2O', amount: -1, unit: 'L' }
            ],
            notes: "Fill to volume with MiliQ H2O."
        },
        'lysis': {
            name: 'Lysis Buffer',
            ingredients: [
                { name: 'MES pH 6 (Stock 1M)', amount: 20, unit: 'mM' }, // Logic note: complex buffers usually made from stocks.
                // For simplicity, we'll assume making FROM stocks if units are mM, or direct masses.
                // The user recipe: "20mM MES, 1mM EGTA, ..."
                // To print a recipe, we need to know if we are weighing things or diluting stocks.
                // Let's print the required Molarity and users calculate stocks usage? 
                // OR assume standard stocks? 
                // Let's just list the Final Concentrations for the components like the user provided, OR
                // if the user wants "how much to add", we need Stock concentrations.
                // User didn't provide stocks except for Lysis/Buffers, usually 1M stocks assumed or added as solids.
                // Let's just create a list text similar to input but scaled?
                // Actually, the user PROBABLY wants to know how much to weigh or add.
                // Let's assume defaults: MES (1M Stock or Powder? usually Stock for buffers).
                // Let's display the recipe text as-is, BUT with a "Volume Multiplier" note, or better:
                // Let's assume standard stocks: 1M MES, 1M NaCl, 1M EGTA, 1M MgCl2, 1M DTT.
                { name: 'MES (from 1M)', amount: 20, unit: 'mL', _molarity: 20 }, // 20mM needed -> 20mL of 1M in 1L.
                { name: 'EGTA (from 1M)', amount: 1, unit: 'mL', _molarity: 1 },
                { name: 'MgCl2 (from 1M)', amount: 0.2, unit: 'mL', _molarity: 0.2 },
                { name: 'PMSF', amount: 1, unit: 'mM', manual: true }, // "Spike in"
                { name: 'DTT', amount: 5, unit: 'mM', manual: true }, // "Spike in"
                { name: 'Protease Inhibitor', amount: 0, unit: 'tablet', manual: true },
            ],
            notes: "Spike in PMSF, DTT, and Protease Inhibitors just before use."
        },
        'bufferA': {
            name: 'Buffer A',
            ingredients: [
                { name: 'MES (from 1M)', amount: 20, unit: 'mL', _molarity: 20 },
                { name: 'NaCl (from 5M)', amount: 10, unit: 'mL', _molarity: 50 }, // 50mM needed. If Stock 5M -> 10mL. If 1M -> 50mL. Let's assume 1M default if not specific? 
                // Let's be safe and list "Amount for 1L" then user can select volume.
                { name: 'EGTA (from 1M)', amount: 1, unit: 'mL', _molarity: 1 },
                { name: 'MgCl2 (from 1M)', amount: 0.2, unit: 'mL', _molarity: 0.2 },
                { name: 'DTT', amount: 2, unit: 'mM', manual: true }
            ],
            notes: "Spike in DTT before use."
        },
        'bufferB': {
            name: 'Buffer B',
            ingredients: [
                { name: 'MES (from 1M)', amount: 20, unit: 'mL', _molarity: 20 },
                { name: 'NaCl (from 5M)', amount: 200, unit: 'mL', _molarity: 1000 }, // 1M needed. 1000mM. From 5M Stock -> 200mL.
                { name: 'EGTA (from 1M)', amount: 1, unit: 'mL', _molarity: 1 },
                { name: 'MgCl2 (from 1M)', amount: 0.2, unit: 'mL', _molarity: 0.2 },
                { name: 'DTT', amount: 2, unit: 'mM', manual: true }
            ],
            notes: "Spike in DTT before use."
        },
        'sdsRun': {
            name: '10x SDS Running Buffer',
            ingredients: [
                { name: 'Tris Base', amount: 30, unit: 'g' },
                { name: 'Glycine', amount: 144, unit: 'g' },
                { name: 'SDS', amount: 10, unit: 'g' },
                { name: 'H2O', amount: -1, unit: 'L' }
            ],
            notes: "pH 8.3 (no adjustment needed). Heat to dissolve if needed."
        },
        'sdsLoad': {
            name: '5x SDS Loading Dye',
            ingredients: [
                { name: 'Tris 0.5M pH 6.8', amount: 1.2, unit: 'mL' }, // This recipe is for 10mL total. 
                { name: 'Glycerol 50%', amount: 5, unit: 'mL' },
                { name: 'SDS (10%)', amount: 2, unit: 'mL' },
                // User didn't specify Bromophenol blue but usually it's in there. I'll stick to their text.
            ],
            totalBaseVol: 10, // Special case: this recipe is defined for 10mL, not 1L
            totalBaseUnit: 'mL',
            notes: "Recipe defined for 10mL total volume."
        }
    };

    const recipeSel = document.getElementById('recipe-select');
    const recipeVol = document.getElementById('recipe-vol');
    const recipeUnit = document.getElementById('recipe-vol-unit');

    if (recipeSel) {
        recipeSel.addEventListener('change', updateRecipe);
        recipeVol.addEventListener('input', updateRecipe);
        recipeUnit.addEventListener('change', updateRecipe);
    }

    function updateRecipe() {
        const key = recipeSel.value;
        const display = document.getElementById('recipe-display');
        const notes = document.getElementById('recipe-notes');
        const content = document.getElementById('recipe-content');

        if (!key) {
            content.style.display = 'none';
            return;
        }
        content.style.display = 'block';

        const data = recipeData[key];
        const desiredVol = parseFloat(recipeVol.value);
        const desiredUnit = recipeUnit.value;

        // Convert desired volume to Liters for scaling (unless recipe is special)
        let factor = 1;

        let volInBaseUnits = desiredVol;
        if (desiredUnit === 'mL' && (data.totalBaseUnit !== 'mL')) volInBaseUnits = desiredVol / 1000; // Convert mL input to L standard
        if (desiredUnit === 'L' && (data.totalBaseUnit === 'mL')) volInBaseUnits = desiredVol * 1000; // Convert L input to mL standard

        const baseVol = data.totalBaseVol || 1; // Default base is 1 (liter)
        factor = volInBaseUnits / baseVol;

        if (isNaN(factor)) factor = 0;

        let html = '';
        data.ingredients.forEach(ing => {
            if (ing.manual) {
                html += `
                <div class="ingredient-row">
                    <span class="ing-name">${ing.name}</span>
                    <span class="ing-amount">Add to ${ing.amount} ${ing.unit}</span>
                </div>`;
            } else if (ing.amount < 0) {
                html += `
                <div class="ingredient-row">
                    <span class="ing-name">${ing.name}</span>
                    <span class="ing-amount">Fill to ${desiredVol} ${desiredUnit}</span>
                </div>`;
            } else {
                const amount = ing.amount * factor;
                html += `
                <div class="ingredient-row">
                    <span class="ing-name">${ing.name}</span>
                    <span class="ing-amount">${formatNumber(amount)} ${ing.unit}</span>
                </div>`;
            }
        });

        display.innerHTML = html;
        notes.innerText = data.notes;
    }


    // --- Tau Mastermix Calculator ---
    const tauInputs = ['tau-stock', 'tau-target', 'tau-well-vol', 'tau-final-vol', 'tau-n', 'tau-overhead'];
    tauInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', calculateTau);
            el.addEventListener('change', calculateTau);
        }
    });

    function calculateTau() {
        const stock = parseFloat(document.getElementById('tau-stock').value); // uM
        const target = parseFloat(document.getElementById('tau-target').value); // nM
        const wellVol = parseFloat(document.getElementById('tau-well-vol').value); // uL (V_added)
        const finalVol = parseFloat(document.getElementById('tau-final-vol').value); // uL (V_final)
        const n = parseFloat(document.getElementById('tau-n').value);
        const overhead = parseFloat(document.getElementById('tau-overhead').value) || 0;

        if (isNaN(stock) || isNaN(target) || isNaN(wellVol) || isNaN(finalVol) || isNaN(n)) return;

        // 1. Calculate needed Mastermix Concentration (C_MM)
        // C_MM * V_added = C_final * V_final
        // C_MM = (C_final * V_final) / V_added
        // C_final is nM, stick to nM first.

        const c_mm_nM = (target * finalVol) / wellVol;
        const c_mm_uM = c_mm_nM / 1000;

        // 2. Prep Calculation
        const totalWells = n + overhead;
        const totalMixVol = totalWells * wellVol;

        // C_stock * V_stock = C_MM * V_mix
        // V_stock = (C_MM * V_mix) / C_stock
        // Units: C_MM (uM), V_mix (uL), C_stock (uM) -> V_stock (uL)

        const v_stock = (c_mm_uM * totalMixVol) / stock;
        const v_buffer = totalMixVol - v_stock;

        document.getElementById('tau-result').innerHTML = `
            <div style="margin-bottom:1rem; border-bottom:1px solid var(--border); padding-bottom:0.5rem;">
                <strong>Mastermix Conc:</strong> <span class="result-value-big">${formatNumber(c_mm_uM)} µM</span>
            </div>
            <div>To make <strong>${formatNumber(totalMixVol)} µL</strong> of Mastermix:</div>
            <div style="margin-top:0.5rem">
                <div>Protein Stock: <span class="result-value-big">${formatNumber(v_stock)} µL</span></div>
                <div>Buffer: <span class="result-value-big">${formatNumber(v_buffer)} µL</span></div>
            </div>
        `;
    }

    // --- SAVE FUNCTIONALITY ---
    const saveBtns = document.querySelectorAll('.btn-save');
    saveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.getAttribute('data-tool');
            saveResult(tool);
        });
    });

    document.getElementById('clear-all-saved').addEventListener('click', () => {
        if (confirm("Clear all saved calculations?")) {
            localStorage.removeItem('rauchLabSaved');
            loadSavedItems();
        }
    });

    function saveResult(tool) {
        const name = prompt("Name this calculation:");
        if (!name) return;

        let details = "";
        let result = "";
        const date = new Date().toLocaleString();

        if (tool === 'dilution') {
            const v1 = document.querySelector('#dil-result .result-value-big')?.innerText;
            if (!v1) return alert("No result to save.");
            result = `Add ${v1} Stock`;
            details = `Dilution: ${document.getElementById('dil-c1').value} -> ${document.getElementById('dil-c2').value}`;
        }
        else if (tool === 'molarity') {
            const res = document.querySelector('#mol-result .result-value-big')?.innerText;
            if (!res) return alert("No result to save.");
            result = res;
            details = `Molarity (${molMode})`;
        }
        else if (tool === 'bca') {
            const stats = document.getElementById('curve-stats').innerText;
            result = stats.split('R²')[0]; // Just the equation
            details = `BCA Standard Curve`;
        }
        else if (tool === 'tau') {
            const mm = document.querySelector('#tau-result .result-value-big')?.innerText;
            if (!mm) return alert("No result to save");
            result = `MM: ${mm}`;
            details = `Target: ${document.getElementById('tau-target').value}nM`;
        }

        const item = { id: Date.now(), tool, name, result, details, date };

        const saved = JSON.parse(localStorage.getItem('rauchLabSaved') || '[]');
        saved.unshift(item);
        localStorage.setItem('rauchLabSaved', JSON.stringify(saved));
        alert("Saved!");
    }

    function loadSavedItems() {
        const list = document.getElementById('saved-list');
        const saved = JSON.parse(localStorage.getItem('rauchLabSaved') || '[]');

        if (saved.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted)">No saved calculations yet.</p>';
            return;
        }

        list.innerHTML = saved.map(item => `
            <div class="saved-card">
                <h3>${item.name}</h3>
                <div class="date">${item.date}</div>
                <div class="saved-details">
                    <div><strong>${item.result}</strong></div>
                    <div>${item.details}</div>
                </div>
                <button class="delete-btn" onclick="deleteSavedItem(${item.id})"><i class="ph ph-trash"></i></button>
            </div>
        `).join('');
    }

    // Expose delete function global
    window.deleteSavedItem = function (id) {
        let saved = JSON.parse(localStorage.getItem('rauchLabSaved') || '[]');
        saved = saved.filter(i => i.id !== id);
        localStorage.setItem('rauchLabSaved', JSON.stringify(saved));
        loadSavedItems();
    }

});
