// ===== Estado =====
const sacola = []; // { name, price, obs }

// ===== Utils =====
const brl = (n) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`;

// ===== Sacola (elementos) =====
const listaSacola = document.getElementById("lista-sacola");
const totalSacola = document.getElementById("total-sacola");

// ===== Modal Produto =====
const modal = document.getElementById("modal");
const modalClose = document.getElementById("modalClose");
const modalImg = document.getElementById("modalImg");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalPrice = document.getElementById("modalPrice");
const modalObs = document.getElementById("modalObs");
const modalAdd = document.getElementById("modalAdd");

// ===== Modal Revisão =====
const inputRetirada = document.getElementById("opcaoRetirada");
const infoRetirada = document.getElementById("infoRetirada");
const revisao = document.getElementById("revisao");
const revisaoClose = document.getElementById("revisaoClose");
const btnRevisar = document.getElementById("btn-revisar");
const revisaoLista = document.getElementById("revisaoLista");
const revSubtotal = document.getElementById("revSubtotal");
const revTaxa = document.getElementById("revTaxa");
const revTotal = document.getElementById("revTotal");
const inputEndereco = document.getElementById("endereco");
const inputTaxa = document.getElementById("taxa");
const revisaoConfirmar = document.getElementById("revisaoConfirmar");

// produto corrente (o CARD clicado)
let produtoAtual = null;
let precoBase = 0;

// ===== helpers =====
function updateBodyLock() {
  const modalOpen =
    modal.getAttribute("aria-hidden") === "false" ||
    revisao.getAttribute("aria-hidden") === "false";
  document.body.classList.toggle("modal-open", modalOpen);
}

// ===== Modal Produto =====
function abrirModalProduto(el) {
  const name = el.dataset.name;
  const price = parseFloat(el.dataset.price);
  const desc = el.dataset.desc || "";
  const img = el.dataset.img || "";

  produtoAtual = el;
  precoBase = price;

  modalImg.src = img;
  modalImg.alt = name;
  modalTitle.textContent = name;
  modalDesc.textContent = desc;
  modalObs.value = "";

  // limpa o container de opções do modal
const modalOpcoes = document.getElementById("modalOpcoes");
modalOpcoes.innerHTML = "";

// se o card tiver .opcoes-produto, clona pro modal
const blocoOpcoes = el.querySelector(".opcoes-produto");
if (blocoOpcoes) {
  const clone = blocoOpcoes.cloneNode(true);
  clone.classList.remove("opcoes-produto");
  clone.classList.add("opcoes-modal");
  modalOpcoes.appendChild(clone);

  // adiciona eventos + e – nos controles de quantidade
modal.querySelectorAll(".opcoes-modal .qtd-control").forEach(ctrl => {
  const menos = ctrl.querySelector(".menos");
  const mais = ctrl.querySelector(".mais");
  const qtdEl = ctrl.querySelector(".qtd");

  menos.addEventListener("click", () => {
    let val = parseInt(qtdEl.textContent);
    if (val > 0) {
      qtdEl.textContent = val - 1;
      atualizarPrecoModal();
    }
  });

  mais.addEventListener("click", () => {
    let val = parseInt(qtdEl.textContent);
    qtdEl.textContent = val + 1;
    atualizarPrecoModal();
  });
});


  // adiciona evento para recalcular preço ao marcar adicionais
  clone.querySelectorAll('input[type="checkbox"]').forEach(chk => {
    chk.addEventListener("change", atualizarPrecoModal);
  });
}

modalPrice.textContent = brl(precoBase);

function atualizarPrecoModal() {
  let total = precoBase;
  const extras = modal.querySelectorAll(".opcoes-modal .extra");

  extras.forEach(ex => {
    const input = ex.querySelector("input");
    const qtd = parseInt(ex.querySelector(".qtd").textContent) || 0;
    const extraValor = parseFloat(input.dataset.extra || "0");
    total += qtd * extraValor;
  });

  modalPrice.textContent = brl(total);
}



  // preço inicial
  modalPrice.textContent = brl(precoBase);
  modal.setAttribute("aria-hidden", "false");
  updateBodyLock();
}



// ===== Adicionar à sacola =====
// ===== Adicionar à sacola =====
modalAdd.addEventListener("click", () => {
  if (!produtoAtual) return;

  const obs = modalObs.value.trim();

  let adicionaisSelecionados = [];
  let extraTotal = 0;

  // lê os adicionais com quantidade
  const extras = modal.querySelectorAll(".opcoes-modal .extra");
  extras.forEach(ex => {
    const input = ex.querySelector("input");
    const qtd = parseInt(ex.querySelector(".qtd").textContent) || 0;
    if (qtd > 0) {
      adicionaisSelecionados.push(`${qtd}x ${input.value}`);
      extraTotal += qtd * parseFloat(input.dataset.extra || "0");
    }
  });

  const finalPrice = precoBase + extraTotal;

  sacola.push({
    name: produtoAtual.dataset.name + (adicionaisSelecionados.length ? ` (+ ${adicionaisSelecionados.join(", ")})` : ""),
    price: finalPrice,
    obs: obs || null
  });

  atualizarSacola();
  atualizarBotaoFlutuante();
  atualizarCarrinhoNovo();

  showConfirmPopup();
  fecharModal(modal);
});

// ===== Cards =====
document.querySelectorAll(".item").forEach((card) => {
  card.addEventListener("click", (e) => {
    if (
      e.target.classList.contains("ver-detalhes") ||
      !e.target.closest("button")
    ) {
      abrirModalProduto(card);
    }
  });
});

// ===== Fechar Modais =====
modalClose.addEventListener("click", () => fecharModal(modal));
revisaoClose.addEventListener("click", () => fecharModal(revisao));
modal.addEventListener("click", (e) => {
  if (e.target === modal) fecharModal(modal);
});
revisao.addEventListener("click", (e) => {
  if (e.target === revisao) fecharModal(revisao);
});

// ===== Sacola =====
function atualizarSacola() {
  listaSacola.innerHTML = "";
  let total = 0;

  sacola.forEach((it, idx) => {
    total += it.price;
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="li-info">
        ${it.name} — ${brl(it.price)}
        ${it.obs ? `<br/><small style="opacity:.8">obs: ${it.obs}</small>` : ""}
      </div>
      <button class="btn-remove" data-idx="${idx}">Remover</button>
    `;
    listaSacola.appendChild(li);
  });

  totalSacola.innerHTML = `<strong>Total:</strong> ${brl(total)}`;
}

