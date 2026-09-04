(() => {
  'use strict';
  let lastResultId = null;
  let revealTimer = null;

  const render = (state, autoReveal = false) => {
    const list = TAG.ranked(state.families);
    document.getElementById('led-ranking').innerHTML = list.map((family, index) => `<div class="led-rank-row" style="--family:${family.color};--order:${index}"><div class="led-rank">${String(index + 1).padStart(2, '0')}</div><img src="${TAG.logo(family)}" alt="${TAG.escapeHTML(family.name)} emblem"><div class="led-family"><strong>${TAG.escapeHTML(family.name)}</strong><span>${family.wins} wins • ${family.momentum}% momentum</span></div><div class="led-score"><b data-led-score="${family.id}">${TAG.formatPoints(family.points)}</b><span>championship points</span></div></div>`).join('');
    const news = state.announcements[0];
    document.getElementById('led-ticker').innerHTML = `<strong>${TAG.escapeHTML(news.title)}</strong><span>— ${TAG.escapeHTML(news.body)}</span>`;
    if (autoReveal && state.results[0] && lastResultId && state.results[0].id !== lastResultId) showWinner(state.results[0], state);
    lastResultId = state.results[0]?.id || null;
  };

  const fireworks = (canvas) => {
    const context = canvas.getContext('2d');
    const ratio = Math.min(devicePixelRatio, 2); canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio; context.scale(ratio, ratio);
    const colors = ['#f4ce6a', '#ffffff', '#d55c79', '#ff8d43'];
    const particles = Array.from({ length: 170 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 170 + Math.random() * .3;
      const speed = 2.2 + Math.random() * 7;
      return { x: innerWidth * (.28 + Math.random() * .44), y: innerHeight * (.24 + Math.random() * .14), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 70 + Math.random() * 55, color: colors[index % colors.length], size: 1 + Math.random() * 3 };
    });
    let frame = 0;
    const animate = () => {
      context.clearRect(0, 0, innerWidth, innerHeight); context.globalCompositeOperation = 'lighter';
      particles.forEach((particle) => {
        if (particle.life <= 0) return;
        particle.x += particle.vx; particle.y += particle.vy; particle.vy += .045; particle.vx *= .992; particle.life -= 1;
        context.globalAlpha = Math.min(1, particle.life / 35); context.fillStyle = particle.color; context.fillRect(particle.x, particle.y, particle.size, particle.size * 2.2);
      });
      context.globalAlpha = 1; frame += 1; if (frame < 145) requestAnimationFrame(animate);
    };
    animate();
  };

  const showWinner = (result = TAG.state.results[0], state = TAG.state) => {
    if (!result) return;
    const winner = TAG.family(result.winner, state);
    document.getElementById('winner-content').innerHTML = `<div class="winner-trophy">🏆</div><small>${TAG.escapeHTML(result.event)} Champion</small><img src="${TAG.logo(winner)}" alt="${TAG.escapeHTML(winner.name)} emblem"><h2>${TAG.escapeHTML(winner.name)}</h2><p>+${TAG.formatPoints(result.points[0])} Championship Points</p>`;
    document.getElementById('winner-reveal').classList.add('open');
    fireworks(document.getElementById('fireworks'));
    clearTimeout(revealTimer); revealTimer = setTimeout(hideWinner, 9000);
  };
  const hideWinner = () => { document.getElementById('winner-reveal').classList.remove('open'); clearTimeout(revealTimer); };

  const tickClock = () => { document.getElementById('led-clock').textContent = new Intl.DateTimeFormat('en-PH', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()); };

  const init = async () => {
    const state = await TAG.load(); render(state); TAG.setupParticles(document.getElementById('led-particles'), { density: 72, speed: .25 }); tickClock(); setInterval(tickClock, 1000);
    TAG.subscribe((newState) => render(newState, true));
    document.getElementById('show-rankings').addEventListener('click', hideWinner);
    document.getElementById('show-winner').addEventListener('click', () => showWinner());
    document.getElementById('fullscreen').addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
    document.getElementById('winner-reveal').addEventListener('click', hideWinner);
    addEventListener('keydown', (event) => {
      if (event.key.toLowerCase() === 'f') document.getElementById('fullscreen').click();
      if (event.key.toLowerCase() === 'r' || event.key === 'Escape') hideWinner();
      if (event.key.toLowerCase() === 'c') showWinner();
    });
  };
  addEventListener('DOMContentLoaded', () => init().catch(console.error));
})();
