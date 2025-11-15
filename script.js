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

function adicionarLinha(desc = '', qtd = '', unidade = 'ponto', valor = '') {
    const tbody = document.querySelector('#tabela-itens tbody');
    const tr = document.createElement('tr');

    const tdDesc = document.createElement('td');
    const inputDesc = document.createElement('input');
    inputDesc.type = 'text';
    inputDesc.placeholder = 'Ex: Instalação de 3 tomadas duplas 10A';
    inputDesc.value = desc;
    inputDesc.style.width = '100%';
    tdDesc.appendChild(inputDesc);

    const tdQtd = document.createElement('td');
    const inputQtd = document.createElement('input');
    inputQtd.type = 'number';
    inputQtd.min = '0';
    inputQtd.step = '0.01';
    inputQtd.value = qtd;
    inputQtd.oninput = () => calcularLinha.call(tr);
    tdQtd.appendChild(inputQtd);

    const tdUnidade = document.createElement('td');
    const selectUnidade = criarSelectUnidade();
    selectUnidade.value = unidade;
    tdUnidade.appendChild(selectUnidade);

    const tdValor = document.createElement('td');
    const inputValor = document.createElement('input');
    inputValor.type = 'number';
    inputValor.min = '0';
    inputValor.step = '0.01';
    inputValor.placeholder = '0,00';
    inputValor.value = valor;
    inputValor.oninput = () => calcularLinha.call(tr);
    tdValor.appendChild(inputValor);

    const tdSubtotal = document.createElement('td');
    tdSubtotal.className = 'subtotal';
    tdSubtotal.textContent = 'R$ 0,00';

    const tdRemove = document.createElement('td');
    const btnRemove = document.createElement('button');
    btnRemove.textContent = 'X';
    btnRemove.className = 'btn btn-remove';
    btnRemove.onclick = () => {
        tbody.removeChild(tr);
        calcularTotal();
        atualizarNumeroOrcamento();
    };
    tdRemove.appendChild(btnRemove);

    tr.appendChild(tdDesc);
    tr.appendChild(tdQtd);
    tr.appendChild(tdUnidade);
    tr.appendChild(tdValor);
    tr.appendChild(tdSubtotal);
    tr.appendChild(tdRemove);

    tbody.appendChild(tr);
    calcularLinha.call(tr);
    atualizarNumeroOrcamento();
}

function calcularLinha() {
    const cells = this.querySelectorAll('td');
    const qtd = parseFloat(cells[1].querySelector('input').value) || 0;
    const valor = parseFloat(cells[3].querySelector('input').value) || 0;
    const subtotal = qtd * valor;
    cells[4].textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    calcularTotal();
}