listaSacola.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-remove");
  if (!btn) return;
  const idx = Number(btn.dataset.idx);
  sacola.splice(idx, 1);
  atualizarSacola();
  atualizarBotaoFlutuante();
  if (revisao.getAttribute("aria-hidden") === "false") preencherRevisao();
});

// ===== Revisão =====
btnRevisar.addEventListener("click", () => {
  if (sacola.length === 0) return alert("Sua sacola está vazia!");
  preencherRevisao();
  revisao.setAttribute("aria-hidden", "false");
  updateBodyLock();
});

function preencherRevisao() {
  revisaoLista.innerHTML = "";
  let subtotal = 0;

  sacola.forEach((it, idx) => {
    subtotal += it.price;
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="li-info">
        ${it.name} — ${brl(it.price)}
        ${it.obs ? `<br/><small style="opacity:.8">obs: ${it.obs}</small>` : ""}
      </div>
      <button class="btn-remove" data-idx="${idx}">Remover</button>
    `;
    revisaoLista.appendChild(li);
  });

  const taxa = parseFloat(inputTaxa.value || "0");
  revSubtotal.textContent = brl(subtotal);
  revTaxa.textContent = brl(isNaN(taxa) ? 0 : taxa);
  revTotal.textContent = brl(subtotal + (isNaN(taxa) ? 0 : taxa));
}

revisaoLista.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-remove");
  if (!btn) return;
  const idx = Number(btn.dataset.idx);
  sacola.splice(idx, 1);
  atualizarSacola();
  atualizarBotaoFlutuante();
  if (sacola.length === 0) fecharModal(revisao);
  else preencherRevisao();
});

inputTaxa.addEventListener("input", preencherRevisao);

// ===== WhatsApp + Firebase Firestore =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 🔥 Configuração Firebase (substitua pelos seus dados)
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "geraldo-menu.firebaseapp.com",
  projectId: "geraldo-menu",
  storageBucket: "geraldo-menu.appspot.com",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID"
};

// Inicializa
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== Enviar Pedido =====
revisaoConfirmar.addEventListener("click", () => enviarPedido(true));

async function enviarPedido(jaRevisado = false) {
  if (sacola.length === 0) return alert("Sua sacola está vazia!");
  if (!jaRevisado) {
    preencherRevisao();
    revisao.setAttribute("aria-hidden", "false");
    updateBodyLock();
    return;
  }

  const endereco = (inputEndereco.value || "").trim();
  const taxa = parseFloat(inputTaxa.value || "0");
  const subtotal = sacola.reduce((acc, it) => acc + it.price, 0);
  const totalFinal = subtotal + (isNaN(taxa) ? 0 : taxa);

  const linhas = sacola.map((it) => {
    const base = `${it.name} — ${brl(it.price)}`;
    return it.obs ? `${base} (obs: ${it.obs})` : base;
  });

  const pedido = {
    nomeCliente: "Cliente", // (depois você pode puxar input do nome)
    endereco: endereco || "Retirada no local",
    itens: sacola,
    subtotal,
    taxa,
    total: totalFinal,
    status: "pendente",
    data: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, "pedidos"), pedido);
    console.log("✅ Pedido salvo no Firestore!");
  } catch (err) {
    console.error("❌ Erro ao salvar pedido:", err);
  }

  // 🔗 Envio opcional via WhatsApp
  const linhasMsg = linhas.map((l) => `• ${l}`).join("\n");
  let msg =
    `Olá! Quero fazer um pedido:\n\n${linhasMsg}\n\n` +
    `Subtotal: ${brl(subtotal)}\nEntrega: ${brl(taxa)}\nTotal: ${brl(totalFinal)}\n`;

  if (endereco) msg += `\nEntrega em: ${endereco}\n`;

  const numero = "5512997891619"; // <<<<< seu número
  const link = `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
  window.open(link, "_blank");
}

/* 🎯 Encolhe o topo ao rolar */
window.addEventListener("scroll", () => {
  const header = document.querySelector(".brand-header");
  if (window.scrollY > 100) {
    header.classList.add("minimized");
  } else {
    header.classList.remove("minimized");
  }
});

/* 🔐 Modo Moderador + Painel de Adicionais */
window.addEventListener("DOMContentLoaded", initModerador);

function initModerador() {
  const senhaModerador = "batata2025";
  const btnModerador = document.getElementById("btnModerador");
  const btnGerenciarAdicionais = document.getElementById("btnGerenciarAdicionais");

  // 🔒 Começa invisível
  if (btnGerenciarAdicionais) {
    btnGerenciarAdicionais.style.display = "none";
    btnGerenciarAdicionais.style.pointerEvents = "none";
  }

  if (!btnModerador) {
    console.log("⏳ aguardando botão moderador...");
    return setTimeout(initModerador, 300);
  }

  // ... (resto do código igual)

  // resto do seu código igual...



  console.log("✅ Botão Moderador encontrado!");

  let pausados = JSON.parse(localStorage.getItem("itensPausados") || "[]");

  pausados.forEach(nome => {
    document.querySelectorAll(".item").forEach(item => {
      if (item.dataset.name === nome) item.classList.add("pausado");
    });
  });

  const estilo = document.createElement("style");
  estilo.textContent = `
    .item { position:relative; }
    .item.pausado { opacity:0.4; }
    .item.pausado::after {
      content:"⏸️ Indisponível";
      position:absolute; inset:0;
      display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,0.6); color:#fff; font-weight:900;
      border-radius:16px; pointer-events:none;
    }
    .btn-pausar {
      display:none; position:absolute; top:8px; right:8px;
      background:#ffdc73; border:none; border-radius:10px;
      padding:5px 10px; font-weight:700; cursor:pointer; z-index:10;
    }
    body.modoModerador .btn-pausar { display:block; }
    .moderador-ativo {
      position:fixed; top:10px; right:10px;
      background:#222; color:#0f0;
      padding:6px 12px; border-radius:8px;
      font-weight:700; z-index:99999; font-size:14px;
    }
  `;
  document.head.appendChild(estilo);

  function prepararCards() {
    document.querySelectorAll(".item").forEach(item => {
      const nome = item.dataset.name;
      let btn = item.querySelector(".btn-pausar");
      if (!btn) {
        btn = document.createElement("button");
        btn.className = "btn-pausar";
        btn.textContent = item.classList.contains("pausado") ? "▶️ Ativar" : "⏸️ Pausar";
        btn.onclick = (ev) => {
          ev.stopPropagation();
          const pausado = item.classList.toggle("pausado");
          btn.textContent = pausado ? "▶️ Ativar" : "⏸️ Pausar";
          if (pausado) {
            if (!pausados.includes(nome)) pausados.push(nome);
          } else {
            pausados = pausados.filter(p => p !== nome);
          }
          localStorage.setItem("itensPausados", JSON.stringify(pausados));
        };
        item.appendChild(btn);
      }
    });
  }

  btnModerador.addEventListener("click", () => {
    const senha = prompt("Digite a senha do modo moderador:");
    if (senha !== senhaModerador) return alert("❌ Senha incorreta!");

    document.body.classList.toggle("modoModerador");
    const ativo = document.body.classList.contains("modoModerador");

    // 🔧 força mostrar o botão de adicionais quando modo moderador estiver ativo
    const btnGerenciarAdicionais = document.getElementById("btnGerenciarAdicionais");
    if (btnGerenciarAdicionais) {
      btnGerenciarAdicionais.style.display = ativo ? "block" : "none";
      console.log("🔧 Botão de adicionais visível:", ativo);
    }

    if (ativo) {
      alert("✅ Modo moderador ativado!");
      if (!document.querySelector(".moderador-ativo")) {
        const aviso = document.createElement("div");
        aviso.className = "moderador-ativo";
        aviso.textContent = "🟢 Modo Moderador ativo";
        document.body.appendChild(aviso);
      }
    } else {
      alert("🟡 Modo moderador desativado.");
      document.querySelector(".moderador-ativo")?.remove();
    }

    prepararCards();
  });
};
/* ⚙️ Painel de Gerenciamento de Adicionais */
document.addEventListener("DOMContentLoaded", () => {
  const btnGerenciarAdicionais = document.getElementById("btnGerenciarAdicionais");
  const painelAdicionais = document.getElementById("painelAdicionais");
  const listaAdicionais = document.getElementById("listaAdicionais");

  if (!btnGerenciarAdicionais || !painelAdicionais || !listaAdicionais) {
    console.warn("⚠️ Elementos do painel de adicionais não encontrados.");
    return;
  }

  let adicionaisPausados = JSON.parse(localStorage.getItem("adicionaisPausados") || "[]");

  // 🟢 Atualiza o estado visual dos extras nos produtos
  function atualizarEstadoExtras() {
    document.querySelectorAll(".extra").forEach(extra => {
      const nome = extra.querySelector("input")?.value;
      if (!nome) return;
      if (adicionaisPausados.includes(nome)) {
        extra.classList.add("pausado");
        extra.style.opacity = "0.4";
        extra.style.pointerEvents = "none";
      } else {
        extra.classList.remove("pausado");
        extra.style.opacity = "1";
        extra.style.pointerEvents = "auto";
      }
    });
  }

  // 🧩 Abre o painel com a lista de todos os adicionais únicos
  function abrirPainelAdicionais() {
    const todosExtras = document.querySelectorAll('.extra input[type="hidden"]');
    const nomesUnicos = [...new Set(Array.from(todosExtras).map(inp => inp.value))];

    listaAdicionais.innerHTML = "";
    nomesUnicos.forEach(nome => {
      const li = document.createElement("li");
      li.style.marginBottom = "10px";
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";

      const span = document.createElement("span");
      span.textContent = nome;
      const btn = document.createElement("button");
      btn.textContent = adicionaisPausados.includes(nome) ? "▶️ Ativar" : "⏸️ Pausar";
      btn.className = "btn-primario";
      btn.style.background = adicionaisPausados.includes(nome) ? "#4CAF50" : "#ffdc73";
      btn.style.color = adicionaisPausados.includes(nome) ? "#000000ff" : "#000";

      btn.addEventListener("click", () => {
        if (adicionaisPausados.includes(nome)) {
          adicionaisPausados = adicionaisPausados.filter(n => n !== nome);
        } else {
          adicionaisPausados.push(nome);
        }
        localStorage.setItem("adicionaisPausados", JSON.stringify(adicionaisPausados));
        atualizarEstadoExtras();
        abrirPainelAdicionais(); // recarrega a lista
      });

      li.appendChild(span);
      li.appendChild(btn);
      listaAdicionais.appendChild(li);
    });

    painelAdicionais.setAttribute("aria-hidden", "false");
  }

  // ❌ Fecha o painel
  window.fecharPainelAdicionais = function () {
    painelAdicionais.setAttribute("aria-hidden", "true");
  };

  // Clique no botão principal para abrir
  btnGerenciarAdicionais.addEventListener("click", abrirPainelAdicionais);

  // Atualiza visual de extras na inicialização
  atualizarEstadoExtras();
});

// ===== Pop-up de Confirmação =====
function showConfirmPopup() {
  const popup = document.createElement("div");
  popup.className = "confirm-popup";
  popup.textContent = "✅ Adicionado à sacola!";
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.classList.add("visible");
  }, 10);

  setTimeout(() => {
    popup.classList.remove("visible");
    setTimeout(() => popup.remove(), 300);
  }, 1500);
}

