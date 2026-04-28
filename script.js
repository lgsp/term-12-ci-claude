// ── SCROLL ANIMATION ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ── NAV ACTIVE ──
const navLinks = document.querySelectorAll('nav a');
const sections = document.querySelectorAll('.section');
const secObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(e.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const id = e.target.id;
      const link = document.querySelector(`nav a[href="#${id}"]`);
      if(link) link.classList.add('active');
    }
  });
}, { threshold: 0.3 });
sections.forEach(s => secObserver.observe(s));

// ── FUNCTIONS ──
const funcs = {
  x2:   { f: x => x*x,           F: x => x*x*x/3,                  label: 'x²' },
  x3:   { f: x => x*x*x,         F: x => x*x*x*x/4,                label: 'x³' },
  sinx: { f: x => Math.sin(x),   F: x => -Math.cos(x),             label: 'sin(x)' },
  cosx: { f: x => Math.cos(x),   F: x => Math.sin(x),              label: 'cos(x)' },
  ex:   { f: x => Math.exp(x),   F: x => Math.exp(x),              label: 'eˣ' },
  invx: { f: x => 1/x,           F: x => Math.log(Math.abs(x)),    label: '1/x' },
  sqrtx:{ f: x => Math.sqrt(Math.max(x,0)), F: x => 2/3*Math.pow(Math.max(x,0),1.5), label: '√x' },
  lnx:  { f: x => Math.log(Math.max(x,1e-9)), F: x => x*Math.log(Math.max(x,1e-9))-x, label: 'ln(x)', ipp: true },
  xex:  { f: x => x*Math.exp(x), F: x => (x-1)*Math.exp(x),       label: 'x·eˣ', ipp: true },
  x2sinx:{ f: x => x*x*Math.sin(x), F: x => (2-x*x)*Math.cos(x)+2*x*Math.sin(x), label: 'x²sin(x)', ipp: true },
  x:    { f: x => x,             F: x => x*x/2,                    label: 'x' },
  zero: { f: x => 0,             F: x => 0,                        label: '0' },
  x3d4: { f: x => x*x*x/4,      F: x => x*x*x*x/16,               label: 'x³/4' },
};

function integrate(key, a, b) {
  const fn = funcs[key];
  if(!fn) return NaN;
  return fn.F(b) - fn.F(a);
}

function numericalIntegrate(key, a, b, n=1000) {
  const fn = funcs[key];
  if(!fn) return NaN;
  const h = (b-a)/n;
  let s = 0;
  for(let i=0;i<n;i++) s += fn.f(a + (i+0.5)*h);
  return s*h;
}

function round4(x) { return Math.round(x*10000)/10000; }

function computeIntegral() {
  const key = document.getElementById('calc-func').value;
  const a = parseFloat(document.getElementById('calc-a').value);
  const b = parseFloat(document.getElementById('calc-b').value);
  const el = document.getElementById('calc-result');
  if(a >= b) { el.innerHTML = '<span style="color:#e06060">Erreur : a doit être < b</span>'; return; }
  const val = numericalIntegrate(key, a, b);
  const fn = funcs[key];
  const method = fn.ipp ? '(intégration par parties — approximation numérique)' : '(primitive exacte)';
  el.innerHTML = `<span class="result-val">∫<sub>${a}</sub><sup>${b}</sup> ${fn.label} dx ≈ <strong>${round4(val)}</strong></span> <span style="opacity:0.6;font-size:0.8rem">${method}</span>`;
  if(typeof MathJax !== 'undefined') MathJax.typesetPromise([el]);
}

function computeMean() {
  const key = document.getElementById('mean-func').value;
  const a = parseFloat(document.getElementById('mean-a').value);
  const b = parseFloat(document.getElementById('mean-b').value);
  const el = document.getElementById('mean-result');
  if(a >= b) { el.innerHTML = '<span style="color:#e06060">Erreur : a doit être < b</span>'; return; }
  const val = numericalIntegrate(key, a, b);
  const mean = val / (b - a);
  const fn = funcs[key];
  el.innerHTML = `<span class="result-val">μ = 1/(${b}-${a}) × ∫ = <strong>${round4(mean)}</strong></span>`;
}

