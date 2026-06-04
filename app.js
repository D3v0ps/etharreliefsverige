/* ===========================================================
   Ethar Cup — render engine
   Reads config (config.json -> fallback DEFAULT_CONFIG) and
   builds the page. Listens for postMessage to support live
   preview from the admin portal.
   =========================================================== */
(function(){
  "use strict";

  var ICONS = {
    water:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5s6 6.5 6 10.5a6 6 0 0 1-12 0c0-4 6-10.5 6-10.5z"/></svg>',
    school:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-5 9 5-9 5-9-5z"/><path d="M7 11v5c0 1 2 2.5 5 2.5s5-1.5 5-2.5v-5"/><path d="M21 9v5"/></svg>',
    heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 5.5a4.5 4.5 0 0 0-7.5 1.6A4.5 4.5 0 0 0 4.5 5.5C2.5 7.5 3 11 7 14.5l5 4.5 5-4.5c4-3.5 4.5-7 2.5-9z"/></svg>',
    food:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v7a3 3 0 0 0 6 0V3"/><path d="M8 3v18"/><path d="M17 3c-1.5 0-3 1.5-3 5s1 5 3 5"/><path d="M17 3v18"/></svg>',
    women:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M12 11v8"/><path d="M9 16h6"/></svg>',
    aid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M9 6V4h6v2"/><path d="M12 10v6M9 13h6"/></svg>',
    default:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>'
  };

  function esc(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;");
  }
  function paras(arr){
    if(!Array.isArray(arr)) return "";
    return arr.map(function(p){return "<p>"+esc(p)+"</p>";}).join("");
  }
  function $(s,ctx){return (ctx||document).querySelector(s);}

  /* -------- color theme -------- */
  function applyBrand(b){
    if(!b) return;
    var r=document.documentElement.style;
    if(b.primary) r.setProperty("--primary",b.primary);
    if(b.primaryDark) r.setProperty("--primary-dark",b.primaryDark);
    if(b.accent) r.setProperty("--accent",b.accent);
    if(b.accentDark) r.setProperty("--accent-dark",b.accentDark);
    if(b.bg) r.setProperty("--bg",b.bg);
  }

  function brandLogo(b,onDark){
    if(b && b.logoUrl){
      return '<img class="brand-logo" src="'+esc(b.logoUrl)+'" alt="'+esc(b.name||"Ethar Relief Sverige")+'">';
    }
    var initials=(b&&b.name?b.name:"Ethar").trim().charAt(0).toUpperCase();
    return '<span class="brand-fallback"><span class="brand-mark">'+esc(initials)+'</span>'+
      '<span>'+esc(b&&b.name?b.name:"Ethar Relief Sverige")+
      '<small>'+esc(b&&b.tagline?b.tagline:"")+'</small></span></span>';
  }

  /* ============================ RENDER ============================ */
  function render(cfg){
    if(!cfg) return;
    applyBrand(cfg.brand);
    document.title = (cfg.hero&&cfg.hero.title?cfg.hero.title:"Ethar Cup")+" — "+(cfg.brand&&cfg.brand.name?cfg.brand.name:"Ethar Relief Sverige");

    /* ---- header ---- */
    var nav=cfg.nav||{}; var navItems=nav.items||[];
    $("#brandSlot").innerHTML = brandLogo(cfg.brand);
    $("#navSlot").innerHTML =
      navItems.map(function(n){return '<a href="#'+esc(n.target)+'">'+esc(n.label)+'</a>';}).join("")+
      '<a class="btn btn-donate" href="#donera">'+esc(nav.donateLabel||"Donera")+'</a>';
    $("#mobileNav").innerHTML =
      navItems.map(function(n){return '<a href="#'+esc(n.target)+'" data-mm>'+esc(n.label)+'</a>';}).join("")+
      '<a class="btn btn-primary" href="#donera" data-mm>'+esc(nav.donateLabel||"Donera")+' <span class="arrow">→</span></a>';

    /* ---- hero ---- */
    var h=cfg.hero||{};
    var photo = h.imageUrl ? '<div class="hero-photo" style="background-image:url('+JSON.stringify(h.imageUrl)+')"></div>' : '<div class="hero-photo" aria-hidden="true"></div>';
    var chips=(h.chips||[]).map(function(c){
      return '<span class="chip"><span>'+esc(c.label)+'</span><b>'+esc(c.value)+'</b></span>';
    }).join("");
    var cta="";
    if(h.ctaPrimary&&h.ctaPrimary.label) cta+='<a class="btn btn-primary" href="#'+esc(h.ctaPrimary.target||"anmal")+'">'+esc(h.ctaPrimary.label)+' <span class="arrow">→</span></a>';
    if(h.ctaSecondary&&h.ctaSecondary.label) cta+='<a class="btn btn-ghost" href="#'+esc(h.ctaSecondary.target||"donera")+'">'+esc(h.ctaSecondary.label)+' <span class="arrow">→</span></a>';
    $("#hero").innerHTML =
      photo +
      '<div class="wrap"><div class="hero-inner reveal in">'+
        '<p class="eyebrow">'+esc(h.eyebrow||"")+'</p>'+
        '<h1>'+esc(h.title||"")+'</h1>'+
        '<p class="hero-sub">'+esc(h.subtitle||"")+'</p>'+
        '<div class="chips">'+chips+'</div>'+
        '<div class="hero-cta">'+cta+'</div>'+
      '</div></div>'+
      '<div class="hero-curve"><svg viewBox="0 0 1440 60" preserveAspectRatio="none"><path d="M0,40 C360,0 1080,0 1440,40 L1440,60 L0,60 Z"></path></svg></div>';

    /* ---- about ---- */
    var a=cfg.about||{};
    var focus=(a.focusAreas||[]).map(function(f){
      var ico=ICONS[f.icon]||ICONS.default;
      return '<div class="focus-item"><span class="focus-ico">'+ico+'</span>'+esc(f.label)+'</div>';
    }).join("");
    $("#om").innerHTML =
      '<div class="wrap"><div class="about-grid">'+
        '<div class="about-text reveal">'+
          '<p class="eyebrow">Om Ethar Relief Sverige</p>'+
          '<h2 class="section-title">'+esc(a.title||"Vilka är vi?")+'</h2>'+
          paras(a.paragraphs)+
          (a.linkText?'<a class="btn btn-outline" href="'+esc(a.linkUrl||"#")+'" target="_blank" rel="noopener">'+esc(a.linkText)+' <span class="arrow">→</span></a>':'')+
        '</div>'+
        '<div class="focus-card reveal"><h3>Våra fokusområden</h3><div class="focus-list">'+focus+'</div></div>'+
      '</div></div>';

    /* ---- folkfest / social ---- */
    var s=cfg.social||{};
    var stats=(s.stats||[]).map(function(st){return '<div class="stat"><b>'+esc(st.value)+'</b><span>'+esc(st.label)+'</span></div>';}).join("");
    var press=s.press||{};
    var igCards=(s.instagram||[]).map(function(ig){
      var thumb = ig.imageUrl ? ' style="background-image:url('+JSON.stringify(ig.imageUrl)+')"' : '';
      return '<a class="ig-card" href="'+esc(ig.url)+'" target="_blank" rel="noopener" aria-label="Öppna inlägg på Instagram">'+
        '<div class="ig-thumb"'+thumb+'></div>'+
        '<span class="play-ico"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></span>'+
        '<div class="ig-overlay"><span class="ig-tag">Instagram</span><p>'+esc(ig.caption||"Se inlägget")+'</p></div>'+
      '</a>';
    }).join("");
    $("#folkfest").innerHTML =
      '<div class="wrap">'+
        '<div class="folkfest-grid">'+
          '<div class="folkfest-text reveal">'+
            '<p class="eyebrow" style="color:var(--accent)">Turneringen 2024</p>'+
            '<h2 class="section-title">'+esc(s.title||"En folkfest för välgörenhet")+'</h2>'+
            paras(s.paragraphs)+
            '<div class="stat-row">'+stats+'</div>'+
          '</div>'+
          '<div class="press-card reveal">'+
            '<span class="kicker">'+esc(press.kicker||"I pressen")+'</span>'+
            '<h3>'+esc(press.title||"")+'</h3>'+
            (press.linkText?'<a class="btn btn-dark btn-sm" href="'+esc(press.linkUrl||"#")+'" target="_blank" rel="noopener">'+esc(press.linkText)+' <span class="arrow">→</span></a>':'')+
          '</div>'+
        '</div>'+
        (igCards?'<div class="ig-grid reveal">'+igCards+'</div>':'')+
      '</div>';

    /* ---- format ---- */
    var f=cfg.format||{};
    var cards=(f.items||[]).map(function(it){
      return '<div class="fmt-card"><div class="lbl">'+esc(it.label)+'</div><div class="val">'+esc(it.value)+'</div></div>';
    }).join("");
    $("#turneringen").innerHTML =
      '<div class="wrap">'+
        '<div class="reveal"><p class="eyebrow">Praktiskt</p><h2 class="section-title">'+esc(f.title||"Så går turneringen till")+'</h2></div>'+
        '<div class="format-grid reveal">'+cards+'</div>'+
        (f.note?'<p class="format-note reveal"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg><span>'+esc(f.note)+'</span></p>':'')+
      '</div>';

    /* ---- team form ---- */
    var tf=cfg.teamForm||{};
    $("#anmal").innerHTML =
      '<div class="wrap"><div class="form-shell reveal">'+
        '<div class="form-aside">'+
          '<p class="eyebrow">Anmälan</p>'+
          '<h2>'+esc(tf.title||"Anmäl ditt lag")+'</h2>'+
          '<p>'+esc(tf.intro||"")+'</p>'+
          (cfg.format&&cfg.format.items?deadlineBox(cfg.format.items):'')+
        '</div>'+
        '<div class="form-card">'+
          '<div class="form-msg err" id="lagErr"></div>'+
          '<div class="form-success" id="lagSuccess">'+
            '<div class="ico"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>'+
            '<h3>'+esc(tf.successTitle||"Tack för din anmälan!")+'</h3>'+
            '<p>'+esc(tf.successText||"")+'</p>'+
          '</div>'+
          '<form id="lagForm" novalidate>'+
            field("Lagnamn","lagnamn","text",true)+
            field("Kontaktperson","kontakt","text",true,"För- och efternamn")+
            '<div class="field-row">'+
              field("E-postadress","epost","email",true)+
              field("Telefonnummer","telefon","tel",true)+
            '</div>'+
            field("Antal spelare","antal","number",true)+
            textarea("Meddelande / övrigt","meddelande",false)+
            '<label class="check"><input type="checkbox" id="lagGodkann" required><span>Jag godkänner att anmälan är bindande efter bekräftad plats. <span class="req">*</span></span></label>'+
            '<button type="submit" class="btn btn-primary">Skicka anmälan <span class="arrow">→</span></button>'+
            '<p class="form-fallback">Formuläret kräver JavaScript. Du kan annars mejla din anmälan till <a href="mailto:'+esc(tf.fallbackEmail||"")+'">'+esc(tf.fallbackEmail||"")+'</a>.</p>'+
          '</form>'+
        '</div>'+
      '</div></div>';

    /* ---- find us ---- */
    var fu=cfg.findus||{};
    var rows=(fu.items||[]).map(function(it){
      return '<div class="info-row"><div class="k">'+esc(it.label)+'</div><div class="v">'+esc(it.value)+'</div></div>';
    }).join("");
    var mapsHref = fu.mapsUrl || ("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(fu.mapsQuery||""));
    $("#hittahit").innerHTML =
      '<div class="wrap">'+
        '<div class="reveal"><p class="eyebrow">Praktisk info</p><h2 class="section-title">'+esc(fu.title||"Hitta hit")+'</h2></div>'+
        '<div class="findus-grid">'+
          '<div class="info-list reveal">'+rows+'</div>'+
          '<a class="map-card reveal" href="'+esc(mapsHref)+'" target="_blank" rel="noopener">'+
            '<div class="map-grid-bg"></div>'+
            '<div class="map-ico"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg></div>'+
            '<h3>'+esc(fu.mapsQuery||fu.title||"Hitta hit")+'</h3>'+
            '<p>Klicka för vägbeskrivning</p>'+
            '<span class="btn btn-primary btn-sm" style="align-self:flex-start">'+esc(fu.mapsLabel||"Öppna i Maps")+' <span class="arrow">→</span></span>'+
          '</a>'+
        '</div>'+
      '</div>';

    /* ---- donate ---- */
    var d=cfg.donate||{};
    $("#donera").innerHTML =
      '<div class="wrap">'+
        '<div class="reveal" style="max-width:680px;margin:0 auto;">'+
          '<p class="eyebrow" style="color:var(--accent)">Stöd insamlingen</p>'+
          '<h2 class="section-title">'+esc(d.title||"Vill du bidra direkt?")+'</h2>'+
          '<p class="lede">'+esc(d.intro||"")+'</p>'+
        '</div>'+
        '<div class="donate-cards reveal">'+
          (d.swish?'<div class="pay-card"><div class="lbl">Swish</div><div class="num">'+esc(d.swish)+'</div></div>':'')+
          (d.plusgiro?'<div class="pay-card"><div class="lbl">Plusgiro</div><div class="num">'+esc(d.plusgiro)+'</div></div>':'')+
        '</div>'+
        '<div class="reveal">'+
          (d.swishUrl?'<a class="btn btn-primary" href="'+esc(d.swishUrl)+'" target="_blank" rel="noopener">Öppna Swish <span class="arrow">→</span></a>':'')+
          (d.message?'<p class="donate-msg">'+esc(d.message)+'</p>':'')+
        '</div>'+
      '</div>';

    /* ---- footer ---- */
    var ft=cfg.footer||{};
    var socials=(ft.socials||[]).map(function(so){
      return '<a href="'+esc(so.url)+'" target="_blank" rel="noopener">'+esc(so.label)+'</a>';
    }).join("");
    $("#footer").innerHTML =
      '<div class="wrap">'+
        '<div class="footer-inner">'+
          '<div class="footer-brand">'+brandLogo(cfg.brand)+'</div>'+
          '<div class="footer-socials">'+socials+'</div>'+
        '</div>'+
        '<div class="footer-bottom"><span>'+esc(ft.copyright||"")+'</span>'+
          '<a href="admin.html">Adminportal →</a></div>'+
      '</div>';

    /* ---- wire up dynamic behavior ---- */
    wireForm(cfg);
    wireMobile();
    observeReveal();
  }

  function deadlineBox(items){
    var dl=items.filter(function(i){return /sista/i.test(i.label);})[0];
    if(!dl) return "";
    return '<div class="deadline"><b>'+esc(dl.label)+':</b> '+esc(dl.value)+'</div>';
  }
  function field(label,name,type,req,ph){
    return '<div class="field"><label for="f_'+name+'">'+esc(label)+(req?' <span class="req">*</span>':'')+'</label>'+
      '<input id="f_'+name+'" name="'+name+'" type="'+type+'"'+(req?' required':'')+(ph?' placeholder="'+esc(ph)+'"':'')+(type==="number"?' min="1"':'')+'></div>';
  }
  function textarea(label,name,req){
    return '<div class="field"><label for="f_'+name+'">'+esc(label)+(req?' <span class="req">*</span>':'')+'</label>'+
      '<textarea id="f_'+name+'" name="'+name+'"'+(req?' required':'')+'></textarea></div>';
  }

  /* -------- form submit -------- */
  function wireForm(cfg){
    var form=$("#lagForm"); if(!form) return;
    var endpoint=(cfg.settings&&cfg.settings.formEndpoint)||"";
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var errBox=$("#lagErr");
      errBox.classList.remove("show");
      // validation
      var invalid=[];
      ["lagnamn","kontakt","epost","telefon","antal"].forEach(function(n){
        var el=form.elements[n];
        if(!el.value.trim()){invalid.push(el);}
      });
      var em=form.elements.epost;
      if(em.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value)) invalid.push(em);
      if(!form.elements.lagGodkann.checked) invalid.push(form.elements.lagGodkann);
      if(invalid.length){
        invalid[0].focus();
        errBox.textContent="Fyll i alla obligatoriska fält korrekt och godkänn villkoren.";
        errBox.classList.add("show");
        return;
      }
      var data=new URLSearchParams();
      data.append("formtyp","lag");
      ["lagnamn","kontakt","epost","telefon","antal","meddelande"].forEach(function(n){
        data.append(n, form.elements[n].value.trim());
      });
      var btn=form.querySelector("button[type=submit]");
      var orig=btn.innerHTML; btn.disabled=true; btn.innerHTML="Skickar…";

      function done(){ $("#lagForm").style.display="none"; $("#lagSuccess").classList.add("show"); }
      function fail(){
        btn.disabled=false; btn.innerHTML=orig;
        errBox.innerHTML='Något gick fel. Försök igen eller mejla <a href="mailto:'+esc((cfg.teamForm&&cfg.teamForm.fallbackEmail)||"")+'">'+esc((cfg.teamForm&&cfg.teamForm.fallbackEmail)||"")+'</a>.';
        errBox.classList.add("show");
      }
      if(!endpoint){
        // No endpoint configured yet — simulate success so the UX is testable.
        setTimeout(done,600); return;
      }
      fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:data.toString()})
        .then(function(r){ if(r.ok||r.type==="opaque") done(); else fail(); })
        .catch(fail);
    });
  }

  /* -------- mobile menu -------- */
  function wireMobile(){
    var btn=$("#hamburger"), menu=$("#mobileMenu"), close=$("#mmClose");
    if(!btn||!menu) return;
    function open(){menu.classList.add("open");document.body.style.overflow="hidden";}
    function shut(){menu.classList.remove("open");document.body.style.overflow="";}
    btn.onclick=open; if(close) close.onclick=shut;
    menu.querySelectorAll("[data-mm]").forEach(function(a){a.onclick=shut;});
  }

  /* -------- scroll reveal + sticky header -------- */
  function observeReveal(){
    var els=document.querySelectorAll(".reveal:not(.in)");
    if(!("IntersectionObserver" in window)){els.forEach(function(e){e.classList.add("in");});return;}
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){en.target.classList.add("in");io.unobserve(en.target);} });
    },{threshold:.12,rootMargin:"0px 0px -40px 0px"});
    els.forEach(function(e){io.observe(e);});
  }
  function stickyHeader(){
    var hd=$("#siteHeader"); if(!hd) return;
    function upd(){ hd.classList.toggle("scrolled",window.scrollY>30); }
    window.addEventListener("scroll",upd,{passive:true}); upd();
  }

  /* ============================ BOOT ============================ */
  function getDefault(){ return window.DEFAULT_CONFIG || {}; }
  function merge(base,over){
    if(!over) return base;
    // shallow-ish merge: top-level keys from override replace base keys
    var out={}; var k;
    for(k in base) out[k]=base[k];
    for(k in over) out[k]=over[k];
    return out;
  }

  var isPreview = /[?&]preview=1/.test(location.search);

  function boot(){
    stickyHeader();
    render(getDefault()); // instant paint with inline default
    if(isPreview){
      // Admin live-preview drives the page via postMessage — tell parent we're ready.
      try{ if(window.parent && window.parent!==window) window.parent.postMessage({__etharReady:true},"*"); }catch(e){}
      return;
    }
    // Try published config.json (overrides default)
    fetch("config.json",{cache:"no-store"})
      .then(function(r){return r.ok?r.json():null;})
      .then(function(j){ if(j) render(merge(getDefault(),j)); })
      .catch(function(){/* keep default */});
  }

  // live preview from admin portal
  window.addEventListener("message",function(ev){
    if(ev.data && ev.data.__etharConfig){ render(ev.data.config); }
  });

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();

  window.EtharRender=render;
})();
