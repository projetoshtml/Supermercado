"use strict";

// Estrutura de dados principal
let mercadorias = JSON.parse(localStorage.getItem('mercadorias')) || [];
const NOTIFICATION_TIMEOUT = 5000;

// Elementos do DOM
const form = document.getElementById('form-mercadoria');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const btnGerarPDF = document.getElementById('btn-gerar-pdf');
const btnBackup = document.getElementById('btn-backup');
const modalBackup = document.getElementById('modal-backup');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const btnExportar = document.getElementById('btn-exportar');
const inputImportar = document.getElementById('input-importar');

// Filtros
const filtroNome = document.getElementById('filtro-nome');
const filtroCategoria = document.getElementById('filtro-categoria');
const filtroMarca = document.getElementById('filtro-marca');

// Atualiza estatísticas
function atualizarEstatisticas() {
  document.getElementById('total-itens').textContent = mercadorias.length;
  const proximaCompra = mercadorias.filter(p => p.quantidade <= p.limiteMinimo);
  document.getElementById('total-proxima').textContent = proximaCompra.length;
}

// Salvar no localStorage
function salvarDados() {
  localStorage.setItem('mercadorias', JSON.stringify(mercadorias));
  atualizarEstatisticas();
}

// Renderizar listas
function renderizarEstoque() {
  const lista = document.getElementById('lista-estoque');
  const nome = filtroNome.value.toLowerCase();
  const categoria = filtroCategoria.value;
  const marca = filtroMarca.value;

  const filtrados = mercadorias.filter(item => {
    return (
      item.nome.toLowerCase().includes(nome) &&
      (categoria === '' || item.categoria === categoria) &&
      (marca === '' || item.marca === marca)
    );
  });

  lista.innerHTML = '';
  filtrados.forEach(item => {
    const card = document.createElement('div');
    card.className = `product-card ${item.quantidade <= item.limiteMinimo ? 'low' : ''}`;
    card.innerHTML = `
      <div class="product-info">
        <h3>${item.nome} <small>(${item.marca})</small></h3>
        <p><strong>${item.quantidade} ${item.unidade}</strong> | ${item.categoria} | Comprado em: ${formatarData(item.dataCompra)}</p>
        <p>Limite mínimo: ${item.limiteMinimo} ${item.unidade} | Obs: ${item.observacoes || '—'}</p>
      </div>
      <div class="product-actions">
        <button class="btn-use" data-id="${item.id}" title="Usar 1 unidade">Usar</button>
        <button class="btn-edit" data-id="${item.id}" title="Editar">Editar</button>
        <button class="btn-delete" data-id="${item.id}" title="Excluir">Excluir</button>
      </div>
    `;
    lista.appendChild(card);
  });

  // Adicionar eventos
  document.querySelectorAll('.btn-use').forEach(btn => {
    btn.addEventListener('click', usarProduto);
  });
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', editarProduto);
  });
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', excluirProduto);
  });
}