function computeArea() {
  const kf = document.getElementById('area-f').value;
  const kg = document.getElementById('area-g').value;
  const a = parseFloat(document.getElementById('area-a').value);
  const b = parseFloat(document.getElementById('area-b').value);
  const el = document.getElementById('area-result');
  if(a >= b) { el.innerHTML = '<span style="color:#e06060">Erreur : a doit être < b</span>'; return; }
  // numerical
  const n = 1000;
  const h = (b-a)/n;
  let s = 0;
  const ff = funcs[kf].f, gf = funcs[kg].f;
  for(let i=0;i<n;i++) {
    const xi = a + (i+0.5)*h;
    s += Math.abs(ff(xi) - gf(xi));
  }
  const area = s * h;
  el.innerHTML = `<span class="result-val">Aire = |∫<sub>${a}</sub><sup>${b}</sup> [f - g] dx| ≈ <strong>${round4(area)}</strong> u.a.</span>`;
}

// ── AREA CHART ──
let areaChartInst = null;
function drawAreaChart() {
  const key = document.getElementById('viz-func').value;
  const a = parseFloat(document.getElementById('viz-a').value);
  const b = parseFloat(document.getElementById('viz-b').value);
  const fn = funcs[key].f;
  const N = 200;
  const step = (b - a) / N;
  const labels = [], data = [], areaData = [];
  for(let i = 0; i <= N; i++) {
    const x = a + i * step;
    labels.push(round4(x));
    const y = fn(x);
    data.push(y);
    areaData.push(y);
  }
  const ctx = document.getElementById('areaChart').getContext('2d');
  if(areaChartInst) areaChartInst.destroy();
  areaChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: funcs[key].label,
          data,
          borderColor: '#c8402a',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: 'origin',
          backgroundColor: 'rgba(200,64,42,0.15)'
        }
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 300 },
      plugins: { legend: { labels: { font: { family: 'JetBrains Mono', size: 12 } } } },
      scales: {
        x: { ticks: { maxTicksLimit: 8, font: { family: 'JetBrains Mono', size: 11 } } },
        y: { ticks: { font: { family: 'JetBrains Mono', size: 11 } } }
      }
    }
  });
}
drawAreaChart();

// ── RIEMANN CHART ──
let riemannChartInst = null;
function drawRiemann() {
  const key = document.getElementById('riemann-func').value;
  const n = parseInt(document.getElementById('riemann-n').value);
  const type = document.getElementById('riemann-type').value;
  const fn = funcs[key].f;
  const a = 0, b = 2;
  const h = (b - a) / n;

  // Background curve
  const N = 200;
  const curveLabels = [], curveData = [];
  for(let i = 0; i <= N; i++) {
    const x = a + i * (b-a)/N;
    curveLabels.push(round4(x));
    curveData.push(fn(x));
  }

  // Riemann rectangles as bar chart
  const barLabels = [], barData = [];
  let sum = 0;
  for(let k = 0; k < n; k++) {
    let xk;
    if(type === 'left') xk = a + k * h;
    else if(type === 'right') xk = a + (k+1) * h;
    else xk = a + (k + 0.5) * h;
    const yk = fn(xk);
    barLabels.push(round4(a + (k+0.5)*h));
    barData.push(yk);
    sum += yk * h;
  }

  // Exact
  const exact = numericalIntegrate(key, a, b, 2000);
  document.getElementById('riemann-info').innerHTML =
    `Approximation S<sub>${n}</sub> ≈ <strong>${round4(sum)}</strong> &nbsp;|&nbsp; Valeur exacte ≈ ${round4(exact)} &nbsp;|&nbsp; Erreur : ${round4(Math.abs(sum-exact))}`;

  const ctx = document.getElementById('riemannChart').getContext('2d');
  if(riemannChartInst) riemannChartInst.destroy();
  riemannChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: barLabels,
      datasets: [
        {
          type: 'bar',
          label: `Rectangles (n=${n})`,
          data: barData,
          backgroundColor: 'rgba(42,108,142,0.4)',
          borderColor: 'rgba(42,108,142,0.8)',
          borderWidth: 1,
          barPercentage: 1,
          categoryPercentage: 1,
        }
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 200 },
      plugins: {
        legend: { labels: { font: { family: 'JetBrains Mono', size: 12 } } },
        tooltip: { callbacks: { label: ctx => `f = ${round4(ctx.raw)}` } }
      },
      scales: {
        x: { ticks: { maxTicksLimit: 10, font: { family: 'JetBrains Mono', size: 10 } } },
        y: { ticks: { font: { family: 'JetBrains Mono', size: 11 } } }
      }
    }
  });
}
drawRiemann();

