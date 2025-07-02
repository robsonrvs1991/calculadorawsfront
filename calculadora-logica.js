// calculadora-logica.js

function calcularInvestimentos(params) {
  const {
    investimentoInicial,
    aportesMensais,
    periodo,
    selic,
    cdi,
    ipca,
    tr,
    tesouroNominal,
    taxaCustodia,
    tesouroIPCA,
    taxaAdm,
    pctCDB,
    pctFundo,
    pctLCI,
    rentPoupanca
  } = params;

  const resultados = {
    CDB: [],
    LCI: [],
    Tesouro: [],
    CDI: [],
    IPCA: [],
    Poupanca: []
  };
  const labels = [];

  let montanteBase = investimentoInicial;
  let montantes = {
    CDB: montanteBase,
    LCI: montanteBase,
    Tesouro: montanteBase,
    CDI: montanteBase,
    IPCA: montanteBase,
    Poupanca: montanteBase
  };

  for (let mes = 1; mes <= periodo; mes++) {
    labels.push(`${mes}º mês`);

    const cdiMensal = Math.pow(1 + cdi, 1 / 12) - 1;
    const selicMensal = Math.pow(1 + selic, 1 / 12) - 1;
    const ipcaMensal = Math.pow(1 + ipca, 1 / 12) - 1;
    const tesouroMensal = Math.pow(1 + tesouroNominal, 1 / 12) - 1;
    const juroIPCAMensal = tesouroIPCA / 12;

    montantes.CDB = (montantes.CDB + aportesMensais) * (1 + cdiMensal * pctCDB);
    montantes.LCI = (montantes.LCI + aportesMensais) * (1 + cdiMensal * pctLCI);
    montantes.Tesouro = (montantes.Tesouro + aportesMensais) * (1 + tesouroMensal * (1 - taxaCustodia));
    montantes.CDI = (montantes.CDI + aportesMensais) * (1 + cdiMensal * pctFundo * (1 - taxaAdm));
    montantes.IPCA = (montantes.IPCA + aportesMensais) * (1 + ipcaMensal + juroIPCAMensal);
    montantes.Poupanca = (montantes.Poupanca + aportesMensais) * (1 + rentPoupanca);

    resultados.CDB.push(montantes.CDB);
    resultados.LCI.push(montantes.LCI);
    resultados.Tesouro.push(montantes.Tesouro);
    resultados.CDI.push(montantes.CDI);
    resultados.IPCA.push(montantes.IPCA);
    resultados.Poupanca.push(montantes.Poupanca);
  }

  atualizarGrafico(resultados, labels);
  atualizarResultado("Simulação concluída com sucesso. Gráfico exibido.");
}

let chartInstance;

function atualizarGrafico(dados, labels) {
  const ctx = document.getElementById('graficoInvestimentos').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        document.getElementById('cbCDB').checked ? {
          label: 'CDB',
          data: dados.CDB,
          borderWidth: 2,
          fill: false
        } : null,
        document.getElementById('cbLCI').checked ? {
          label: 'LCI/LCA',
          data: dados.LCI,
          borderWidth: 2,
          fill: false
        } : null,
        document.getElementById('cbTesouro').checked ? {
          label: 'Tesouro Prefixado',
          data: dados.Tesouro,
          borderWidth: 2,
          fill: false
        } : null,
        {
          label: 'CDI',
          data: dados.CDI,
          borderWidth: 1,
          borderDash: [5, 5],
          fill: false
        },
        {
          label: 'IPCA',
          data: dados.IPCA,
          borderWidth: 1,
          borderDash: [5, 5],
          fill: false
        },
        {
          label: 'Poupança',
          data: dados.Poupanca,
          borderWidth: 1,
          borderDash: [5, 5],
          fill: false
        }
      ].filter(Boolean)
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false
        },
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          ticks: {
            callback: value => 'R$ ' + value.toFixed(2)
          }
        }
      }
    }
  });
}

function atualizarResultado(texto) {
  document.getElementById('resultado').innerText = texto;
}

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.text("Simulação de Investimentos", 20, 20);
  pdf.html(document.querySelector("#graficoInvestimentos"), {
    callback: () => pdf.save("simulacao-investimento.pdf")
  });
}

function exportarXLSX() {
  const wb = XLSX.utils.book_new();
  const labels = chartInstance.data.labels;
  const output = [['Mês']];

  chartInstance.data.datasets.forEach(dataset => {
    output[0].push(dataset.label);
  });

  labels.forEach((label, i) => {
    const row = [label];
    chartInstance.data.datasets.forEach(dataset => {
      row.push(dataset.data[i]);
    });
    output.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(output);
  XLSX.utils.book_append_sheet(wb, ws, 'Simulação');
  XLSX.writeFile(wb, 'simulacao-investimento.xlsx');
}

document.getElementById("btnCalcular").addEventListener("click", async () => {
  const investimentoInicial = parseFloat(document.getElementById("investimentoInicial").value) || 0;
  const aporteMensal = parseFloat(document.getElementById("aportesMensais").value) || 0;
  const periodo = parseInt(document.getElementById("periodo").value) || 0;
  const unidade = document.getElementById("periodoUnidade").value;
  const meses = unidade === "anos" ? periodo * 12 : periodo;

  const cdi = parseFloat(document.getElementById("cdi").value) || 0;
  const ipca = parseFloat(document.getElementById("ipca").value) || 0;
  const poupanca = parseFloat(document.getElementById("rentPoupanca").value) || 0;
  const juroIPCA = parseFloat(document.getElementById("tesouroIPCA").value.replace(",", ".")) || 0;

  const payload = {
    investimento_inicial: investimentoInicial,
    aporte_mensal: aporteMensal,
    meses: meses,
    cdi: cdi,
    ipca: ipca,
    poupanca: poupanca,
    juro_ipca: juroIPCA
  };

  try {
    const res = await fetch("https://calculadora-rvs-production.up.railway.app/calcular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Erro no cálculo");

    const data = await res.json();

    document.getElementById("resultado").innerHTML = `
      <div>📈 <strong>Total estimado CDI:</strong> R$ ${data.total_cdi.toFixed(2)}</div>
      <div>📊 <strong>Total estimado IPCA:</strong> R$ ${data.total_ipca.toFixed(2)}</div>
      <div>🏦 <strong>Total estimado Poupança:</strong> R$ ${data.total_poupanca.toFixed(2)}</div>
    `;

    atualizarGrafico({
      CDI: Array.from({ length: meses }, (_, i) => data.total_cdi * (i + 1) / meses),
      IPCA: Array.from({ length: meses }, (_, i) => data.total_ipca * (i + 1) / meses),
      Poupanca: Array.from({ length: meses }, (_, i) => data.total_poupanca * (i + 1) / meses)
    }, Array.from({ length: meses }, (_, i) => `${i + 1}º mês`));
  } catch (err) {
    console.error(err);
    alert("Erro ao calcular. Tente novamente.");
  }
});