function calcularTotal() {
    let total = 0;
    document.querySelectorAll('.subtotal').forEach(sub => {
        const valor = sub.textContent.replace(/[^\d,.-]/g, '').replace(',', '.');
        total += parseFloat(valor) || 0;
    });

    const desconto = parseFloat(document.getElementById("valor-desconto")?.value) || 0;
    const valorDesconto = total * (desconto / 100);

    total -= valorDesconto;
    if (total < 0) total = 0;

    const totalEl = document.getElementById('total-geral');
    if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function adicionarDesconto() {
    if (document.getElementById("campo-desconto")) return;

    const container = document.getElementById("desconto-container");
    const div = document.createElement("div");
    div.id = "campo-desconto";
    div.style.marginTop = "10px";

    div.innerHTML = `
        <label><strong>Desconto (%):</strong></label>
        <input type="number" id="valor-desconto" placeholder="0" 
               min="0" max="100" step="0.01" oninput="calcularTotal()" />
        <button class="btn btn-remove" onclick="removerDesconto()">Remover</button>
    `;

    container.appendChild(div);
}

function removerDesconto() {
    document.getElementById("campo-desconto").remove();
    calcularTotal();
}

function atualizarNumeroOrcamento() {
    const ano = new Date().getFullYear().toString().slice(-2);
    const mes = String(new Date().getMonth() + 1).padStart(2, '0');
    const seq = String(document.querySelectorAll('#tabela-itens tbody tr').length).padStart(3, '0');
    document.getElementById('orcamento-num').value = `KAISER-${ano}${mes}-${seq}`;
}

window.onload = () => {
    adicionarLinha();
    document.getElementById('data').value = new Date().toISOString().split('T')[0];
    atualizarNumeroOrcamento();
};

//
//  VALIDAR ANTES DE GERAR PDF
//
function validarFormulario() {
    const cliente = document.getElementById("cliente").value.trim();
    const contato = document.getElementById("contato").value.trim();
    const endereco = document.getElementById("endereco").value.trim();
    const data = document.getElementById("data").value.trim();
    const linhas = document.querySelectorAll("#tabela-itens tbody tr");

    if (!cliente) { alert("⚠ Preencha o nome do cliente."); return false; }
    if (!contato) { alert("⚠ Preencha o contato do cliente."); return false; }
    if (!endereco) { alert("⚠ Preencha o endereço do serviço."); return false; }
    if (!data) { alert("⚠ Selecione a data."); return false; }

    if (linhas.length === 0) {
        alert("⚠ Adicione ao menos 1 serviço.");
        return false;
    }

    for (const tr of linhas) {
        const desc = tr.children[0].querySelector("input").value.trim();
        const qtd = parseFloat(tr.children[1].querySelector("input").value);
        const valor = parseFloat(tr.children[3].querySelector("input").value);

        if (!desc) { alert("⚠ Todas as linhas precisam de descrição."); return false; }
        if (!qtd || qtd <= 0) { alert("⚠ Quantidade deve ser maior que zero."); return false; }
        if (!valor || valor <= 0) { alert("⚠ Valor unitário deve ser maior que zero."); return false; }
    }

    return true;
}

//
//  GERAR PDF REAL
//
function gerarPDF() {
    if (!validarFormulario()) return; // 👈 PDF só gera se estiver TUDO OK

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

    window.scrollTo(0, 0);

    const clone = element.cloneNode(true);

    const removeButtons = clone.querySelectorAll(".btn-pdf, .btn-add, .btn-remove");
    removeButtons.forEach(btn => btn.remove());

    clone.style.marginTop = "0";
    clone.style.marginBottom = "0";
    clone.style.boxShadow = "none";

    const cliente = document.getElementById('cliente').value || 'Cliente não informado';
    const data = document.getElementById('data').value;
    const num = document.getElementById('orcamento-num').value;
    const validade = document.getElementById('validade').options[document.getElementById('validade').selectedIndex].text;

    const header = document.createElement("div");
    header.style = `
        text-align:center;
        padding: 0 0 10px 0;
        margin: 0;
        border-bottom:2px solid #003087;
        background:white;
    `;
    header.innerHTML = `
        <h2 style="margin:0; color:#003087;">ORÇAMENTO ELÉTRICA KAISER</h2>
        <p style="margin:4px 0;">
            <strong>Nº:</strong> ${num} |
            <strong>Cliente:</strong> ${cliente} |
            <strong>Data:</strong> ${new Date(data).toLocaleDateString('pt-BR')} |
            <strong>Validade:</strong> ${validade}
        </p>
    `;

    clone.prepend(header);

    // Desconto mostrado no PDF (% + R$)
    const desconto = parseFloat(document.getElementById("valor-desconto")?.value) || 0;

    if (desconto > 0) {
        let totalBruto = 0;

        clone.querySelectorAll('.subtotal').forEach(sub => {
            const valor = sub.textContent.replace(/[^\d,.-]/g, '').replace(',', '.');
            totalBruto += parseFloat(valor) || 0;
        });

        const valorDesconto = totalBruto * (desconto / 100);

        const descontoDiv = document.createElement("p");
        descontoDiv.style = "font-size:14px; margin: 10px 0 0 15px;";
        descontoDiv.innerHTML = `
            <strong>Desconto aplicado:</strong> ${desconto}% 
            &nbsp; | &nbsp; 
            <strong>Valor do desconto:</strong> R$ ${valorDesconto.toFixed(2).replace('.', ',')}
        `;
        clone.appendChild(descontoDiv);
    }

    const temp = document.createElement("div");
    temp.style.position = "absolute";
    temp.style.left = "-9999px";
    temp.appendChild(clone);
    document.body.appendChild(temp);

    const opt = {
        margin: 0.5,
        filename: `Orcamento_${num}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            scrollY: 0
        },
        jsPDF: {
            unit: "cm",
            format: [24, 29.7],
            orientation: "portrait"
        }
    };

    html2pdf().set(opt).from(clone).save().then(() => {
        temp.remove();
    });
}
