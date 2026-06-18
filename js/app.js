const DB_FILE = 'imobflow_db.json'

const dbDefault = {
  proprietarios: [],
  locatarios: [],
  imoveis: [],
  contratos: [],
  recibos: [],
  pagamentos: [],
  repasses: [],
  indicesReajuste: [],
  reajustesAplicados: [],
  iptuLancamentos: [],
  emissor: {
    nome: '',
    empresa: '',
    cpf: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    cidadeUf: '',
    logoDataUrl: ''
  }
}

let db = loadDb()

const editing = {
  proprietarioId: null,
  locatarioId: null,
  imovelId: null,
  contratoId: null,
  pagamentoId: null,
  repasseId: null
  ,indiceId: null
  ,iptuId: null
}

function cloneDefaultDb() {
  return JSON.parse(JSON.stringify(dbDefault))
}

function loadDb() {
  const loaded = window.store.readJSON(DB_FILE, null)
  const base = cloneDefaultDb()

  if (!loaded || typeof loaded !== 'object') {
    return base
  }

  const out = {
    ...base,
    ...loaded,
    proprietarios: Array.isArray(loaded.proprietarios) ? loaded.proprietarios : [],
    locatarios: Array.isArray(loaded.locatarios) ? loaded.locatarios : [],
    imoveis: Array.isArray(loaded.imoveis) ? loaded.imoveis : [],
    contratos: Array.isArray(loaded.contratos) ? loaded.contratos : [],
    recibos: Array.isArray(loaded.recibos) ? loaded.recibos : [],
    pagamentos: Array.isArray(loaded.pagamentos) ? loaded.pagamentos : [],
    repasses: Array.isArray(loaded.repasses) ? loaded.repasses : [],
    indicesReajuste: Array.isArray(loaded.indicesReajuste) ? loaded.indicesReajuste : [],
    reajustesAplicados: Array.isArray(loaded.reajustesAplicados) ? loaded.reajustesAplicados : [],
    iptuLancamentos: Array.isArray(loaded.iptuLancamentos) ? loaded.iptuLancamentos : [],
    emissor: {
      ...base.emissor,
      ...(loaded.emissor && typeof loaded.emissor === 'object' ? loaded.emissor : {})
    }
  }

  return out
}

function saveDb() {
  const ok = window.store.writeJSON(DB_FILE, db)
  if (!ok) toast('Erro ao salvar dados locais.', 'danger')
  return ok
}

function byId(list, id) {
  return list.find((x) => String(x.id) === String(id))
}

