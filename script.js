// ===== IMPORTS (CORRIGIDO: Movidos para o topo do arquivo) =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ===== CONFIGURAÇÃO FIREBASE =====
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "geraldo-menu.firebaseapp.com",
  projectId: "geraldo-menu",
  storageBucket: "geraldo-menu.appspot.com",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== ESTADO GLOBAL =====
const sacola = []; // { name, price, obs }
let produtoAtual = null;
let precoBase = 0;

// ===== UTILS (Funções Ajudantes) =====
const brl = (n) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`;

/**
 * Trava o scroll do body e gerencia a visibilidade do botão flutuante
 */
function updateModalState(isOpening) {
  document.body.classList.toggle("modal-open", isOpening);

  // CORREÇÃO: Esconde/mostra o botão flutuante
  if (btnCarrinhoNovo) {
    // Se estiver abrindo um modal, esconde o botão.
    if (isOpening) {
      btnCarrinhoNovo.style.display = 'none';
    } 
    // Se estiver fechando, deixa o CSS (classe .hidden) decidir.
    else {
      btnCarrinhoNovo.style.display = ''; // Reseta o display inline
    }
  }
}


function fecharModal(ref) {
  ref.setAttribute("aria-hidden", "true");
  updateModalState(false); // <-- CORREÇÃO: Chama a função unificada
  if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }
}

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

// ===== ELEMENTOS (declarados aqui, definidos no DOMContentLoaded) =====
let listaSacola, totalSacola, modal, modalClose, modalImg, modalTitle, modalDesc,
    modalPrice, modalObs, modalAdd, inputRetirada, infoRetirada, revisao,
    revisaoClose, btnRevisar, revisaoLista, revSubtotal, revTaxa, revTotal,
    inputEndereco, inputTaxa, revisaoConfirmar, btnFlutuante, btnCarrinhoNovo,
    btnModerador, btnGerenciarAdicionais, painelAdicionais, listaAdicionais,
    popupTroco, resumoTroco, btnConfirmarTroco;

// ===== FUNÇÕES PRINCIPAIS =====

/**
 * Atualiza o botão flutuante antigo (oculto)
 */
function atualizarBotaoFlutuante() {
  const btn = btnFlutuante; // usa a variável global
  const contador = document.getElementById("count-itens");
  const valorItens = document.getElementById("valor-itens");
  if (!btn || !contador || !valorItens) return;

  const qtd = sacola.length;
  const total = sacola.reduce((acc, it) => acc + it.price, 0);

  if (qtd > 0) {
    btn.style.removeProperty("display");
    btn.classList.remove("hidden");
    contador.textContent = String(qtd);
    valorItens.textContent = brl(total);

    btn.onclick = () => {
      if (sacola.length === 0) return;
      preencherRevisao();
      revisao.setAttribute("aria-hidden", "false");
      updateModalState(true); // <-- CORREÇÃO: Chama a função unificada
    };
  } else {
    btn.classList.add("hidden");
    btn.style.removeProperty("display");
  }
}

/**
 * Atualiza o novo botão flutuante (o amarelo)
 */
function atualizarCarrinhoNovo() {
  const btn = btnCarrinhoNovo; // usa a variável global
  const count = document.getElementById("novoCount");
  const totalEl = document.getElementById("novoTotal");
  if (!btn || !count || !totalEl) return;

  const qtd = sacola.length;
  const total = sacola.reduce((acc, it) => acc + it.price, 0);

  if (qtd > 0) {
    btn.classList.remove("hidden");
    count.textContent = qtd;
    totalEl.textContent = brl(total);
  } else {
    btn.classList.add("hidden");
  }
}

/**
 * Atualiza a sacola de compras (Sidebar)
 * (Versão unificada e corrigida)
 */
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

  // Atualiza os dois botões flutuantes
  atualizarBotaoFlutuante();
  atualizarCarrinhoNovo();

  // Se a sacola esvaziou e o modal de revisão está aberto, fecha
  if (sacola.length === 0 && revisao.getAttribute("aria-hidden") === "false") {
    fecharModal(revisao);
  }
}

/**
 * Atualiza os valores de Subtotal, Taxa e Total no modal de Revisão
 */
function atualizarTotalComTaxa() {
  const subtotal = parseFloat(
    revSubtotal.textContent.replace("R$", "").replace(",", ".").trim()
  ) || 0;
  const taxa = parseFloat(inputTaxa.value) || 0;
  const total = subtotal + taxa;
  
  revTotal.innerText = brl(total);
  revTaxa.innerText = brl(taxa);
}

/**
 * Habilita/Desabilita o botão de enviar pedido se for entrega e não tiver endereço
 */
function atualizarBotaoWhatsApp() {
  const tipo = document.querySelector('input[name="tipoEntrega"]:checked').value;
  const endereco = inputEndereco.value.trim();

  if (tipo === "entrega") {
    revisaoConfirmar.disabled = endereco.length === 0;
    revisaoConfirmar.style.opacity = endereco.length === 0 ? 0.5 : 1;
  } else {
    revisaoConfirmar.disabled = false;
    revisaoConfirmar.style.opacity = 1;
  }
}

/**
 * Preenche o modal de Revisão com os itens da sacola
 */
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

  revSubtotal.textContent = brl(subtotal);
  atualizarTotalComTaxa(); // Atualiza taxa e total
  atualizarBotaoWhatsApp(); // Verifica o botão
}

/**
 * Abre o modal de detalhes do produto
 */
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

  const modalOpcoes = document.getElementById("modalOpcoes");
  modalOpcoes.innerHTML = "";

  // Função interna para recalcular o preço no modal
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

  const blocoOpcoes = el.querySelector(".opcoes-produto");
  if (blocoOpcoes) {
    const clone = blocoOpcoes.cloneNode(true);
    clone.classList.remove("opcoes-produto");
    clone.classList.add("opcoes-modal");
    modalOpcoes.appendChild(clone);

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

    clone.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      chk.addEventListener("change", atualizarPrecoModal);
    });
  }

  atualizarPrecoModal(); // Calcula o preço inicial
  modal.setAttribute("aria-hidden", "false");
  updateModalState(true); // <-- CORREÇÃO: Chama a função unificada
}

/**
 * Salva o pedido no Firestore e abre o link do WhatsApp
 */
async function enviarPedido() {
  if (sacola.length === 0) return alert("Sua sacola está vazia!");
  
  // Validação final
  atualizarBotaoWhatsApp();
  if (revisaoConfirmar.disabled) {
    return alert("Por favor, preencha o endereço para entrega.");
  }

  const tipoEntrega = document.querySelector('input[name="tipoEntrega"]:checked').value;
  const endereco = tipoEntrega === 'retirada' ? "Retirada no local" : inputEndereco.value.trim();
  const taxa = parseFloat(inputTaxa.value || "0");
  const subtotal = sacola.reduce((acc, it) => acc + it.price, 0);
  const totalFinal = subtotal + (isNaN(taxa) ? 0 : taxa);
  
  const formaPagamento = document.querySelector('input[name="pagamento"]:checked').value;
  let obsPagamento = "";
  
  if (formaPagamento === "Dinheiro") {
    obsPagamento = resumoTroco.textContent.trim();
    if (!obsPagamento) {
        return alert("Se o pagamento é em dinheiro, por favor, informe o valor para troco.");
    }
  }

  const linhas = sacola.map((it) => {
    const base = `${it.name} — ${brl(it.price)}`;
    return it.obs ? `${base} (obs: ${it.obs})` : base;
  });

  const pedido = {
    nomeCliente: "Cliente", // (depois você pode puxar input do nome)
    endereco: endereco,
    itens: sacola,
    subtotal,
    taxa,
    total: totalFinal,
    pagamento: formaPagamento,
    obsPagamento: obsPagamento || null,
    status: "pendente",
    data: serverTimestamp(),
  };

  try {
    revisaoConfirmar.disabled = true;
    revisaoConfirmar.textContent = "Enviando...";
    await addDoc(collection(db, "pedidos"), pedido);
    console.log("✅ Pedido salvo no Firestore!");
  } catch (err) {
    console.error("❌ Erro ao salvar pedido:", err);
    alert("Erro ao salvar o pedido. Tente novamente.");
    revisaoConfirmar.disabled = false;
    revisaoConfirmar.textContent = "✅ Confirmar e enviar no WhatsApp";
    return;
  }

  // 🔗 Envio opcional via WhatsApp
  const linhasMsg = linhas.map((l) => `• ${l}`).join("\n");
  let msg =
    `Olá! Quero fazer um pedido:\n\n${linhasMsg}\n\n` +
    `Subtotal: ${brl(subtotal)}\nTaxa: ${brl(taxa)}\n*Total: ${brl(totalFinal)}*\n\n` +
    `*Pagamento:* ${formaPagamento}\n` +
    (obsPagamento ? `*Troco:* ${obsPagamento}\n` : "") +
    `*Entrega:* ${endereco}\n`;

  const numero = "5512997891619"; // <<<<< seu número
  const link = `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
  window.open(link, "_blank");
  
  revisaoConfirmar.disabled = false;
  revisaoConfirmar.textContent = "✅ Confirmar e enviar no WhatsApp";
}