function renderizarProximaCompra() {
  const lista = document.getElementById('lista-proxima');
  const proxima = mercadorias.filter(p => p.quantidade <= p.limiteMinimo);

  lista.innerHTML = '';
  if (proxima.length === 0) {
    lista.innerHTML = '<p>Nenhum item na próxima compra. Tudo em dia! 🎉</p>';
    return;
  }

  proxima.forEach(item => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-info">
        <h3>${item.nome} <small>(${item.marca})</small></h3>
        <p><strong>Sugerido:</strong> ${item.limiteMinimo + 1} ${item.unidade} | Categoria: ${item.categoria}</p>
      </div>
    `;
    lista.appendChild(card);
  });
}

// Formatar data para exibição
function formatarData(dataStr) {
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Gerar ID único
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Evento de cadastro
form.addEventListener('submit', function (e) {
  e.preventDefault();

  const novo = {
    id: gerarId(),
    nome: document.getElementById('nome').value.trim(),
    marca: document.getElementById('marca').value.trim(),
    categoria: document.getElementById('categoria').value,
    quantidade: parseInt(document.getElementById('quantidade').value),
    unidade: document.getElementById('unidade').value,
    dataCompra: document.getElementById('data-compra').value,
    limiteMinimo: parseInt(document.getElementById('limite-minimo').value) || 1,
    observacoes: document.getElementById('observacoes').value.trim()
  };

  mercadorias.push(novo);
  salvarDados();
  form.reset();
  mostrarNotificacao(`${novo.nome} cadastrado com sucesso!`);
  atualizarMarcas();
  renderizarEstoque();
  renderizarProximaCompra();
});

// Usar produto
function usarProduto(e) {
  const id = e.target.dataset.id;
  const item = mercadorias.find(p => p.id === id);
  if (!item) return;

  if (item.quantidade > 0) {
    item.quantidade--;
    salvarDados();
    renderizarEstoque();
    renderizarProximaCompra();

    if (item.quantidade === item.limiteMinimo) {
      mostrarNotificacao(`${item.nome} está em falta! Adicionado à próxima compra.`);
    }
  }
}

// Editar produto
function editarProduto(e) {
  const id = e.target.dataset.id;
  const item = mercadorias.find(p => p.id === id);
  if (!item) return;

  // Preencher formulário com dados atuais
  document.getElementById('nome').value = item.nome;
  document.getElementById('marca').value = item.marca;
  document.getElementById('categoria').value = item.categoria;
  document.getElementById('quantidade').value = item.quantidade;
  document.getElementById('unidade').value = item.unidade;
  document.getElementById('data-compra').value = item.dataCompra;
  document.getElementById('limite-minimo').value = item.limiteMinimo;
  document.getElementById('observacoes').value = item.observacoes;

  // Remover item atual para não duplicar
  mercadorias = mercadorias.filter(p => p.id !== id);
  salvarDados();
  renderizarEstoque();
  renderizarProximaCompra();

  // Scroll até o formulário
  document.getElementById('cadastro').scrollIntoView({ behavior: 'smooth' });
}

// Excluir produto
function excluirProduto(e) {
  if (!confirm('Tem certeza que deseja excluir este produto?')) return;

  const id = e.target.dataset.id;
  mercadorias = mercadorias.filter(p => p.id !== id);
  salvarDados();
  renderizarEstoque();
  renderizarProximaCompra();
  atualizarMarcas();
  mostrarNotificacao('Produto excluído.');
}

// Abas
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;

    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(tab).classList.add('active');
  });
});

// Filtros
function atualizarMarcas() {
  const marcas = [...new Set(mercadorias.map(m => m.marca))].sort();
  filtroMarca.innerHTML = '<option value="">Todas as marcas</option>';
  marcas.forEach(marca => {
    const opt = document.createElement('option');
    opt.value = marca;
    opt.textContent = marca;
    filtroMarca.appendChild(opt);
  });
}

[filtroNome, filtroCategoria, filtroMarca].forEach(el => {
  el.addEventListener('input', () => {
    renderizarEstoque();
  });
});

// Notificação
function mostrarNotificacao(mensagem) {
  let notif = document.createElement('div');
  notif.className = 'notification';
  notif.textContent = mensagem;
  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add('show'), 100);
  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 300);
  }, NOTIFICATION_TIMEOUT);
}

// Gerar PDF
btnGerarPDF.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('Próxima Compra', 20, 20);

  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 20, 30);

  const proxima = mercadorias.filter(p => p.quantidade <= p.limiteMinimo);
  let y = 40;
  doc.setFontSize(12);

  if (proxima.length === 0) {
    doc.text('Nenhum item na lista de próxima compra.', 20, y);
  } else {
    proxima.forEach(item => {
      doc.text(
        `${item.nome} (${item.marca}) - Sugerido: ${item.limiteMinimo + 1} ${item.unidade}`, 
        20, y
      );
      y += 10;
    });
  }

  doc.save(`proxima-compra-${new Date().toISOString().split('T')[0]}.pdf`);
});

// Backup
btnBackup.addEventListener('click', () => {
  modalBackup.classList.add('active');
});

btnFecharModal.addEventListener('click', () => {
  modalBackup.classList.remove('active');
});

btnExportar.addEventListener('click', () => {
  const dataStr = JSON.stringify(mercadorias, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mercado-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
});

inputImportar.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const data = JSON.parse(ev.target.result);
      if (Array.isArray(data)) {
        mercadorias = data;
        salvarDados();
        renderizarEstoque();
        renderizarProximaCompra();
        atualizarMarcas();
        mostrarNotificacao('Dados importados com sucesso!');
        modalBackup.classList.remove('active');
        inputImportar.value = '';
      } else {
        alert('Formato inválido. O arquivo deve conter um array de produtos.');
      }
    } catch (err) {
      alert('Erro ao ler o arquivo. Verifique se é um JSON válido.');
    }
  };
  reader.readAsText(file);
});

// Inicialização
atualizarMarcas();
atualizarEstatisticas();
renderizarEstoque();
renderizarProximaCompra();