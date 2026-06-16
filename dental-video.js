/**
 * dental-video.js
 * Generates a looping canvas-based dental video with full player UI.
 * No external assets — everything is drawn procedurally.
 */
(function () {
  'use strict';

  var vc  = document.getElementById('dentalVideoCanvas');
  var bar = document.getElementById('dvProgress');
  var btn = document.getElementById('dvPlayBtn');
  var tim = document.getElementById('dvTime');
  if (!vc) return;

  var ctx2 = vc.getContext('2d');
  var W2 = 0, H2 = 0;
  var playing  = true;
  var startTS  = null;
  var DURATION = 18;   // seconds per full loop
  var rafID;

  function resize2() {
    var wrap = vc.parentElement;
    W2 = vc.width  = wrap.clientWidth  || 720;
    H2 = vc.height = wrap.clientHeight || 405;
  }
  resize2();
  window.addEventListener('resize', function () { resize2(); });

  // ── colour helpers (shared) ────────────────────────────────────────────
  function hsl(h,s,l,a) { return 'hsla('+h+','+s+'%,'+l+'%,'+(a===undefined?1:a)+')'; }
  function ease2(t) { return t < 0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
  function clamp2(v,a,b) { return Math.max(a,Math.min(b,v)); }
  function lerp2(a,b,t) { return a+(b-a)*t; }

  // ── scene helpers ─────────────────────────────────────────────────────
  function clear(col) {
    ctx2.fillStyle = col;
    ctx2.fillRect(0,0,W2,H2);
  }

  function gradBg(c1,c2,angle) {
    var rad = (angle||0)*Math.PI/180;
    var g = ctx2.createLinearGradient(
      W2*.5-Math.cos(rad)*W2*.6, H2*.5-Math.sin(rad)*H2*.6,
      W2*.5+Math.cos(rad)*W2*.6, H2*.5+Math.sin(rad)*H2*.6
    );
    g.addColorStop(0,c1); g.addColorStop(1,c2);
    ctx2.fillStyle = g;
    ctx2.fillRect(0,0,W2,H2);
  }

  function txt(str, x, y, size, color, weight, align) {
    ctx2.font = (weight||'600')+' '+(size||16)+'px Poppins,Arial,sans-serif';
    ctx2.fillStyle = color||'#fff';
    ctx2.textAlign = align||'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillText(str, x, y);
  }

  function pill(str, x, y, color) {
    ctx2.font = '600 11px Poppins,Arial,sans-serif';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    var tw = ctx2.measureText(str).width + 24;
    ctx2.fillStyle   = color+'33';
    ctx2.strokeStyle = color+'99';
    ctx2.lineWidth = 1.5;
    rr2(ctx2, x-tw/2, y-13, tw, 26, 13);
    ctx2.fill(); ctx2.stroke();
    ctx2.fillStyle = color;
    ctx2.fillText(str, x, y);
  }

  function rr2(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r);
    c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r);
    c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y);
    c.closePath();
  }

  function vignette2() {
    var vg = ctx2.createRadialGradient(W2*.5,H2*.5,H2*.1,W2*.5,H2*.5,Math.max(W2,H2)*.65);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,'rgba(0,0,0,0.55)');
    ctx2.fillStyle = vg;
    ctx2.fillRect(0,0,W2,H2);
  }

  // Starburst / sparkle
  function sparkles(cx,cy,count,maxR,color,t2) {
    for (var i=0; i<count; i++) {
      var ang = i/count*Math.PI*2 + t2*2;
      var r   = maxR*(0.6+Math.sin(t2*3+i)*0.4);
      var x   = cx + Math.cos(ang)*r;
      var y   = cy + Math.sin(ang)*r*(H2/W2);
      var a   = 0.3+Math.abs(Math.sin(t2*2+i))*0.5;
      ctx2.beginPath(); ctx2.arc(x,y,2+Math.sin(t2+i)*1,0,Math.PI*2);
      ctx2.fillStyle = color.replace(')',','+a+')').replace('rgb','rgba').replace('#','rgba(');
      // simpler:
      ctx2.fillStyle = 'rgba(255,255,255,'+a+')';
      ctx2.fill();
    }
  }

  // ── SCENE 0  (0-3s): Clinic name reveal ──────────────────────────────────
  function scene0(sp,t2) {
    gradBg('#040e18','#0b2236',135);

    // rotating backdrop circles
    ctx2.save();
    ctx2.translate(W2*.5, H2*.5);
    for (var r=0; r<4; r++) {
      ctx2.beginPath();
      ctx2.arc(0, 0, (H2*.22 + r*H2*.14) * (0.9+Math.sin(t2+r)*0.05), 0, Math.PI*2);
      ctx2.strokeStyle = 'rgba(0,191,165,'+(0.06-r*.01)+')';
      ctx2.lineWidth = 1.5;
      ctx2.stroke();
    }
    ctx2.restore();

    // ambient glow
    var ag = ctx2.createRadialGradient(W2*.5,H2*.45,0,W2*.5,H2*.45,H2*.55);
    ag.addColorStop(0,'rgba(0,191,165,0.18)'); ag.addColorStop(1,'rgba(0,0,0,0)');
    ctx2.fillStyle = ag; ctx2.fillRect(0,0,W2,H2);

    // "tooth" icon
    var ts = H2*.14;
    ctx2.save();
    ctx2.translate(W2*.5, H2*.28);
    ctx2.scale(ts/50, ts/50);
    ctx2.globalAlpha = ease2(clamp2(sp*3,0,1));
    ctx2.strokeStyle = '#00e5cc'; ctx2.lineWidth = 3.5;
    ctx2.shadowColor = '#00bfa5'; ctx2.shadowBlur = 20;
    ctx2.lineCap = ctx2.lineJoin = 'round';
    ctx2.beginPath();
    ctx2.moveTo(0,-44); ctx2.bezierCurveTo(25,-44,32,-22,23,5);
    ctx2.bezierCurveTo(16,25,11,42,0,48);
    ctx2.bezierCurveTo(-11,42,-16,25,-23,5);
    ctx2.bezierCurveTo(-32,-22,-25,-44,0,-44); ctx2.closePath(); ctx2.stroke();
    ctx2.restore();

    // clinic name
    var na = ease2(clamp2((sp-.15)*2, 0, 1));
    ctx2.save(); ctx2.globalAlpha = na;
    ctx2.shadowColor = '#00bfa5'; ctx2.shadowBlur = 30;
    txt('Bright & Shine Dental Square', W2*.5, H2*.5, W2*.028, '#ffffff', '800');
    ctx2.shadowBlur = 0;
    txt('Dr. Bansode's Bright & Shine · Pune', W2*.5, H2*.5+H2*.065, W2*.016, 'rgba(0,229,204,0.85)', '500');
    ctx2.restore();

    // rating badge
    if (sp > 0.5) {
      var ra = ease2(clamp2((sp-.5)*2,0,1));
      ctx2.save(); ctx2.globalAlpha = ra;
      pill('⭐ 4.9 Rating · 48 Reviews', W2*.5, H2*.72, '#fbbf24');
      ctx2.restore();
    }

    vignette2();
  }

  // ── SCENE 1  (3-6s): Modern treatment room ───────────────────────────────
  function scene1(sp,t2) {
    gradBg('#0a1628','#07302a',160);

    var cx=W2*.5, cy=H2*.5;

    // floor
    ctx2.fillStyle = 'rgba(0,191,165,0.06)';
    ctx2.fillRect(0, H2*.65, W2, H2*.35);

    // ceiling light
    ctx2.save();
    ctx2.translate(cx, H2*.08);
    var lw = W2*.12, lh = H2*.04;
    ctx2.fillStyle = 'rgba(200,240,255,0.9)';
    rr2(ctx2, -lw/2, 0, lw, lh, 4); ctx2.fill();
    var lg = ctx2.createRadialGradient(0, lh, 0, 0, H2*.4, W2*.35);
    lg.addColorStop(0,'rgba(200,240,255,0.22)'); lg.addColorStop(1,'rgba(0,0,0,0)');
    ctx2.fillStyle = lg; ctx2.fillRect(-W2*.5,-lh,W2,H2); ctx2.restore();

    // dental chair outline
    ctx2.save();
    ctx2.translate(cx, cy+H2*.06);
    var sc3 = Math.min(W2,H2)*.008;
    ctx2.scale(sc3, sc3);
    ctx2.strokeStyle = '#2dd4bf'; ctx2.lineWidth = 3;
    ctx2.shadowColor = '#00bfa5'; ctx2.shadowBlur = 20;
    ctx2.globalAlpha = ease2(clamp2(sp*2,0,1));
    // seat
    ctx2.beginPath();
    rr2(ctx2,-30,-10,60,18,5); ctx2.stroke();
    // backrest
    ctx2.beginPath(); rr2(ctx2,-25,-50,50,40,5); ctx2.stroke();
    // armrests
    ctx2.beginPath(); ctx2.moveTo(-30,-10); ctx2.lineTo(-38,-2); ctx2.stroke();
    ctx2.beginPath(); ctx2.moveTo(30,-10); ctx2.lineTo(38,-2); ctx2.stroke();
    // base pole
    ctx2.beginPath(); ctx2.moveTo(0,8); ctx2.lineTo(0,24); ctx2.stroke();
    ctx2.beginPath(); ctx2.moveTo(-18,24); ctx2.lineTo(18,24); ctx2.stroke();
    ctx2.restore();

    // overhead arm + drill
    ctx2.save();
    ctx2.translate(cx+W2*.22, cy-H2*.18);
    ctx2.rotate(-Math.PI*.15 + Math.sin(t2*.8)*.04);
    ctx2.strokeStyle = '#2dd4bf'; ctx2.lineWidth = 2;
    ctx2.shadowColor = '#00bfa5'; ctx2.shadowBlur = 10;
    ctx2.globalAlpha = ease2(clamp2((sp-.2)*2,0,1));
    ctx2.beginPath(); ctx2.moveTo(0,0); ctx2.lineTo(-W2*.18,H2*.25); ctx2.stroke();
    ctx2.beginPath(); ctx2.arc(-W2*.18+8, H2*.25+8, 7, 0, Math.PI*2);
    ctx2.fillStyle = '#2dd4bf'; ctx2.fill();
    ctx2.restore();

    // sterilization badge
    if (sp > 0.45) {
      var ba = ease2(clamp2((sp-.45)*2,0,1));
      ctx2.save(); ctx2.globalAlpha = ba;
      pill('✓ 100% Sterilized Equipment', cx, H2*.82, '#2dd4bf');
      txt('Modern Digital X-Ray · Pain-Free Technology', cx, H2*.82+H2*.05, W2*.014, 'rgba(255,255,255,0.55)', '400');
      ctx2.restore();
    }

    vignette2();
  }

  // ── SCENE 2  (6-9s): Tooth transformation ────────────────────────────────
  function scene2(sp,t2) {
    gradBg('#030d1c','#041a36',150);

    var cx=W2*.5, cy=H2*.46;
    var morphP = ease2(clamp2((sp-.1)/.8, 0, 1));

    // before → after background shift
    var bgTeal = 'rgba(0,191,165,'+morphP*0.1+')';
    ctx2.fillStyle = bgTeal; ctx2.fillRect(0,0,W2,H2);

    // "BEFORE | AFTER" divider
    if (sp > 0.35) {
      var da = ease2(clamp2((sp-.35)*3,0,1));
      ctx2.save(); ctx2.globalAlpha = da*.4;
      ctx2.strokeStyle = '#fff'; ctx2.lineWidth = 1;
      ctx2.setLineDash([4,6]);
      ctx2.beginPath(); ctx2.moveTo(cx,H2*.1); ctx2.lineTo(cx,H2*.9); ctx2.stroke();
      ctx2.setLineDash([]);
      ctx2.globalAlpha = da*.5;
      txt('BEFORE',cx-W2*.2,H2*.12,W2*.012,'rgba(255,100,100,0.8)','700');
      txt('AFTER', cx+W2*.2,H2*.12,W2*.012,'rgba(0,229,204,0.9)','700');
      ctx2.restore();
    }

    // Draw two teeth: left=decayed, right=perfect
    function drawTooth(tx, ty, scale, shade, glow) {
      ctx2.save(); ctx2.translate(tx,ty); ctx2.scale(scale,scale);
      ctx2.strokeStyle = shade; ctx2.lineWidth = 3;
      ctx2.shadowColor = glow; ctx2.shadowBlur = glow ? 22 : 0;
      ctx2.fillStyle = shade+'33';
      ctx2.beginPath();
      ctx2.moveTo(0,-44); ctx2.bezierCurveTo(25,-44,32,-22,23,5);
      ctx2.bezierCurveTo(16,25,11,42,0,48);
      ctx2.bezierCurveTo(-11,42,-16,25,-23,5);
      ctx2.bezierCurveTo(-32,-22,-25,-44,0,-44); ctx2.closePath();
      ctx2.fill(); ctx2.stroke();
      ctx2.restore();
    }

    var ts = Math.min(W2,H2)*.007;
    var beforeAlpha = 1-morphP*.85;
    var afterAlpha  = morphP;

    // Before tooth (grey/brown, left side)
    ctx2.save(); ctx2.globalAlpha = beforeAlpha*ease2(clamp2(sp*3,0,1));
    drawTooth(cx-W2*.18, cy, ts, '#8b7355', '');
    // cavity spots
    ctx2.translate(cx-W2*.18, cy);
    ctx2.scale(ts,ts);
    ctx2.fillStyle = 'rgba(60,30,10,0.7)';
    ctx2.beginPath(); ctx2.arc(-5,5,4,0,Math.PI*2); ctx2.fill();
    ctx2.beginPath(); ctx2.arc(8,-8,3,0,Math.PI*2); ctx2.fill();
    ctx2.restore();

    // After tooth (bright white, right side)
    ctx2.save(); ctx2.globalAlpha = afterAlpha*ease2(clamp2(sp*3,0,1));
    drawTooth(cx+W2*.18, cy, ts, '#e0f7f5', '#00e5cc');
    // sparkle
    if (morphP > 0.6) {
      sparkles(cx+W2*.18, cy, 8, W2*.08, '#00e5cc', t2);
    }
    ctx2.restore();

    // "PAIN-FREE ROOT CANAL · SMILE MAKEOVER" text
    var ta = ease2(clamp2((sp-.55)/.45,0,1));
    ctx2.save(); ctx2.globalAlpha = ta;
    txt('Pain-Free Dental Procedures', cx, H2*.82, W2*.02, '#fff', '700');
    txt('Root Canal · Implants · Whitening · Crowns', cx, H2*.82+H2*.05, W2*.014, 'rgba(0,229,204,0.7)', '400');
    ctx2.restore();

    vignette2();
  }

  // ── SCENE 3  (9-12s): Smile creation ─────────────────────────────────────
  function scene3(sp,t2) {
    gradBg('#0c0520','#1a0840',145);

    var cx=W2*.5, cy=H2*.44;
    var sR = Math.min(W2,H2)*.22;
    var showDots = Math.floor(ease2(clamp2(sp*1.8,0,1))*140);

    // smile dots
    ctx2.shadowColor = '#c084fc'; ctx2.shadowBlur = 8;
    for (var i=0; i<showDots; i++) {
      var pct = i/140;
      var ang = Math.PI*.1 + pct*Math.PI*.8;
      var wb  = Math.sin(pct*Math.PI*10+t2*3)*3;
      ctx2.beginPath();
      ctx2.arc(cx+Math.cos(ang)*(sR+wb), cy+Math.sin(ang)*(sR+wb), 2.8+Math.sin(pct*Math.PI*8)*.8, 0, Math.PI*2);
      ctx2.fillStyle = 'rgba(192,132,252,'+(0.6+pct*.35)+')'; ctx2.fill();
    }

    // eyes
    if (sp > 0.44) {
      var ea = ease2(clamp2((sp-.44)*2,0,1));
      [[-sR*.44,-sR*.52],[sR*.44,-sR*.52]].forEach(function(pos) {
        ctx2.save(); ctx2.globalAlpha = ea;
        var eg = ctx2.createRadialGradient(cx+pos[0],cy+pos[1],0,cx+pos[0],cy+pos[1],14);
        eg.addColorStop(0,'rgba(192,132,252,1)'); eg.addColorStop(1,'rgba(0,0,0,0)');
        ctx2.fillStyle = eg;
        ctx2.beginPath(); ctx2.arc(cx+pos[0],cy+pos[1],14,0,Math.PI*2); ctx2.fill();
        ctx2.beginPath(); ctx2.arc(cx+pos[0],cy+pos[1],5.5,0,Math.PI*2);
        ctx2.fillStyle='rgba(192,132,252,1)'; ctx2.shadowBlur=16; ctx2.fill();
        ctx2.restore();
      });
    }

    // star burst around smile
    if (sp > 0.65) {
      var ba = ease2(clamp2((sp-.65)/.35,0,1));
      for (var bi=0; bi<24; bi++) {
        var bAng = bi/24*Math.PI*2 + t2;
        var bd = sR*1.38*ba;
        ctx2.beginPath();
        ctx2.arc(cx+Math.cos(bAng)*bd, cy+Math.sin(bAng)*bd, 2+ba*1.5, 0, Math.PI*2);
        ctx2.fillStyle = 'rgba(192,132,252,'+(0.4*ba)+')'; ctx2.fill();
      }
    }

    // "5000+ smiles" counter
    var num = Math.round(ease2(clamp2(sp*1.5,0,1))*5000);
    ctx2.save(); ctx2.globalAlpha = ease2(clamp2(sp*2,0,1));
    ctx2.shadowColor = '#c084fc'; ctx2.shadowBlur = 30;
    txt(num.toLocaleString()+'+', cx, H2*.78, W2*.042, '#c084fc', '800');
    ctx2.shadowBlur = 0;
    txt('Smiles Transformed', cx, H2*.78+H2*.055, W2*.016, 'rgba(255,255,255,0.65)', '500');
    ctx2.restore();

    vignette2();
  }

  // ── SCENE 4  (12-15s): Dr. Bansode credentials & award ──────────────────
  function scene4(sp,t2) {
    gradBg('#120700','#3d1800',145);

    var cx=W2*.5, cy=H2*.5;

    // golden radial glow
    var gg = ctx2.createRadialGradient(cx,cy*.7,0,cx,cy*.7,H2*.55);
    gg.addColorStop(0,'rgba(251,191,36,0.22)'); gg.addColorStop(1,'rgba(0,0,0,0)');
    ctx2.fillStyle = gg; ctx2.fillRect(0,0,W2,H2);

    // starburst rays
    ctx2.save(); ctx2.translate(cx, cy*.55);
    ctx2.shadowColor = '#fbbf24'; ctx2.shadowBlur = 18;
    var nR = 14;
    for (var ri=0; ri<nR; ri++) {
      var ra2 = ri/nR*Math.PI*2 + t2*.4;
      var rl  = (ri%2===0?H2*.26:H2*.16) * ease2(clamp2(sp*2,0,1));
      ctx2.strokeStyle = 'rgba(251,191,36,'+(0.4+ri%2*.2)*sp+')';
      ctx2.lineWidth = ri%2===0?2:1.2;
      ctx2.beginPath(); ctx2.moveTo(0,0);
      ctx2.lineTo(Math.cos(ra2)*rl, Math.sin(ra2)*rl); ctx2.stroke();
    }
    // star
    if (sp > 0.2) {
      var sia = ease2(clamp2((sp-.2)/.5,0,1));
      ctx2.globalAlpha = sia;
      var sR2 = H2*.1*sia;
      ctx2.beginPath();
      for (var si2=0; si2<10; si2++) {
        var sR3 = si2%2===0?sR2:sR2*.5;
        var sa2 = si2/10*Math.PI*2-Math.PI/2;
        si2===0?ctx2.moveTo(sR3*Math.cos(sa2),sR3*Math.sin(sa2)):ctx2.lineTo(sR3*Math.cos(sa2),sR3*Math.sin(sa2));
      }
      ctx2.closePath();
      ctx2.fillStyle='rgba(251,191,36,0.22)'; ctx2.strokeStyle='rgba(251,191,36,0.85)';
      ctx2.lineWidth=2; ctx2.shadowBlur=22; ctx2.fill(); ctx2.stroke();
    }
    ctx2.restore();

    // doctor name & credentials
    var ta = ease2(clamp2((sp-.1)/.6,0,1));
    ctx2.save(); ctx2.globalAlpha = ta;
    ctx2.shadowColor = '#fbbf24'; ctx2.shadowBlur = 25;
    txt('Dr. Pooja Bhure-Bansode', cx, H2*.54, W2*.025, '#fff', '800');
    ctx2.shadowBlur = 0;
    txt('BDS · MCI Reg. A31210 · Pune', cx, H2*.54+H2*.055, W2*.016, 'rgba(251,191,36,0.8)', '500');
    ctx2.restore();

    // awards row
    if (sp > 0.42) {
      var aw = ease2(clamp2((sp-.42)/.58,0,1));
      ctx2.save(); ctx2.globalAlpha = aw;
      var awards = ['🏆 Best Dental Clinic Pune 2024','⭐ 4.9 Google Rating','💎 5000+ Smiles'];
      awards.forEach(function(a,i) {
        var ax = cx + (i-1)*W2*.28;
        pill(a, ax, H2*.78, '#fbbf24');
      });
      ctx2.restore();
    }

    vignette2();
  }

  // ── SCENE 5  (15-18s): CTA / fade out ────────────────────────────────────
  function scene5(sp,t2) {
    gradBg('#040e18','#0c2236',135);

    var ag = ctx2.createRadialGradient(W2*.5,H2*.5,0,W2*.5,H2*.5,H2*.6);
    ag.addColorStop(0,'rgba(0,191,165,0.18)'); ag.addColorStop(1,'rgba(0,0,0,0)');
    ctx2.fillStyle = ag; ctx2.fillRect(0,0,W2,H2);

    // rotating big rings
    ctx2.save(); ctx2.translate(W2*.5,H2*.5);
    ctx2.rotate(t2*.3);
    for (var ri=0; ri<3; ri++) {
      ctx2.beginPath(); ctx2.arc(0,0,(H2*.22+ri*H2*.13)*(1+Math.sin(t2+ri)*.04),0,Math.PI*2);
      ctx2.strokeStyle='rgba(0,191,165,'+(0.08-ri*.02)+')'; ctx2.lineWidth=1.5; ctx2.stroke();
    }
    ctx2.restore();

    var ta = ease2(clamp2(sp*2.5,0,1));
    ctx2.save(); ctx2.globalAlpha = ta;
    ctx2.shadowColor='#00bfa5'; ctx2.shadowBlur=30;
    txt('Your Smile is Our Greatest Achievement', W2*.5, H2*.42, W2*.022, '#fff', '800');
    ctx2.shadowBlur=0;
    txt('Book a FREE Consultation Today', W2*.5, H2*.54, W2*.018, 'rgba(0,229,204,0.9)', '600');
    txt('+91 98765 43210  ·  brightshine.dental@gmail.com', W2*.5, H2*.64, W2*.013, 'rgba(255,255,255,0.5)', '400');
    ctx2.restore();

    if (sp > 0.4) {
      var ba = ease2(clamp2((sp-.4)/.6,0,1));
      ctx2.save(); ctx2.globalAlpha = ba;
      // CTA button shape
      var bw=W2*.24, bh=H2*.09;
      ctx2.shadowColor='#00bfa5'; ctx2.shadowBlur=20;
      var bg2 = ctx2.createLinearGradient(W2*.5-bw/2,0,W2*.5+bw/2,0);
      bg2.addColorStop(0,'#00bfa5'); bg2.addColorStop(1,'#0097a7');
      ctx2.fillStyle=bg2;
      rr2(ctx2,W2*.5-bw/2,H2*.72,bw,bh,bh/2); ctx2.fill();
      txt('BOOK APPOINTMENT →', W2*.5, H2*.72+bh/2, W2*.014, '#fff', '700');
      ctx2.restore();
    }

    vignette2();
  }

  // ── FRAME CONTROLLER ──────────────────────────────────────────────────────
  function renderFrame(ts) {
    if (!playing) { rafID = requestAnimationFrame(renderFrame); return; }
    if (!startTS) startTS = ts;
    var elapsed = (ts - startTS) / 1000;
    var p = (elapsed % DURATION) / DURATION;

    var si  = Math.floor(p * 6);            // scene 0-5
    var sp2 = (p * 6) % 1;                  // 0-1 inside scene
    var t2  = elapsed;

    try {
      if      (si===0) scene0(sp2,t2);
      else if (si===1) scene1(sp2,t2);
      else if (si===2) scene2(sp2,t2);
      else if (si===3) scene3(sp2,t2);
      else if (si===4) scene4(sp2,t2);
      else             scene5(sp2,t2);
    } catch(e) { clear('#040e18'); }

    // scan lines
    ctx2.fillStyle='rgba(0,0,0,0.022)';
    for (var y=0;y<H2;y+=3) ctx2.fillRect(0,y,W2,1);

    // update player bar + thumb
    if (bar)  { bar.style.width = (p*100)+'%'; }
    var thumb = document.getElementById('dvThumb');
    if (thumb) thumb.style.left = (p*100)+'%';
    if (tim)  tim.textContent = fmtTime(elapsed % DURATION)+' / '+fmtTime(DURATION);

    rafID = requestAnimationFrame(renderFrame);
  }

  function fmtTime(s) {
    var m = Math.floor(s/60);
    var ss= Math.floor(s%60);
    return m+':'+(ss<10?'0':'')+ss;
  }

  // ── CONTROLS ──────────────────────────────────────────────────────────────
  var overlay = document.getElementById('dvPlayOverlay');
  function togglePlay() {
    playing = !playing;
    if (btn) btn.textContent = playing ? '⏸' : '▶';
    if (overlay) overlay.classList.toggle('visible', !playing);
  }
  if (btn) btn.addEventListener('click', togglePlay);
  if (overlay) overlay.addEventListener('click', togglePlay);

  // click on bar to seek
  var barWrap = document.getElementById('dvProgressWrap');
  if (barWrap) {
    barWrap.addEventListener('click', function (e) {
      var rect = barWrap.getBoundingClientRect();
      var frac = (e.clientX - rect.left) / rect.width;
      startTS = null;
      // approximate seek by adjusting startTS
      var fakeElapsed = frac * DURATION;
      // use performance.now trick
      var now = performance.now();
      startTS = now - fakeElapsed * 1000;
    });
  }

  // Start
  rafID = requestAnimationFrame(renderFrame);
}());
