/**
 * scroll-story.js  — Cinematic frame-scroll animation
 * Canvas is driven by native scroll + rAF (no GSAP dependency for rendering).
 * GSAP is used only for the frosted-glass card slide-ins.
 */
(function () {
  'use strict';

  // ─── CANVAS INIT (immediate — no waiting for anything) ───────────────────
  var canvas = document.getElementById('storyCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var W = 0, H = 0, lastProg = 0, rafPending = false;

  function setSize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    draw(lastProg);
  }

  // Call immediately — do not wait for load/ready
  setSize();

  var _rsz;
  window.addEventListener('resize', function () {
    clearTimeout(_rsz);
    _rsz = setTimeout(setSize, 120);
  });

  // ─── SCROLL → PROGRESS ───────────────────────────────────────────────────
  function getProgress() {
    var el = document.getElementById('story');
    if (!el) return 0;
    var top   = el.getBoundingClientRect().top;
    var range = el.offsetHeight - window.innerHeight;
    if (range <= 0) return 0;
    return Math.max(0, Math.min(1, -top / range));
  }

  window.addEventListener('scroll', function () {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(function () {
        rafPending = false;
        draw(getProgress());
      });
    }
  }, { passive: true });

  // ─── SCENE PALETTE ───────────────────────────────────────────────────────
  var SC = [
    { b1: '#040e18', b2: '#0c2236', ac: '#00e5cc', name: 'Her Story'   },
    { b1: '#04061a', b2: '#0a1460', ac: '#60a5fa', name: 'Education'   },
    { b1: '#021810', b2: '#044a3c', ac: '#2dd4bf', name: 'Experience'  },
    { b1: '#0a0318', b2: '#180840', ac: '#c084fc', name: 'Impact'      },
    { b1: '#120700', b2: '#3d1800', ac: '#fbbf24', name: 'Legacy'      },
  ];

  // ─── PARTICLES (generated once) ──────────────────────────────────────────
  var PTS = (function () {
    var arr = [];
    for (var i = 0; i < 210; i++) {
      arr.push({
        nx: Math.random(), ny: Math.random(),
        sz: Math.random() * 2.2 + 0.4,
        ph: Math.random() * Math.PI * 2,
        ox: (Math.random() - 0.5) * 0.055,
        oy: (Math.random() - 0.5) * 0.035,
        sp: Math.random() * 0.7 + 0.25,
      });
    }
    return arr;
  }());

  // ─── COLOUR HELPERS ──────────────────────────────────────────────────────
  function rgb(hex) {
    return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
  }
  function col(hex, a) {
    var c = rgb(hex);
    return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';
  }
  function ease(t) {            // smooth ease-in-out
    return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
  }
  function cl(v,lo,hi) { return Math.max(lo,Math.min(hi,v)); }

  // ─── MAIN DRAW ───────────────────────────────────────────────────────────
  function draw(p) {
    lastProg = p;
    if (!W || !H) return;

    p = cl(p, 0, 0.9999);
    var si = Math.floor(p * 5);       // scene 0-4
    var sp = (p * 5) % 1;             // progress inside scene 0-1
    var sc = SC[si];
    var cx = W / 2, cy = H / 2;

    // ── background gradient ──
    var bg = ctx.createLinearGradient(0, 0, W * 0.65, H);
    bg.addColorStop(0, sc.b1);
    bg.addColorStop(1, sc.b2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── ambient glow ──
    var ag = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W,H)*0.52);
    ag.addColorStop(0,   col(sc.ac, 0.13 + sp*0.07));
    ag.addColorStop(0.55,col(sc.ac, 0.04));
    ag.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = ag;
    ctx.fillRect(0, 0, W, H);

    // ── particles ──
    var t = p * 6;
    for (var i = 0; i < PTS.length; i++) {
      var pt = PTS[i];
      var px = (pt.nx + Math.sin(pt.ph + t*pt.sp)   * pt.ox) * W;
      var py = (pt.ny + Math.cos(pt.ph + t*pt.sp*.7) * pt.oy) * H;
      var pa = 0.1 + Math.abs(Math.sin(pt.ph + t*.35)) * 0.22;
      ctx.beginPath();
      ctx.arc(px, py, pt.sz, 0, Math.PI*2);
      ctx.fillStyle = col(sc.ac, pa);
      ctx.fill();
    }

    // ── central scene element ──
    ctx.save();
    ctx.translate(cx, cy - H*0.04);
    try {
      if      (si===0) s0(sp, sc.ac);
      else if (si===1) s1(sp, sc.ac);
      else if (si===2) s2(sp, sc.ac);
      else if (si===3) s3(sp, sc.ac);
      else             s4(sp, sc.ac);
    } catch(e) { /* silent */ }
    ctx.restore();

    // ── scan lines ──
    ctx.fillStyle = 'rgba(0,0,0,0.024)';
    for (var y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

    // ── vignette ──
    var vg = ctx.createRadialGradient(cx,cy, H*.1, cx,cy, Math.max(W,H)*.72);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,'rgba(0,0,0,0.68)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // ── HUD ──
    var bar = document.getElementById('sceneProgressBar');
    if (bar) bar.style.width = (sp*100)+'%';
    var lbl = document.getElementById('sceneLabel');
    if (lbl) lbl.textContent = sc.name;
  }

  // ─── SCENE 0 — pulsing orb + tooth glyph ────────────────────────────────
  function s0(sp, ac) {
    var pulse = 0.5 + 0.5*Math.sin(sp*Math.PI*4);
    var R = 82 + pulse*20;

    // shimmer halos
    for (var r=4; r>=0; r--) {
      var hR = R + r*34;
      var hg = ctx.createRadialGradient(0,0,hR-8, 0,0,hR+8);
      hg.addColorStop(0, col(ac,0));
      hg.addColorStop(.5, col(ac, 0.07 - r*.012));
      hg.addColorStop(1, col(ac,0));
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(0,0,hR+8,0,Math.PI*2); ctx.fill();
    }

    // core
    var cg = ctx.createRadialGradient(0,0,0, 0,0,R);
    cg.addColorStop(0,   col(ac, 0.75 + pulse*.25));
    cg.addColorStop(0.55,col(ac, 0.22));
    cg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(0,0,R,0,Math.PI*2); ctx.fill();

    // tooth glyph
    var sc2 = R/52;
    ctx.save();
    ctx.scale(sc2, sc2);
    ctx.globalAlpha = cl(sp*2.2, 0, 1);
    ctx.strokeStyle = ac;
    ctx.lineWidth   = 3.5/sc2;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.shadowColor = ac; ctx.shadowBlur = 26/sc2;
    ctx.beginPath();
    ctx.moveTo(0,-45);
    ctx.bezierCurveTo(25,-45,32,-22,23,5);
    ctx.bezierCurveTo(16,25,11,42,0,48);
    ctx.bezierCurveTo(-11,42,-16,25,-23,5);
    ctx.bezierCurveTo(-32,-22,-25,-45,0,-45);
    ctx.closePath(); ctx.stroke();
    // crown lines
    ctx.beginPath();
    ctx.moveTo(-13,-31); ctx.lineTo(-9,-11);
    ctx.moveTo(0,-36);   ctx.lineTo(0,-11);
    ctx.moveTo(13,-31);  ctx.lineTo(9,-11);
    ctx.stroke();
    ctx.restore();

    // rotating dashed orbit + nodes
    ctx.save();
    ctx.rotate(sp*Math.PI*1.9);
    ctx.strokeStyle = col(ac, 0.22);
    ctx.lineWidth = 1.3;
    ctx.setLineDash([5,11]);
    ctx.beginPath(); ctx.arc(0,0,R*1.72,0,Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = col(ac, 0.55);
    for (var d=0; d<7; d++) {
      var a = d/7*Math.PI*2;
      ctx.beginPath();
      ctx.arc(Math.cos(a)*R*1.72, Math.sin(a)*R*1.72, 3.8, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ─── SCENE 1 — X-ray grid + diploma ─────────────────────────────────────
  function s1(sp, ac) {
    // X-ray grid
    ctx.strokeStyle = col(ac, 0.06);
    ctx.lineWidth = 1;
    for (var x=-W/2; x<W/2; x+=42) {
      ctx.beginPath(); ctx.moveTo(x,-H/2); ctx.lineTo(x,H/2); ctx.stroke();
    }
    for (var y=-H/2; y<H/2; y+=42) {
      ctx.beginPath(); ctx.moveTo(-W/2,y); ctx.lineTo(W/2,y); ctx.stroke();
    }

    // diploma card
    var dw = Math.min(W*.42, 300) * ease(cl(sp*1.5, 0, 1));
    var dh = dw * 0.68;
    ctx.fillStyle   = col(ac, 0.055);
    ctx.strokeStyle = col(ac, 0.68);
    ctx.lineWidth   = 2;
    ctx.shadowColor = ac; ctx.shadowBlur = 26;
    rr(ctx, -dw/2, -dh/2, dw, dh, 15);
    ctx.fill(); ctx.stroke();

    // inner text lines
    if (sp > 0.2) {
      var la = ease(cl((sp-.2)*2.8, 0, 1));
      ctx.shadowBlur = 4;
      ctx.strokeStyle = col(ac, 0.28*la);
      ctx.lineWidth = 1.5;
      for (var l=0; l<4; l++) {
        var lx = dw*(0.48 - l*.045);
        var ly = -dh/2 + 28 + l*(dh-56)/3;
        ctx.beginPath(); ctx.moveTo(-lx/2,ly); ctx.lineTo(lx/2,ly); ctx.stroke();
      }
    }

    // wax seal star
    if (sp > 0.5) {
      var sa = ease(cl((sp-.5)*2, 0, 1));
      ctx.save(); ctx.globalAlpha = sa;
      ctx.translate(0, dh/2+36);
      starShape(ctx, 0, 0, 5, 20, 10, ac);
      ctx.restore();
    }

    // floating credential pills
    if (sp > 0.38) {
      var pa = ease(cl((sp-.38)/.6, 0, 1));
      var pills = ['BDS', 'Reg. A31210', 'MCI Verified'];
      for (var pi=0; pi<pills.length; pi++) {
        var ang = -0.7 + pi*0.7;
        var rad = Math.min(W,H)*0.27;
        var ppx = Math.cos(ang - Math.PI/2)*rad;
        var ppy = Math.sin(ang - Math.PI/2)*rad + 18;
        var tw  = pills[pi].length*7.6+28;
        ctx.save();
        ctx.globalAlpha = pa * (0.65 + pi*.12);
        ctx.fillStyle   = col(ac, 0.14);
        ctx.strokeStyle = col(ac, 0.45);
        ctx.lineWidth = 1.5;
        ctx.shadowColor = ac; ctx.shadowBlur = 14;
        rr(ctx, ppx-tw/2, ppy-14, tw, 28, 14);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = col(ac, 0.95);
        ctx.font = '600 11px Poppins,Arial,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillText(pills[pi], ppx, ppy);
        ctx.restore();
      }
    }
  }

  // ─── SCENE 2 — pulse rings + timeline ───────────────────────────────────
  function s2(sp, ac) {
    // heartbeat rings
    for (var r=0; r<8; r++) {
      var ph = (sp*2.2 + r/8) % 1;
      var rad = ease(ph) * Math.min(W,H)*.44;
      var a   = Math.pow(1-ph, 2) * .48;
      ctx.beginPath(); ctx.arc(0,0,rad,0,Math.PI*2);
      ctx.strokeStyle = col(ac, a);
      ctx.lineWidth = 1.8; ctx.stroke();
    }

    // medical cross
    ctx.strokeStyle = col(ac, 0.9);
    ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.shadowColor = ac; ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.moveTo(-32,0); ctx.lineTo(32,0);
    ctx.moveTo(0,-32); ctx.lineTo(0,32);
    ctx.stroke();

    // centre glow dot
    var dg = ctx.createRadialGradient(0,0,0, 0,0,16);
    dg.addColorStop(0, col(ac,.9)); dg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*2); ctx.fill();

    // timeline
    if (sp > 0.16) {
      var ta = ease(cl((sp-.16)/.56, 0, 1));
      var tlW = Math.min(W*.56, 340);
      var tlY = H*.41;
      ctx.save(); ctx.globalAlpha = ta;

      ctx.strokeStyle = col(ac,.18); ctx.lineWidth = 2; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.moveTo(-tlW/2,tlY); ctx.lineTo(tlW/2,tlY); ctx.stroke();

      ctx.strokeStyle = col(ac,.62); ctx.lineWidth = 2.6;
      ctx.shadowColor = ac; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(-tlW/2,tlY); ctx.lineTo(-tlW/2+tlW*ta,tlY); ctx.stroke();

      var yrs = ['2014','2016','2018','2020','2022','2024+'];
      for (var yi=0; yi<yrs.length; yi++) {
        var nx = -tlW/2 + yi/(yrs.length-1)*tlW;
        var active = nx <= -tlW/2 + tlW*ta - 2;
        ctx.beginPath(); ctx.arc(nx, tlY, active?5:3, 0, Math.PI*2);
        ctx.fillStyle = active ? col(ac,.9) : col(ac,.28);
        ctx.shadowBlur = active ? 10 : 0; ctx.fill();
        if (active && yi%2===0) {
          ctx.fillStyle = col(ac,.65);
          ctx.font = '500 10px Poppins,Arial,sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.shadowBlur = 0;
          ctx.fillText(yrs[yi], nx, tlY+11);
        }
      }
      ctx.restore();
    }
  }

  // ─── SCENE 3 — smile dots + burst ───────────────────────────────────────
  function s3(sp, ac) {
    var total = 150;
    var show  = Math.floor(ease(cl(sp*1.55, 0, 1)) * total);
    var sR    = Math.min(W,H)*.23;

    ctx.shadowColor = ac; ctx.shadowBlur = 7;
    for (var i=0; i<show; i++) {
      var t = i/total;
      var ang = Math.PI*.09 + t*Math.PI*.82;
      var wb  = Math.sin(t*Math.PI*10 + sp*4) * 3;
      var x   = Math.cos(ang)*(sR+wb);
      var y   = Math.sin(ang)*(sR+wb);
      ctx.beginPath(); ctx.arc(x,y, 2.6, 0, Math.PI*2);
      ctx.fillStyle = col(ac, .65 + t*.3); ctx.fill();
    }

    // eyes
    if (sp > 0.46) {
      var ea = ease(cl((sp-.46)*2, 0, 1));
      var er = sR*.44;
      var eyes = [[-er, -sR*.52],[er, -sR*.52]];
      for (var ei=0; ei<eyes.length; ei++) {
        var ex=eyes[ei][0], ey=eyes[ei][1];
        ctx.save(); ctx.globalAlpha = ea;
        var eg = ctx.createRadialGradient(ex,ey,0, ex,ey,15);
        eg.addColorStop(0,col(ac,1)); eg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = eg;
        ctx.beginPath(); ctx.arc(ex,ey,15,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex,ey,6,0,Math.PI*2);
        ctx.fillStyle = col(ac,1); ctx.shadowBlur=14; ctx.fill();
        ctx.restore();
      }
    }

    // burst ring
    if (sp > 0.68) {
      var ba = ease(cl((sp-.68)/.32, 0, 1));
      ctx.shadowBlur = 10;
      for (var bi=0; bi<30; bi++) {
        var ba2 = bi/30*Math.PI*2;
        var bd  = sR*1.42*ba;
        ctx.beginPath();
        ctx.arc(Math.cos(ba2)*bd, Math.sin(ba2)*bd, 2+ba*1.5, 0, Math.PI*2);
        ctx.fillStyle = col(ac, .4*ba); ctx.fill();
      }
    }
  }

  // ─── SCENE 4 — starburst + trophy ───────────────────────────────────────
  function s4(sp, ac) {
    var nR = 16;
    ctx.shadowColor = ac; ctx.shadowBlur = 18;
    for (var i=0; i<nR; i++) {
      var ang = i/nR*Math.PI*2 - Math.PI/2;
      var len = (i%2===0?130:78) * ease(cl(sp*1.4, 0, 1));
      ctx.strokeStyle = col(ac, (.48+i%2*.22)*sp);
      ctx.lineWidth = i%2===0 ? 2 : 1.2;
      ctx.beginPath(); ctx.moveTo(0,0);
      ctx.lineTo(Math.cos(ang)*len, Math.sin(ang)*len); ctx.stroke();
    }

    // rotating orbit ring
    ctx.save(); ctx.rotate(sp*Math.PI*2);
    ctx.strokeStyle = col(ac,.28); ctx.lineWidth = 1.5;
    ctx.setLineDash([4,8]);
    ctx.beginPath(); ctx.arc(0,0,150,0,Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
    for (var d=0; d<8; d++) {
      var da = d/8*Math.PI*2;
      ctx.beginPath(); ctx.arc(Math.cos(da)*150, Math.sin(da)*150, 3.6, 0, Math.PI*2);
      ctx.fillStyle = col(ac,.65); ctx.fill();
    }
    ctx.restore();

    // star
    if (sp > 0.16) {
      ctx.save();
      ctx.globalAlpha = ease(cl((sp-.16)/.42, 0, 1));
      starShape(ctx, 0, 0, 5, 54*ease(cl((sp-.16)/.44,0,1)), 27, ac);
      ctx.restore();
    }

    // trophy
    if (sp > 0.42) {
      var ta = ease(cl((sp-.42)/.58, 0, 1));
      ctx.save(); ctx.globalAlpha = ta;
      ctx.strokeStyle = col(ac,.88);
      ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.shadowColor = ac; ctx.shadowBlur = 28;
      ctx.beginPath();
      ctx.moveTo(-34,-68); ctx.lineTo(-40,-24);
      ctx.bezierCurveTo(-40,24, 40,24, 40,-24);
      ctx.lineTo(34,-68); ctx.closePath(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-40,-46); ctx.bezierCurveTo(-64,-46,-64,-12,-40,-12); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(40,-46); ctx.bezierCurveTo(64,-46,64,-12,40,-12); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-18,24); ctx.lineTo(-18,44);
      ctx.moveTo(18,24);  ctx.lineTo(18,44);
      ctx.moveTo(-26,44); ctx.lineTo(26,44);
      ctx.stroke();
      ctx.save(); ctx.translate(0,-22);
      ctx.globalAlpha = ta*.85;
      starShape(ctx,0,0,5,14,7,ac);
      ctx.restore();
      ctx.restore();
    }
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────
  function rr(c, x, y, w, h, r) {  // rounded-rect path
    c.beginPath();
    c.moveTo(x+r, y);
    c.lineTo(x+w-r, y); c.quadraticCurveTo(x+w,y,   x+w,y+r);
    c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w,y+h, x+w-r,y+h);
    c.lineTo(x+r, y+h); c.quadraticCurveTo(x,y+h, x,y+h-r);
    c.lineTo(x, y+r); c.quadraticCurveTo(x,y, x+r,y);
    c.closePath();
  }

  function starShape(c, cx, cy, pts, outer, inner, col2) {
    c.save(); c.translate(cx, cy);
    c.beginPath();
    for (var i=0; i<pts*2; i++) {
      var r = i%2===0 ? outer : inner;
      var a = i/(pts*2)*Math.PI*2 - Math.PI/2;
      i===0 ? c.moveTo(r*Math.cos(a), r*Math.sin(a))
            : c.lineTo(r*Math.cos(a), r*Math.sin(a));
    }
    c.closePath();
    c.fillStyle   = col(col2, 0.22);
    c.strokeStyle = col(col2, 0.85);
    c.lineWidth   = 2;
    c.shadowColor = col2; c.shadowBlur = 22;
    c.fill(); c.stroke();
    c.restore();
  }

  // ─── GSAP CARD ANIMATIONS (optional enhancement) ─────────────────────────
  function initCards() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.achievement-item').forEach(function (el) {
      var side = el.getAttribute('data-align') === 'left' ? -60 : 60;
      gsap.fromTo(el,
        { opacity: 0, x: side, y: 38, scale: 0.93 },
        {
          opacity: 1, x: 0, y: 0, scale: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
            end:   'top 26%',
            scrub: 0.9,
          },
        }
      );
    });

    // count-up numbers
    gsap.utils.toArray('.story-stat-num').forEach(function (el) {
      var tgt  = parseFloat(el.getAttribute('data-target'));
      var suf  = el.getAttribute('data-suffix') || '';
      var flt  = el.getAttribute('data-target').indexOf('.') !== -1;
      ScrollTrigger.create({
        trigger: el, start: 'top 74%', once: true,
        onEnter: function () {
          var o = { v: 0 };
          gsap.to(o, {
            v: tgt, duration: 2.2, ease: 'power2.out',
            onUpdate: function () {
              el.textContent = (flt ? o.v.toFixed(1) : Math.round(o.v)) + suf;
            },
          });
        },
      });
    });
  }

  // Run card init after GSAP loads (defer keeps ordering, but also safe on load)
  if (typeof gsap !== 'undefined') {
    initCards();
  } else {
    window.addEventListener('load', initCards);
  }

  // ─── DRAW INITIAL FRAME NOW ──────────────────────────────────────────────
  draw(0);

}());