function showPage(page) {
  const section = document.getElementById(`page-${page}`)
  const nav = document.querySelector(`[data-page="${page}"]`)
  if (!section || !nav) return

  document.querySelectorAll('.page').forEach((el) => el.classList.remove('active'))
  document.querySelectorAll('.nav-btn').forEach((el) => el.classList.remove('active'))
  section.classList.add('active')
  nav.classList.add('active')
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function fmtDateBR(iso) {
  if (!iso) return 'N/A'
  const parts = String(iso).split('-')
  if (parts.length !== 3) return 'N/A'
  const [y, m, d] = parts
  return `${d}/${m}/${y}`
}

function fmtCompetencia(monthYear) {
  const parsed = window.store.parseMonthYear(monthYear)
  if (!parsed) return 'N/A'
  const date = new Date(parsed.year, parsed.month - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function currentMonth() {
  return window.store.todayISO().slice(0, 7)
}

function getContratoBundle(contratoId) {
  const contrato = byId(db.contratos, contratoId)
  const imovel = contrato ? byId(db.imoveis, contrato.imovelId) : null
  const locatario = contrato ? byId(db.locatarios, contrato.locatarioId) : null
  const proprietario = imovel ? byId(db.proprietarios, imovel.proprietarioId) : null
  return { contrato, imovel, locatario, proprietario }
}

function contratoOptionLabel(c) {
  const { imovel, locatario } = getContratoBundle(c.id)
  return `${imovel?.codigo || 'Contrato'} - ${imovel?.descricao || 'Imóvel'} | ${locatario?.nome || 'Locatário'}`
}

function findPagamento(contratoId, competencia) {
  return db.pagamentos.find((p) => String(p.contratoId) === String(contratoId) && p.competencia === competencia)
}

function findRepasse(contratoId, competencia) {
  return db.repasses.find((r) => String(r.contratoId) === String(contratoId) && r.competencia === competencia)
}

function normal(v) {
  return String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function toast(msg, type = 'info') {
  const host = document.getElementById('toastHost')
  if (!host) {
    console.log('[toast]', msg)
    return
  }
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.textContent = String(msg || '')
  host.appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  setTimeout(() => {
    el.classList.remove('show')
    setTimeout(() => el.remove(), 220)
  }, 3200)
}

function askConfirm(message) {
  const host = document.getElementById('confirmHost')
  const msgEl = document.getElementById('confirmMessage')
  const btnOk = document.getElementById('confirmOk')
  const btnCancel = document.getElementById('confirmCancel')

  if (!host || !msgEl || !btnOk || !btnCancel) {
    return Promise.resolve(window.confirm(message))
  }

  msgEl.textContent = String(message || 'Confirmar ação?')
  host.classList.remove('hidden')

  return new Promise((resolve) => {
    let done = false
    const cleanup = (result) => {
      if (done) return
      done = true
      host.classList.add('hidden')
      btnOk.removeEventListener('click', onOk)
      btnCancel.removeEventListener('click', onCancel)
      host.removeEventListener('click', onBackdrop)
      document.removeEventListener('keydown', onEsc)
      resolve(result)
    }

    const onOk = () => cleanup(true)
    const onCancel = () => cleanup(false)
    const onBackdrop = (e) => {
      if (e.target === host) cleanup(false)
    }
    const onEsc = (e) => {
      if (e.key === 'Escape') cleanup(false)
    }

    btnOk.addEventListener('click', onOk)
    btnCancel.addEventListener('click', onCancel)
    host.addEventListener('click', onBackdrop)
    document.addEventListener('keydown', onEsc)
  })
}

function clearInputs(ids) {
  ids.forEach((id) => {
    const el = document.getElementById(id)
    if (!el) return
    if (el.tagName === 'SELECT') el.selectedIndex = 0
    else el.value = ''
  })
}

function nextImovelCode() {
  const n = db.imoveis.length + 1
  return `IMO-${String(n).padStart(3, '0')}`
}

function renderSelects() {
  const propSel = document.getElementById('imoProprietario')
  propSel.innerHTML = db.proprietarios.length
    ? db.proprietarios.map((p) => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join('')
    : '<option value="">Cadastre proprietário primeiro</option>'

  const locatarioOptions = db.locatarios.length
    ? '<option value="">Sem locatário vinculado</option>' + db.locatarios.map((l) => `<option value="${l.id}">${escapeHtml(l.nome)}</option>`).join('')
    : '<option value="">Cadastre locatário primeiro</option>'
  const imoLocatario = document.getElementById('imoLocatario')
  if (imoLocatario) imoLocatario.innerHTML = locatarioOptions

  document.getElementById('conImovel').innerHTML = db.imoveis.length
    ? db.imoveis.map((i) => `<option value="${i.id}">${escapeHtml(i.codigo)} - ${escapeHtml(i.descricao)}</option>`).join('')
    : '<option value="">Cadastre imóvel primeiro</option>'

  document.getElementById('conLocatario').innerHTML = db.locatarios.length
    ? db.locatarios.map((l) => `<option value="${l.id}">${escapeHtml(l.nome)}</option>`).join('')
    : '<option value="">Cadastre locatário primeiro</option>'

  document.getElementById('recContrato').innerHTML = db.contratos.length
    ? db.contratos.map((c) => {
        const i = byId(db.imoveis, c.imovelId)
        const l = byId(db.locatarios, c.locatarioId)
        return `<option value="${c.id}">${escapeHtml(i?.descricao || 'Imóvel')} - ${escapeHtml(l?.nome || 'Locatário')}</option>`
      }).join('')
    : '<option value="">Cadastre contrato primeiro</option>'

  const contratoOptions = db.contratos.length
    ? db.contratos.map((c) => `<option value="${c.id}">${escapeHtml(contratoOptionLabel(c))}</option>`).join('')
    : '<option value="">Cadastre contrato primeiro</option>'

  ;['finContrato', 'repContrato', 'extContrato', 'bolContrato'].forEach((id) => {
    const el = document.getElementById(id)
    if (el) el.innerHTML = contratoOptions
  })

  const iptuImovel = document.getElementById('iptuImovel')
  if (iptuImovel) iptuImovel.innerHTML = db.imoveis.length
    ? db.imoveis.map((i) => `<option value="${i.id}">${escapeHtml(i.codigo)} - ${escapeHtml(i.descricao)}</option>`).join('')
    : '<option value="">Cadastre imóvel primeiro</option>'

  document.getElementById('imoCodigo').placeholder = `Código automático: ${nextImovelCode()}`
}

function renderProprietarios() {
  const q = normal(document.getElementById('buscaProp').value)
  const list = q
    ? db.proprietarios.filter((x) => normal(`${x.nome} ${x.doc} ${x.rg} ${x.telefone} ${x.email} ${x.endereco} ${x.pix}`).includes(q))
    : db.proprietarios

  const tb = document.getElementById('tbProp')
  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="5" class="empty">Nenhum proprietário cadastrado.</td></tr>'
    return
  }

  tb.innerHTML = list
    .map((x) => `
      <tr>
        <td>${escapeHtml(x.nome)}</td>
        <td>${escapeHtml(x.doc || 'N/A')}<br><small>RG: ${escapeHtml(x.rg || 'N/A')}</small></td><td>${escapeHtml(x.telefone || 'N/A')}<br><small>${escapeHtml(x.email || 'N/A')}</small></td><td>${escapeHtml(x.endereco || 'N/A')}</td><td>${escapeHtml(x.banco || 'N/A')} | ${escapeHtml(x.agencia || '-')} | ${escapeHtml(x.conta || '-')}<br><small>PIX: ${escapeHtml(x.pix || 'N/A')}</small></td>
        <td>
          <button class="btn" onclick="editProprietario('${x.id}')">Editar</button>
          <button class="btn" onclick="delProprietario('${x.id}')">Excluir</button>
        </td>
      </tr>`)
    .join('')
}

function renderLocatarios() {
  const q = normal(document.getElementById('buscaLoc').value)
  const list = q
    ? db.locatarios.filter((x) => normal(`${x.nome} ${x.doc} ${x.rg} ${x.telefone} ${x.email} ${x.endereco}`).includes(q))
    : db.locatarios

  const tb = document.getElementById('tbLoc')
  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="5" class="empty">Nenhum locatário cadastrado.</td></tr>'
    return
  }

  tb.innerHTML = list
    .map((x) => `
      <tr>
        <td>${escapeHtml(x.nome)}</td>
        <td>${escapeHtml(x.doc || 'N/A')}<br><small>RG: ${escapeHtml(x.rg || 'N/A')}</small></td><td>${escapeHtml(x.telefone || 'N/A')}<br><small>${escapeHtml(x.email || 'N/A')}</small></td><td>${escapeHtml(x.endereco || 'N/A')}</td>
        <td>
          <button class="btn" onclick="editLocatario('${x.id}')">Editar</button>
          <button class="btn" onclick="delLocatario('${x.id}')">Excluir</button>
        </td>
      </tr>`)
    .join('')
}

function renderImoveis() {
  const q = normal(document.getElementById('buscaImovel').value)
  const list = q
    ? db.imoveis.filter((i) => {
        const dono = byId(db.proprietarios, i.proprietarioId)
        const inquilino = byId(db.locatarios, i.locatarioId)
        return normal(`${i.codigo} ${i.descricao} ${i.endereco} ${dono?.nome || ''} ${inquilino?.nome || ''}`).includes(q)
      })
    : db.imoveis

  const tb = document.getElementById('tbImovel')
  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="6" class="empty">Nenhum imóvel cadastrado.</td></tr>'
    return
  }

  tb.innerHTML = list
    .map((i) => {
      const dono = byId(db.proprietarios, i.proprietarioId)
      const inquilino = byId(db.locatarios, i.locatarioId)
      const contrato = db.contratos.find((c) => String(c.imovelId) === String(i.id) && contratoAtivo(c))
      return `
      <tr>
        <td><strong>${escapeHtml(i.codigo)}</strong><br>${escapeHtml(i.descricao)}<br><small>${escapeHtml(i.endereco || '')}</small></td><td>${escapeHtml(dono?.nome || 'N/A')}</td><td>${escapeHtml(inquilino?.nome || byId(db.locatarios, contrato?.locatarioId)?.nome || 'Sem locatário')}</td><td>${contrato ? window.store.fmtMoney(valorTotalContrato(contrato)) : 'Sem contrato'}<br><small>${escapeHtml(i.tipo)}</small></td>
        <td>${i.alugado === 'SIM' ? '<span class="tag-ok">Alugado</span>' : '<span class="tag-no">Livre</span>'}</td>
        <td>
          <button class="btn" onclick="editImovel('${i.id}')">Editar</button>
          <button class="btn" onclick="delImovel('${i.id}')">Excluir</button>
        </td>
      </tr>`
    })
    .join('')
}

function contratoAtivo(c) {
  return c.fim && window.store.daysBetween(window.store.todayISO(), c.fim) >= 0
}

function valorTotalContrato(c) {
  return (
    window.store.toNumber(c.valorAluguel) +
    window.store.toNumber(c.iptu) +
    window.store.toNumber(c.condominio) +
    window.store.toNumber(c.seguro) +
    window.store.toNumber(c.outros) +
    window.store.toNumber(c.taxaAdm)
  )
}

function renderContratos() {
  const q = normal(document.getElementById('buscaContrato').value)
  const list = q
    ? db.contratos.filter((c) => {
        const i = byId(db.imoveis, c.imovelId)
        const l = byId(db.locatarios, c.locatarioId)
        return normal(`${i?.descricao || ''} ${l?.nome || ''}`).includes(q)
      })
    : db.contratos

  const tb = document.getElementById('tbContrato')
  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="7" class="empty">Nenhum contrato cadastrado.</td></tr>'
    return
  }

  tb.innerHTML = list
    .map((c) => {
      const i = byId(db.imoveis, c.imovelId)
      const l = byId(db.locatarios, c.locatarioId)
      const ativo = contratoAtivo(c)
      const total = valorTotalContrato(c)

      return `
      <tr>
        <td>${escapeHtml(i?.descricao || 'N/A')}</td>
        <td>${escapeHtml(l?.nome || 'N/A')}</td>
        <td>${fmtDateBR(c.inicio)} até ${fmtDateBR(c.fim)}</td>
        <td>Dia ${escapeHtml(c.vencimentoDia || '-')}</td>
        <td>${window.store.fmtMoney(total)}</td>
        <td>${ativo ? '<span class="tag-ok">Ativo</span>' : '<span class="tag-no">Encerrado</span>'}</td>
        <td>
          <button class="btn" onclick="editContrato('${c.id}')">Editar</button>
          <button class="btn" onclick="delContrato('${c.id}')">Excluir</button>
        </td>
      </tr>`
    })
    .join('')
}

function renderRecibos() {
  const tb = document.getElementById('tbRecibos')
  if (!db.recibos.length) {
    tb.innerHTML = '<tr><td colspan="6" class="empty">Nenhum recibo salvo.</td></tr>'
    return
  }

  tb.innerHTML = db.recibos
    .slice()
    .reverse()
    .map((r) => {
      const c = byId(db.contratos, r.contratoId)
      const i = c ? byId(db.imoveis, c.imovelId) : null
      const l = c ? byId(db.locatarios, c.locatarioId) : null
      const dt = String(r.criadoEm || '').slice(0, 10)
      return `
      <tr>
        <td>${fmtDateBR(dt)}</td>
        <td>${escapeHtml(i?.descricao || 'N/A')}</td>
        <td>${escapeHtml(l?.nome || 'N/A')}</td>
        <td>${escapeHtml(r.competencia || 'N/A')}</td>
        <td>${window.store.fmtMoney(r.valor)}</td>
        <td>${r.pago === 'SIM' ? '<span class="tag-ok">Pago</span>' : '<span class="tag-no">Não</span>'}</td>
      </tr>`
    })
    .join('')
}

function renderPagamentos() {
  const tb = document.getElementById('tbPagamentos')
  if (!tb) return
  if (!db.pagamentos.length) {
    tb.innerHTML = '<tr><td colspan="6" class="empty">Nenhuma baixa registrada.</td></tr>'
    return
  }

  tb.innerHTML = db.pagamentos
    .slice()
    .reverse()
    .map((p) => {
      const { locatario } = getContratoBundle(p.contratoId)
      return `
      <tr>
        <td>${fmtDateBR(p.dataPagamento)}</td>
        <td>${escapeHtml(fmtCompetencia(p.competencia))}</td>
        <td>${escapeHtml(locatario?.nome || 'N/A')}</td>
        <td>${window.store.fmtMoney(p.valor)}</td>
        <td>${p.status === 'PAGO' ? '<span class="tag-ok">Pago</span>' : '<span class="tag-no">' + escapeHtml(p.status || 'Pendente') + '</span>'}</td>
        <td>
          <button class="btn" onclick="editPagamento('${p.id}')">Editar</button>
          <button class="btn" onclick="delPagamento('${p.id}')">Excluir</button>
        </td>
      </tr>`
    })
    .join('')
}

function renderRepasses() {
  const tb = document.getElementById('tbRepasses')
  if (!tb) return
  if (!db.repasses.length) {
    tb.innerHTML = '<tr><td colspan="5" class="empty">Nenhum repasse registrado.</td></tr>'
    return
  }

  tb.innerHTML = db.repasses
    .slice()
    .reverse()
    .map((r) => {
      const { proprietario } = getContratoBundle(r.contratoId)
      return `
      <tr>
        <td>${fmtDateBR(r.dataRepasse)}</td>
        <td>${escapeHtml(fmtCompetencia(r.competencia))}</td>
        <td>${escapeHtml(proprietario?.nome || 'N/A')}</td>
        <td>${window.store.fmtMoney(r.valorLiquido)}</td>
        <td>
          <button class="btn" onclick="editRepasse('${r.id}')">Editar</button>
          <button class="btn" onclick="delRepasse('${r.id}')">Excluir</button>
        </td>
      </tr>`
    })
    .join('')
}

function getStatementBrandLogo() {
  const e = db.emissor || {}
  return e.logoDataUrl || './assets/logo.png'
}

function buildStatementHtml(contratoId, competencia) {
  const { contrato, imovel, locatario, proprietario } = getContratoBundle(contratoId)
  if (!contrato) return ''

  const e = db.emissor || {}
  const pagamento = findPagamento(contratoId, competencia)
  const repasse = findRepasse(contratoId, competencia)
  const totalContrato = valorTotalContrato(contrato)
  const valorRecebido = pagamento ? Number(pagamento.valor || 0) : 0
  const taxaAdm = repasse ? Number(repasse.taxaAdm || 0) : Number(contrato.taxaAdm || 0)
  const despesasRepasse = repasse ? Number(repasse.despesas || 0) : 0
  const valorLiquido = repasse ? Number(repasse.valorLiquido || 0) : Math.max(totalContrato - taxaAdm - despesasRepasse, 0)
  const status = pagamento?.status || 'PENDENTE'
  const empresa = e.empresa || 'ImobCore'

  const itens = [
    ['Aluguel mensal', contrato.valorAluguel],
    ['IPTU', contrato.iptu],
    ['Condomínio', contrato.condominio],
    ['Seguro', contrato.seguro],
    ['Outros custos', contrato.outros]
  ].filter(([, valor]) => window.store.toNumber(valor) > 0)

  const itemRows = itens.map(([label, valor]) => `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>${escapeHtml(fmtCompetencia(competencia))}</td>
      <td>${window.store.fmtMoney(valor)}</td>
    </tr>`).join('')

  return `
    <article class="statement-page">
      <header class="statement-head">
        <div class="statement-brand">
          <img class="statement-logo" src="${escapeHtml(getStatementBrandLogo())}" alt="${escapeHtml(empresa)}" />
          <div>
            <div class="statement-title">${escapeHtml(empresa)}</div>
            <div class="statement-subtitle">Extrato demonstrativo de pagamento</div>
          </div>
        </div>
        <div class="statement-meta">
          <strong>${escapeHtml(fmtCompetencia(competencia))}</strong><br>
          Emitido em ${fmtDateBR(window.store.todayISO())}<br>
          Contrato: ${escapeHtml(contrato.id)}
        </div>
      </header>
      <div class="statement-body">
        <div class="statement-row">
          <div class="statement-box">
            <span class="statement-label">Locatário</span>
            <span class="statement-value">${escapeHtml(locatario?.nome || 'N/A')}</span>
          </div>
          <div class="statement-box">
            <span class="statement-label">Proprietário</span>
            <span class="statement-value">${escapeHtml(proprietario?.nome || 'N/A')}</span>
          </div>
          <div class="statement-box">
            <span class="statement-label">Status</span>
            <span class="statement-value">${escapeHtml(status)}</span>
          </div>
        </div>
        <div class="statement-box">
          <span class="statement-label">Imóvel</span>
          <span class="statement-value">${escapeHtml(imovel?.descricao || 'N/A')}</span>
          <div>${escapeHtml(imovel?.endereco || '')}${imovel?.cep ? ' | CEP: ' + escapeHtml(imovel.cep) : ''}</div>
        </div>

        <section class="statement-section">
          <h3>Composição da cobrança</h3>
          <table class="statement-table">
            <thead><tr><th>Descrição</th><th>Referência</th><th>Valor</th></tr></thead>
            <tbody>${itemRows || '<tr><td colspan="3">Nenhum item financeiro informado.</td></tr>'}</tbody>
          </table>
        </section>

        <section class="statement-section">
          <h3>Pagamento e repasse</h3>
          <table class="statement-table">
            <tbody>
              <tr><td>Valor previsto do contrato</td><td>${window.store.fmtMoney(totalContrato)}</td></tr>
              <tr><td>Valor recebido do locatário</td><td>${window.store.fmtMoney(valorRecebido)}</td></tr>
              <tr><td>Taxa administrativa</td><td>${window.store.fmtMoney(taxaAdm)}</td></tr>
              <tr><td>Despesas/descontos do repasse</td><td>${window.store.fmtMoney(despesasRepasse)}</td></tr>
            </tbody>
          </table>
        </section>

        <div class="statement-total">
          <span>Valor líquido a repassar ao proprietário</span>
          <strong>${window.store.fmtMoney(valorLiquido)}</strong>
        </div>

        <div class="statement-note">
          ${escapeHtml(repasse?.obs || pagamento?.obs || contrato.obs || 'Documento gerado para controle administrativo local. Não substitui boleto bancário registrado.')}
        </div>

        <div class="statement-signatures">
          <div class="statement-signature">${escapeHtml(locatario?.nome || 'Locatário')}</div>
          <div class="statement-signature">${escapeHtml(empresa)}</div>
        </div>
      </div>
    </article>`
}

function renderExtratoPreview() {
  const host = document.getElementById('prevExtrato')
  if (!host) return
  const contratoId = document.getElementById('extContrato')?.value
  const competencia = document.getElementById('extCompetencia')?.value
  if (!contratoId || !competencia) {
    host.textContent = 'Selecione um contrato e uma competência para gerar o extrato demonstrativo.'
    return
  }
  host.innerHTML = buildStatementHtml(contratoId, competencia)
}

function printStatement() {
  const contratoId = document.getElementById('extContrato')?.value
  const competencia = document.getElementById('extCompetencia')?.value
  const html = buildStatementHtml(contratoId, competencia)
  if (!html) return toast('Gere o extrato antes de imprimir.', 'warn')

  let host = document.getElementById('printStatementHost')
  if (!host) {
    host = document.createElement('div')
    host.id = 'printStatementHost'
    host.style.display = 'none'
    document.body.appendChild(host)
  }
  host.innerHTML = html
  document.body.classList.add('printing-statement')
  setTimeout(() => {
    window.print()
    document.body.classList.remove('printing-statement')
  }, 150)
}

function renderDashboard() {
  const alugados = db.imoveis.filter((x) => x.alugado === 'SIM').length
  const ativos = db.contratos.filter(contratoAtivo)
  const valor = ativos.reduce((s, c) => s + valorTotalContrato(c), 0)

  document.getElementById('kpiImoveis').textContent = db.imoveis.length
  document.getElementById('kpiAlugados').textContent = alugados
  document.getElementById('kpiContratos').textContent = ativos.length
  document.getElementById('kpiValor').textContent = window.store.fmtMoney(valor)

  const alertas = ativos
    .map((c) => ({ c, dias: window.store.daysBetween(window.store.todayISO(), c.fim) }))
    .filter((x) => x.dias <= 60)
    .sort((a, b) => a.dias - b.dias)

  const tb = document.getElementById('tbAlertas')
  if (!alertas.length) {
    tb.innerHTML = '<tr><td colspan="5" class="empty">Nenhum vencimento próximo.</td></tr>'
    return
  }

  tb.innerHTML = alertas
    .map(({ c, dias }) => {
      const i = byId(db.imoveis, c.imovelId)
      const l = byId(db.locatarios, c.locatarioId)
      return `
      <tr>
        <td>${escapeHtml(i?.descricao || 'N/A')}</td>
        <td>${escapeHtml(l?.nome || 'N/A')}</td>
        <td>${fmtDateBR(c.fim)}</td>
        <td>${dias}</td>
        <td>${window.store.fmtMoney(valorTotalContrato(c))}</td>
      </tr>`
    })
    .join('')
}

function renderEmissor() {
  const e = db.emissor || {}
  document.getElementById('emNome').value = e.nome || ''
  document.getElementById('emEmpresa').value = e.empresa || ''
  document.getElementById('emCpf').value = e.cpf || ''
  document.getElementById('emCnpj').value = e.cnpj || ''
  document.getElementById('emTelefone').value = e.telefone || ''
  document.getElementById('emEmail').value = e.email || ''
  document.getElementById('emEndereco').value = e.endereco || ''
  document.getElementById('emCidadeUf').value = e.cidadeUf || ''

  const resumo = document.getElementById('emissorResumo')
  const lines = [
    e.empresa ? `Empresa: ${escapeHtml(e.empresa)}` : '',
    e.nome ? `Responsável: ${escapeHtml(e.nome)}` : '',
    e.cnpj ? `CNPJ: ${escapeHtml(e.cnpj)}` : '',
    e.cpf ? `CPF: ${escapeHtml(e.cpf)}` : '',
    e.telefone ? `Telefone: ${escapeHtml(e.telefone)}` : '',
    e.email ? `E-mail: ${escapeHtml(e.email)}` : '',
    e.endereco ? `Endereço: ${escapeHtml(e.endereco)}` : '',
    e.cidadeUf ? `Cidade/UF: ${escapeHtml(e.cidadeUf)}` : '',
    e.logoDataUrl ? 'Logo personalizada: cadastrada' : ''
  ].filter(Boolean)

  resumo.innerHTML = lines.length ? lines.join('<br>') : 'Nenhum dado salvo.'
}

function buildReciboText(c, competencia, pago, valor) {
  const i = byId(db.imoveis, c.imovelId)
  const l = byId(db.locatarios, c.locatarioId)
  const p = i ? byId(db.proprietarios, i.proprietarioId) : null
  const e = db.emissor || {}
  const hoje = fmtDateBR(window.store.todayISO())

  return [
    'RECIBO DE ALUGUEL',
    '',
    `Data de emissão: ${hoje}`,
    `Competência: ${competencia}`,
    `Tipo de recibo: ${c.tipoRecibo || 'RESIDENCIAL'}`,
    '',
    'DADOS DO EMISSOR',
    `Empresa/Imobiliária: ${e.empresa || 'N/A'}`,
    `Responsável: ${e.nome || 'N/A'}`,
    `CPF: ${e.cpf || 'N/A'} | CNPJ: ${e.cnpj || 'N/A'}`,
    `Telefone: ${e.telefone || 'N/A'} | E-mail: ${e.email || 'N/A'}`,
    `Endereço: ${e.endereco || 'N/A'} ${e.cidadeUf ? '- ' + e.cidadeUf : ''}`,
    '',
    'DADOS DO LOCATÁRIO',
    `Recebemos de: ${l?.nome || 'N/A'}`,
    `Documento: ${l?.doc || 'N/A'}`,
    '',
    'DADOS DO IMÓVEL',
    `Imóvel: ${i?.descricao || 'N/A'}`,
    `Endereço: ${i?.endereco || 'N/A'}`,
    `Proprietário: ${p?.nome || 'N/A'}`,
    '',
    'DISCRIMINAÇÃO',
    `- Aluguel: ${window.store.fmtMoney(c.valorAluguel)}`,
    `- IPTU: ${window.store.fmtMoney(c.iptu)}`,
    `- Condomínio: ${window.store.fmtMoney(c.condominio)}`,
    `- Seguro: ${window.store.fmtMoney(c.seguro)}`,
    `- Outros: ${window.store.fmtMoney(c.outros)}`,
    `- Taxa adm.: ${window.store.fmtMoney(c.taxaAdm)}`,
    '',
    `VALOR TOTAL: ${window.store.fmtMoney(valor)}`,
    `Situação: ${pago === 'SIM' ? 'ALUGUEL PAGO' : 'ALUGUEL NÃO PAGO'}`,
    '',
    'Observações:',
    c.obs || '-',
    '',
    'Assinatura do responsável: __________________________'
  ].join('\n')
}

function printText(title, text) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;padding:24px;white-space:pre-wrap;line-height:1.45}h1{margin-top:0}</style></head><body><h1>${escapeHtml(title)}</h1><div>${escapeHtml(text)}</div><script>setTimeout(()=>window.print(),200)</script></body></html>`
  const w = window.open('', '_blank', 'width=900,height=760')
  if (!w) return
  w.document.open()
  w.document.write(html)
  w.document.close()
}

function buildRelatorioRows() {
  const filtroTipo = document.getElementById('filtroTipo').value
  const filtroStatus = document.getElementById('filtroStatus').value
  const filtroMesAno = document.getElementById('filtroMesAno').value
  const filtroPago = document.getElementById('filtroPago').value

  const rows = db.contratos.map((c) => {
    const i = byId(db.imoveis, c.imovelId)
    const l = byId(db.locatarios, c.locatarioId)
    const p = i ? byId(db.proprietarios, i.proprietarioId) : null
    const rec = filtroMesAno ? db.recibos.find((r) => r.contratoId === c.id && r.competencia === filtroMesAno) : null
    const pag = filtroMesAno ? findPagamento(c.id, filtroMesAno) : null
    const competencia = filtroMesAno || c.inicio?.slice(0, 7) || ''
    const [ano, mes] = competencia.split('-')

    return {
      codigo: i?.codigo || 'N/A',
      imovel: i?.descricao || 'N/A',
      locado: i?.alugado || 'NAO',
      proprietario: p?.nome || 'N/A',
      locatario: l?.nome || 'N/A',
      tipo: i?.tipo || 'N/A',
      valor: pag ? Number(pag.valor) : (rec ? Number(rec.valor) : valorTotalContrato(c)),
      mes: mes || '',
      ano: ano || '',
      pago: pag ? (pag.status === 'PAGO' ? 'SIM' : 'NAO') : (rec ? rec.pago : 'NAO')
    }
  })

  return rows.filter((r) => {
    if (filtroTipo && r.tipo !== filtroTipo) return false
    if (filtroStatus && r.locado !== filtroStatus) return false
    if (filtroPago && r.pago !== filtroPago) return false
    return true
  })
}

function renderRelatorios() {
  const rows = buildRelatorioRows()
  const tb = document.getElementById('tbRel')
  const total = rows.reduce((s, r) => s + Number(r.valor || 0), 0)

  document.getElementById('resumoRel').textContent = `Total de registros: ${rows.length} | Total: ${window.store.fmtMoney(total)}`

  if (!rows.length) {
    tb.innerHTML = '<tr><td colspan="10" class="empty">Nenhum registro para os filtros.</td></tr>'
    return
  }

  tb.innerHTML = rows
    .map((r) => `
      <tr>
        <td>${escapeHtml(r.codigo)}</td>
        <td>${escapeHtml(r.imovel)}</td>
        <td>${r.locado === 'SIM' ? '<span class="tag-ok">SIM</span>' : '<span class="tag-no">NÃO</span>'}</td>
        <td>${escapeHtml(r.proprietario)}</td>
        <td>${escapeHtml(r.locatario)}</td>
        <td>${escapeHtml(r.tipo)}</td>
        <td>${window.store.fmtMoney(r.valor)}</td>
        <td>${escapeHtml(r.mes)}</td>
        <td>${escapeHtml(r.ano)}</td>
        <td>${r.pago === 'SIM' ? '<span class="tag-ok">SIM</span>' : '<span class="tag-no">NÃO</span>'}</td>
      </tr>`)
    .join('')
}

function fillFinanceDefaults() {
  const contratoId = document.getElementById('finContrato')?.value
  const c = byId(db.contratos, contratoId)
  if (!c) return
  const total = valorTotalContrato(c)
  const finValor = document.getElementById('finValor')
  if (finValor && !finValor.value) finValor.value = window.store.fmtMoney(total)
}

function fillRepasseDefaults() {
  const contratoId = document.getElementById('repContrato')?.value
  const c = byId(db.contratos, contratoId)
  if (!c) return
  const bruto = valorTotalContrato(c)
  const taxaAdm = window.store.toNumber(c.taxaAdm)
  const liquido = Math.max(bruto - taxaAdm, 0)

  const brutoEl = document.getElementById('repValorBruto')
  const taxaEl = document.getElementById('repTaxaAdm')
  const despesasEl = document.getElementById('repDespesas')
  const liquidoEl = document.getElementById('repValorLiquido')

  if (brutoEl && !brutoEl.value) brutoEl.value = window.store.fmtMoney(bruto)
  if (taxaEl && !taxaEl.value) taxaEl.value = window.store.fmtMoney(taxaAdm)
  if (despesasEl && !despesasEl.value) despesasEl.value = window.store.fmtMoney(0)
  if (liquidoEl && !liquidoEl.value) liquidoEl.value = window.store.fmtMoney(liquido)
}

function recalculateRepasseLiquido() {
  const bruto = window.store.toNumber(document.getElementById('repValorBruto')?.value)
  const taxa = window.store.toNumber(document.getElementById('repTaxaAdm')?.value)
  const despesas = window.store.toNumber(document.getElementById('repDespesas')?.value)
  const liquidoEl = document.getElementById('repValorLiquido')
  if (liquidoEl) liquidoEl.value = window.store.fmtMoney(Math.max(bruto - taxa - despesas, 0))
}

function readLogoFile(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(db.emissor?.logoDataUrl || '')
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => resolve(db.emissor?.logoDataUrl || '')
    reader.readAsDataURL(file)
  })
}

function competenciaFromDate(iso) {
  return String(iso || window.store.todayISO()).slice(0, 7)
}

function dueDateForContract(c, competencia) {
  const parsed = window.store.parseMonthYear(competencia)
  if (!parsed) return ''
  const lastDay = new Date(parsed.year, parsed.month, 0).getDate()
  const day = Math.min(lastDay, Math.max(1, Number(c.vencimentoDia || 5)))
  return `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function renderPendencias() {
  const tb = document.getElementById('tbPendencias')
  if (!tb) return
  const dataRef = document.getElementById('pendDataRef')?.value || window.store.todayISO()
  const competencia = competenciaFromDate(dataRef)
  const filtro = document.getElementById('pendSituacao')?.value || ''
  const rows = db.contratos.filter(contratoAtivo).map((c) => {
    const pagamento = findPagamento(c.id, competencia)
    if (pagamento?.status === 'PAGO') return null
    const vencimento = dueDateForContract(c, competencia)
    const situacao = vencimento < dataRef ? 'VENCIDO' : 'AVENCER'
    const { imovel, locatario } = getContratoBundle(c.id)
    return { c, imovel, locatario, vencimento, situacao, valor: valorTotalContrato(c), competencia }
  }).filter(Boolean).filter((r) => !filtro || r.situacao === filtro).sort((a,b) => a.vencimento.localeCompare(b.vencimento))
  tb.innerHTML = rows.length ? rows.map((r) => `<tr><td>${fmtDateBR(r.vencimento)}</td><td>${escapeHtml(r.imovel?.descricao || 'N/A')}</td><td>${escapeHtml(r.locatario?.nome || 'N/A')}</td><td>${escapeHtml(fmtCompetencia(r.competencia))}</td><td>${window.store.fmtMoney(r.valor)}</td><td>${r.situacao === 'VENCIDO' ? '<span class="tag-no">Vencido</span>' : '<span class="tag-ok">A vencer</span>'}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">Nenhuma pendência para os filtros.</td></tr>'
}

function renderIndices() {
  const tb = document.getElementById('tbIndices')
  if (!tb) return
  tb.innerHTML = db.indicesReajuste.length ? db.indicesReajuste.slice().sort((a,b) => b.competencia.localeCompare(a.competencia)).map((x) => `<tr><td>${escapeHtml(x.tipo)}</td><td>${escapeHtml(fmtCompetencia(x.competencia))}</td><td>${Number(x.percentual || 0).toLocaleString('pt-BR')}%</td><td><button class="btn" onclick="editIndice('${x.id}')">Editar</button> <button class="btn" onclick="delIndice('${x.id}')">Excluir</button></td></tr>`).join('') : '<tr><td colspan="4" class="empty">Nenhum índice cadastrado.</td></tr>'
}

function renderIptu() {
  const tb = document.getElementById('tbIptu')
  if (!tb) return
  tb.innerHTML = db.iptuLancamentos.length ? db.iptuLancamentos.slice().sort((a,b) => String(a.vencimento).localeCompare(String(b.vencimento))).map((x) => {
    const imovel = byId(db.imoveis, x.imovelId)
    return `<tr><td>${escapeHtml(imovel?.descricao || 'N/A')}</td><td>${escapeHtml(x.contribuinte || 'N/A')}</td><td>${escapeHtml(fmtCompetencia(x.competencia))}</td><td>${fmtDateBR(x.vencimento)}</td><td>${window.store.fmtMoney(x.valor)}</td><td>${x.status === 'PAGO' ? '<span class="tag-ok">Pago</span>' : '<span class="tag-no">Pendente</span>'}</td><td><button class="btn" onclick="editIptu('${x.id}')">Editar</button> <button class="btn" onclick="delIptu('${x.id}')">Excluir</button></td></tr>`
  }).join('') : '<tr><td colspan="7" class="empty">Nenhum lançamento de IPTU.</td></tr>'
}

function addYear(iso) {
  const date = new Date(String(iso) + 'T00:00:00')
  if (Number.isNaN(date.getTime())) return ''
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().slice(0, 10)
}

function applyPendingAdjustments(referenceDate = window.store.todayISO()) {
  let count = 0
  db.contratos.forEach((c) => {
    if (!c.indiceReajuste || !c.proximoReajuste || c.proximoReajuste > referenceDate) return
    const competencia = c.proximoReajuste.slice(0, 7)
    const indice = db.indicesReajuste.filter((x) => x.tipo === c.indiceReajuste && x.competencia <= competencia).sort((a,b) => b.competencia.localeCompare(a.competencia))[0]
    if (!indice) return
    const valorAnterior = window.store.toNumber(c.valorAluguel)
    const valorNovo = Number((valorAnterior * (1 + Number(indice.percentual || 0) / 100)).toFixed(2))
    c.valorAluguel = valorNovo
    db.reajustesAplicados.push({ id: window.store.uid('reaj'), contratoId: c.id, indiceId: indice.id, percentual: indice.percentual, valorAnterior, valorNovo, aplicadoEm: referenceDate })
    c.proximoReajuste = addYear(c.proximoReajuste)
    count += 1
  })
  if (count) saveDb()
  return count
}

function exportBackup() {
  const payload = { app: 'ImobCore', versao: 1, exportadoEm: new Date().toISOString(), dados: db }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `imobcore-backup-${window.store.todayISO()}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}


function refreshAll() {
  renderSelects()
  renderProprietarios()
  renderLocatarios()
  renderImoveis()
  renderContratos()
  renderRecibos()
  renderPagamentos()
  renderRepasses()
  renderRelatorios()
  renderDashboard()
  renderEmissor()
  renderPendencias()
  renderIndices()
  renderIptu()
}

function setImovelStatusByContracts(imovelId) {
  const hasContrato = db.contratos.some((c) => String(c.imovelId) === String(imovelId) && contratoAtivo(c))
  const im = byId(db.imoveis, imovelId)
  if (!im) return
  if (!hasContrato) im.alugado = 'NAO'
}

function bindEvents() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => showPage(btn.dataset.page))
  })

  const pendBtn = document.getElementById('btnFiltrarPend')
  if (pendBtn) pendBtn.addEventListener('click', renderPendencias)

  const indiceBtn = document.getElementById('btnSalvarIndice')
  if (indiceBtn) indiceBtn.addEventListener('click', () => {
    const tipo = document.getElementById('idxTipo').value
    const competencia = document.getElementById('idxCompetencia').value
    const percentual = window.store.toNumber(document.getElementById('idxPercentual').value)
    if (!tipo || !competencia || !Number.isFinite(percentual)) return toast('Informe índice, competência e percentual.', 'warn')
    const payload = { tipo, competencia, percentual }
    const current = editing.indiceId ? byId(db.indicesReajuste, editing.indiceId) : null
    if (current) Object.assign(current, payload)
    else db.indicesReajuste.push({ id: window.store.uid('idx'), ...payload })
    editing.indiceId = null
    indiceBtn.textContent = 'Salvar índice'
    saveDb(); clearInputs(['idxPercentual']); renderIndices()
    toast(current ? 'Índice atualizado.' : 'Índice cadastrado.')
  })

  const aplicarBtn = document.getElementById('btnAplicarReajustes')
  if (aplicarBtn) aplicarBtn.addEventListener('click', () => {
    const count = applyPendingAdjustments()
    refreshAll()
    toast(count ? `${count} contrato(s) reajustado(s).` : 'Nenhum contrato apto ao reajuste.', count ? 'info' : 'warn')
  })

  const iptuBtn = document.getElementById('btnSalvarIptu')
  if (iptuBtn) iptuBtn.addEventListener('click', () => {
    const imovelId = document.getElementById('iptuImovel').value
    const competencia = document.getElementById('iptuCompetencia').value
    const vencimento = document.getElementById('iptuVencimento').value
    if (!imovelId || !competencia || !vencimento) return toast('Informe imóvel, competência e vencimento.', 'warn')
    const payload = { imovelId, contribuinte: document.getElementById('iptuContribuinte').value.trim(), competencia, vencimento, valor: window.store.toNumber(document.getElementById('iptuValor').value), status: document.getElementById('iptuStatus').value, obs: document.getElementById('iptuObs').value.trim() }
    const current = editing.iptuId ? byId(db.iptuLancamentos, editing.iptuId) : null
    if (current) Object.assign(current, payload)
    else db.iptuLancamentos.push({ id: window.store.uid('iptu'), ...payload })
    editing.iptuId = null
    iptuBtn.textContent = 'Salvar lançamento de IPTU'
    saveDb(); clearInputs(['iptuContribuinte','iptuValor','iptuObs']); renderIptu()
    toast(current ? 'IPTU atualizado.' : 'IPTU cadastrado.')
  })

  const exportBtn = document.getElementById('btnExportarBackup')
  if (exportBtn) exportBtn.addEventListener('click', exportBackup)
  const backupFile = document.getElementById('arquivoBackup')
  if (backupFile) backupFile.addEventListener('change', () => {
    document.getElementById('backupStatus').textContent = backupFile.files?.[0]?.name || 'Nenhum arquivo selecionado.'
  })
  const restoreBtn = document.getElementById('btnRestaurarBackup')
  if (restoreBtn) restoreBtn.addEventListener('click', async () => {
    const file = backupFile?.files?.[0]
    if (!file) return toast('Selecione um arquivo de backup.', 'warn')
    if (!(await askConfirm('Restaurar este backup e substituir os dados atuais?'))) return
    try {
      const parsed = JSON.parse(await file.text())
      const restored = parsed?.dados || parsed
      if (!restored || typeof restored !== 'object') throw new Error('Arquivo inválido')
      db = { ...cloneDefaultDb(), ...restored }
      saveDb(); refreshAll()
      toast('Backup restaurado com sucesso.')
    } catch (error) {
      toast('Não foi possível restaurar o backup.', 'danger')
    }
  })


  document.getElementById('btnSalvarProp').addEventListener('click', () => {
    const nome = document.getElementById('propNome').value.trim()
    if (!nome) return toast('Informe o nome do proprietário.', 'warn')

    const payload = {
      nome,
      doc: document.getElementById('propDoc').value.trim(),
      rg: document.getElementById('propRg').value.trim(),
      telefone: document.getElementById('propTel').value.trim(),
      email: document.getElementById('propEmail').value.trim(), endereco: document.getElementById('propEndereco').value.trim(), banco: document.getElementById('propBanco').value.trim(), agencia: document.getElementById('propAgencia').value.trim(), conta: document.getElementById('propConta').value.trim(), pix: document.getElementById('propPix').value.trim()
    }

    const current = editing.proprietarioId ? byId(db.proprietarios, editing.proprietarioId) : null
    if (current) Object.assign(current, payload)
    else db.proprietarios.push({ id: window.store.uid('prop'), ...payload })

    saveDb()
    editing.proprietarioId = null
    document.getElementById('btnSalvarProp').textContent = 'Salvar proprietário'
    clearInputs(['propNome', 'propDoc', 'propRg', 'propTel', 'propEmail', 'propEndereco', 'propBanco', 'propAgencia', 'propConta', 'propPix'])
    refreshAll()
    toast(current ? 'Proprietário atualizado com sucesso.' : 'Proprietário cadastrado com sucesso.')
  })

  document.getElementById('buscaProp').addEventListener('input', renderProprietarios)

  document.getElementById('btnSalvarLoc').addEventListener('click', () => {
    const nome = document.getElementById('locNome').value.trim()
    if (!nome) return toast('Informe o nome do locatário.', 'warn')

    const payload = {
      nome,
      doc: document.getElementById('locDoc').value.trim(),
      rg: document.getElementById('locRg').value.trim(),
      telefone: document.getElementById('locTel').value.trim(),
      email: document.getElementById('locEmail').value.trim(), endereco: document.getElementById('locEndereco').value.trim()
    }

    const current = editing.locatarioId ? byId(db.locatarios, editing.locatarioId) : null
    if (current) Object.assign(current, payload)
    else db.locatarios.push({ id: window.store.uid('loc'), ...payload })

    saveDb()
    editing.locatarioId = null
    document.getElementById('btnSalvarLoc').textContent = 'Salvar locatário'
    clearInputs(['locNome', 'locDoc', 'locRg', 'locTel', 'locEmail', 'locEndereco'])
    refreshAll()
    toast(current ? 'Locatário atualizado com sucesso.' : 'Locatário cadastrado com sucesso.')
  })

  document.getElementById('buscaLoc').addEventListener('input', renderLocatarios)

  document.getElementById('btnSalvarImovel').addEventListener('click', () => {
    const descricao = document.getElementById('imoDescricao').value.trim()
    const endereco = document.getElementById('imoEndereco').value.trim()
    const proprietarioId = document.getElementById('imoProprietario').value

    if (!descricao || !endereco || !proprietarioId) {
      return toast('Preencha descrição, endereço e proprietário.', 'warn')
    }

    const payload = {
      codigo: document.getElementById('imoCodigo').value.trim() || nextImovelCode(),
      tipo: document.getElementById('imoTipo').value,
      descricao,
      endereco,
      cep: document.getElementById('imoCep').value.trim(),
      proprietarioId,
      locatarioId: document.getElementById('imoLocatario').value,
      bancoConta: document.getElementById('imoBanco').value.trim(),
      alugado: document.getElementById('imoStatus').value
    }

    const current = editing.imovelId ? byId(db.imoveis, editing.imovelId) : null
    if (current) Object.assign(current, payload)
    else db.imoveis.push({ id: window.store.uid('imo'), ...payload })

    saveDb()
    editing.imovelId = null
    document.getElementById('btnSalvarImovel').textContent = 'Salvar imóvel'
    clearInputs(['imoCodigo', 'imoDescricao', 'imoEndereco', 'imoCep', 'imoBanco'])
    document.getElementById('imoTipo').value = 'RESIDENCIAL'
    document.getElementById('imoStatus').value = 'NAO'
    refreshAll()
    toast(current ? 'Imóvel atualizado com sucesso.' : 'Imóvel cadastrado com sucesso.')
  })

  document.getElementById('buscaImovel').addEventListener('input', renderImoveis)

  document.getElementById('btnSalvarContrato').addEventListener('click', () => {
    const imovelId = document.getElementById('conImovel').value
    const locatarioId = document.getElementById('conLocatario').value
    const inicio = document.getElementById('conInicio').value
    const fim = document.getElementById('conFim').value

    if (!imovelId || !locatarioId || !inicio || !fim) {
      return toast('Preencha imóvel, locatário e período do contrato.', 'warn')
    }

    const payload = {
      imovelId,
      locatarioId,
      inicio,
      fim,
      vencimentoDia: document.getElementById('conVencimentoDia').value || '5',
      valorAluguel: window.store.toNumber(document.getElementById('conValor').value),
      iptu: window.store.toNumber(document.getElementById('conIptu').value),
      condominio: window.store.toNumber(document.getElementById('conCondominio').value),
      seguro: window.store.toNumber(document.getElementById('conSeguro').value),
      outros: window.store.toNumber(document.getElementById('conOutros').value),
      taxaAdm: window.store.toNumber(document.getElementById('conTaxaAdm').value),
      indiceReajuste: document.getElementById('conIndiceReajuste').value,
      proximoReajuste: document.getElementById('conProximoReajuste').value,
      tipoRecibo: document.getElementById('conTipoRecibo').value,
      obs: document.getElementById('conObs').value.trim()
    }

    const current = editing.contratoId ? byId(db.contratos, editing.contratoId) : null
    if (current) Object.assign(current, payload)
    else db.contratos.push({ id: window.store.uid('cont'), ...payload })

    const im = byId(db.imoveis, imovelId)
    if (im) { im.alugado = 'SIM'; im.locatarioId = locatarioId }

    saveDb()
    editing.contratoId = null
    document.getElementById('btnSalvarContrato').textContent = 'Salvar contrato'
    clearInputs(['conInicio', 'conFim', 'conVencimentoDia', 'conValor', 'conIptu', 'conCondominio', 'conSeguro', 'conOutros', 'conTaxaAdm', 'conProximoReajuste', 'conObs'])
    document.getElementById('conIndiceReajuste').value = ''
    refreshAll()
    toast(current ? 'Contrato atualizado com sucesso.' : 'Contrato salvo com sucesso.')
  })

  document.getElementById('buscaContrato').addEventListener('input', renderContratos)

  document.getElementById('btnGerarRecibo').addEventListener('click', () => {
    const contratoId = document.getElementById('recContrato').value
    const comp = document.getElementById('recMesAno').value
    if (!contratoId || !comp) return toast('Selecione contrato e competência.', 'warn')

    const c = byId(db.contratos, contratoId)
    if (!c) return

    const pago = document.getElementById('recPago').value
    const manual = window.store.toNumber(document.getElementById('recValorManual').value)
    const valor = manual > 0 ? manual : valorTotalContrato(c)

    document.getElementById('prevRecibo').value = buildReciboText(c, comp, pago, valor)
  })

  document.getElementById('btnImprimirRecibo').addEventListener('click', () => {
    const txt = document.getElementById('prevRecibo').value.trim()
    if (!txt) return toast('Gere o recibo antes de imprimir.', 'warn')
    printText('Recibo de Aluguel', txt)
  })

  document.getElementById('btnSalvarRecibo').addEventListener('click', () => {
    const contratoId = document.getElementById('recContrato').value
    const comp = document.getElementById('recMesAno').value
    if (!contratoId || !comp) return toast('Selecione contrato e competência.', 'warn')

    const c = byId(db.contratos, contratoId)
    if (!c) return

    const pago = document.getElementById('recPago').value
    const manual = window.store.toNumber(document.getElementById('recValorManual').value)
    const valor = manual > 0 ? manual : valorTotalContrato(c)

    db.recibos.push({
      id: window.store.uid('rec'),
      contratoId,
      competencia: comp,
      pago,
      valor,
      criadoEm: new Date().toISOString()
    })

    saveDb()
    refreshAll()
    toast('Recibo salvo no histórico.')
  })

  document.getElementById('finContrato').addEventListener('change', fillFinanceDefaults)
  document.getElementById('repContrato').addEventListener('change', fillRepasseDefaults)
  ;['repValorBruto', 'repTaxaAdm', 'repDespesas'].forEach((id) => {
    document.getElementById(id).addEventListener('input', recalculateRepasseLiquido)
  })

  document.getElementById('btnSalvarPagamento').addEventListener('click', () => {
    const contratoId = document.getElementById('finContrato').value
    const competencia = document.getElementById('finCompetencia').value
    if (!contratoId || !competencia) return toast('Selecione contrato e competência da baixa.', 'warn')

    const existing = editing.pagamentoId ? byId(db.pagamentos, editing.pagamentoId) : findPagamento(contratoId, competencia)
    const dataPagamento = document.getElementById('finData').value || window.store.todayISO()
    const valor = window.store.toNumber(document.getElementById('finValor').value)
    if (valor <= 0) return toast('Informe o valor recebido.', 'warn')

    const payload = {
      contratoId,
      competencia,
      dataPagamento,
      valor,
      status: document.getElementById('finStatus').value,
      obs: document.getElementById('finObs').value.trim()
    }

    if (existing) {
      Object.assign(existing, payload)
    } else {
      db.pagamentos.push({ id: window.store.uid('pag'), ...payload, criadoEm: new Date().toISOString() })
    }

    saveDb()
    editing.pagamentoId = null
    document.getElementById('btnSalvarPagamento').textContent = 'Salvar baixa do locatário'
    clearInputs(['finValor', 'finObs'])
    document.getElementById('finData').value = window.store.todayISO()
    refreshAll()
    fillFinanceDefaults()
    toast('Baixa do locatário salva com sucesso.')
  })

  document.getElementById('btnSalvarRepasse').addEventListener('click', () => {
    const contratoId = document.getElementById('repContrato').value
    const competencia = document.getElementById('repCompetencia').value
    if (!contratoId || !competencia) return toast('Selecione contrato e competência do repasse.', 'warn')

    const valorBruto = window.store.toNumber(document.getElementById('repValorBruto').value)
    const taxaAdm = window.store.toNumber(document.getElementById('repTaxaAdm').value)
    const despesas = window.store.toNumber(document.getElementById('repDespesas').value)
    const valorLiquido = window.store.toNumber(document.getElementById('repValorLiquido').value)
    if (valorBruto <= 0) return toast('Informe o valor bruto recebido.', 'warn')

    const payload = {
      contratoId,
      competencia,
      dataRepasse: document.getElementById('repData').value || window.store.todayISO(),
      valorBruto,
      taxaAdm,
      despesas,
      valorLiquido,
      obs: document.getElementById('repObs').value.trim()
    }
    const existing = editing.repasseId ? byId(db.repasses, editing.repasseId) : findRepasse(contratoId, competencia)

    if (existing) {
      Object.assign(existing, payload)
    } else {
      db.repasses.push({ id: window.store.uid('rep'), ...payload, criadoEm: new Date().toISOString() })
    }

    saveDb()
    editing.repasseId = null
    document.getElementById('btnSalvarRepasse').textContent = 'Salvar repasse ao proprietário'
    clearInputs(['repValorBruto', 'repTaxaAdm', 'repDespesas', 'repValorLiquido', 'repObs'])
    document.getElementById('repData').value = window.store.todayISO()
    refreshAll()
    fillRepasseDefaults()
    toast('Repasse ao proprietário salvo com sucesso.')
  })

  document.getElementById('btnGerarExtrato').addEventListener('click', renderExtratoPreview)
  document.getElementById('btnImprimirExtrato').addEventListener('click', printStatement)

  document.getElementById('btnFiltrarRel').addEventListener('click', renderRelatorios)

  document.getElementById('btnImprimirRel').addEventListener('click', () => {
    const rows = buildRelatorioRows()
    if (!rows.length) return toast('Nenhum dado para imprimir.', 'warn')

    const resumo = rows
      .map((r) => `${r.codigo} | ${r.imovel} | ${r.locatario} | ${window.store.fmtMoney(r.valor)} | ${r.pago}`)
      .join('\n')

    printText('Relatório de Imóveis', resumo)
  })

  document.getElementById('btnSalvarEmissor').addEventListener('click', async () => {
    const logoFile = document.getElementById('emLogo').files?.[0]
    db.emissor = {
      nome: document.getElementById('emNome').value.trim(),
      empresa: document.getElementById('emEmpresa').value.trim(),
      cpf: document.getElementById('emCpf').value.trim(),
      cnpj: document.getElementById('emCnpj').value.trim(),
      telefone: document.getElementById('emTelefone').value.trim(),
      email: document.getElementById('emEmail').value.trim(),
      endereco: document.getElementById('emEndereco').value.trim(),
      cidadeUf: document.getElementById('emCidadeUf').value.trim(),
      logoDataUrl: await readLogoFile(logoFile)
    }

    saveDb()
    renderEmissor()
    toast('Dados do recibo salvos com sucesso.')
  })

  document.getElementById('recMesAno').value = window.store.todayISO().slice(0, 7)
  document.getElementById('filtroMesAno').value = window.store.todayISO().slice(0, 7)
  ;['finCompetencia', 'repCompetencia', 'extCompetencia'].forEach((id) => {
    document.getElementById(id).value = currentMonth()
  })
  document.getElementById('idxCompetencia').value = currentMonth()
  document.getElementById('iptuCompetencia').value = currentMonth()
  document.getElementById('pendDataRef').value = window.store.todayISO()
  ;['finData', 'repData'].forEach((id) => {
    document.getElementById(id).value = window.store.todayISO()
  })
  fillFinanceDefaults()
  fillRepasseDefaults()
}