// ===== CSS (adicione no seu style.css) =====
/*
.confirm-popup {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%) scale(0.9);
  background: #4CAF50;
  color: white;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 9999;
}
.confirm-popup.visible {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}
*/
function atualizarBotaoFlutuante() {
  const btn = document.getElementById("btn-flutuante");
  const contador = document.getElementById("count-itens");
  const valorItens = document.getElementById("valor-itens");
  if (!btn || !contador || !valorItens) return;

  const qtd = sacola.length;
  const total = sacola.reduce((acc, it) => acc + it.price, 0);

  if (qtd > 0) {
    // limpa qualquer display:none inline que algum script antigo possa ter deixado
    btn.style.removeProperty("display");     // <- ESSENCIAL
    btn.classList.remove("hidden");          // controla via classe
    contador.textContent = String(qtd);
    valorItens.textContent = `R$ ${total.toFixed(2).replace(".", ",")}`;

    // garante que o click abre a revisão
    btn.onclick = () => {
      if (sacola.length === 0) return;
      preencherRevisao();
      revisao.setAttribute("aria-hidden", "false");
      updateBodyLock();
    };
  } else {
    btn.classList.add("hidden");
    btn.style.removeProperty("display");     // deixa o CSS decidir (sem inline)
  }
}

function fecharModal(ref) {
  ref.setAttribute("aria-hidden", "true");
  updateBodyLock();
  // solta o foco para o body – evita o warn “Blocked aria-hidden…”
  if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }
}


