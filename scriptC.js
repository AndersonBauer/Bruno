const unidades = ['ponto', 'tomada', 'interruptor', 'luminária', 'disjuntor', 'circuito', 'm', 'm²', 'h', 'un'];

function criarSelectUnidade() {
    const select = document.createElement('select');
    unidades.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u;
        opt.textContent = u;
        select.appendChild(opt);
    });
    return select;
}

function adicionarLinha(desc = '', qtd = '', unidade = 'ponto') {
    const tbody = document.querySelector('#tabela-itens tbody');
    const tr = document.createElement('tr');

    // Descrição
    const tdDesc = document.createElement('td');
    const inputDesc = document.createElement('input');
    inputDesc.type = 'text';
    inputDesc.placeholder = 'Ex: Instalação de 3 tomadas duplas 10A';
    inputDesc.value = desc;
    inputDesc.style.width = '100%';
    tdDesc.appendChild(inputDesc);

    // Quantidade
    const tdQtd = document.createElement('td');
    const inputQtd = document.createElement('input');
    inputQtd.type = 'number';
    inputQtd.min = '0';
    inputQtd.step = '0.01';
    inputQtd.value = qtd;
    tdQtd.appendChild(inputQtd);

    // Unidade
    const tdUnidade = document.createElement('td');
    const selectUnidade = criarSelectUnidade();
    selectUnidade.value = unidade;
    tdUnidade.appendChild(selectUnidade);

    // Ação
    const tdRemove = document.createElement('td');
    const btnRemove = document.createElement('button');
    btnRemove.textContent = 'X';
    btnRemove.className = 'btn btn-remove';
    btnRemove.onclick = () => {
        tbody.removeChild(tr);
    };
    tdRemove.appendChild(btnRemove);

    tr.appendChild(tdDesc);
    tr.appendChild(tdQtd);
    tr.appendChild(tdUnidade);
    tr.appendChild(tdRemove);

    tbody.appendChild(tr);
}

window.onload = () => {
    adicionarLinha();
};

// Validação do formulário antes de gerar PDF
function validarFormulario() {
    const cliente = document.getElementById("cliente").value.trim();
    const contato = document.getElementById("contato").value.trim();
    const endereco = document.getElementById("endereco").value.trim();
    const linhas = document.querySelectorAll("#tabela-itens tbody tr");

    if (!cliente) { alert("⚠ Preencha o nome do cliente."); return false; }
    if (!contato) { alert("⚠ Preencha o contato do cliente."); return false; }
    if (!endereco) { alert("⚠ Preencha o endereço do serviço."); return false; }
    if (linhas.length === 0) { alert("⚠ Adicione ao menos 1 serviço."); return false; }

    for (const tr of linhas) {
        const desc = tr.children[0].querySelector("input").value.trim();
        const qtd = parseFloat(tr.children[1].querySelector("input").value);
        if (!desc) { alert("⚠ Todas as linhas precisam de descrição."); return false; }
        if (!qtd || qtd <= 0) { alert("⚠ Quantidade deve ser maior que zero."); return false; }
    }

    return true;
}

// Gerar PDF
function gerarPDF() {
    if (!validarFormulario()) return;

    if (!window.html2pdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        document.head.appendChild(script);
        script.onload = gerarPDFReal;
    } else {
        gerarPDFReal();
    }
}

function gerarPDFReal() {
    const element = document.querySelector('.container');

    const clone = element.cloneNode(true);

    // Remover botões de ação
    clone.querySelectorAll(".btn-pdf, .btn-add, .btn-remove").forEach(btn => btn.remove());
    clone.style.marginTop = "0";
    clone.style.marginBottom = "0";
    clone.style.boxShadow = "none";

    const cliente = document.getElementById('cliente').value;

    const header = document.createElement("div");
    header.style = "text-align:center; padding: 0 0 10px 0; margin: 0; border-bottom:2px solid #003087; background:white;";
    header.innerHTML = `
        <h2 style="margin:0; color:#003087;">ORÇAMENTO ELÉTRICA KAISER</h2>
        <p style="margin:4px 0;"><strong>Cliente:</strong> ${cliente}</p>
    `;
    clone.prepend(header);

    const temp = document.createElement("div");
    temp.style.position = "absolute";
    temp.style.left = "-9999px";
    temp.appendChild(clone);
    document.body.appendChild(temp);

    const opt = {
        margin: 0.5,
        filename: `Orcamento_${cliente}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: "cm", format: [24, 29.7], orientation: "portrait" }
    };

    html2pdf().set(opt).from(clone).save().then(() => {
        temp.remove();
    });
}
