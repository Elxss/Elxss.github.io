console.log("[WindowManager.js] Loading")

document.addEventListener("DOMContentLoaded", () => {
    let zIndexCounter = 100;
  
    // ===== DRAG =====
    function makeWindowDraggable(win) {
      const header = win.querySelector(".title-bar");
      if (!header) return;
  
      const parent = win.closest(".winxp");
      let offsetX = 0, offsetY = 0, isDragging = false;
  
      header.addEventListener("mousedown", e => {
        if (e.target.closest(".title-bar-controls button")) return;
        isDragging = true;
        const rect = win.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top + 15;
        zIndexCounter++;
        win.style.zIndex = zIndexCounter;
        win.style.position = "absolute";
      });
  
      document.addEventListener("mousemove", e => {
        if (!isDragging) return;
        const parentRect = parent.getBoundingClientRect();
        let left = e.clientX - parentRect.left - offsetX;
        let top = e.clientY - parentRect.top - offsetY;
        left = Math.max(0, Math.min(left, parentRect.width - win.offsetWidth));
        top = Math.max(0, Math.min(top, parentRect.height - win.offsetHeight));
        win.style.left = left + "px";
        win.style.top = top + "px";
      });
  
      document.addEventListener("mouseup", () => { isDragging = false; });
    }
  
    // ===== CONTROLS =====
    function setupControls(win) {
      const controls = win.querySelector(".title-bar-controls");
      if (!controls) return;
      const [btnMin, btnMax, btnClose] = controls.querySelectorAll("button");
  
      if (btnMin) {
        btnMin.addEventListener("click", () => {
          const body = win.querySelector(".window-body");
          if (body) body.style.display = (body.style.display === "none" ? "" : "none");
        });
      }
  
      if (btnMax) {
        btnMax.addEventListener("click", () => {
          if (win.classList.contains("maximized")) {
            win.style.top = win.dataset.top;
            win.style.left = win.dataset.left;
            win.style.width = win.dataset.width;
            win.style.height = win.dataset.height;
            win.classList.remove("maximized");
          } else {
            win.dataset.top = win.style.top;
            win.dataset.left = win.style.left;
            win.dataset.width = win.style.width;
            win.dataset.height = win.style.height;
            win.style.top = "0px";
            win.style.left = "0px";
            win.style.width = "100%";
            win.style.height = "100%";
            win.classList.add("maximized");
          }
        });
      }
  
      if (btnClose) {
        // 🔧 CORRIGÉ : on cache la fenêtre au lieu de la supprimer
        btnClose.addEventListener("click", () => { 
          win.style.display = "none";
        });
      }
    }
  
    // ===== POSITION ALÉATOIRE =====
    function randomOffsetFromCenter(radiusPercent = 20, verticalOffset = -100) {
      const pageWidth = window.innerWidth;
      const pageHeight = window.innerHeight;
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2 + verticalOffset;
      const radius = (Math.min(pageWidth, pageHeight) * radiusPercent) / 100;
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radius;
      return { x: centerX + distance * Math.cos(angle), y: centerY + distance * Math.sin(angle) };
    }
  
    // ===== AFFICHER UNE FENÊTRE =====
    function showWindow(win) {
      const minWidth = win.style.minWidth || '400px';
      const minHeight = win.style.minHeight || '200px';
      win.style.width = minWidth;
      win.style.height = minHeight;
      win.style.display = 'flex';
      win.style.position = 'absolute';
  
      const coords = randomOffsetFromCenter(20);
      const rect = win.getBoundingClientRect();
      win.style.left = `calc(${coords.x}px - ${rect.width / 2}px)`;
      win.style.top = `calc(${coords.y}px - ${rect.height / 2}px)`;
  
      win.style.width = '';
      win.style.height = '';
      zIndexCounter++;
      win.style.zIndex = zIndexCounter;
    }


    // ===== MESSAGEBOX ERREUR =====
    function error_message_box(text) {
      const template = document.getElementById("AlreadyOpenedError");
      if (!template) return;
  
      const clone = template.cloneNode(true);
      clone.id = `AlreadyOpenedError_${Date.now()}`;
      const textContainer = clone.querySelector(".text-container p");
      if (textContainer) textContainer.textContent = text;
  
      const winxpContainer = document.querySelector(".winxp");
      if (!winxpContainer) return;
      winxpContainer.appendChild(clone);
  
      makeWindowDraggable(clone);
      setupControls(clone);
      clone.addEventListener("mousedown", e => {
        if (e.target.closest(".title-bar-controls button")) return;
        zIndexCounter++;
        clone.style.zIndex = zIndexCounter;
      });
  
      const btnClose = clone.querySelector(".title-bar-controls button");
      const btnOk = clone.querySelector(".button-container button");
      if (btnClose) btnClose.addEventListener("click", () => clone.remove());
      if (btnOk) btnOk.addEventListener("click", () => clone.remove());
  
      showWindow(clone);
    }
  
    // ===== OUVERTURE CONTROL PANEL =====
    function openControlPanel() {
      const win = document.getElementById("control-panel");
      if (!win) return;
      if (win.style.display !== "none" && win.style.display !== "") {
        error_message_box("This window is Already Opened!");
        return;
      }
      showWindow(win);
    }
  
    // ===== INITIALISATION =====
    document.querySelectorAll(".window").forEach(win => {
      makeWindowDraggable(win);
      setupControls(win);
      win.addEventListener("mousedown", e => {
        if (e.target.closest(".title-bar-controls button")) return;
        zIndexCounter++;
        win.style.zIndex = zIndexCounter;
      });
    });
  
    // ===== DOUBLE-CLIC ICONES BUREAU =====

    // ===== DEBUG CONSOLE =====
    window.debug_show_controlpanel = function() {
      console.log("🧩 Debug: ouverture du Control Panel demandée depuis DevTools.");
      openControlPanel();
    };
  
    console.log("%c💡 Astuce :", "color: cyan; font-weight:bold", "Vous pouvez ouvrir le Control Panel depuis la console avec : debug_show_controlpanel()");
  });

  /////////////////////////////
  //////// LINKSS

  function openLinkBlank(url) {
    // Ouvre le lien dans un nouvel onglet
    window.open(url, '_blank');
  }

  function openLinkGithub() {
    openLinkBlank('https://github.com/Elxss/'); 
  }

  function openLinkYoutube() {
    openLinkBlank('https://www.youtube.com/'); 
  }

  function openLinkReportIssue() {
    openLinkBlank('https://www.youtube.com/'); 
  }

  function openLinkStarRepo() {
    openLinkBlank('https://www.youtube.com/'); 
  }
  
  ///////////////////////////////////////////////////////////////////////////////////////////
  // DESKTOP
  document.addEventListener('DOMContentLoaded', () => {
      const desktopItems = document.querySelectorAll('.desktop-icons');
      const desktop = document.querySelector('.desktop-grid');

      const actions = {
        openControlPanel: () => {window.debug_show_controlpanel();},
        openCredits: () => { openLinkBlank('https://www.youtube.com/'); },
        StarThisRepo: () => { openLinkStarRepo() },
        openResume: () => { alert("Ouverture du CV !"); },
      };

      desktopItems.forEach(item => {
        item.addEventListener('click', e => {
          e.stopPropagation();
          desktopItems.forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
          console.log("selected")
        });

        item.addEventListener('dblclick', e => {
          e.stopPropagation();
          const actionName = item.dataset.action;
          if (actionName && actions[actionName]) actions[actionName]();
        });
      });

      desktop.addEventListener('click', () => {
        desktopItems.forEach(i => i.classList.remove('selected'));
      });
    });
    ////////////////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////////////////
                                // CONTROL PANEL
    ////////////////////////////////////////////////////////////////////////////////////////

    document.addEventListener('DOMContentLoaded', () => {
      const items = document.querySelectorAll('.right-column-grid-item');
      const windowDiv = document.querySelector('.window');

      const actions = {
        MdInterpreterRepo: () => { openLinkBlank('https://www.youtube.com/'); },
        StarThisRepo: () => { openLinkStarRepo() },
        PlayCustomVideoTeleveision: () => { openLinkGithub() },
        PlayCustomMDTeleveision: () => { openLinkGithub() },
        getStandardResume: () => { openLinkGithub() },
        openCredits: () => { openLinkGithub() },
        
      };

      items.forEach(item => {
        item.addEventListener('click', e => {
          e.stopPropagation();
          items.forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
        });

        item.addEventListener('dblclick', e => {
          e.stopPropagation();
          const actionName = item.dataset.action;
          if (actionName && actions[actionName]) actions[actionName]();
        });
      });

      windowDiv.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('selected'));
      });

      // Dropdown header
      document.querySelectorAll('.header-item.dropdown > a').forEach(btn => {
        const dropdown = btn.nextElementSibling;
        btn.addEventListener('click', e => {
          e.preventDefault();
          dropdown.style.display = (dropdown.style.display === 'flex') ? 'none' : 'flex';
        });
      });

      // Fermer dropdown si clic hors
      document.addEventListener('click', e => {
        document.querySelectorAll('.header-item.dropdown .dropdown').forEach(drop => {
          if (!drop.parentElement.contains(e.target)) drop.style.display = 'none';
        });
      });
    });