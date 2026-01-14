document.addEventListener('DOMContentLoaded', () => {
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
        });
    });

    // Theme Toggle
    const themeBtn = document.getElementById('theme-btn');
    const body = document.body;
    let isDark = false; // Default light

    // Check system preference
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
        const uv2 = document.getElementById('dil-v2-unit').value; // L, mL, uL

        if (isNaN(c1) || isNaN(c2) || isNaN(v2) || c1 === 0) {
            document.getElementById('dil-result').innerHTML = '<div class="result-placeholder">Enter valid values to calculate</div>';
            return;
        }

        // Normalize units to base (M or g/L)
        // If units are same type (both M-based or both mass-based), we can convert.
        // Simplified approach: treat units as factors.

        const unitFactors = {
            'M': 1, 'mM': 1e-3, 'uM': 1e-6, 'nM': 1e-9,
            'mg/mL': 1, '%': 10, 'x': 1 // % w/v is usually g/100mL = 10 mg/mL approx for logic? No, % is simple factor
            // For dilution C1V1 = C2V2, as long as C1 and C2 are convertible, we are good.
        };

        // Handling the "x" (fold) dilution separately or just numeric ratio
        // If units are different, warn user, unless they are standard prefixes

        let ratio = 1;
        if (u1 !== u2) {
            // Attempt conversion if possible
            if (unitFactors[u1] && unitFactors[u2]) {
                // Convert C1 to base, C2 to base
                // But wait, if u1 is mg/mL and u2 is M, we need MW. 
                // Simple Dilution usually implies same substance type.
                // Let's assume user picks compatible units or handles ratio themselves if mixed types (rare for simple V1=C2V2/C1)
                // actually commonly people do 1M stock -> 10mM.

                const f1 = unitFactors[u1];
                const f2 = unitFactors[u2];

                if (f1 && f2) {
                    // Check if mixing mass and molar?
                    // mg/mL vs M requires MW. 
                    // Let's check "families".
                    const isMolar1 = ['M', 'mM', 'uM', 'nM'].includes(u1);
                    const isMolar2 = ['M', 'mM', 'uM', 'nM'].includes(u2);

                    if (isMolar1 !== isMolar2) {
                        document.getElementById('dil-result').innerHTML = '<div class="result-placeholder" style="color:red">Cannot convert different unit types (e.g. M vs mg/mL) without MW.</div>';
                        return;
                    }

                    ratio = f2 / f1;
                }
            }
        }

        // V1 = (C2 * V2) / C1
        // Effective C2 in terms of C1's unit = C2 * ratio
        // e.g. C1 = 1 M, C2 = 100 mM. ratio (mM->M) = 1e-3. 
        // Eff C2 = 100 * 0.001 = 0.1 M.
        // V1 = (0.1 * 50) / 1 = 5.

        const c2_normalized = c2 * ratio;
        const v1 = (c2_normalized * v2) / c1;
        const solvent = v2 - v1;

        if (v1 < 0 || solvent < 0) {
            document.getElementById('dil-result').innerHTML = '<div class="result-placeholder" style="color:red">Impossible dilution (Target > Stock).</div>';
            return;
        }

        document.getElementById('dil-result').innerHTML = `
            <div>Add <span class="result-value-big">${formatNumber(v1)} ${uv2}</span> of Stock</div>
            <div>to <span class="result-value-big">${formatNumber(solvent)} ${uv2}</span> of Solvent</div>
            <div class="result-detail">Total Volume: ${v2} ${uv2}</div>
        `;
    }

    // --- Molarity Calculator ---
    let molMode = 'mass'; // mass, conc, vol
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
        if (isNaN(mw)) {
            document.getElementById('mol-result').innerHTML = '<div class="result-placeholder">Enter Molecular Weight</div>';
            return;
        }

        // Factors to standard units (g, L, M)
        const massUnit = document.getElementById('mol-mass-unit').value; // g, mg, ug
        const volUnit = document.getElementById('mol-vol-unit').value; // L, mL, uL
        const concUnit = document.getElementById('mol-conc-unit').value; // M, mM, uM

        const massFactors = { 'g': 1, 'mg': 1e-3, 'ug': 1e-6 };
        const volFactors = { 'L': 1, 'mL': 1e-3, 'uL': 1e-6 };
        const concFactors = { 'M': 1, 'mM': 1e-3, 'uM': 1e-6 };

        // Equation: Mass (g) = Conc (M) * Vol (L) * MW (g/mol)

        if (molMode === 'mass') {
            // Find Mass
            const conc = parseFloat(document.getElementById('mol-conc').value);
            const vol = parseFloat(document.getElementById('mol-vol').value);
            if (isNaN(conc) || isNaN(vol)) return;

            const concM = conc * concFactors[concUnit];
            const volL = vol * volFactors[volUnit];

            const massG = concM * volL * mw;

            // Convert to selected mass unit ?? Or auto select best?
            // Let's output in the unit user selected if possible, but the input field is hidden. 
            // Actually good UI shows the result. Let's just output in reasonable units.

            // Wait, the input field for Mass is hidden in this mode, so we don't know "desired output unit".
            // Let's just show g and mg.
            const massMg = massG * 1000;

            document.getElementById('mol-result').innerHTML = `
                <div>Required Mass:</div>
                <div class="result-value-big">${formatNumber(massG)} g</div>
                <div class="result-detail">or ${formatNumber(massMg)} mg</div>
             `;
        }
        else if (molMode === 'conc') {
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
        }
        else if (molMode === 'vol') {
            const mass = parseFloat(document.getElementById('mol-mass').value);
            const conc = parseFloat(document.getElementById('mol-conc').value);
            if (isNaN(mass) || isNaN(conc)) return;

            const massG = mass * massFactors[massUnit];
            const concM = conc * concFactors[concUnit];

            const volL = massG / (concM * mw);
            const volmL = volL * 1000;
            const voluL = volmL * 1000;

            document.getElementById('mol-result').innerHTML = `
                <div>Required Volume:</div>
                <div class="result-value-big">${formatNumber(volmL)} mL</div>
                <div class="result-detail">${formatNumber(volL)} L | ${formatNumber(voluL)} µL</div>
             `;
        }
    }


    // --- BCA Calculator ---
    // Simple Linear Regression

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
        // Gather data
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

        if (concs.length < 2) {
            document.getElementById('curve-stats').innerText = "Status: Need more points";
            return;
        }

        // Linear Regression: y = mx + b
        // We calculate x from y usually? Setup: x = Concentration, y = Absorbance.
        // Fit y = mx + b.
        // Then for unknown y, x = (y - b) / m.

        const n = concs.length;
        const sumX = concs.reduce((a, b) => a + b, 0);
        const sumY = abss.reduce((a, b) => a + b, 0);
        const sumXY = concs.reduce((sum, x, i) => sum + x * abss[i], 0);
        const sumXX = concs.reduce((sum, x) => sum + x * x, 0);
        const sumYY = abss.reduce((sum, y) => sum + y * y, 0);

        curveSlope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        curveIntercept = (sumY - curveSlope * sumX) / n;

        // R2
        const ssTot = abss.reduce((sum, y) => sum + Math.pow(y - (sumY / n), 2), 0);
        // predicted y
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

        // y = mx + b  ->  x = (y - b) / m
        const conc = (abs - curveIntercept) / curveSlope;
        resultArea.innerText = formatNumber(conc);
    }

    function formatNumber(num) {
        if (num === 0) return "0";
        if (Math.abs(num) < 0.01 || Math.abs(num) > 10000) {
            return num.toExponential(3);
        }
        return parseFloat(num.toFixed(4)); // clean trailing zeros
    }
});
