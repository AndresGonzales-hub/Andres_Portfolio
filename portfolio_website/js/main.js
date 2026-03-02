// js/main.js
// Initializes the Globe.gl visualization and timeline interactivity.
// Ensures the WebGL canvas is forced to fill and align inside its wrapper so the globe is centered/fully visible.

document.addEventListener('DOMContentLoaded', function () {
    // Footer year (safe guard if inline script didn't run)
    const yearEl = document.getElementById('year');
    if (yearEl && !yearEl.textContent) yearEl.textContent = new Date().getFullYear();

    /* -------------------------
       Globe initialization
       ------------------------- */
    if (typeof Globe === 'undefined') {
        console.warn('Globe.gl not found. Ensure <script src="//unpkg.com/globe.gl"></script> is present before js/main.js');
    } else {
        const container = document.getElementById('globeContainer');
        const globeEl = document.getElementById('globeViz');
        const tooltip = document.getElementById('globeTooltip');

        if (!container || !globeEl || !tooltip) {
            console.warn('Globe container, canvas or tooltip missing in DOM.');
        } else {
            const mouse = { x: 0, y: 0 };
            container.addEventListener('mousemove', (ev) => {
                mouse.x = ev.clientX;
                mouse.y = ev.clientY;
                if (tooltip && tooltip.getAttribute('aria-hidden') === 'false') {
                    positionTooltip();
                }
            });

            const markers = [
                { id: 'flagstaff', lat: 35.1983, lng: -111.6513, label: 'Flagstaff, AZ — NAU Robotics' },
                { id: 'madrid', lat: 40.4168, lng: -3.7038, label: 'Madrid, ES — BOSCH Internship & UC3M' },
                { id: 'colorado_plateau', lat: 36.1069, lng: -112.1129, label: 'Colorado Plateau — FEWSION Research' }
            ];
            const arcs = [
                { startLat: markers[0].lat, startLng: markers[0].lng, endLat: markers[1].lat, endLng: markers[1].lng },
                { startLat: markers[1].lat, startLng: markers[1].lng, endLat: markers[2].lat, endLng: markers[2].lng },
                { startLat: markers[2].lat, startLng: markers[2].lng, endLat: markers[0].lat, endLng: markers[0].lng }
            ];

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
                .pointColor(() => '#00d0ff')
                .pointAltitude(() => 0.02)
                .pointRadius(0.6)
                .pointsTransitionDuration(300)
                .arcsData(arcs)
                .arcColor(() => ['#00d0ff'])
                .arcStroke(0.7)
                .arcAltitude(0.2)
                .arcDashLength(0.3)
                .arcDashGap(0.7)
                .arcDashAnimateTime(2000)
                .enablePointerInteraction(true)
                .onGlobeReady(() => {
                    // 1) Best-effort center the camera so the whole globe is visible
                    g.pointOfView({ lat: 0, lng: 0, altitude: 1.8 }, 900);

                    // 2) Ensure wrapper has no padding that could offset the canvas
                    try {
                        container.style.padding = '0';
                        globeEl.style.padding = '0';
                        globeEl.style.margin = '0';
                        globeEl.style.display = 'block';
                        container.style.display = 'block';
                    } catch (e) { /* ignore */ }

                    // 3) Find the canvas injected by Three.js and force it to fill the parent exactly
                    try {
                        const canvas = globeEl.querySelector('canvas') || globeEl.getElementsByTagName('canvas')[0];
                        if (canvas) {
                            canvas.style.position = 'absolute';
                            canvas.style.top = '0';
                            canvas.style.left = '0';
                            canvas.style.width = '100%';
                            canvas.style.height = '100%';
                            canvas.style.maxWidth = '100%';
                            canvas.style.maxHeight = '100%';
                            canvas.style.transform = 'none';
                            canvas.style.margin = '0';
                            canvas.style.padding = '0';
                            // also reset parent positioning just in case
                            globeEl.style.position = 'relative';
                        }
                    } catch (e) { /* ignore */ }

                    // 4) Nudge a resize on next RAF to force Three.js to recompute sizes.
                    requestAnimationFrame(() => {
                        window.dispatchEvent(new Event('resize'));
                        // Re-center POV once more after resize settles
                        setTimeout(() => {
                            try {
                                g.pointOfView({ lat: 0, lng: 0, altitude: 1.8 }, 400);
                            } catch (e) { /* ignore */ }
                        }, 200);
                    });
                });

            function positionTooltip() {
                const offsetY = 18;
                tooltip.style.left = `${mouse.x}px`;
                tooltip.style.top = `${mouse.y - offsetY}px`;
                const rect = tooltip.getBoundingClientRect();
                if (rect.right > window.innerWidth - 12) {
                    tooltip.style.left = `${window.innerWidth - rect.width - 12}px`;
                }
                if (rect.left < 6) {
                    tooltip.style.left = `6px`;
                }
            }

            let hoverMarker = null;

            g.onPointHover(function (d) {
                if (d) {
                    hoverMarker = d;
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

            g.onPointClick(function (d) {
                if (!d) return;
                g.pointAltitude(() => 0.03);
                setTimeout(() => g.pointAltitude(() => 0.02), 420);

                tooltip.textContent = `${d.label} — View details in Experience`;
                tooltip.setAttribute('aria-hidden', 'false');
                tooltip.hidden = false;
                positionTooltip();

                clearTimeout(g._tooltipTimeout);
                g._tooltipTimeout = setTimeout(() => {
                    if (!hoverMarker) {
                        tooltip.setAttribute('aria-hidden', 'true');
                        tooltip.hidden = true;
                    }
                }, 2200);
            });
        }
    }

    /* -------------------------
       Timeline interactions
       ------------------------- */
    const nodes = document.querySelectorAll('.timeline-node');
    nodes.forEach(node => {
        node.addEventListener('click', () => {
            const target = node.getAttribute('data-target');
            if (target) {
                node.classList.add('active-click');
                setTimeout(() => { window.location.href = target; }, 150);
            }
        });
        node.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                node.click();
            }
        });
    });
});