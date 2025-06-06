
const MOTORISTA = "Lucas";
const LIMITE_LINHAS = 30;

function trocarAba(id) {
  document.querySelectorAll(".aba").forEach(aba => aba.classList.remove("ativa"));
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.getElementById("aba-" + id).classList.add("ativa");
  document.querySelector(`[onclick="trocarAba('${id}')"]`).classList.add("active");
}

function carregarTabela() {
  const registros = JSON.parse(localStorage.getItem("registrosAtuais")) || [];
  const tbody = document.querySelector("#tabela tbody");
  tbody.innerHTML = "";

  registros.forEach(reg => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${reg.data}</td><td>${reg.horario}</td><td>${reg.obra}</td><td>${reg.motorista}</td>`;
    tbody.appendChild(tr);
  });

  carregarHistorico();
}

function adicionarRegistro() {
  const obra = document.getElementById("obra").value.trim();
  if (!obra) return alert("Digite o nome da obra.");

  const agora = new Date();
  const registro = {
    data: agora.toLocaleDateString("pt-BR"),
    horario: agora.toLocaleTimeString("pt-BR"),
    obra,
    motorista: MOTORISTA,
  };

  let registros = JSON.parse(localStorage.getItem("registrosAtuais")) || [];
  registros.push(registro);

  if (registros.length >= LIMITE_LINHAS) {
    const historico = JSON.parse(localStorage.getItem("historicoRegistros")) || [];
    historico.push({ timestamp: agora.toISOString(), dados: registros });
    localStorage.setItem("historicoRegistros", JSON.stringify(historico));
    registros = [];
    alert("Limite atingido. Dados salvos no histórico.");
  }

  localStorage.setItem("registrosAtuais", JSON.stringify(registros));
  document.getElementById("obra").value = "";
  carregarTabela();
}

function exportarExcel(dados = null, nome = null) {
  const registros = dados || JSON.parse(localStorage.getItem("registrosAtuais")) || [];
  if (registros.length === 0) return alert("Nada para exportar.");

  const ws = XLSX.utils.json_to_sheet(registros);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Registros");
  XLSX.writeFile(wb, nome || "registro-obras.xlsx");
}

function exportarPDF(dados = null, nome = "registros.pdf") {
  const registros = dados || JSON.parse(localStorage.getItem("registrosAtuais")) || [];
  if (registros.length === 0) return alert("Nada para exportar.");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Relatório de Registros de Obras", 14, 18);

  const linhas = registros.map(r => [
    r.data,
    r.horario,
    r.obra,
    r.motorista
  ]);

  doc.autoTable({
    head: [["Data", "Horário", "Obra", "Motorista"]],
    body: linhas,
    startY: 25,
    styles: { fontSize: 10 }
  });

  doc.save(nome);
}

function carregarHistorico() {
  const container = document.getElementById("historico-container");
  const historico = JSON.parse(localStorage.getItem("historicoRegistros")) || [];

  const filtroObra = document.getElementById("filtroObra").value.toLowerCase();
  const filtroData = document.getElementById("filtroData").value;

  if (historico.length === 0) {
    container.innerHTML = `<p>Nenhum histórico salvo.</p>`;
    return;
  }

  let html = "<ul>";

  historico.forEach((item, i) => {
    const dataStr = new Date(item.timestamp).toLocaleString("pt-BR");

    const correspondeFiltro = item.dados.some(d =>
      (!filtroObra || d.obra.toLowerCase().includes(filtroObra)) &&
      (!filtroData || d.data === formatarData(filtroData))
    );

    if (!correspondeFiltro) return;

    html += `
      <li>
        <strong>${dataStr}</strong>
        <button onclick="exportarHistorico(${i})">Excel</button>
        <button onclick="exportarHistoricoPDF(${i})">PDF</button>
        <button onclick="apagarHistorico(${i})">Apagar</button>
      </li>
    `;
  });

  html += "</ul>";
  container.innerHTML = html;
}

function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function exportarHistorico(i) {
  const historico = JSON.parse(localStorage.getItem("historicoRegistros")) || [];
  if (!historico[i]) return;
  exportarExcel(historico[i].dados, `historico-${i + 1}.xlsx`);
}

function exportarHistoricoPDF(i) {
  const historico = JSON.parse(localStorage.getItem("historicoRegistros")) || [];
  if (!historico[i]) return;
  exportarPDF(historico[i].dados, `historico-${i + 1}.pdf`);
}

function exportarTodosHistoricos() {
  const historico = JSON.parse(localStorage.getItem("historicoRegistros")) || [];
  let todos = [];
  historico.forEach(h => todos = todos.concat(h.dados));
  exportarExcel(todos, "todos-historicos.xlsx");
}

function exportarTodosHistoricosPDF() {
  const historico = JSON.parse(localStorage.getItem("historicoRegistros")) || [];
  let todos = [];
  historico.forEach(h => todos = todos.concat(h.dados));
  exportarPDF(todos, "todos-historicos.pdf");
}

function apagarHistorico(i) {
  const historico = JSON.parse(localStorage.getItem("historicoRegistros")) || [];
  if (confirm("Apagar este histórico?")) {
    historico.splice(i, 1);
    localStorage.setItem("historicoRegistros", JSON.stringify(historico));
    carregarHistorico();
  }
}

function apagarTodosHistoricos() {
  if (confirm("Tem certeza que deseja apagar todos os históricos?")) {
    localStorage.removeItem("historicoRegistros");
    carregarHistorico();
  }
}

window.onload = carregarTabela;
