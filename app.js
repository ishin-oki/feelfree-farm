const config = window.FARM_CONFIG;
const quantity = document.querySelector('#quantity');
const money = n => '¥' + n.toLocaleString('ja-JP');
const method = () => document.querySelector('input[name="method"]:checked').value;
function update() {
 document.querySelector('#total').textContent = money(Number(quantity.value) * config.price);
 document.querySelector('#shipping-note').textContent = method() === 'shipping' ? '発送は要相談です。送料・対応地域は未確定で、商品代金には含まれません。' : '受取場所・日時は調整中です。';
 document.querySelector('#confirmation').hidden = true;
}
quantity.max = config.maxBags;
document.querySelector('#minus').onclick = () => { quantity.value = Math.max(1, Number(quantity.value) - 1); update(); };
document.querySelector('#plus').onclick = () => { quantity.value = Math.min(config.maxBags, Number(quantity.value) + 1); update(); };
quantity.addEventListener('input', update);
document.querySelectorAll('input[name="method"]').forEach(el => el.addEventListener('change', update));
document.querySelector('#order-form').addEventListener('submit', e => {
 e.preventDefault(); if (!e.target.reportValidity()) return;
 const text = `きゅうり ${quantity.value}袋 / 商品代金 ${money(Number(quantity.value) * config.price)}（税込・仮価格） / ${method() === 'local' ? 'ローカル受取（場所・日時未定）' : '発送相談（送料・対応可否未確定）'}`;
 document.querySelector('#summary').textContent = text;
 document.querySelector('#copy-status').textContent = '';
 const panel = document.querySelector('#confirmation'); panel.hidden = false; panel.focus(); panel.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center'});
});
document.querySelector('#copy').onclick = async () => {
 try { await navigator.clipboard.writeText('【確認用・未予約】' + document.querySelector('#summary').textContent); document.querySelector('#copy-status').textContent = '確認用の内容をコピーしました。予約は送信されていません。'; }
 catch { document.querySelector('#copy-status').textContent = 'コピーできませんでした。上の文章を選択してコピーしてください。'; }
};
const instagramLink = document.querySelector('#instagram-button');
if (/^https:\/\/(www\.)?instagram\.com\//.test(config.instagramUrl)) instagramLink.href = config.instagramUrl;

// A short, single scene: the next harvest joins the basket, then rests.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const scenes = [...document.querySelectorAll('[data-motion-scene]')];
const runningTimers = new Map();
function playScene(scene) {
 if (motionPreference.matches) return;
 clearTimeout(runningTimers.get(scene));
 scene.classList.remove('is-playing');
 void scene.offsetWidth;
 scene.classList.add('is-playing');
 if (scene.dataset.motionScene === 'hands') scene.closest('.hand-connection').classList.add('has-connected');
 runningTimers.set(scene, setTimeout(() => {
  scene.classList.remove('is-playing');
  runningTimers.delete(scene);
 }, 5200));
}
if ('IntersectionObserver' in window) {
 const sceneObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
   if (entry.isIntersecting) { playScene(entry.target); sceneObserver.unobserve(entry.target); }
  });
 }, {threshold: .55});
 scenes.forEach(scene => sceneObserver.observe(scene));
}
motionPreference.addEventListener('change', () => {
 scenes.forEach(scene => { clearTimeout(runningTimers.get(scene)); scene.classList.remove('is-playing'); });
 runningTimers.clear();
});

// Reading rhythm: each reveal settles once, without hiding content before JS.
const readingAnimations = new Set();
if ('IntersectionObserver' in window && typeof Element.prototype.animate === 'function') {
 const readingObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
   if (!entry.isIntersecting) return;
   readingObserver.unobserve(entry.target);
   if (motionPreference.matches) return;
   const type = entry.target.dataset.readingMotion;
   const frames = type === 'photo'
    ? [{opacity: .3, transform: 'translateY(16px) scale(.98)'}, {opacity: 1, transform: 'none'}]
    : [{opacity: 0, transform: 'translateY(14px)'}, {opacity: 1, transform: 'none'}];
   const animation = entry.target.animate(frames, {
    duration: type === 'photo' ? 900 : 650,
    delay: Number(entry.target.dataset.motionDelay || 0),
    easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'backwards'
   });
   readingAnimations.add(animation);
   animation.finished.then(() => readingAnimations.delete(animation)).catch(() => readingAnimations.delete(animation));
  });
 }, {threshold: .12});
 const registerReadingMotion = (selector, type, stagger = false) => {
  document.querySelectorAll(selector).forEach((element, index) => {
   element.dataset.readingMotion = type;
   element.dataset.motionDelay = stagger ? (index % 4) * 90 : 0;
   readingObserver.observe(element);
  });
 };
 registerReadingMotion('main h2, .story-body .large-copy, .connection-copy h3, .seasonal-heading', 'text');
 registerReadingMotion('.story-photo, .product-visual, .journal > div', 'photo', true);
 registerReadingMotion('.crop-grid > div, .article-grid > a, .event-row, .future > p:not(.eyebrow), .faq details', 'text', true);
 motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) {
   readingAnimations.forEach(animation => animation.cancel());
   readingAnimations.clear();
  }
 });
}