window.delProprietario = async function delProprietario(id) {
  if (!(await askConfirm('Excluir proprietário?'))) return
  if (db.imoveis.some((i) => String(i.proprietarioId) === String(id))) {
    return toast('Não é possível excluir: proprietário vinculado a imóvel.', 'warn')
  }

  db.proprietarios = db.proprietarios.filter((x) => String(x.id) !== String(id))
  saveDb()
  refreshAll()
}

window.editProprietario = function editProprietario(id) {
  const item = byId(db.proprietarios, id)
  if (!item) return
  editing.proprietarioId = id
  document.getElementById('propNome').value = item.nome || ''
  document.getElementById('propDoc').value = item.doc || ''
  document.getElementById('propRg').value = item.rg || ''
  document.getElementById('propTel').value = item.telefone || ''
  document.getElementById('propEmail').value = item.email || ''
  document.getElementById('propEndereco').value = item.endereco || ''; document.getElementById('propBanco').value = item.banco || ''; document.getElementById('propAgencia').value = item.agencia || ''; document.getElementById('propConta').value = item.conta || ''; document.getElementById('propPix').value = item.pix || ''
  document.getElementById('btnSalvarProp').textContent = 'Atualizar proprietário'
  showPage('proprietarios')
}

window.delLocatario = async function delLocatario(id) {
  if (!(await askConfirm('Excluir locatário?'))) return
  if (db.contratos.some((c) => String(c.locatarioId) === String(id))) {
    return toast('Não é possível excluir: locatário vinculado a contrato.', 'warn')
  }

  db.locatarios = db.locatarios.filter((x) => String(x.id) !== String(id))
  saveDb()
  refreshAll()
}

