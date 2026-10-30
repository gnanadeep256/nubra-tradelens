const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const firstEnd = html.indexOf('</script>');
const scriptTag = '<script>';
const secondScript = html.indexOf(scriptTag, firstEnd);
const scriptStart = secondScript + scriptTag.length;
const scriptEnd = html.indexOf('</script>', scriptStart);
const appCode = html.slice(scriptStart, scriptEnd);
const sampleStart = html.indexOf('<script id="sampleData" type="application/json">') + '<script id="sampleData" type="application/json">'.length;
const sampleEnd = html.indexOf('</script>', sampleStart);
const embeddedSample = html.slice(sampleStart, sampleEnd);

class FakeClassList {
  constructor(){ this.classes = new Set(); }
  add(c){ this.classes.add(c); }
  remove(c){ this.classes.delete(c); }
  toggle(c, force){
    if(force === undefined){
      if(this.classes.has(c)) this.classes.delete(c); else this.classes.add(c);
    } else if(force) this.classes.add(c); else this.classes.delete(c);
  }
  contains(c){ return this.classes.has(c); }
}

class FakeElement {
  constructor(id=''){
    this.id = id;
    this.events = {};
    this.dataset = {};
    this.classList = new FakeClassList();
    this.innerHTML = '';
    this.textContent = '';
    this.disabled = false;
    this.value = '';
    this.files = [];
    this.style = {};
    this.attributes = {};
  }
  addEventListener(name, fn){ this.events[name] = fn; }
  setAttribute(k, v){ this.attributes[k] = String(v); }
  removeAttribute(k){ delete this.attributes[k]; }
  getAttribute(k){ return this.attributes[k] ?? null; }
  click(){ if(this.events.click) return this.events.click({ target: this, preventDefault(){} }); }
  focus(){ FakeElement.activeElement = this; }
  scrollIntoView(){}
  appendChild(child){
    if(!this._children) this._children = [];
    this._children.push(child);
  }
}
FakeElement.activeElement = null;

class FakeDocument {
  constructor(){
    this.elements = new Map();
    this.qcache = new Map();
    this.steps = ['overview', 'insights', 'experiment'].map(v => {
      const e = new FakeElement();
      e.dataset.step = v;
      return e;
    });
    this.body = new FakeElement('body');
  }
  get activeElement(){ return FakeElement.activeElement; }
  getElementById(id){
    if(id === 'sampleData'){
      const e = new FakeElement(id);
      e.textContent = embeddedSample;
      return e;
    }
    if(!this.elements.has(id)) this.elements.set(id, new FakeElement(id));
    return this.elements.get(id);
  }
  querySelectorAll(sel){
    if(sel === '.step') return this.steps;
    const activeHtml = sel === '[data-evidence]' ? this.getElementById('insightList').innerHTML :
                       sel === '[data-choice]' ? this.getElementById('choiceGrid').innerHTML :
                       this.getElementById('modalRoot').innerHTML;
    const cacheKey = sel + '::' + activeHtml;
    if(this.qcache.has(cacheKey)) return this.qcache.get(cacheKey);

    const listHtml = this.getElementById('insightList').innerHTML;
    const gridHtml = this.getElementById('choiceGrid').innerHTML;
    const modalHtml = this.getElementById('modalRoot').innerHTML;
    const out = [];

    if(sel === '[data-evidence]'){
      for(const m of listHtml.matchAll(/data-evidence="([^"]+)"/g)){
        const e = new FakeElement(); e.dataset.evidence = m[1]; out.push(e);
      }
    } else if(sel === '[data-choice]'){
      for(const m of gridHtml.matchAll(/data-choice="([^"]+)"/g)){
        const e = new FakeElement(); e.dataset.choice = m[1]; out.push(e);
      }
    } else if(sel === '[data-feedback]'){
      for(const m of modalHtml.matchAll(/data-feedback="([^"]+)" data-id="([^"]+)"/g)){
        const e = new FakeElement(); e.dataset.feedback = m[1]; e.dataset.id = m[2]; out.push(e);
      }
    } else if(sel === 'tr' || sel === 'tbody tr'){
      for(const m of modalHtml.matchAll(/<tr>/g)){ out.push(new FakeElement('tr')); }
    } else if(sel.includes('button')){
      for(const m of modalHtml.matchAll(/<button[^>]*id="([^"]+)"/g)){ out.push(this.getElementById(m[1])); }
    }
    this.qcache.set(cacheKey, out);
    return out;
  }
  querySelector(sel){
    if(sel.startsWith('[data-feedback=')){
      const m = sel.match(/data-feedback="([^"]+)"\]\[data-id="([^"]+)"/);
      if(m){
        const all = this.querySelectorAll('[data-feedback]');
        return all.find(e => e.dataset.feedback === m[1] && e.dataset.id === m[2]) || null;
      }
    }
    const all = this.querySelectorAll(sel);
    return all.length ? all[0] : null;
  }
  createElement(tag){ return new FakeElement(tag); }
}