// --- Funções do Modo Moderador ---

function prepararCardsModerador() {
  document.querySelectorAll(".item").forEach(item => {
    const nome = item.dataset.name;
    let btn = item.querySelector(".btn-pausar");
    if (!btn) {
      btn = document.createElement("button");
      btn.className = "btn-pausar";
      const pausado = item.classList.contains("pausado");
      btn.textContent = pausado ? "▶️ Ativar" : "⏸️ Pausar";
      
      btn.onclick = (ev) => {
        ev.stopPropagation();
        const estaPausado = item.classList.toggle("pausado");
        btn.textContent = estaPausado ? "▶️ Ativar" : "⏸️ Pausar";
        
        let pausados = JSON.parse(localStorage.getItem("itensPausados") || "[]");
        if (estaPausado) {
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

function initModerador() {
  const senhaModerador = "batata2025";
  if (!btnModerador) return;

  // Aplica estado salvo ao carregar
  let pausados = JSON.parse(localStorage.getItem("itensPausados") || "[]");
  pausados.forEach(nome => {
    document.querySelectorAll(".item").forEach(item => {
      if (item.dataset.name === nome) item.classList.add("pausado");
    });
  });

  btnModerador.addEventListener("click", () => {
    const senha = prompt("Digite a senha do modo moderador:");
    if (senha !== senhaModerador) return alert("❌ Senha incorreta!");

    document.body.classList.toggle("modoModerador");
    const ativo = document.body.classList.contains("modoModerador");

    if (ativo) {
      alert("✅ Modo moderador ativado!");
      if (!document.querySelector(".moderador-ativo")) {
        const aviso = document.createElement("div");
        aviso.className = "moderador-ativo";
        aviso.textContent = "🟢 Modo Moderador ativo";
        document.body.appendChild(aviso);
      }
      prepararCardsModerador();
    } else {
      alert("🟡 Modo moderador desativado.");
      document.querySelector(".moderador-ativo")?.remove();
    }
  });
}

// --- Funções do Painel de Adicionais ---

let adicionaisPausados = JSON.parse(localStorage.getItem("adicionaisPausados") || "[]");

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

function abrirPainelAdicionais() {
  const todosExtras = document.querySelectorAll('.extra input[type="hidden"]');
  const nomesUnicos = [...new Set(Array.from(todosExtras).map(inp => inp.value))];

  listaAdicionais.innerHTML = "";
  nomesUnicos.forEach(nome => {
    const li = document.createElement("li");
    li.style.cssText = "margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;";
    
    const span = document.createElement("span");
    span.textContent = nome;
    const btn = document.createElement("button");
    const pausado = adicionaisPausados.includes(nome);
    
    btn.textContent = pausado ? "▶️ Ativar" : "⏸️ Pausar";
    btn.className = "btn-primario";
    btn.style.background = pausado ? "#4CAF50" : "#ffdc73";
    btn.style.color = pausado ? "#fff" : "#000";

    btn.addEventListener("click", () => {
      if (adicionaisPausados.includes(nome)) {
        adicionaisPausados = adicionaisPausados.filter(n => n !== nome);
      } else {
        adicionaisPausados.push(nome);
      }
      localStorage.setItem("adicionaisPausados", JSON.stringify(adicionaisPausados));
      atualizarEstadoExtras();
      abrirPainelAdicionais(); // Recarrega a lista do painel
    });

    li.appendChild(span);
    li.appendChild(btn);
    listaAdicionais.appendChild(li);
  });

  painelAdicionais.setAttribute("aria-hidden", "false");
}

// Exposta globalmente para o `onclick` no HTML
window.fecharPainelAdicionais = function () {
  painelAdicionais.setAttribute("aria-hidden", "true");
};

function initPainelAdicionais() {
  if (!btnGerenciarAdicionais || !painelAdicionais || !listaAdicionais) {
    console.warn("⚠️ Elementos do painel de adicionais não encontrados.");
    return;
  }
  btnGerenciarAdicionais.addEventListener("click", abrirPainelAdicionais);
  atualizarEstadoExtras(); // Aplica estado salvo ao carregar
}


// ===================================================================
// ===== INICIALIZAÇÃO (UNIFICADO) =====
// ===================================================================

document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Atribui todos os elementos do DOM a variáveis ---
  listaSacola = document.getElementById("lista-sacola");
  totalSacola = document.getElementById("total-sacola");
  modal = document.getElementById("modal");
  modalClose = document.getElementById("modalClose");
  modalImg = document.getElementById("modalImg");
  modalTitle = document.getElementById("modalTitle");
  modalDesc = document.getElementById("modalDesc");
  modalPrice = document.getElementById("modalPrice");
  modalObs = document.getElementById("modalObs");
  modalAdd = document.getElementById("modalAdd");
  inputRetirada = document.getElementById("opcaoRetirada"); // (Requer ID no HTML)
  infoRetirada = document.getElementById("infoRetirada");
  revisao = document.getElementById("revisao");
  revisaoClose = document.getElementById("revisaoClose");
  btnRevisar = document.getElementById("btn-revisar");
  revisaoLista = document.getElementById("revisaoLista");
  revSubtotal = document.getElementById("revSubtotal");
  revTaxa = document.getElementById("revTaxa");
  revTotal = document.getElementById("revTotal");
  inputEndereco = document.getElementById("endereco");
  inputTaxa = document.getElementById("taxa");
  revisaoConfirmar = document.getElementById("revisaoConfirmar");
  btnFlutuante = document.getElementById("btn-flutuante");
  btnCarrinhoNovo = document.getElementById("btnCarrinhoNovo");
  btnModerador = document.getElementById("btnModerador");
  btnGerenciarAdicionais = document.getElementById("btnGerenciarAdicionais");
  painelAdicionais = document.getElementById("painelAdicionais");
  listaAdicionais = document.getElementById("listaAdicionais");
  popupTroco = document.getElementById("popupTroco");
  resumoTroco = document.getElementById("resumoTroco");
  btnConfirmarTroco = document.getElementById("confirmarTroco");

  // --- 2. Adiciona os Event Listeners ---

  // Abrir modal ao clicar no card
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

  // Fechar Modais
  modalClose.addEventListener("click", () => fecharModal(modal));
  revisaoClose.addEventListener("click", () => fecharModal(revisao));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fecharModal(modal);
  });
  revisao.addEventListener("click", (e) => {
    if (e.target === revisao) fecharModal(revisao);
  });

  // Adicionar item à sacola
  modalAdd.addEventListener("click", () => {
    if (!produtoAtual) return;

    const obs = modalObs.value.trim();
    let adicionaisSelecionados = [];
    let extraTotal = 0;

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
    showConfirmPopup();
    fecharModal(modal);
  });

  // Remover item da Sacola (sidebar)
  listaSacola.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-remove");
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    sacola.splice(idx, 1);
    atualizarSacola();
    if (revisao.getAttribute("aria-hidden") === "false") preencherRevisao();
  });

  // Abrir Revisão (do botão da sidebar)
  btnRevisar.addEventListener("click", () => {
    if (sacola.length === 0) return alert("Sua sacola está vazia!");
    preencherRevisao();
    revisao.setAttribute("aria-hidden", "false");
    updateModalState(true); // <-- CORREÇÃO: Chama a função unificada
  });

  // Remover item do Modal de Revisão
  revisaoLista.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-remove");
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    sacola.splice(idx, 1);
    atualizarSacola();
    if (sacola.length === 0) fecharModal(revisao);
    else preencherRevisao();
  });

  // Recalcular total se a taxa mudar (ex: calculo de entrega)
  inputTaxa.addEventListener("input", atualizarTotalComTaxa);

  // Enviar pedido
  revisaoConfirmar.addEventListener("click", enviarPedido);

  // Animação do Header
  window.addEventListener("scroll", () => {
    const header = document.querySelector(".brand-header");
    if (window.scrollY > 100) {
      header.classList.add("minimized");
    } else {
      header.classList.remove("minimized");
    }
  });

  // Clique no botão flutuante NOVO
  btnCarrinhoNovo.addEventListener("click", () => {
    if (sacola.length === 0) return;
    preencherRevisao();
    revisao.setAttribute("aria-hidden", "false");
    updateModalState(true); // <-- CORREÇÃO: Chama a função unificada
  });
  
  // (UNIFICADO E CORRIGIDO: Lógica de Entrega/Retirada)
  document.querySelectorAll('input[name="tipoEntrega"]').forEach(radio => {
    radio.addEventListener("change", () => {
      const tipoSelecionado = document.querySelector('input[name="tipoEntrega"]:checked').value;
      const campoEndereco = document.getElementById("campoEndereco");
      const infoRetirada = document.getElementById("infoRetirada");

      if (tipoSelecionado === "retirada") {
        campoEndereco.style.display = "none";
        infoRetirada.style.display = "block";
        inputTaxa.value = "0.00";
        inputEndereco.disabled = true; 
        document.getElementById("resultadoEntrega").innerHTML = "ℹ️ Retirada no local selecionada. Sem taxa de entrega.";
      } else {
        campoEndereco.style.display = "block";
        infoRetirada.style.display = "none";
        inputEndereco.disabled = false;
      }
      atualizarTotalComTaxa();
      atualizarBotaoWhatsApp();
    });
  });

  // (UNIFICADO: Lógica de Pagamento/Troco)
  document.querySelectorAll('input[name="pagamento"]').forEach(radio => {
    radio.addEventListener("change", () => {
      const valorInput = document.getElementById("valorTroco");
      
      if (radio.value === "Dinheiro" && radio.checked) {
        popupTroco.style.display = "block";
        popupTroco.setAttribute("aria-hidden", "false");
        valorInput.focus();
      } else {
        popupTroco.style.display = "none";
        popupTroco.setAttribute("aria-hidden", "true");
        resumoTroco.style.display = "none";
        resumoTroco.textContent = ""; // Limpa o valor
      }
    });
  });

  // Confirmar valor do troco
  btnConfirmarTroco.addEventListener("click", () => {
    const valorInput = document.getElementById("valorTroco");
    const valor = parseFloat(valorInput.value);
    const totalPedido = parseFloat(revTotal.textContent.replace("R$", "").replace(",", ".").trim());

    if (isNaN(valor) || valor <= 0) {
        return alert("Por favor, insira um valor válido.");
    }
    if (valor < totalPedido) {
        return alert("O valor para troco deve ser maior ou igual ao total do pedido.");
    }
    
    resumoTroco.textContent = `Troco para R$ ${valor.toFixed(2).replace('.', ',')}`;
    resumoTroco.style.display = "block";
    
    valorInput.blur();
    popupTroco.style.display = "none";
    popupTroco.setAttribute("aria-hidden", "true");
  });

  // Atualiza botão do zap se digitar endereço
  inputEndereco.addEventListener("input", atualizarBotaoWhatsApp);

  // --- 3. Inicializa os Módulos ---
  initModerador();
  initPainelAdicionais();
  
  // Força uma verificação inicial (caso a página recarregue com "entrega" selecionado)
  atualizarBotaoWhatsApp();
  
  // Força o estado inicial correto ao carregar a página
  const tipoInicial = document.querySelector('input[name="tipoEntrega"]:checked')?.value || 'entrega';
  if (tipoInicial === 'entrega') {
      inputEndereco.disabled = false;
  } else {
      inputEndereco.disabled = true;
  }
});