window.editLocatario = function editLocatario(id) {
  const item = byId(db.locatarios, id)
  if (!item) return
  editing.locatarioId = id
  document.getElementById('locNome').value = item.nome || ''
  document.getElementById('locDoc').value = item.doc || ''
  document.getElementById('locRg').value = item.rg || ''
  document.getElementById('locTel').value = item.telefone || ''
  document.getElementById('locEmail').value = item.email || ''
  document.getElementById('locEndereco').value = item.endereco || ''
  document.getElementById('btnSalvarLoc').textContent = 'Atualizar locatário'
  showPage('locatarios')
}

window.delImovel = async function delImovel(id) {
  if (!(await askConfirm('Excluir imóvel?'))) return
  if (db.contratos.some((c) => String(c.imovelId) === String(id))) {
    return toast('Não é possível excluir: imóvel vinculado a contrato.', 'warn')
  }

  db.imoveis = db.imoveis.filter((x) => String(x.id) !== String(id))
  saveDb()
  refreshAll()
}

window.editImovel = function editImovel(id) {
  const item = byId(db.imoveis, id)
  if (!item) return
  editing.imovelId = id
  document.getElementById('imoCodigo').value = item.codigo || ''
  document.getElementById('imoTipo').value = item.tipo || 'RESIDENCIAL'
  document.getElementById('imoDescricao').value = item.descricao || ''
  document.getElementById('imoEndereco').value = item.endereco || ''
  document.getElementById('imoCep').value = item.cep || ''
  document.getElementById('imoProprietario').value = item.proprietarioId || ''
  document.getElementById('imoLocatario').value = item.locatarioId || ''
  document.getElementById('imoBanco').value = item.bancoConta || ''
  document.getElementById('imoStatus').value = item.alugado || 'NAO'
  document.getElementById('btnSalvarImovel').textContent = 'Atualizar imóvel'
  showPage('imoveis')
}