// === NOVO BOTÃO FLUTUANTE (INDIVIDUAL E FUNCIONAL) ===
function atualizarCarrinhoNovo() {
  const btn = document.getElementById("btnCarrinhoNovo");
  const count = document.getElementById("novoCount");
  const totalEl = document.getElementById("novoTotal");
  if (!btn || !count || !totalEl) return;

  const qtd = sacola.length;
  const total = sacola.reduce((acc, it) => acc + it.price, 0);

  if (qtd > 0) {
    btn.classList.remove("hidden");
    count.textContent = qtd;
    totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
  } else {
    btn.classList.add("hidden");
  }
}

// abre revisão ao clicar
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnCarrinhoNovo");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (sacola.length === 0) return;
    preencherRevisao();
    revisao.setAttribute("aria-hidden", "false");
    updateBodyLock();
    inputRetirada.addEventListener("change", () => {
  const retirar = inputRetirada.checked;

  inputEndereco.disabled = retirar;
  infoRetirada.style.display = retirar ? "block" : "none";

  if (!retirar && inputEndereco.value.trim() === "") {
    inputEndereco.focus();
  }
});

  });
});
document.querySelectorAll('input[name="tipoEntrega"]').forEach(radio => {
  radio.addEventListener("change", () => {
    const tipo = document.querySelector('input[name="tipoEntrega"]:checked').value;
    const campoEndereco = document.getElementById("campoEndereco");
    const infoRetirada = document.getElementById("infoRetirada");

    if (tipo === "entrega") {
      campoEndereco.style.display = "block";
      infoRetirada.style.display = "none";
      document.getElementById("taxa").value = "0.00"; // zera taxa quando troca
    } else {
      campoEndereco.style.display = "none";
      infoRetirada.style.display = "block";
      document.getElementById("taxa").value = "0.00";
      document.getElementById("resultadoEntrega").innerHTML = "ℹ️ Retirada no local selecionada. Sem taxa de entrega.";
    }

    // Atualiza valor do total também
    atualizarTotalComTaxa();
  });
});
function atualizarTotalComTaxa() {
  const subtotalText = document.getElementById("revSubtotal").innerText.replace("R$", "").replace(",", ".").trim();
  const subtotal = parseFloat(subtotalText) || 0;
  const taxa = parseFloat(document.getElementById("taxa").value) || 0;
  const total = subtotal + taxa;
  document.getElementById("revTotal").innerText = `R$ ${total.toFixed(2).replace(".", ",")}`;
  document.getElementById("revTaxa").innerText = `R$ ${taxa.toFixed(2).replace(".", ",")}`;
}
document.querySelectorAll('input[name="tipoEntrega"]').forEach(input => {
  input.addEventListener('change', () => {
    const tipo = input.value;
    const campoEndereco = document.getElementById('campoEndereco');
    const infoRetirada = document.getElementById('infoRetirada');
    const taxaInput = document.getElementById('taxa');
    const taxaDisplay = document.getElementById("revTaxa");
    const totalDisplay = document.getElementById("revTotal");
    const subtotalText = document.getElementById("revSubtotal").innerText.replace("R$", "").replace(",", ".").trim();
    const subtotal = parseFloat(subtotalText) || 0;

    if (tipo === "retirada") {
      campoEndereco.style.display = "none";
      infoRetirada.style.display = "block";
      taxaInput.value = "0.00";
      taxaDisplay.innerText = "R$ 0,00";
      totalDisplay.innerText = `R$ ${subtotal.toFixed(2).replace(".", ",")}`;
    } else {
      campoEndereco.style.display = "block";
      infoRetirada.style.display = "none";
    }
  });
});
// === Alterna entre Entrega e Retirada ===
document.querySelectorAll('input[name="tipoEntrega"]').forEach(radio => {
  radio.addEventListener("change", () => {
    const tipoSelecionado = document.querySelector('input[name="tipoEntrega"]:checked').value;
    const campoEndereco = document.getElementById("campoEndereco");
    const infoRetirada = document.getElementById("infoRetirada");
    const taxaInput = document.getElementById("taxa");
    const revTaxa = document.getElementById("revTaxa");
    const revTotal = document.getElementById("revTotal");
    const revSubtotal = document.getElementById("revSubtotal");

    const subtotal = parseFloat(
      revSubtotal.textContent.replace("R$", "").replace(",", ".").trim()
    ) || 0;

    if (tipoSelecionado === "retirada") {
      campoEndereco.style.display = "none";
      infoRetirada.style.display = "block";
      taxaInput.value = "0.00";
      revTaxa.textContent = "R$ 0,00";
      revTotal.textContent = `R$ ${subtotal.toFixed(2).replace(".", ",")}`;
      document.getElementById("resultadoEntrega").innerHTML = "ℹ️ Retirada no local selecionada. Sem taxa de entrega.";
    } else {
      campoEndereco.style.display = "block";
      infoRetirada.style.display = "none";
      revTaxa.textContent = `R$ ${parseFloat(taxaInput.value || "0").toFixed(2).replace(".", ",")}`;
      revTotal.textContent = `R$ ${(subtotal + parseFloat(taxaInput.value || "0")).toFixed(2).replace(".", ",")}`;
    }
  });
});
function atualizarBotaoWhatsApp() {
  const tipo = document.querySelector('input[name="tipoEntrega"]:checked').value;
  const endereco = document.getElementById("endereco").value.trim();
  const btnWhats = document.getElementById("revisaoConfirmar");

  if (tipo === "entrega") {
    // Só ativa o botão se o endereço estiver preenchido
    btnWhats.disabled = endereco.length === 0;
    btnWhats.style.opacity = endereco.length === 0 ? 0.5 : 1;
  } else {
    // Retirada: libera o botão
    btnWhats.disabled = false;
    btnWhats.style.opacity = 1;
  }
}