async function makeContext(initialLocalStorage = {}){
  const document = new FakeDocument();
  const windowListeners = {};
  const window = {
    SAMPLE_TRADES: null,
    scrollTo(){},
    addEventListener(name, fn){ windowListeners[name] = fn; },
    removeEventListener(name){ delete windowListeners[name]; }
  };
  const localStore = { ...initialLocalStorage };
  const localStorage = {
    setItem: (k, v) => localStore[k] = String(v),
    getItem: k => localStore[k] ?? null,
    removeItem: k => delete localStore[k]
  };
  const ctx = {
    document,
    window,
    localStorage,
    console,
    Intl,
    Date,
    Number,
    Math,
    Set,
    Map,
    Blob,
    URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
    Promise,
    JSON,
    Error,
    Array,
    String,
    parseInt,
    clearTimeout,
    setTimeout: () => 0
  };
  vm.createContext(ctx);
  vm.runInContext(appCode, ctx);
  return { document, window, windowListeners, localStore, ctx };
}

(async()=>{
  console.log('--- STARTING TRADELENS COMPREHENSIVE TEST SUITE ---');

  // TEST 1: Sample summary, corrected cohort net deficits, ranking A > C > B, modal evidence, experiment choice & local save
  {
    const app = await makeContext();
    const $ = id => app.document.getElementById(id);
    assert($('metricGrid').innerHTML.includes('60'), 'sample summary should show 60 trades');
    assert($('metricGrid').innerHTML.includes('−₹14,750'), 'sample summary should show net P&L -₹14,750');

    // Check Stepper Navigation restrictions initially: Step 2 and Step 3 locked via aria-disabled
    const steps = app.document.querySelectorAll('.step');
    assert.strictEqual(steps[0].disabled, false, 'Step 1 should not be natively disabled');
    assert.strictEqual(steps[0].getAttribute('aria-disabled'), 'false', 'Step 1 aria-disabled should be false');
    assert.strictEqual(steps[1].getAttribute('aria-disabled'), 'true', 'Step 2 should be locked (aria-disabled="true") before insight generation');
    assert.strictEqual(steps[2].getAttribute('aria-disabled'), 'true', 'Step 3 should be locked (aria-disabled="true") before insight generation');

    // Generate insights
    $('generateBtn').click();
    assert.strictEqual(steps[1].getAttribute('aria-disabled'), 'false', 'Step 2 should be unlocked after generation');
    assert.strictEqual(steps[2].getAttribute('aria-disabled'), 'false', 'Step 3 should be unlocked when insights exist');

    const insightHtml = $('insightList').innerHTML;
    assert(insightHtml.includes('Losing trades held longer'), 'insight A (holding) should appear');
    assert(insightHtml.includes('Losses in larger positions'), 'insight C (large-size) should appear');
    assert(insightHtml.includes('Trades opened shortly after a loss'), 'insight B (after-loss) should appear');

    // Verify Cohort Net Deficits and Explanatory Losses
    assert(insightHtml.includes('₹30,039'), 'insight A net deficit should be ₹30,039');
    assert(insightHtml.includes('₹6,704'), 'insight C net cohort deficit should be ₹6,704');
    assert(insightHtml.includes('₹14,242'), 'insight C explanatory loss should be ₹14,242');
    assert(insightHtml.includes('₹3,041'), 'insight B net cohort deficit should be ₹3,041');
    assert(insightHtml.includes('₹14,804'), 'insight B explanatory loss should be ₹14,804');

    // Verify Ranking order: Rank 1 is A, Rank 2 is C, Rank 3 is B
    const rankA = insightHtml.indexOf('Losing trades held longer');
    const rankC = insightHtml.indexOf('Losses in larger positions');
    const rankB = insightHtml.indexOf('Trades opened shortly after a loss');
    assert(rankA < rankC && rankC < rankB, 'Ranking order must be Rule A (₹30,039) > Rule C (₹6,704) > Rule B (₹3,041)');

    // Inspect evidence modal for Rule C (large positions)
    const evidence = app.document.querySelectorAll('[data-evidence]');
    assert.strictEqual(evidence.length, 3, 'Three evidence buttons should render');
    
    // Click evidence for Rule C (second card)
    evidence[1].click();
    const modalHtml = $('modalRoot').innerHTML;
    assert(modalHtml.includes('Evidence details'), 'Evidence modal should open');
    assert(modalHtml.includes('16 (8 / 8)'), 'Modal stat should show all 16 trades (8 losses / 8 wins) in quartile');
    assert(modalHtml.includes('Important limitation'), 'Modal caveat should be visible');

    // Close modal
    $('closeModal').click();
    assert($('modalRoot').classList.contains('hidden'), 'Modal should close when close button is clicked');

    // Go to Experiment View
    $('toExperimentBtn').click();
    const choices = app.document.querySelectorAll('[data-choice]');
    assert.strictEqual(choices.length, 3, 'All 3 currently active habits should be available as choices');

    choices[0].click();
    assert(!$('saveCommitmentBtn').disabled, 'Save commitment button should be enabled after choice');
    $('saveCommitmentBtn').click();
    assert(Boolean(app.localStore.tradelens_commitment), 'Commitment must be persisted in localStorage');
    console.log('PASS: Corrected cohort net deficits, ranking A > C > B, modal evidence, experiment choice and local save');
  }

  // TEST 2: Commitment persistence & retrieval on simulated reload
  {
    const savedRecord = JSON.stringify({
      habit_id: 'holding',
      title: 'Record an exit rationale',
      commitment: 'For the next month, I will record the reason whenever a trade stays open beyond my planned duration.',
      saved_at: '2026-10-30T10:00:00.000Z',
      source: 'synthetic-demo'
    });
    const reloaded = await makeContext({ tradelens_commitment: savedRecord });
    const r$ = id => reloaded.document.getElementById(id);

    // Active pill in header should be visible
    assert(!r$('savedPill').classList.contains('hidden'), 'Saved pill in top bar should be visible on return');
    
    // Switch to experiment view directly or after generate
    r$('generateBtn').click();
    r$('toExperimentBtn').click();

    const commitmentBox = r$('activeCommitmentContainer').innerHTML;
    assert(commitmentBox.includes('Active recorded commitment'), 'Active recorded commitment banner should render');
    assert(commitmentBox.includes('Record an exit rationale'), 'Saved commitment title should be restored');
    assert(commitmentBox.includes('For the next month, I will record the reason'), 'Saved commitment text should be restored');
    console.log('PASS: Commitment retrieved and rendered from localStorage on initialisation');
  }

  // TEST 3: Rule C instrument comparability & suppression on mixed disparate instruments
  {
    const app = await makeContext();
    const a$ = id => app.document.getElementById(id);

    // Upload CSV with mixed disparate instruments (NIFTY index + RELIANCE stock with 50x notional difference)
    const lines = ['trade_id,instrument,entry_time,exit_time,position_size_inr,gross_pnl_inr,charges_inr'];
    for(let i=0; i<20; i++){
      const day = String(1 + Math.floor(i/5)).padStart(2,'0');
      const inst = i % 2 === 0 ? 'NIFTY' : 'RELIANCE';
      const size = i % 2 === 0 ? 50000 : 2500000; // 50x disparity
      lines.push(`M${i+1},${inst},2026-10-${day}T09:15,2026-10-${day}T09:40,${size},${i%2?-600:700},40`);
    }
    a$('csvInput').events.change({ target: { files: [{ text: async() => lines.join('\n') }], value: '' } });
    await new Promise(r => setImmediate(r));
    a$('generateBtn').click();

    const insightHtml = a$('insightList').innerHTML;
    assert(!insightHtml.includes('Losses in larger positions'), 'Rule C must be suppressed for disparate mixed instruments');
    assert(!a$('suppressedNotice').classList.contains('hidden'), 'Suppression notice for Rule C must be visible');
    assert(a$('suppressedNotice').textContent.includes('Position Sizing'), 'Suppression notice should mention Rule C');
    console.log('PASS: Rule C correctly suppresses insight and explains reason for disparate mixed instruments');
  }

  // TEST 4: Deterministic simultaneous exit handling in Rule B
  {
    const app = await makeContext();
    const a$ = id => app.document.getElementById(id);

    // Construct a dataset with simultaneous exits at 09:30:
    // P1 exits 09:30 with -1000 loss; P2 exits 09:30 with +1200 profit -> Conflicting signs at identical timestamp (ambiguous chronology)
    // T1 enters 09:35 (5 min gap). Because exit outcomes conflict at 09:30, T1 should NOT be flagged as following a loss!
    const lines = [
      'trade_id,instrument,entry_time,exit_time,position_size_inr,gross_pnl_inr,charges_inr',
      'P1,NIFTY,2026-10-01T09:15,2026-10-01T09:30,50000,-1000,40',
      'P2,NIFTY,2026-10-01T09:15,2026-10-01T09:30,50000,1200,40',
      'T1,NIFTY,2026-10-01T09:35,2026-10-01T09:45,50000,-800,40',
      // Add more trades so sample sizes meet minimums
    ];
    for(let i=0; i<25; i++){
      lines.push(`X${i+1},NIFTY,2026-10-02T${String(9+Math.floor(i/4)).padStart(2,'0')}:${String((i%4)*15).padStart(2,'0')},2026-10-02T${String(9+Math.floor(i/4)).padStart(2,'0')}:${String((i%4)*15+10).padStart(2,'0')},50000,500,30`);
    }
    a$('csvInput').events.change({ target: { files: [{ text: async() => lines.join('\n') }], value: '' } });
    await new Promise(r => setImmediate(r));
    a$('generateBtn').click();

    // Verify T1 is not flagged under Rule B
    const insightHtml = a$('insightList').innerHTML;
    assert(!insightHtml.includes('T1'), 'T1 should not be flagged after an ambiguous simultaneous exit');
    console.log('PASS: Simultaneous exits with conflicting outcomes are deterministically excluded');
  }

  // TEST 5: Reporting-period filter for multi-month datasets
  {
    const app = await makeContext();
    const a$ = id => app.document.getElementById(id);

    // Create 2-month dataset: 10 trades in Sep 2026, 10 trades in Oct 2026
    const lines = ['trade_id,instrument,entry_time,exit_time,position_size_inr,gross_pnl_inr,charges_inr'];
    for(let i=0; i<10; i++){
      lines.push(`S${i+1},NIFTY,2026-09-${String(15+i).padStart(2,'0')}T09:15,2026-09-${String(15+i).padStart(2,'0')}T09:30,50000,1000,40`);
    }
    for(let i=0; i<10; i++){
      lines.push(`O${i+1},NIFTY,2026-10-${String(15+i).padStart(2,'0')}T09:15,2026-10-${String(15+i).padStart(2,'0')}T09:30,50000,-1000,40`);
    }
    a$('csvInput').events.change({ target: { files: [{ text: async() => lines.join('\n') }], value: '' } });
    await new Promise(r => setImmediate(r));

    assert(a$('metricGrid').innerHTML.includes('20'), 'Initially shows all 20 trades');

    // Filter to September 2026
    a$('periodSelect').value = '2026-09';
    a$('periodSelect').events.change({ target: a$('periodSelect') });
    assert(a$('metricGrid').innerHTML.includes('10'), 'Filtered to Sep should show 10 trades');
    assert(a$('metricGrid').innerHTML.includes('₹9,600'), 'Sep net P&L should be 10 * (1000 - 40) = 9600');

    // Filter to October 2026
    a$('periodSelect').value = '2026-10';
    a$('periodSelect').events.change({ target: a$('periodSelect') });
    assert(a$('metricGrid').innerHTML.includes('10'), 'Filtered to Oct should show 10 trades');
    assert(a$('metricGrid').innerHTML.includes('−₹10,400'), 'Oct net P&L should be 10 * (-1000 - 40) = -10400');
    console.log('PASS: Multi-month reporting period filter successfully segments trades and metrics');
  }

  // TEST 6: Evidence modal table counts match displayed stats
  {
    const app = await makeContext();
    const a$ = id => app.document.getElementById(id);
    a$('generateBtn').click();

    // Inspect Rule A (holding): 24 flagged losing trades & horizontal duration comparison chart
    const evidence = app.document.querySelectorAll('[data-evidence]');
    evidence[0].click(); // Rule A
    const modalA = a$('modalRoot').innerHTML;
    const rowsA = (modalA.match(/<tr>/g) || []).length - 1; // subtract header
    assert.strictEqual(rowsA, 24, 'Rule A evidence table must contain exactly 24 rows matching flagged count');
    assert(modalA.includes('Holding Duration Comparison'), 'Rule A must render duration comparison chart');
    assert(modalA.includes('vis-bar-fill win') && modalA.includes('vis-bar-fill loss'), 'Rule A must render comparison bars');
    assert(modalA.includes('11m') && modalA.includes('32m'), 'Rule A chart must display calculated winning and losing medians');
    a$('closeModal').click();

    // Inspect Rule C (large positions): 16 trades in quartile (8 losses + 8 wins) & breakdown chart
    evidence[1].click(); // Rule C
    const modalC = a$('modalRoot').innerHTML;
    const rowsC = (modalC.match(/<tr>/g) || []).length - 1;
    assert.strictEqual(rowsC, 16, 'Rule C evidence table must contain exactly 16 rows matching cohort count');
    assert(modalC.includes('Largest-Quartile Sizing Breakdown'), 'Rule C must render quartile breakdown chart');
    assert(modalC.includes('vis-segment win') && modalC.includes('vis-segment loss'), 'Rule C must render split outcome bar');
    assert(modalC.includes('8 wins (50%)') && modalC.includes('8 losses (50%)'), 'Rule C must display split counts and percentages');
    a$('closeModal').click();

    // Inspect Rule B (trades after loss): 25 trades in cohort (12 losses + 13 wins) & composition chart
    evidence[2].click(); // Rule B
    const modalB = a$('modalRoot').innerHTML;
    const rowsB = (modalB.match(/<tr>/g) || []).length - 1;
    assert.strictEqual(rowsB, 25, 'Rule B evidence table must contain exactly 25 rows matching cohort count');
    assert(modalB.includes('Qualifying Cohort Composition'), 'Rule B must render cohort composition chart');
    assert(modalB.includes('13 wins (52%)') && modalB.includes('12 losses (48%)'), 'Rule B must display win/loss breakdown');
    a$('closeModal').click();
    console.log('PASS: Evidence modal table counts and compact visualisations strictly match across all rules');
  }

  // TEST 7: Modal keyboard behavior (Escape key closes) & Focus restoration
  {
    const app = await makeContext();
    const a$ = id => app.document.getElementById(id);
    a$('generateBtn').click();

    const evidence = app.document.querySelectorAll('[data-evidence]');
    evidence[0].click();
    assert(!a$('modalRoot').classList.contains('hidden'), 'Modal should be open');

    // Simulate pressing Escape key
    assert(typeof app.windowListeners.keydown === 'function', 'Keydown listener must be attached');
    app.windowListeners.keydown({ key: 'Escape', preventDefault(){} });
    assert(a$('modalRoot').classList.contains('hidden'), 'Modal must close on Escape key');
    console.log('PASS: Modal keyboard Escape-key dismissal and event management verified');
  }

  // TEST 8: Dismissal empty state vs Insufficient data empty state
  {
    const app = await makeContext();
    const a$ = id => app.document.getElementById(id);
    a$('generateBtn').click();

    // Dismiss all 3 insights
    for(let i=0; i<3; i++){
      const evidence = app.document.querySelectorAll('[data-evidence]');
      if(!evidence.length) break;
      evidence[0].click();
      const feedbackBtns = app.document.querySelectorAll('[data-feedback]');
      const dismissBtn = feedbackBtns.find(b => b.dataset.feedback === 'dismiss');
      dismissBtn.click();
    }

    assert(a$('insightList').innerHTML.includes('All insights have been dismissed'), 'Empty state after dismissing must acknowledge user dismissal');
    assert(a$('insightList').innerHTML.includes('Restore dismissed insights'), 'Must provide restore button');

    // Click restore
    const restoreBtn = a$('restoreDismissedBtn');
    restoreBtn.click();
    assert.strictEqual(a$('insightCount').textContent, '3 findings', 'Restoring dismissed insights should restore all 3');
    console.log('PASS: Dismissed empty state correctly distinguishes user dismissal from insufficient data');
  }

  // TEST 9: Edge case validations: duplicate ID, negative charges, header-only, invalid timestamps
  {
    const bad = await makeContext();
    const b$ = id => bad.document.getElementById(id);
    const duplicate = 'trade_id,instrument,entry_time,exit_time,position_size_inr,gross_pnl_inr,charges_inr\nA1,NIFTY,2026-10-01T09:15,2026-10-01T09:30,50000,1000,50\nA1,NIFTY,2026-10-01T10:00,2026-10-01T10:20,60000,-500,40';
    b$('csvInput').events.change({ target: { files: [{ text: async() => duplicate }], value: '' } });
    await new Promise(r => setImmediate(r));
    assert(b$('errorBox').textContent.includes('Duplicate trade_id'), 'Duplicate trade ID rejected');

    const malformed = await makeContext();
    const m$ = id => malformed.document.getElementById(id);
    const negCharges = 'trade_id,instrument,entry_time,exit_time,position_size_inr,gross_pnl_inr,charges_inr\nA1,NIFTY,2026-10-01T09:15,2026-10-01T09:30,50000,1000,-5';
    m$('csvInput').events.change({ target: { files: [{ text: async() => negCharges }], value: '' } });
    await new Promise(r => setImmediate(r));
    assert(m$('errorBox').textContent.includes('charges_inr must be zero or greater'), 'Negative charges rejected');

    const empty = await makeContext();
    const e$ = id => empty.document.getElementById(id);
    const headerOnly = 'trade_id,instrument,entry_time,exit_time,position_size_inr,gross_pnl_inr,charges_inr';
    e$('csvInput').events.change({ target: { files: [{ text: async() => headerOnly }], value: '' } });
    await new Promise(r => setImmediate(r));
    assert(e$('errorBox').textContent.includes('No completed trades'), 'Header only CSV rejected');

    const badDate = await makeContext();
    const d$ = id => badDate.document.getElementById(id);
    const invalidDate = 'trade_id,instrument,entry_time,exit_time,position_size_inr,gross_pnl_inr,charges_inr\nX1,NIFTY,not-a-date,2026-10-01T09:30,50000,1000,40';
    d$('csvInput').events.change({ target: { files: [{ text: async() => invalidDate }], value: '' } });
    await new Promise(r => setImmediate(r));
    assert(d$('errorBox').textContent.includes('not a valid date/time'), 'Invalid timestamp rejected');
    console.log('PASS: Standard edge cases validated (duplicates, negative charges, header-only, invalid dates)');
  }

  // TEST 10: Stepper navigation lifecycle, accessible aria-disabled states, keyboard/click feedback, and dynamic guard synchronization
  {
    const navApp = await makeContext();
    const n$ = id => navApp.document.getElementById(id);
    const steps = navApp.document.steps;

    // 10A: Initial load state & visual styling attributes
    assert.strictEqual(steps[0].disabled, false, 'Step 1 must not be natively disabled');
    assert.strictEqual(steps[0].getAttribute('aria-disabled'), 'false', 'Step 1 aria-disabled should be false');
    assert.strictEqual(steps[1].disabled, false, 'Step 2 must not be natively disabled so it can receive clicks/focus');
    assert.strictEqual(steps[1].getAttribute('aria-disabled'), 'true', 'Step 2 aria-disabled must be true for visual styling via .step[aria-disabled="true"]');
    assert.strictEqual(steps[2].disabled, false, 'Step 3 must not be natively disabled so it can receive clicks/focus');
    assert.strictEqual(steps[2].getAttribute('aria-disabled'), 'true', 'Step 3 aria-disabled must be true for visual styling via .step[aria-disabled="true"]');
    assert(steps[1].getAttribute('title').includes('Generate your review'), 'Step 2 should have explanatory locked tooltip');
    assert(steps[2].getAttribute('title').includes('Generate your review'), 'Step 3 should have explanatory locked tooltip');
    assert.strictEqual(n$('toExperimentBtn').disabled, true, 'toExperimentBtn should be disabled initially');
    assert(n$('stepperHint').textContent.includes('Generate your review'), 'Stepper hint should explain how to unlock Step 2');
    assert(!n$('stepperHint').classList.contains('hidden'), 'Stepper hint must be visible');

    // 10B: Locked steps receive click and keyboard activation events without changing view
    // Click locked Step 2
    steps[1].click();
    assert(n$('toast').textContent.includes('Generate your review to unlock Costly habits.'), 'Locked click must trigger explanatory toast');
    assert(!n$('toast').classList.contains('hidden'), 'Toast must be visible');
    assert(!n$('overviewView').classList.contains('hidden'), 'Overview view must remain active after clicking locked step');
    assert(n$('insightsView').classList.contains('hidden'), 'Insights view must remain hidden after clicking locked step');

    // Keyboard activation (Enter key) on locked Step 2
    steps[1].events.keydown({ key: 'Enter', target: steps[1], preventDefault(){} });
    assert(n$('toast').textContent.includes('Generate your review to unlock Costly habits.'), 'Locked Enter key must trigger explanatory toast');
    assert(!n$('overviewView').classList.contains('hidden'), 'View must not change on locked keyboard activation');

    // Keyboard activation (Space key) on locked Step 3
    steps[2].events.keydown({ key: ' ', target: steps[2], preventDefault(){} });
    assert(n$('toast').textContent.includes('Generate your review to unlock Costly habits.'), 'Locked Space key must trigger explanatory toast');
    assert(!n$('overviewView').classList.contains('hidden'), 'View must not change on locked keyboard activation');

    // 10C: Post-generation unlocked navigation
    n$('generateBtn').click();
    assert.strictEqual(steps[0].getAttribute('aria-disabled'), 'false', 'Step 1 remains unlocked');
    assert.strictEqual(steps[1].getAttribute('aria-disabled'), 'false', 'Step 2 unlocks after generating review');
    assert.strictEqual(steps[2].getAttribute('aria-disabled'), 'false', 'Step 3 unlocks when active findings exist');
    assert.strictEqual(steps[1].getAttribute('title'), null, 'Step 2 title tooltip removed when unlocked');
    assert.strictEqual(steps[2].getAttribute('title'), null, 'Step 3 title tooltip removed when unlocked');
    assert.strictEqual(n$('toExperimentBtn').disabled, false, 'toExperimentBtn unlocked when active findings exist');
    assert(n$('stepperHint').classList.contains('hidden'), 'Stepper hint hidden when all navigation unlocked');

    // Unlocked steps navigate correctly
    steps[2].click(); // navigate to experiment
    assert(!n$('experimentView').classList.contains('hidden'), 'Clicking unlocked Step 3 navigates to Experiment view');
    steps[1].click(); // navigate to insights
    assert(!n$('insightsView').classList.contains('hidden'), 'Clicking unlocked Step 2 navigates to Insights view');
    steps[0].click(); // navigate to overview
    assert(!n$('overviewView').classList.contains('hidden'), 'Clicking unlocked Step 1 navigates to Overview view');

    // 10D: Dynamic dismissal synchronization and locked feedback
    n$('generateBtn').click(); // back to insights
    // Dismiss first insight
    navApp.document.querySelectorAll('[data-evidence]')[0].click();
    navApp.document.querySelectorAll('[data-feedback]').find(b => b.dataset.feedback === 'dismiss').click();
    assert.strictEqual(steps[2].getAttribute('aria-disabled'), 'false', 'Step 3 remains unlocked with 2 active findings');
    assert.strictEqual(n$('toExperimentBtn').disabled, false, 'toExperimentBtn remains enabled with 2 active findings');

    // Dismiss remaining two insights
    navApp.document.querySelectorAll('[data-evidence]')[0].click();
    navApp.document.querySelectorAll('[data-feedback]').find(b => b.dataset.feedback === 'dismiss').click();
    navApp.document.querySelectorAll('[data-evidence]')[0].click();
    navApp.document.querySelectorAll('[data-feedback]').find(b => b.dataset.feedback === 'dismiss').click();

    // Now 0 active findings
    assert.strictEqual(steps[2].getAttribute('aria-disabled'), 'true', 'Step 3 dynamically locks (aria-disabled="true") when all findings dismissed');
    assert(steps[2].getAttribute('title').includes('At least one active finding'), 'Step 3 indicates why it is locked');
    assert.strictEqual(n$('toExperimentBtn').disabled, true, 'toExperimentBtn dynamically locks when 0 active findings');
    assert(n$('stepperHint').textContent.includes('At least one active finding'), 'Stepper hint informs user findings needed');
    assert(!n$('stepperHint').classList.contains('hidden'), 'Stepper hint must be visible');

    // Clicking locked Step 3 when all findings dismissed shows explanatory toast and prevents navigation
    steps[2].click();
    assert(n$('toast').textContent.includes('At least one active finding is needed to create a commitment.'), 'Locked Step 3 click triggers toast');
    assert(!n$('insightsView').classList.contains('hidden'), 'View does not switch to experiment when findings dismissed');

    // Clicking toExperimentBtn guard also prevents progression
    n$('toExperimentBtn').click();
    assert(n$('toast').textContent.includes('At least one active finding is needed to create a commitment.'), 'toExperimentBtn guard triggers toast');

    // Restore dismissed insights
    n$('restoreDismissedBtn').click();
    assert.strictEqual(steps[2].getAttribute('aria-disabled'), 'false', 'Step 3 dynamically unlocks after restoring findings');
    assert.strictEqual(n$('toExperimentBtn').disabled, false, 'toExperimentBtn dynamically unlocks after restore');
    assert.strictEqual(steps[2].getAttribute('title'), null, 'Step 3 title removed after restore');
    assert(n$('stepperHint').classList.contains('hidden'), 'Stepper hint hidden after restore');

    // 10E: Period change reset locks navigation
    n$('periodSelect').value = '2026-10';
    n$('periodSelect').events.change({ target: n$('periodSelect') });
    assert.strictEqual(steps[1].getAttribute('aria-disabled'), 'true', 'Step 2 locks when reporting period changes');
    assert.strictEqual(steps[2].getAttribute('aria-disabled'), 'true', 'Step 3 locks when reporting period changes');
    assert(n$('stepperHint').textContent.includes('Generate your review'), 'Stepper hint shows generation prompt');

    // 10F: Reset sample data locks navigation
    n$('generateBtn').click(); // re-generate first
    assert.strictEqual(steps[1].getAttribute('aria-disabled'), 'false', 'Step 2 unlocked after re-generation');
    n$('resetBtn').click();
    assert.strictEqual(steps[1].getAttribute('aria-disabled'), 'true', 'Step 2 locks when sample data reset');
    assert.strictEqual(steps[2].getAttribute('aria-disabled'), 'true', 'Step 3 locks when sample data reset');

    console.log('PASS: Stepper navigation lifecycle, accessible aria-disabled states, keyboard/click feedback, and dynamic guard synchronization verified');
  }

  console.log('ALL COMPREHENSIVE TESTS PASSED SUCCESSFULLY (10/10 BLOCKS)');
})().catch(e => {
  console.error('FAIL:', e.stack || e);
  process.exit(1);
});