window.delContrato = async function delContrato(id) {
  if (!(await askConfirm('Excluir contrato?'))) return

  const contrato = byId(db.contratos, id)
  db.contratos = db.contratos.filter((x) => String(x.id) !== String(id))
  db.recibos = db.recibos.filter((x) => String(x.contratoId) !== String(id))

  if (contrato?.imovelId) setImovelStatusByContracts(contrato.imovelId)

  saveDb()
  refreshAll()
}

window.editContrato = function editContrato(id) {
  const item = byId(db.contratos, id)
  if (!item) return
  editing.contratoId = id
  document.getElementById('conImovel').value = item.imovelId || ''
  document.getElementById('conLocatario').value = item.locatarioId || ''
  document.getElementById('conInicio').value = item.inicio || ''
  document.getElementById('conFim').value = item.fim || ''
  document.getElementById('conVencimentoDia').value = item.vencimentoDia || ''
  document.getElementById('conValor').value = item.valorAluguel || ''
  document.getElementById('conIptu').value = item.iptu || ''
  document.getElementById('conCondominio').value = item.condominio || ''
  document.getElementById('conSeguro').value = item.seguro || ''
  document.getElementById('conOutros').value = item.outros || ''
  document.getElementById('conTaxaAdm').value = item.taxaAdm || ''
  document.getElementById('conIndiceReajuste').value = item.indiceReajuste || ''
  document.getElementById('conProximoReajuste').value = item.proximoReajuste || ''
  document.getElementById('conTipoRecibo').value = item.tipoRecibo || 'RESIDENCIAL'
  document.getElementById('conObs').value = item.obs || ''
  document.getElementById('btnSalvarContrato').textContent = 'Atualizar contrato'
  showPage('contratos')
}

