// Paste into a bind.html page (or call with a window): lets the excerpt play once through its clips and checks
// each clip keeps its click target inside the stage. Takes about 20 s (four clips at their normal pace).
window.__fit = async function (w) {
  w = w || window; var d = w.document, out = [], seen = {};
  var play = d.querySelector('#cPlay'); if (play.getAttribute('aria-pressed') === 'true') play.click();
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  for (var k = 0; k < 40 && Object.keys(seen).length < 4; k++) {
    var cap = d.querySelector('#ct').textContent;
    if (!seen[cap]) {
      await wait(1900);
      var st = d.querySelector('#stage').getBoundingClientRect(), t = d.querySelector('#bn [data-t]').getBoundingClientRect();
      var inside = t.left >= st.left - 1 && t.right <= st.right + 1 && t.top >= st.top - 1 && t.bottom <= st.bottom + 1;
      seen[cap] = 1; out.push(cap + (inside ? ':ok' : ':OUT') + '@' + t.height.toFixed(0) + 'px');
    }
    await wait(700);
  }
  return out.join(' | ');
};
