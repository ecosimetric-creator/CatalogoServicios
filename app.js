(() => {

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  

  // Pager superior
  const firstTop = $('#firstTop');
  const prevTop = $('#prevTop');
  const nextTop = $('#nextTop');
  const lastTop = $('#lastTop');
 
  /* ======================================================
     REFERENCIAS DOM 
  ====================================================== */
  const searchInput = $('#search');
  const filterTipo = $('#filterTipo');
  
  
  const programsEl = $('#programs');
  const tipoListEl = $('#tipoList');
  const categoriaPublicoTopList = $('#categoriaPublicoTopList');

  const cardsEl = $('#cards');
  const countEl = $('#count');
  const exportBtn = $('#exportExcel');
  const prevBtn = $('#prev');
  const nextBtn = $('#next');
  const firstBtn = $('#first');
  const lastBtn = $('#last');

  const detailTitle = $('#detailTitle');
  const detailMeta = $('#detailMeta');
  const detailBody = $('#detailBody');
  

  /* ==============================
    MAPEO DE LOGOS POR PROGRAMA
  ============================== */

  const LOGOS = {
    "Conadis": "img/logos/conadis.png",
    "Gratitud": "img/logos/gratitud.png",
    "INABIF": "img/logos/inabif.png",
    "MIMP - Sede Central": "img/logos/mimp.png",
    "Warmi Ñan": "img/logos/warmi.png"
  };


  /* ====================================================== */

  let DATA = [], NORMAL = [], filtered = [];
  let PROGRAMS = [], TIPOS = [], CATEGORIAS = [];

    const ORDEN_CATEGORIAS = [
      "Niñas, niños y adolescentes",
      "Mujeres",
      "Personas adultas mayores",
      "Personas con discapacidad",
      "Hombres",
      "Familias",
      "Víctimas de violencia y trata (población transversal)",
      "Población general",
      "Servidores públicos, autoridades y sociedad civil organizada",
      "Entidades, instituciones y actores estratégicos"
    ];


  let state = {
  page: 1,
  pageSize: 10,
  program: "",
  tipo: "",
  categoriaPublico: ""
  };


  /* ======================================================
     CARGA AUTOMÁTICA DEL EXCEL
  ====================================================== */
async function loadExcelAutomatically() {

  try {

    const response = await fetch("MATRIZ_SERVICIOS.xlsx");
    const arrayBuffer = await response.arrayBuffer();

    const wb = XLSX.read(arrayBuffer, { type: "array" });

    DATA = XLSX.utils.sheet_to_json(
      wb.Sheets[wb.SheetNames[0]],
      { defval: "" }
    );

    NORMAL = DATA.map(r => ({
    raw: r,

    codigo: r["Código del servicio"] || "",
    clasificacion: r["Clasificación"] || "",
    tipo: r["Tipo"] || "",
    servicio: r["Servicio"] || "",
    programa: r["Programa"] || "",
    ejecutora: r["Ejecutora"] || "",
    publico: r["Público"] || "",
    categoriaPublico: r["Categoría del Público"] || "",
    cobertura: r["Cobertura"] || "",
    medida: r["Medida"] || "",
    descripcion: r["Descripción"] || "",
    espacio: r["Espacio"] || ""

    }));

    PROGRAMS = Array.from(new Set(NORMAL.map(x => x.programa))).filter(Boolean);
    TIPOS = Array.from(new Set(NORMAL.map(x => x.tipo))).filter(Boolean);
    CATEGORIAS = Array.from(new Set(NORMAL.map(x => x.categoriaPublico))).filter(Boolean);


    renderPrograms();
    renderTipos();
    populateFilters();
    renderCategoriaPublicoTop();
    
      // Estado limpio
    state.program = "";
    state.tipo = "";
    state.page = 1;

    filterTipo.value = "";
    
    // 🔥 Mostrar TODOS directamente sin depender del filtro inicial
    filtered = [...NORMAL];
    renderCards();

  } catch (error) {
    console.error("Error cargando el Excel:", error);
  }
}

  /* ======================================================
     PROGRAMAS
  ====================================================== */
  function renderPrograms(dataBase = NORMAL){

    programsEl.innerHTML = "";

    // 🔹 Conteo dinámico
    const conteo = {};

    dataBase.forEach(r => {
      const prog = r.programa || "Sin proveedor";
      conteo[prog] = (conteo[prog] || 0) + 1;
    });

    // 🔹 Botón TODOS
    add(`Todos (${dataBase.length})`, "");

    // 🔹 Proveedores ordenados como ya los tienes
    PROGRAMS.forEach(p => {
      const total = conteo[p] || 0;
      add(`${p} (${total})`, p, total === 0);
    });

    function add(label, value, disabled = false){

      const el = document.createElement("div");
      el.className = "program-item";
      el.textContent = label;

      if(disabled){
        el.classList.add("disabled");
      }

      el.onclick = () => {

        if(disabled) return;

        state.program = value;
        state.page = 1;
        applyFilters();
      };

      programsEl.appendChild(el);
    }

    // 🔹 Activar visualmente
    $$('#programs .program-item').forEach(el => {
      const txt = el.textContent.split(" (")[0];
      el.classList.toggle(
        "active",
        txt === (state.program || "Todos")
      );
    });
  }


  /* ====================================================== */

  function renderTipos(dataBase = NORMAL){

    tipoListEl.innerHTML = "";

    // 🔹 Conteo dinámico
    const conteo = {};

    dataBase.forEach(r => {
      const tipo = r.tipo || "Sin tipo";
      conteo[tipo] = (conteo[tipo] || 0) + 1;
    });

    // 🔹 Botón TODOS
    add(`Todos (${dataBase.length})`, "");

    TIPOS.forEach(t => {
      const total = conteo[t] || 0;
      add(`${t} (${total})`, t, total === 0);
    });

    function add(label, value, disabled = false){

      const el = document.createElement("div");
      el.className = "program-item";
      el.textContent = label;

      if(disabled){
        el.classList.add("disabled");
      }

      el.onclick = () => {

        if(disabled) return;

        state.tipo = value;
        filterTipo.value = value;
        state.page = 1;
        applyFilters();
      };

      tipoListEl.appendChild(el);
    }

    $$('#tipoList .program-item').forEach(el => {
      const txt = el.textContent.split(" (")[0];
      el.classList.toggle(
        "active",
        txt === (state.tipo || "Todos")
      );
    });
  }

 function renderCategoriaPublicoTop(dataBase = NORMAL){

    if(!categoriaPublicoTopList) return;

    categoriaPublicoTopList.innerHTML = "";

    // 🔹 Conteo dinámico
    const conteo = {};

    dataBase.forEach(r => {
      const cat = r.categoriaPublico || "Sin categoría";
      conteo[cat] = (conteo[cat] || 0) + 1;
    });

    // 🔹 Botón TODOS
    add(`Todos (${dataBase.length})`, "");

    // 🔹 Orden institucional
    ORDEN_CATEGORIAS.forEach(c => {

      const total = conteo[c] || 0;
      add(`${c} (${total})`, c, total === 0);

    });


    function add(label, value, disabled = false){

      const el = document.createElement("div");
      el.className = "program-item";
      el.textContent = label;

      if(disabled){
        el.classList.add("disabled");
      }

      el.onclick = () => {

        if(disabled) return; // 👈 evita seleccionar categoría en 0

        state.categoriaPublico = value;
        state.page = 1;
        applyFilters();
      };

      categoriaPublicoTopList.appendChild(el);
    }


    $$('#categoriaPublicoTopList .program-item').forEach(el => {
      const txt = el.textContent.split(" (")[0];
      el.classList.toggle(
        "active",
        txt === (state.categoriaPublico || "Todos")
      );
    });
  }



  /* ====================================================== */

  function renderEspacios() {

    if (!espacioListEl) return; // ← ESTA LÍNEA ES CLAVE

    espacioListEl.innerHTML = "";
    add("Todos", "");

    ESPACIOS.forEach(e => add(e, e));

    function add(label, value) {

      const el = document.createElement("div");
      el.className = "program-item";
      el.textContent = label;

      el.onclick = () => {
        state.espacio = value;
        state.page = 1;
                applyFilters();
      };

      espacioListEl.appendChild(el);
    }

    $$('#espacioList .program-item').forEach(el =>
      el.classList.toggle("active",
        el.textContent === (state.espacio || "Todos"))
    );
  }

  /* ======================================================
     FILTROS SUPERIORES
  ====================================================== */

  function populateFilters() {

    filterTipo.innerHTML = `<option value="">Todas</option>`;
    
    TIPOS.sort().forEach(t =>
      filterTipo.innerHTML += `<option>${t}</option>`
    );
       
  }



 function resetFilters(){

    // 1️⃣ Limpiar inputs
    searchInput.value = "";
    filterTipo.value = "";

    // 2️⃣ Resetear estado completo
    state = {
      page: 1,
      pageSize: state.pageSize,
      program: "",
      tipo: "",
      categoriaPublico: ""
    };

    // 3️⃣ Restaurar base completa
    filtered = [...NORMAL];

    // 4️⃣ Reconstruir paneles
    renderPrograms();
    renderTipos();
    renderCategoriaPublicoTop(NORMAL);

    // 5️⃣ Renderizar cards directamente (sin applyFilters)
    renderCards();
  }


function exportFilteredToExcel(){

  if(filtered.length === 0) return;

  // Convertir a formato plano
  const exportData = filtered.map(r => ({
    "Código del servicio": r.codigo,
    "Clasificación": r.clasificacion,
    "Tipo": r.tipo,
    "Servicio": r.servicio,
    "Programa": r.programa,
    "Ejecutora": r.ejecutora,
    "Público": r.publico,
    "Categoría del Público": r.categoriaPublico,
    "Cobertura": r.cobertura,
    "Unidad de medida": r.medida,
    "Descripción": r.descripcion,
    "Lugar de prestación": r.espacio
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Listado filtrado");

  const fecha = new Date().toISOString().slice(0,10);

  XLSX.writeFile(
    wb,
    `Listado_Servicios_Filtrado_${fecha}.xlsx`
  );
}



  $('#reset').onclick = resetFilters;

  if(exportBtn){
  exportBtn.onclick = exportFilteredToExcel;
  }



  searchInput.oninput = applyFilters;
  filterTipo.onchange = applyFilters;
  

  /* ======================================================
     FILTROS
  ====================================================== */

  function applyFilters() {

    const q = searchInput.value.toLowerCase();

    // 🔹 Filtrar TODO excepto categoría (para poder contar)
    let base = NORMAL.filter(r => {

      if (state.program && r.programa !== state.program) return false;
      if (state.tipo && r.tipo !== state.tipo) return false;
      if (filterTipo.value && r.tipo !== filterTipo.value) return false;

      if (q &&
        !(`${r.servicio} ${r.ejecutora} ${r.programa} ${r.tipo}`
          .toLowerCase().includes(q)))
        return false;

      return true;
    });

    // 🔹 Renderizar categorías con conteo dinámico
    renderPrograms(base);
    renderTipos(base);
    renderCategoriaPublicoTop(base);

    // 🔹 Aplicar categoría después del conteo
    if (state.categoriaPublico) {
      base = base.filter(r =>
        r.categoriaPublico === state.categoriaPublico
      );
    }

    filtered = base;

    state.page = 1;
    renderCards();
  }

  /* ======================================================
     CARDS
  ====================================================== */

    function renderCards() {

        cardsEl.innerHTML = "";
        if (filtered.length === 0) {
            if(exportBtn) exportBtn.disabled = true;
          state.page = 1;

          cardsEl.innerHTML = `
            <div class="no-results fade-in">
              <div class="no-results-icon">📂</div>
              <div class="no-results-text">
                No hay servicios con los filtros seleccionados.
              </div>
              <div class="no-results-sub">
                Puede reiniciar los filtros para realizar una nueva consulta.
              </div>
              <button class="reset-btn" id="resetFiltersBtn">
                Limpiar
              </button>
            </div>
          `;

          const resetBtnInternal = document.getElementById("resetFiltersBtn");
          if (resetBtnInternal) {
            resetBtnInternal.addEventListener("click", resetFilters);
          }

          // 🔴 Contador
          countEl.textContent = "(0 servicios)";

          // 🔴 Limpiar números de página
          renderPageNumbers(0);

          // 🔴 Limpiar rangos
          const pagerInfo = document.getElementById("pagerInfo");
          const pagerInfoTop = document.getElementById("pagerInfoTop");

          if (pagerInfo) pagerInfo.textContent = "0 - 0 de 0";
          if (pagerInfoTop) pagerInfoTop.textContent = "0 - 0 de 0";

          // 🔴 Deshabilitar botones
          [prevBtn, nextBtn, firstBtn, lastBtn,
          firstTop, prevTop, nextTop, lastTop]
          .forEach(btn => {
            if (btn) btn.disabled = true;
          });

          return;
        }




    const total = filtered.length;
    if(exportBtn) exportBtn.disabled = false;


    // 🔵 Habilitar botones nuevamente
      [prevBtn, nextBtn, firstBtn, lastBtn,
      firstTop, prevTop, nextTop, lastTop]
      .forEach(btn => {
        if (btn) btn.disabled = false;
      });


    countEl.textContent = total === 1
  ? `(1 servicio)`
  : `(${total} servicios)`;

    const pages = Math.ceil(total / state.pageSize) || 1;

    if(state.page > pages) state.page = pages;

    const start = (state.page - 1) * state.pageSize;
    const rows = filtered.slice(start, start + state.pageSize);
    

    // 🔥 Animación salida
    cardsEl.classList.add("fade-out");

    setTimeout(() => {

      cardsEl.innerHTML = rows.map((r, i) => {

        
        return `
          <article class="card card-enum" style="cursor:pointer;">

            <div class="enum-box">
              ${esc(r.codigo || "")}
            </div>

            <div class="card-content">
              <h3>${esc(r.servicio)}</h3>

              <div class="card-badge">
                ${esc(r.programa || "")}
              </div>
            </div>

          </article>
        `;

      }).join("");


        $$("article.card").forEach((el, i) => {
          el.onclick = () => {

            // Quitar active a todos
            $$("article.card").forEach(c => c.classList.remove("active"));

            // Activar el actual
            el.classList.add("active");

            // Abrir detalle
            openDetail(rows[i]);
          };
        });


        // 🔵 Activar automáticamente la primera tarjeta visible
        const firstCard = document.querySelector("#cards article.card");

        if (firstCard && rows.length > 0) {

          // Activar visualmente
          firstCard.classList.add("active");

          // Abrir detalle
          openDetail(rows[0]);
        }



      renderPageNumbers(pages);

      // Mostrar rango de servicios visibles
      const pagerInfo = document.getElementById("pagerInfo");
      const pagerInfoTop = document.getElementById("pagerInfoTop");

      const total = filtered.length;

      let from = 0;
      let to = 0;

      if (total > 0) {
        from = (state.page - 1) * state.pageSize + 1;
        to = Math.min(state.page * state.pageSize, total);
      }

      const text = `${from} - ${to} de ${total}`;

      if (pagerInfo) {
        pagerInfo.textContent = text;
      }

      if (pagerInfoTop) {
        pagerInfoTop.textContent = text;
      }



      cardsEl.classList.remove("fade-out");
      cardsEl.classList.add("fade-in");

      setTimeout(()=>cardsEl.classList.remove("fade-in"), 200);

    }, 150);
  }

  prevBtn.onclick = () => {
  if(state.page > 1){
    state.page--;
    renderCards();
  }
  };

  nextBtn.onclick = () => {
    const pages = Math.ceil(filtered.length / state.pageSize) || 1;
    if(state.page < pages){
      state.page++;
      renderCards();
    }
  };

  firstBtn.onclick = () => {
  state.page = 1;
  renderCards();
  };

  lastBtn.onclick = () => {
    const total = filtered.length;
    const pages = Math.ceil(total / state.pageSize) || 1;
    state.page = pages;
    renderCards();
  };

  if (firstTop)
    firstTop.onclick = () => {
      if (filtered.length === 0) return;
      state.page = 1;
      renderCards();
    };

  if (lastTop)
    lastTop.onclick = () => {
      if (filtered.length === 0) return;
      const pages = Math.ceil(filtered.length / state.pageSize) || 1;
      state.page = pages;
      renderCards();
    };

  if (prevTop)
    prevTop.onclick = () => {
      if (filtered.length === 0) return;
      if (state.page > 1) {
        state.page--;
        renderCards();
      }
    };

  if (nextTop)
    nextTop.onclick = () => {
      if (filtered.length === 0) return;
      const pages = Math.ceil(filtered.length / state.pageSize) || 1;
      if (state.page < pages) {
        state.page++;
        renderCards();
      }
    };

     

      function renderPageNumbers(pages){

        const containers = [
          document.getElementById("pageNumbers"),
          document.getElementById("pageNumbersTop")
        ];

        containers.forEach(container => {

          if(!container) return;

          container.innerHTML = "";

          for(let i = 1; i <= pages; i++){

            const btn = document.createElement("span");
            btn.className = "page-number" + (i === state.page ? " active" : "");
            btn.textContent = i;

            btn.onclick = () => {
              state.page = i;
              renderCards();
            };

            container.appendChild(btn);
          }

        });
}


  /* ======================================================
     DETALLE
  ====================================================== */

function formatDescripcion(text) {

  if (!text) return "";

  if (!text.includes("")) {
    return `<p class="modeloB-text">${esc(text)}</p>`;
  }

  // Separar primer bloque (antes del primer bullet)
  const partes = text.split("");

  const primerParrafo = partes[0].trim();

  const bullets = partes
    .slice(1)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return `
    <p class="modeloB-text">${esc(primerParrafo)}</p>

    <ul class="detalle-lista">
      ${bullets.map(p => `<li>${esc(p)}</li>`).join("")}
    </ul>
  `;
}

function formatListaDesdeExcel(text) {

  if (!text) return "";

  // Divide por saltos de línea (ALT+ENTER)
  const items = text
    .split(/\r?\n/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  // Si solo hay uno, mostrar normal
  if (items.length <= 1) {
    return `<p class="modeloB-text">${esc(text)}</p>`;
  }

  // Si hay varios, convertir en lista
  return `
    <ul class="detalle-lista-proveedor">
      ${items.map(i => `<li>${esc(i)}</li>`).join("")}
    </ul>
  `;
}




function openDetail(r) {

  const logoPath = LOGOS[r.programa];

  detailTitle.innerHTML = `
    <div class="detail-header">

      <div class="detail-title-block">

        <div class="service-code-box">
          ${esc(r.codigo || "")}
        </div>

        <div class="service-title">
          ${esc(r.servicio)}
        </div>

      </div>

      ${
        logoPath
          ? `<div class="detail-logo-inline">
              <img src="${logoPath}" alt="${esc(r.programa)}">
            </div>`
          : ""
      }

    </div>
  `;

  detailMeta.innerHTML = `
    <div class="meta-box">
      <span><strong>Clasificación:</strong> ${esc(r.raw["Clasificación"] || "")}</span>
      <span class="meta-divider">|</span>
      <span><strong>Tipo de servicio:</strong> ${esc(r.tipo || "")}</span>
    </div>
  `;

 
  detailBody.innerHTML = `
    <div class="modeloB-section">
      <h3>1. DATOS BÁSICOS</h3>
    </div>

    <div class="modeloB-subsection">
      <h4>1.1 Características generales</h4>

      <div class="modeloB-grid">
        <div><strong>Proveedor</strong></div>
        <div>${formatListaDesdeExcel(r.ejecutora)}</div>

        <div><strong>Público objetivo</strong></div>
        <div>${esc(r.raw["Público"] || "")}</div>

        <div><strong>Cobertura</strong></div>
        <div>${esc(r.raw["Cobertura"] || "")}</div>

        <div><strong>Unidad de medida</strong></div>
        <div>${esc(r.raw["Medida"] || "")}</div>
      </div>
    </div>

    <div class="modeloB-subsection">
      <h4>1.2 Descripción del servicio</h4>
      ${formatDescripcion(r.descripcion)}
    </div>

    <div class="modeloB-subsection">
      <h4>1.3 Lugar de la prestación del servicio</h4>
      <p class="modeloB-text">
        ${esc(r.raw["Espacio"] || "")}
      </p>
    </div>
  `;
}


  /* ======================================================
     INICIAR AUTOMÁTICAMENTE
  ====================================================== */

 document.addEventListener("DOMContentLoaded", () => {

  state.program = "";
  state.tipo = "";
  state.page = 1;

  loadExcelAutomatically();

}); 

})();