window.delPagamento = async function delPagamento(id) {
  if (!(await askConfirm('Excluir baixa de pagamento?'))) return
  db.pagamentos = db.pagamentos.filter((x) => String(x.id) !== String(id))
  saveDb()
  refreshAll()
}

window.editPagamento = function editPagamento(id) {
  const item = byId(db.pagamentos, id)
  if (!item) return
  editing.pagamentoId = id
  document.getElementById('finContrato').value = item.contratoId || ''
  document.getElementById('finCompetencia').value = item.competencia || currentMonth()
  document.getElementById('finData').value = item.dataPagamento || window.store.todayISO()
  document.getElementById('finValor').value = item.valor || ''
  document.getElementById('finStatus').value = item.status || 'PAGO'
  document.getElementById('finObs').value = item.obs || ''
  document.getElementById('btnSalvarPagamento').textContent = 'Atualizar baixa do locatário'
  showPage('financeiro')
}

window.delRepasse = async function delRepasse(id) {
  if (!(await askConfirm('Excluir repasse?'))) return
  db.repasses = db.repasses.filter((x) => String(x.id) !== String(id))
  saveDb()
  refreshAll()
}

window.editRepasse = function editRepasse(id) {
  const item = byId(db.repasses, id)
  if (!item) return
  editing.repasseId = id
  document.getElementById('repContrato').value = item.contratoId || ''
  document.getElementById('repCompetencia').value = item.competencia || currentMonth()
  document.getElementById('repData').value = item.dataRepasse || window.store.todayISO()
  document.getElementById('repValorBruto').value = item.valorBruto || ''
  document.getElementById('repTaxaAdm').value = item.taxaAdm || ''
  document.getElementById('repDespesas').value = item.despesas || ''
  document.getElementById('repValorLiquido').value = item.valorLiquido || ''
  document.getElementById('repObs').value = item.obs || ''
  document.getElementById('btnSalvarRepasse').textContent = 'Atualizar repasse ao proprietário'
  showPage('financeiro')
}