// ── QCM ALÉATOIRE ──
// Banque de questions avec variables paramétrables
function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function r4(x) { return Math.round(x * 10000) / 10000; }

function makeQuestionBank() {
  // Paramètres aléatoires
  const n = rnd([2, 3, 4, 5]);           // exposant pour x^n
  const a = rnd([1, 2, 3]);              // borne sup
  const k = rnd([2, 3, 4]);             // coefficient
  const p = rnd([2, 3]);                // pour (kx)^p
  const c = rnd([1, 2, 3]);             // borne divers

  // Q1 — ∫_0^a k·x^n dx
  const q1_exact = k * Math.pow(a, n+1) / (n+1);
  const q1_wrong1 = r4(k * a);
  const q1_wrong2 = r4(k * Math.pow(a, n));
  const q1_wrong3 = r4(k / (n+1));
  const q1_opts = shuffle([
    { label: `\\(${r4(q1_exact)}\\)`, correct: true },
    { label: `\\(${q1_wrong1}\\)`, correct: false },
    { label: `\\(${q1_wrong2}\\)`, correct: false },
    { label: `\\(${q1_wrong3}\\)`, correct: false },
  ]);

  // Q2 — ∫_0^a e^x dx = e^a - 1
  const q2_exact = r4(Math.exp(a) - 1);
  const q2_opts = shuffle([
    { label: `\\(e^{${a}} - 1 = ${q2_exact}\\)`, correct: true },
    { label: `\\(e^{${a}}\\)`, correct: false },
    { label: `\\(${a}e\\)`, correct: false },
    { label: `\\(1 - e^{${a}}\\)`, correct: false },
  ]);

  // Q3 — propriété conceptuelle (fixe mais choix aléatoire dans 3 versions)
  const q3_variants = [
    {
      q: `La propriété \\(\\int_a^b f = \\int_a^c f + \\int_c^b f\\) s'appelle :`,
      opts: shuffle([
        { label: 'Relation de Chasles', correct: true },
        { label: 'Linéarité de l\'intégrale', correct: false },
        { label: 'Théorème fondamental', correct: false },
        { label: 'Inégalité triangulaire', correct: false },
      ]),
      expl: 'Elle permet de décomposer l\'intégrale sur tout point intermédiaire \\(c\\).'
    },
    {
      q: `La valeur moyenne de \\(f\\) sur \\([a,b]\\) est définie par :`,
      opts: shuffle([
        { label: `\\(\\dfrac{1}{b-a}\\int_a^b f(x)\\,dx\\)`, correct: true },
        { label: `\\(\\dfrac{f(a)+f(b)}{2}\\)`, correct: false },
        { label: `\\(\\int_a^b f(x)\\,dx\\)`, correct: false },
        { label: `\\(\\dfrac{1}{2}\\int_a^b f(x)\\,dx\\)`, correct: false },
      ]),
      expl: 'C\'est la hauteur du rectangle de même aire que l\'intégrale sur \\([a,b]\\).'
    },
    {
      q: `Si \\(f \\geq 0\\) sur \\([a,b]\\), alors \\(\\int_a^b f(x)\\,dx\\) est :`,
      opts: shuffle([
        { label: 'Toujours \\(\\geq 0\\)', correct: true },
        { label: 'Toujours \\(> 0\\)', correct: false },
        { label: 'Toujours \\(= 0\\)', correct: false },
        { label: 'Peut être négatif', correct: false },
      ]),
      expl: 'La positivité de \\(f\\) implique \\(\\int_a^b f \\geq 0\\) (égal à 0 si \\(f=0\\) partout).'
    }
  ];
  const q3 = rnd(q3_variants);

  // Q4 — ∫_1^c 1/x dx = ln(c)
  const q4_exact = r4(Math.log(c + 1));
  const q4_opts = shuffle([
    { label: `\\(\\ln(${c+1})\\approx ${q4_exact}\\)`, correct: true },
    { label: `\\(${c+1} - 1 = ${c}\\)`, correct: false },
    { label: `\\(\\dfrac{1}{${c+1}}\\)`, correct: false },
    { label: `\\(\\ln 1 = 0\\)`, correct: false },
  ]);

  // Q5 — IPP : choisir u et v'
  const q5_variants = [
    {
      q: `Pour \\(\\int_0^1 x e^x\\,dx\\) par parties, on choisit :`,
      opts: shuffle([
        { label: `\\(u = x,\\; v' = e^x\\) (règle LIATE)`, correct: true },
        { label: `\\(u = e^x,\\; v' = x\\)`, correct: false },
        { label: `\\(u = 1,\\; v' = xe^x\\)`, correct: false },
        { label: `\\(u = x^2,\\; v' = e^x\\)`, correct: false },
      ]),
      expl: `LIATE : Algébrique \\(x\\) avant Exponentielle. Résultat : \\(\\big[xe^x\\big]_0^1 - \\int_0^1 e^x\\,dx = 1\\).`
    },
    {
      q: `Pour \\(\\int_1^e \\ln x\\,dx\\) par parties, on pose :`,
      opts: shuffle([
        { label: `\\(u = \\ln x,\\; v' = 1\\) (règle LIATE)`, correct: true },
        { label: `\\(u = x,\\; v' = \\ln x\\)`, correct: false },
        { label: `\\(u = 1/x,\\; v' = x\\)`, correct: false },
        { label: `\\(u = 1,\\; v' = \\ln x\\)`, correct: false },
      ]),
      expl: `LIATE : Logarithme en premier. Résultat : \\(\\big[x\\ln x\\big]_1^e - \\int_1^e 1\\,dx = e - (e-1) = 1\\).`
    }
  ];
  const q5 = rnd(q5_variants);

  // Q6 — changement de variable
  const q6_variants = [
    {
      q: `Pour \\(\\int_0^1 ${k}x \\cdot e^{x^2}\\,dx\\), le meilleur changement est :`,
      opts: shuffle([
        { label: `\\(u = x^2,\\; du = 2x\\,dx\\)`, correct: true },
        { label: `\\(u = e^x\\)`, correct: false },
        { label: `\\(u = \\ln x\\)`, correct: false },
        { label: `\\(u = x^2 + 1\\)`, correct: false },
      ]),
      expl: `On obtient \\(\\frac{${k}}{2}\\int_0^1 e^u\\,du = \\frac{${k}}{2}(e-1)\\approx ${r4(k/2*(Math.E-1))}\\).`
    },
    {
      q: `Pour \\(\\int_0^1 \\dfrac{${2*k}x}{x^2+1}\\,dx\\), la substitution naturelle est :`,
      opts: shuffle([
        { label: `\\(u = x^2+1,\\; du = 2x\\,dx\\)`, correct: true },
        { label: `\\(u = x^2\\)`, correct: false },
        { label: `\\(u = \\ln(x^2+1)\\)`, correct: false },
        { label: `\\(u = x+1\\)`, correct: false },
      ]),
      expl: `La forme \\(u'/u\\) donne \\(${k}\\big[\\ln(x^2+1)\\big]_0^1 = ${k}\\ln 2\\approx ${r4(k*Math.log(2))}\\).`
    }
  ];
  const q6 = rnd(q6_variants);

  return [
    {
      q: `Calculer \\(\\displaystyle\\int_0^{${a}} ${k}x^{${n}}\\,dx\\)`,
      opts: q1_opts,
      expl: `\\(\\Big[\\dfrac{${k}x^{${n+1}}}{${n+1}}\\Big]_0^{${a}} = \\dfrac{${k}\\times${a}^{${n+1}}}{${n+1}} = ${r4(q1_exact)}\\)`
    },
    {
      q: `Quelle est la valeur de \\(\\displaystyle\\int_0^{${a}} e^x\\,dx\\) ?`,
      opts: q2_opts,
      expl: `\\(\\big[e^x\\big]_0^{${a}} = e^{${a}} - e^0 = e^{${a}} - 1 \\approx ${q2_exact}\\)`
    },
    q3,
    {
      q: `Calculer \\(\\displaystyle\\int_1^{${c+1}} \\frac{1}{x}\\,dx\\)`,
      opts: q4_opts,
      expl: `\\(\\big[\\ln x\\big]_1^{${c+1}} = \\ln(${c+1}) - \\ln 1 = \\ln(${c+1}) \\approx ${q4_exact}\\)`
    },
    q5,
    q6,
  ];
}

