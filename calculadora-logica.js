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

    montantes.CDB = (montantes.CDB + aportesMensais) * (1 + cdiMensal * pctCDB);
    montantes.LCI = (montantes.LCI + aportesMensais) * (1 + cdiMensal * pctLCI);
    montantes.Tesouro = (montantes.Tesouro + aportesMensais) * (1 + tesouroMensal * (1 - taxaCustodia));
    montantes.CDI = (montantes.CDI + aportesMensais) * (1 + cdiMensal * pctFundo * (1 - taxaAdm));
    montantes.IPCA = (montantes.IPCA + aportesMensais) * (1 + ipcaMensal + tesouroIPCA / 12);
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
        dados.CDB && document.getElementById('cbCDB').checked ? {
          label: 'CDB',
          data: dados.CDB,
          borderWidth: 2,
          fill: false
        } : null,
        dados.LCI && document.getElementById('cbLCI').checked ? {
          label: 'LCI/LCA',
          data: dados.LCI,
          borderWidth: 2,
          fill: false
        } : null,
        dados.Tesouro && document.getElementById('cbTesouro').checked ? {
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
  const output = [ ['Mês'] ];

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