window.editIndice = function editIndice(id) {
  const item = byId(db.indicesReajuste, id)
  if (!item) return
  editing.indiceId = id
  document.getElementById('idxTipo').value = item.tipo
  document.getElementById('idxCompetencia').value = item.competencia
  document.getElementById('idxPercentual').value = item.percentual
  document.getElementById('btnSalvarIndice').textContent = 'Atualizar índice'
  showPage('indices')
}

window.delIndice = async function delIndice(id) {
  if (!(await askConfirm('Excluir índice de reajuste?'))) return
  db.indicesReajuste = db.indicesReajuste.filter((x) => String(x.id) !== String(id))
  saveDb(); renderIndices()
}

window.editIptu = function editIptu(id) {
  const item = byId(db.iptuLancamentos, id)
  if (!item) return
  editing.iptuId = id
  document.getElementById('iptuImovel').value = item.imovelId
  document.getElementById('iptuContribuinte').value = item.contribuinte || ''
  document.getElementById('iptuCompetencia').value = item.competencia || ''
  document.getElementById('iptuVencimento').value = item.vencimento || ''
  document.getElementById('iptuValor').value = item.valor || ''
  document.getElementById('iptuStatus').value = item.status || 'PENDENTE'
  document.getElementById('iptuObs').value = item.obs || ''
  document.getElementById('btnSalvarIptu').textContent = 'Atualizar lançamento de IPTU'
  showPage('iptu')
}

window.delIptu = async function delIptu(id) {
  if (!(await askConfirm('Excluir lançamento de IPTU?'))) return
  db.iptuLancamentos = db.iptuLancamentos.filter((x) => String(x.id) !== String(id))
  saveDb(); renderIptu()
}


bindEvents()
applyPendingAdjustments()
refreshAll()
