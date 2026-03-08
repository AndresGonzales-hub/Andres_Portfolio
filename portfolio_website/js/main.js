// js/main.js
document.addEventListener('DOMContentLoaded', function () {
  // footer year
  const yearEl = document.getElementById('year');
  if (yearEl && !yearEl.textContent) yearEl.textContent = new Date().getFullYear();

  // Timeline node click behavior (navigate to experience anchor)
  document.querySelectorAll('.timeline-node').forEach(node => {
    node.addEventListener('click', () => {
      const target = node.getAttribute('data-target');
      if (!target) return;
      // If same-page anchor -> smooth scroll
      if (target.startsWith('#')) {
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (target.includes('#')) {
        // Navigate to page anchor
        window.location.href = target;
      } else {
        window.location.href = target;
      }
    });
    node.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        node.click();
      }
    });
  });

  /* Globe setup */
  if (typeof Globe === 'undefined') {
    console.warn('Globe.gl not found. Ensure CDN script is included.');
  } else {
    const globeEl = document.getElementById('globeViz');
    const tooltip = document.getElementById('globeTooltip');
    const container = document.getElementById('globeContainer');

    if (globeEl && tooltip && container) {
      const markers = [
        { id: 'flagstaff', lat: 35.1983, lng: -111.6513, label: 'Flagstaff, AZ — NAU basecamp & capstone', target: 'experience.html#flagstaff' },
        { id: 'phoenix', lat: 33.4484, lng: -112.0740, label: 'Phoenix & Scottsdale — Real estate, early jobs, tutoring', target: 'experience.html#phoenix' },
        { id: 'monument', lat: 36.998979, lng: -110.098, label: 'Monument Valley / Colorado Plateau — CAMINOS research', target: 'experience.html#monument' },
        { id: 'madrid', lat: 40.4168, lng: -3.7038, label: 'Madrid, Spain — UC3M study abroad & BOSCH internship', target: 'experience.html#madrid' },
        { id: 'nau', lat: 35.1983, lng: -111.6513, label: 'NAU Capstone — systems integration & embedded controls', target: 'experience.html#nau-capstone' }
      ];

      const arcs = [
        { startLat: markers[0].lat, startLng: markers[0].lng, endLat: markers[3].lat, endLng: markers[3].lng },
        { startLat: markers[0].lat, startLng: markers[0].lng, endLat: markers[2].lat, endLng: markers[2].lng },
        { startLat: markers[1].lat, startLng: markers[1].lng, endLat: markers[0].lat, endLng: markers[0].lng }
      ];

      // Read theme colors from CSS variables
      const css = getComputedStyle(document.documentElement);
      const ACCENT_GREEN = (css.getPropertyValue('--accent-green') || '#7FB069').trim();
      const ACCENT_GREEN_DARK = (css.getPropertyValue('--accent-green-dark') || '#2E5129').trim();
      const ACCENT_PURPLE = (css.getPropertyValue('--accent-purple') || '#5B3E5C').trim();

      // Initialize globe
      const g = Globe()(globeEl)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundColor('rgba(0,0,0,0)')
        .showGraticules(false)
        .showAtmosphere(true)
        .atmosphereColor('#0ff')
        .atmosphereAltitude(0.25)
        .pointsData(markers)
        .pointLat(d => d.lat)
        .pointLng(d => d.lng)
        .pointColor(() => ACCENT_GREEN)
        .pointAltitude(() => 0.02)
        .pointRadius(0.6)
        .pointsTransitionDuration(300)
        .arcsData(arcs)
        .arcColor(() => [ACCENT_PURPLE])
        .arcStroke(0.7)
        .arcAltitude(0.18)
        .arcDashLength(0.3)
        .arcDashGap(0.7)
        .arcDashAnimateTime(2000)
        .enablePointerInteraction(true)
        .onGlobeReady(() => {
          // Better initial view centered more on US/North America
          g.pointOfView({ lat: 38, lng: -98, altitude: 2.6 }, 1000);

          // Force canvas to fill container properly
          const canvas = globeEl.querySelector('canvas');
          if (canvas) {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.display = 'block';
          }
          // Trigger resize to fix sizing/centering glitches
          window.dispatchEvent(new Event('resize'));
        });

      // Handle window resize properly (Globe.gl needs explicit width/height updates)
      function handleResize() {
        const rect = container.getBoundingClientRect();
        g.width(rect.width).height(rect.height);
        if (globeEl.querySelector('canvas')) {
          globeEl.querySelector('canvas').style.width = '100%';
          globeEl.querySelector('canvas').style.height = '100%';
        }
      }
      window.addEventListener('resize', handleResize);
      // Initial call
      setTimeout(handleResize, 100);

      // Tooltip positioning
      let lastMouse = { x: 0, y: 0 };
      container.addEventListener('mousemove', (ev) => {
        lastMouse.x = ev.clientX;
        lastMouse.y = ev.clientY;
        if (tooltip && tooltip.getAttribute('aria-hidden') === 'false') positionTooltip();
      });

      function positionTooltip() {
        const offsetY = 18;
        tooltip.style.left = `${lastMouse.x}px`;
        tooltip.style.top = `${lastMouse.y - offsetY}px`;
        const rect = tooltip.getBoundingClientRect();
        if (rect.right > window.innerWidth - 12) tooltip.style.left = `${window.innerWidth - rect.width - 12}px`;
        if (rect.left < 6) tooltip.style.left = `6px`;
      }

      g.onPointHover(function (d) {
        if (d) {
          tooltip.innerHTML = `<div class="tooltip-label">${d.label}</div>`;
          tooltip.setAttribute('aria-hidden', 'false');
          tooltip.hidden = false;
          positionTooltip();
        } else {
          tooltip.setAttribute('aria-hidden', 'true');
          tooltip.hidden = true;
        }
      });

      g.onPointClick(function (d) {
        if (!d) return;
        tooltip.innerHTML = `<div class="tooltip-label">${d.label}</div>
          <div style="text-align:center">
            <button class="globe-dive-btn" data-target="${d.target}" aria-label="Dive deeper about ${d.id}">Dive Deeper</button>
          </div>`;
        tooltip.setAttribute('aria-hidden', 'false');
        tooltip.hidden = false;
        positionTooltip();
        g.pointAltitude(() => 0.03);
        setTimeout(() => g.pointAltitude(() => 0.02), 420);
      });

      tooltip.addEventListener('click', function (ev) {
        const btn = ev.target.closest('.globe-dive-btn');
        if (!btn) return;
        const target = btn.getAttribute('data-target');
        if (!target) return;
        if (target.startsWith('#')) {
          const el = document.querySelector(target);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            return;
          }
        }
        window.location.href = target;
      });
    }
  }

  // --- True/False quiz logic for landing page ---
  const quizQuestions = [
    { q: 'The Light-Speed Seasoning: A grain of salt traveling at 99.9% the speed of light would carry enough kinetic energy to completely destroy the Earth upon impact.', a: false },
    { q: 'The Golden Gate Crash: A standard 4,000 lb sedan driving 120 mph directly into the side of a main support tower of the Golden Gate Bridge would cause the tower to buckle and bring the bridge down.', a: false },
    { q: 'The Empire State Penny: If you drop a penny off the top of the Empire State Building, it will reach a terminal velocity fast enough to pierce the skull of a pedestrian on the sidewalk.', a: false },
    { q: 'The Kinetic Kitchen: You can theoretically cook a raw, frozen chicken simply by slapping it enough times.', a: false },
    { q: 'The Spiderman Material: By weight, natural spider silk has a higher tensile strength than structural steel.', a: true },
    { q: 'The Mariana Trench Car Door: If you somehow opened a standard car door at the bottom of the Mariana Trench, the water rushing into the cabin would come in so fast it could literally cut you in half.', a: true },
    { q: 'The Sci-Fi Freeze: If you are ejected into deep space without a spacesuit, your body will instantly flash-freeze solid because space is absolute zero.', a: false },
    { q: 'The Antique Window Myth: Glass is technically a "highly viscous liquid" rather than a true solid, which is why windows in old medieval churches are thicker at the bottom than the top.', a: false },
    { q: 'The Earth Jump: If every human on Earth stood in one city and jumped at the exact same time, the combined force would be enough to push the Earth slightly out of its orbit.', a: false },
    { q: 'The Golf Ball Dimples: A golf ball flies significantly farther because of its dimples; a perfectly smooth golf ball would drop out of the sky much sooner.', a: true },
    { q: 'The Sweat Illusion: Sweating cools your body down because the water excreted onto your skin is physically colder than your internal body temperature.', a: false },
    { q: 'The Space Elevator: Carbon nanotubes have a high enough specific tensile strength that you could theoretically build a cable from the ground to geostationary orbit without the cable snapping under its own weight.', a: true },
    { q: 'The Fridge A/C: If you leave your refrigerator door wide open in a perfectly sealed, insulated room, the room will eventually get freezing cold.', a: false },
    { q: 'The Bass Drop Extinguisher: It is possible to extinguish a raging fire simply by blasting it with the right frequency of sound waves.', a: false },
    { q: 'The Bullet Drop: If you fire a gun perfectly horizontally across a flat plain, and simultaneously drop a bullet from your hand at the exact same height, the bullet fired from the gun will hit the ground later because of its extreme forward velocity.', a: true },
    { q: 'The Ultimate Beam: A solid steel cylinder is mathematically the most efficient cross-sectional shape for a beam to resist bending under heavy loads.', a: false },
    { q: 'The Re-entry Heat: Spacecraft re-entering the Earth\'s atmosphere heat up to thousands of degrees primarily because of the extreme friction of air rubbing against the hull.', a: false },
    { q: 'The Punchable Liquid: Non-Newtonian fluids, like a mixture of cornstarch and water (Oobleck), can temporarily behave like a solid rock if you punch them.', a: true },
    { q: 'The Tug-of-War Math: If two identical tug-of-war teams pull on opposite ends of a rope with 1,000 lbs of force each, the internal tension tearing at the center of the rope is 2,000 lbs.', a: true },
    { q: 'The Teapot Thermodynamics: A shiny, highly polished silver teapot will keep your tea hot for much longer than a matte black teapot made of the exact same material and thickness.', a: true }
  ];

  let quizIndex = 0;
  let quizScore = 0;
  const questionEl = document.getElementById('quizQuestion');
  const feedbackEl = document.getElementById('quizFeedback');
  const scoreEl = document.getElementById('quizScore');
  const trueBtn = document.getElementById('trueBtn');
  const falseBtn = document.getElementById('falseBtn');

  function showQuestion() {
    const current = quizQuestions[quizIndex];
    if (!current) {
      questionEl.textContent = 'Quiz complete! Final score: ' + quizScore + ' / ' + quizQuestions.length;
      trueBtn.disabled = false;
      falseBtn.disabled = false;
      return;
    }
    questionEl.textContent = current.q;
    feedbackEl.textContent = '';
    scoreEl.textContent = 'Score: ' + quizScore + '/' + quizQuestions.length;
  }

  function answerQuestion(choice) {
    const current = quizQuestions[quizIndex];
    if (!current) return;
    if (choice === current.a) {
      feedbackEl.textContent = '✅ Correct!';
      quizScore++;
    } else {
      feedbackEl.textContent = '❌ Incorrect';
    }
    quizIndex++;
    setTimeout(showQuestion, 1000);
  }

  if (trueBtn && falseBtn) {
    trueBtn.addEventListener('click', () => answerQuestion(true));
    falseBtn.addEventListener('click', () => answerQuestion(false));
  }

  showQuestion();
});