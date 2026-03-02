// js/main.js
// Initializes the Globe.gl visualization and timeline interactivity.
// Heavily commented for clarity. Uses vanilla JS only.

// Wait until DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    // Set the footer year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* -------------------------
       1) Globe initialization
       ------------------------- */
    // Ensure Globe is available (globe.gl loaded via CDN in index.html)
    if (typeof Globe === 'undefined') {
        // Fail gracefully
        console.warn('Globe.gl not found. Ensure <script src="//unpkg.com/globe.gl"></script> is present before js/main.js');
    } else {
        // Reference elements
        const container = document.getElementById('globeContainer');
        const globeEl = document.getElementById('globeViz');
        const tooltip = document.getElementById('globeTooltip');

        // Keep last mouse position to place tooltip near pointer
        const mouse = { x: 0, y: 0 };
        container.addEventListener('mousemove', (ev) => {
            mouse.x = ev.clientX;
            mouse.y = ev.clientY;
            // If tooltip visible, keep it near pointer
            if (tooltip && tooltip.getAttribute('aria-hidden') === 'false') {
                positionTooltip();
            }
        });

        // Locations (markers) — minimal dataset representing nodes
        const markers = [
            {
                id: 'flagstaff',
                lat: 35.1983,
                lng: -111.6513,
                label: 'Flagstaff, AZ — NAU Robotics'
            },
            {
                id: 'madrid',
                lat: 40.4168,
                lng: -3.7038,
                label: 'Madrid, ES — BOSCH Internship & UC3M'
            },
            {
                id: 'colorado_plateau',
                lat: 36.1069,
                lng: -112.1129,
                label: 'Colorado Plateau — FEWSION Research'
            }
        ];

        // Arcs connecting the points (triangle)
        const arcs = [
            { startLat: markers[0].lat, startLng: markers[0].lng, endLat: markers[1].lat, endLng: markers[1].lng },
            { startLat: markers[1].lat, startLng: markers[1].lng, endLat: markers[2].lat, endLng: markers[2].lng },
            { startLat: markers[2].lat, startLng: markers[2].lng, endLat: markers[0].lat, endLng: markers[0].lng }
        ];

        // Initialize Globe
        // Use a dark earth texture so the globe appears sleek on the dark UI.
        const g = Globe()
            (globeEl)
            .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg') // darkish earth texture
            .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundColor('rgba(0,0,0,0)') // transparent to blend with page
            .showGraticules(false)
            .showAtmosphere(true)
            .atmosphereColor('#0ff') // subtle cyan rim
            .atmosphereAltitude(0.25)
            // Points (markers)
            .pointsData(markers)
            .pointLat(d => d.lat)
            .pointLng(d => d.lng)
            .pointColor(() => '#00d0ff')    // bright cyan
            .pointAltitude(() => 0.02)
            .pointRadius(0.6)
            .pointsTransitionDuration(300)
            // Arcs
            .arcsData(arcs)
            .arcColor(() => ['#00d0ff'])
            .arcStroke(0.7)
            .arcAltitude(0.2)
            .arcStroke(() => 0.8)
            .arcDashLength(0.3)
            .arcDashGap(0.7)
            .arcDashAnimateTime(2000)
            // Controls tuning
            .enablePointerInteraction(true)
            .onGlobeReady(() => {
                // set an initial point of view
                g.pointOfView({ lat: 20, lng: -20, altitude: 2.8 }, 800);
            });

        // Tooltip helper: position and show/hide
        function positionTooltip() {
            // place tooltip slightly above pointer
            const offsetY = 18;
            tooltip.style.left = `${mouse.x}px`;
            tooltip.style.top = `${mouse.y - offsetY}px`;
            // keep tooltip within viewport horizontally
            const rect = tooltip.getBoundingClientRect();
            if (rect.right > window.innerWidth - 12) {
                tooltip.style.left = `${window.innerWidth - rect.width - 12}px`;
            }
            if (rect.left < 6) {
                tooltip.style.left = `6px`;
            }
        }

        // Keep track of currently hovered marker
        let hoverMarker = null;

        // Globe.gl provides onPointHover for pointsData
        g.onPointHover(function (d) {
            if (d) {
                hoverMarker = d;
                // Fill tooltip content and show
                tooltip.textContent = d.label || `${d.lat}, ${d.lng}`;
                tooltip.setAttribute('aria-hidden', 'false');
                tooltip.hidden = false;
                positionTooltip();
            } else {
                hoverMarker = null;
                tooltip.setAttribute('aria-hidden', 'true');
                tooltip.hidden = true;
            }
        });

        // On click, show a subtle pulse and keep tooltip visible briefly (no navigation).
        g.onPointClick(function (d) {
            if (!d) return;
            // small visual feedback: enlarge then restore
            const original = g.pointAltitude();
            g.pointAltitude(() => 0.03);
            setTimeout(() => {
                g.pointAltitude(() => 0.02);
            }, 420);

            // Keep tooltip visible and add a short hint to navigate to Experience
            tooltip.textContent = `${d.label} — View details in Experience`;
            tooltip.setAttribute('aria-hidden', 'false');
            tooltip.hidden = false;
            positionTooltip();

            // hide after 2.2s
            clearTimeout(g._tooltipTimeout);
            g._tooltipTimeout = setTimeout(() => {
                if (!hoverMarker) {
                    tooltip.setAttribute('aria-hidden', 'true');
                    tooltip.hidden = true;
                }
            }, 2200);
        });
    } // end Globe init

    /* -------------------------
       2) Vertical timeline interactions
       ------------------------- */
    // Make timeline nodes keyboard-focusable and clickable to funnel to other pages.
    const nodes = document.querySelectorAll('.timeline-node');
    nodes.forEach(node => {
        // Click => navigate to target page (data-target)
        node.addEventListener('click', () => {
            const target = node.getAttribute('data-target');
            if (target) {
                // Small transition/feedback
                node.classList.add('active-click');
                // Navigate after a short delay for the micro-interaction
                setTimeout(() => {
                    window.location.href = target;
                }, 150);
            }
        });

        // Keyboard: Enter or Space should activate
        node.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                node.click();
            }
        });

        // Hover provides CSS transition already defined in CSS
        node.addEventListener('mouseover', () => {
            node.setAttribute('aria-pressed', 'false');
        });
        node.addEventListener('mouseout', () => {
            node.removeAttribute('aria-pressed');
        });
    });

}); // end DOMContentLoaded