function shuffle(arr) {
  const a = [...arr];
  for(let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let qcmScore = 0, qcmAnswered = 0, totalQ = 6;
let currentQuestions = [];

function generateQCM() {
  qcmScore = 0;
  qcmAnswered = 0;
  const container = document.getElementById('qcm-container');
  const scoreBox = document.getElementById('qcm-score');
  scoreBox.style.display = 'none';
  document.getElementById('score-val').textContent = '';
  document.getElementById('score-msg').textContent = '';

  currentQuestions = makeQuestionBank();
  totalQ = currentQuestions.length;

  container.innerHTML = currentQuestions.map((q, i) => {
    const qid = `rq${i}`;
    const opts = q.opts.map((o, j) => `
      <label class="qcm-option">
        <input type="radio" name="${qid}" value="${j}" data-correct="${o.correct}">
        <span class="opt-label">${o.label}</span>
      </label>`).join('');
    return `
    <div class="qcm-question" id="${qid}" style="counter-increment:none">
      <div style="font-family:var(--mono);font-size:0.7rem;background:var(--ink);color:var(--paper);display:inline-block;padding:0.1rem 0.4rem;letter-spacing:0.08em;margin-bottom:0.6rem">Q${i+1}</div>
      <p class="q-text">${q.q}</p>
      <div class="qcm-options">${opts}</div>
      <button class="qcm-check-btn" onclick="checkRQ('${qid}', ${i})">Vérifier</button>
      <div class="qcm-feedback" id="${qid}-fb"></div>
    </div>`;
  }).join('');

  // MathJax a déjà traité la page statique ; on lui demande de traiter le nouveau HTML injecté
  if (typeof MathJax !== 'undefined') MathJax.typesetPromise([container]);
}

function checkRQ(qid, questionIndex) {
  const selected = document.querySelector(`input[name="${qid}"]:checked`);
  const fb = document.getElementById(`${qid}-fb`);
  if(!selected) {
    fb.style.display = 'block';
    fb.className = 'qcm-feedback incorrect';
    fb.textContent = 'Veuillez sélectionner une réponse.';
    return;
  }
  fb.style.display = 'block';
  const isCorrect = selected.dataset.correct === 'true';
  const explanation = currentQuestions[questionIndex].expl;
  if(isCorrect) {
    fb.className = 'qcm-feedback correct';
    fb.innerHTML = `✓ Correct ! ${explanation}`;
    qcmScore++;
  } else {
    fb.className = 'qcm-feedback incorrect';
    fb.innerHTML = `✗ Incorrect. ${explanation}`;
  }
  qcmAnswered++;
  const btn = document.querySelector(`#${qid} .qcm-check-btn`);
  if(btn) btn.disabled = true;
  document.querySelectorAll(`#${qid} input`).forEach(i => i.disabled = true);
  if (typeof MathJax !== 'undefined') MathJax.typesetPromise([fb]);

  if(qcmAnswered === totalQ) {
    const box = document.getElementById('qcm-score');
    box.style.display = 'block';
    document.getElementById('score-val').textContent = `${qcmScore} / ${totalQ}`;
    const pct = qcmScore / totalQ;
    document.getElementById('score-msg').textContent =
      pct >= 5/6 ? '🎉 Excellent ! Maîtrise totale.' :
      pct >= 3/6 ? '👍 Bien ! Quelques points à revoir.' :
      '📚 À retravailler — consultez les sections du cours.';
  }
}

// MathJax traite automatiquement le contenu statique au chargement de la page.
// On génère le QCM une fois le DOM prêt ; MathJax traitera ensuite le HTML injecté.
document.addEventListener('DOMContentLoaded', generateQCM);