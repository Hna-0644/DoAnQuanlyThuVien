const STORAGE_KEY = 'thu-vien-manager-state-v2';
let nextBookId = 1, nextMemberId = 1, nextLoanId = 1;
let feePerDay = 5000; // VND per day overdue
let currentTheme = 'light';
let currentView = 'dashboard';
const todayISO = () => new Date().toISOString().slice(0,10);
const addDays = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
const fmtDate = (iso) => { const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`; };
const fmtVND = (n) => n.toLocaleString('vi-VN') + ' đ';

function makeBook(title, author, category, copies = 1, isbn = '', cover = ''){
  const id = nextBookId++;
  return {
    id,
    title,
    author,
    category: category || 'Chưa phân loại',
    copies: Math.max(1, copies),
    available: Math.max(1, copies),
    isbn,
    cover,
  };
}

function saveState(){
  try {
    const payload = {
      nextBookId, nextMemberId, nextLoanId,
      feePerDay,
      books,
      members,
      loans,
      theme: currentTheme,
      activeView: currentView,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Không lưu được trạng thái vào localStorage', err);
  }
}

function applyTheme(theme){
  currentTheme = theme === 'dark' ? 'dark' : 'light';
  document.body.classList.toggle('dark', currentTheme === 'dark');
  const btn = document.getElementById('themeToggle');
  if(btn){
    btn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', currentTheme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối');
  }
}

function toggleTheme(){
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  saveState();
}

function toggleMobileMenu(open){
  const app = document.querySelector('.app');
  const btn = document.querySelector('.mobile-menu-btn');
  app.classList.toggle('menu-open', open);
  if(btn){ btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
}

function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return false;
    const data = JSON.parse(raw);
    if(!data) return false;
    nextBookId = data.nextBookId || 1;
    nextMemberId = data.nextMemberId || 1;
    nextLoanId = data.nextLoanId || 1;
    feePerDay = typeof data.feePerDay === 'number' ? data.feePerDay : 5000;
    books = Array.isArray(data.books) ? data.books.map(b => ({ ...b })) : [];
    members = Array.isArray(data.members) ? data.members.map(m => ({ ...m })) : [];
    loans = Array.isArray(data.loans) ? data.loans.map(l => ({ ...l })) : [];
    currentTheme = data.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    currentView = data.activeView || 'dashboard';
    applyTheme(currentTheme);
    return true;
  } catch (err) {
    console.warn('Không thể đọc trạng thái từ localStorage', err);
    return false;
  }
}

let books = [
  makeBook("Số đỏ", "Vũ Trọng Phụng", "Văn học", 3, "978-604-1-12345-1", ""),
  makeBook("Dế Mèn phiêu lưu ký", "Tô Hoài", "Văn học", 4, "978-604-1-22345-2", ""),
  makeBook("Sapiens: Lược sử loài người", "Yuval Noah Harari", "Lịch sử", 2, "978-0-06-231609-7", ""),
  makeBook("Đắc nhân tâm", "Dale Carnegie", "Kỹ năng sống", 5, "978-604-1-33345-3", ""),
  makeBook("Nhà giả kim", "Paulo Coelho", "Văn học", 3, "978-0-06-231500-7", ""),
  makeBook("Cấu trúc dữ liệu và giải thuật", "Nguyễn Đức Nghĩa", "Khoa học máy tính", 2, "978-604-1-44345-4", ""),
  makeBook("Vũ trụ trong vỏ hạt dẻ", "Stephen Hawking", "Khoa học", 2, "978-0-553-80202-3", ""),
  makeBook("Totto-chan bên cửa sổ", "Kuroyanagi Tetsuko", "Thiếu nhi", 3, "978-604-1-55345-5", ""),
];

let members = [
  { id: nextMemberId++, name: "Trần Minh Anh", email: "minhanh.tran@vidu.com" },
  { id: nextMemberId++, name: "Lê Quốc Bảo", email: "quocbao.le@vidu.com" },
  { id: nextMemberId++, name: "Phạm Thu Hà", email: "thuha.pham@vidu.com" },
];

let loans = [];
function addLoan(bookTitleMatch, memberIdx, borrowOffset, dueOffset){
  const book = books.find(b => b.title === bookTitleMatch);
  if(!book || book.available <= 0) return;
  book.available -= 1;
  loans.push({
    id: nextLoanId++,
    bookId: book.id,
    memberId: members[memberIdx].id,
    borrowDate: addDays(todayISO(), borrowOffset),
    dueDate: addDays(todayISO(), dueOffset),
    returnDate: null
  });
}
addLoan("Sapiens: Lược sử loài người", 0, -20, -6);
addLoan("Đắc nhân tâm", 1, -3, 11);
addLoan("Cấu trúc dữ liệu và giải thuật", 2, -10, -1);
(function(){
  const book = books.find(b => b.title === "Nhà giả kim");
  loans.push({ id: nextLoanId++, bookId: book.id, memberId: members[0].id,
    borrowDate: addDays(todayISO(), -40), dueDate: addDays(todayISO(), -26), returnDate: addDays(todayISO(), -20) });
})();

const views = ["dashboard","books","loans","members"];
function showView(name){
  if(!views.includes(name)) name = 'dashboard';
  currentView = name;
  views.forEach(v => {
    document.getElementById('view-'+v).style.display = (v===name) ? '' : 'none';
  });
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === name);
  });
  toggleMobileMenu(false);
  renderAll();
}

const loanStatus = loan => loan.returnDate ? 'returned' : (loan.dueDate < todayISO() ? 'overdue' : 'borrowing');
const bookById = id => books.find(b => b.id === id);
const memberById = id => members.find(m => m.id === id);
const daysLate = loan => Math.max(0, Math.round((new Date(loan.returnDate || todayISO()) - new Date(loan.dueDate)) / 86400000));
const feeFor = loan => daysLate(loan) * feePerDay;

function renderDashboard(){
  document.getElementById('statTotalBooks').textContent = books.reduce((s,b)=>s+b.copies,0);
  document.getElementById('statAvailable').textContent = books.reduce((s,b)=>s+b.available,0);
  document.getElementById('statLowStock').textContent = books.filter(b => b.available > 0 && b.available <= 1).length;
  document.getElementById('statBorrowing').textContent = loans.filter(l => loanStatus(l)!=='returned').length;
  document.getElementById('statOverdue').textContent = loans.filter(l => loanStatus(l)==='overdue').length;
  const outstanding = loans.filter(l => loanStatus(l)==='overdue').reduce((s,l)=> s+feeFor(l), 0);
  document.getElementById('statFeeOutstanding').textContent = fmtVND(outstanding);

  const active = loans.filter(l => loanStatus(l) !== 'returned').sort((a,b)=> a.dueDate.localeCompare(b.dueDate)).slice(0,6);
  const rows = document.getElementById('dashLoanRows');
  rows.innerHTML = '';
  active.forEach(l => {
    const book = bookById(l.bookId), member = memberById(l.memberId);
    if(!book || !member) return;
    const status = loanStatus(l);
    const fee = feeFor(l);
    rows.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${escapeHTML(book.title)}</td>
        <td class="who">${escapeHTML(member.name)}</td>
        <td><span class="stamp ${status==='overdue'?'':'deep'}">${fmtDate(l.dueDate)}</span></td>
        <td>${statusBadge(status)}</td>
        <td>${fee > 0 ? `<span class="fee-amount">${fmtVND(fee)}</span>` : `<span class="fee-amount zero">—</span>`}</td>
      </tr>
    `);
  });
  document.getElementById('dashLoanEmpty').style.display = active.length ? 'none' : '';
}

function statusBadge(status){
  if(status==='overdue') return `<span class="badge overdue">● Quá hạn</span>`;
  if(status==='returned') return `<span class="badge returned">✓ Đã trả</span>`;
  return `<span class="badge borrowing">● Đang mượn</span>`;
}

function populateCategoryFilter(){
  const sel = document.getElementById('bookCategoryFilter');
  const current = sel.value;
  const cats = [...new Set(books.map(b=>b.category))].sort();
  sel.innerHTML = '<option value="">Mọi thể loại</option>' + cats.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
  sel.value = current;
}

function bookCoverMarkup(b){
  const initial = (b.title || '?').trim().charAt(0).toUpperCase();
  if(b.cover){
    return `<img class="cover" src="${escapeHTML(b.cover)}" alt="" loading="lazy"
              onerror="this.outerHTML='<div class=&quot;cover-placeholder&quot;>${initial}</div>'">`;
  }
  return `<div class="cover-placeholder">${initial}</div>`;
}

function renderBooks(){
  populateCategoryFilter();
  const q = document.getElementById('bookSearch').value.trim().toLowerCase();
  const cat = document.getElementById('bookCategoryFilter').value;
  const status = document.getElementById('bookStatusFilter').value;
  const grid = document.getElementById('bookGrid');
  grid.innerHTML = '';

  const filtered = books.filter(b => {
    const matchesQ = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || (b.isbn||'').toLowerCase().includes(q);
    const matchesCat = !cat || b.category === cat;
    const matchesStatus = !status ||
      (status === 'available' && b.available > 1) ||
      (status === 'low' && b.available > 0 && b.available <= 1) ||
      (status === 'out' && b.available === 0);
    return matchesQ && matchesCat && matchesStatus;
  });

  filtered.forEach(b => {
    const pillClass = b.available === 0 ? 'none' : (b.available <= 1 ? 'low' : 'ok');
    grid.insertAdjacentHTML('beforeend', `
      <div class="book-card">
        <div class="card-top">
          ${bookCoverMarkup(b)}
          <div class="card-info">
            <span class="cat-tag">${escapeHTML(b.category)}</span>
            <h3>${escapeHTML(b.title)}</h3>
            <p class="author">${escapeHTML(b.author)}</p>
            ${b.isbn ? `<p class="isbn mono">ISBN ${escapeHTML(b.isbn)}</p>` : ''}
          </div>
        </div>
        <div class="meta-row">
          <span>${b.copies} bản tổng</span>
          <span class="avail-pill ${pillClass}">${b.available} sẵn có</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-ghost btn-sm" onclick="openBookModal(${b.id})">Sửa</button>
          <button class="btn btn-danger-ghost btn-sm" onclick="deleteBook(${b.id})">Xóa</button>
        </div>
      </div>
    `);
  });

  document.getElementById('bookEmpty').style.display = filtered.length ? 'none' : '';
  document.getElementById('navBookCount').textContent = books.length;
}

document.getElementById('bookSearch').addEventListener('input', renderBooks);
document.getElementById('bookCategoryFilter').addEventListener('change', renderBooks);
document.getElementById('bookStatusFilter').addEventListener('change', renderBooks);

function renderLoans(){
  const filter = document.getElementById('loanStatusFilter').value;
  const rows = document.getElementById('loanRows');
  rows.innerHTML = '';

  const sorted = [...loans].sort((a,b)=> b.id - a.id);
  const filtered = sorted.filter(l => !filter || loanStatus(l) === filter);

  filtered.forEach(l => {
    const book = bookById(l.bookId), member = memberById(l.memberId);
    if(!book || !member) return;
    const status = loanStatus(l);
    const fee = feeFor(l);
    const dueCell = l.returnDate
      ? `<span class="mono" style="color:var(--muted)">${fmtDate(l.dueDate)}</span>`
      : `<span class="stamp ${status==='overdue'?'':'deep'}">${fmtDate(l.dueDate)}</span>`;
    const actions = status==='returned'
      ? (fee > 0 ? `<span class="mono" style="font-size:11px;color:var(--muted)">trả trễ ${daysLate(l)} ngày</span>` : '')
      : `<div class="row-actions">
           <button class="btn btn-ghost btn-sm" onclick="openRenewModal(${l.id})">Gia hạn</button>
           <button class="btn btn-primary btn-sm" onclick="returnLoan(${l.id})">Đã trả</button>
         </div>`;
    rows.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${escapeHTML(book.title)}</td>
        <td class="who">${escapeHTML(member.name)}</td>
        <td class="mono">${fmtDate(l.borrowDate)}</td>
        <td>${dueCell}</td>
        <td>${statusBadge(status)}</td>
        <td>${fee > 0 ? `<span class="fee-amount">${fmtVND(fee)}</span>` : `<span class="fee-amount zero">—</span>`}</td>
        <td>${actions}</td>
      </tr>
    `);
  });

  document.getElementById('loanEmpty').style.display = filtered.length ? 'none' : '';
  document.getElementById('navLoanCount').textContent = loans.filter(l=>loanStatus(l)!=='returned').length;
}

document.getElementById('loanStatusFilter').addEventListener('change', renderLoans);

const feeInput = document.getElementById('feePerDayInput');
feeInput.value = feePerDay;
feeInput.addEventListener('change', () => {
  const v = parseInt(feeInput.value);
  feePerDay = isNaN(v) || v < 0 ? 0 : v;
  feeInput.value = feePerDay;
  renderAll();
});

function returnLoan(id){
  const loan = loans.find(l=>l.id===id);
  if(!loan) return;
  loan.returnDate = todayISO();
  const book = bookById(loan.bookId);
  if(book) book.available = Math.min(book.copies, book.available + 1);
  const fee = feeFor(loan);
  showToast(fee > 0 ? `Đã ghi nhận trả sách. Phí trễ hạn: ${fmtVND(fee)}.` : 'Đã ghi nhận trả sách.');
  renderAll();
}

function openRenewModal(loanId){
  const loan = loans.find(l=>l.id===loanId);
  if(!loan) return;
  document.getElementById('renewLoanId').value = loanId;
  document.getElementById('renewDays').value = 7;
  document.getElementById('renewSub').textContent = `Hạn hiện tại: ${fmtDate(loan.dueDate)}. Chọn số ngày để cộng thêm.`;
  openModal('renewOverlay');
}
function applyRenew(){
  const loanId = parseInt(document.getElementById('renewLoanId').value);
  const days = Math.max(1, parseInt(document.getElementById('renewDays').value) || 7);
  const loan = loans.find(l=>l.id===loanId);
  if(!loan) return;
  const base = loan.dueDate < todayISO() ? todayISO() : loan.dueDate;
  loan.dueDate = addDays(base, days);
  showToast(`Đã gia hạn. Hạn trả mới: ${fmtDate(loan.dueDate)}.`);
  closeModal('renewOverlay');
  renderAll();
}

function renderMembers(){
  const grid = document.getElementById('memberGrid');
  grid.innerHTML = '';
  members.forEach(m => {
    const activeLoans = loans.filter(l => l.memberId === m.id && loanStatus(l) !== 'returned').length;
    const initials = m.name.split(' ').slice(-2).map(w=>w[0]).join('').toUpperCase();
    grid.insertAdjacentHTML('beforeend', `
      <div class="member-card" onclick="openMemberDetail(${m.id})">
        <div class="avatar">${initials}</div>
        <div class="member-body">
          <div class="name">${escapeHTML(m.name)}</div>
          <div class="email">${escapeHTML(m.email)}</div>
          <div class="tally">${activeLoans} sách đang mượn</div>
          <div class="member-actions">
            <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); openMemberModal(${m.id})">Sửa</button>
            <button class="btn btn-danger-ghost btn-sm" onclick="event.stopPropagation(); deleteMember(${m.id})">Xóa</button>
          </div>
        </div>
      </div>
    `);
  });
  document.getElementById('memberEmpty').style.display = members.length ? 'none' : '';
  document.getElementById('navMemberCount').textContent = members.length;
}

function openMemberDetail(memberId){
  const m = memberById(memberId);
  if(!m) return;
  const initials = m.name.split(' ').slice(-2).map(w=>w[0]).join('').toUpperCase();
  document.getElementById('detailAvatar').textContent = initials;
  document.getElementById('detailName').textContent = m.name;
  document.getElementById('detailEmail').textContent = m.email;

  const history = loans.filter(l => l.memberId === memberId).sort((a,b)=> b.id - a.id);
  const list = document.getElementById('detailList');
  list.innerHTML = '';
  history.forEach(l => {
    const book = bookById(l.bookId);
    const status = loanStatus(l);
    const fee = feeFor(l);
    list.insertAdjacentHTML('beforeend', `
      <div class="detail-row">
        <div>
          <div class="book-name">${book ? escapeHTML(book.title) : '(Sách đã xóa)'}</div>
          <div class="dates">${fmtDate(l.borrowDate)} → ${fmtDate(l.dueDate)}${l.returnDate ? ' · trả ' + fmtDate(l.returnDate) : ''}</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          ${fee > 0 ? `<span class="fee-amount">${fmtVND(fee)}</span>` : ''}
          ${statusBadge(status)}
        </div>
      </div>
    `);
  });
  document.getElementById('detailEmptyHist').style.display = history.length ? 'none' : '';
  openModal('memberDetailOverlay');
}

function openModal(id){ document.getElementById(id).classList.add('show'); }
function closeModal(id){ document.getElementById(id).classList.remove('show'); }

function openBookModal(id){
  document.getElementById('bookEditId').value = id || '';
  if(id){
    const b = bookById(id);
    document.getElementById('bookModalTitle').textContent = 'Sửa thông tin sách';
    document.getElementById('bookTitle').value = b.title;
    document.getElementById('bookAuthor').value = b.author;
    document.getElementById('bookCategory').value = b.category;
    document.getElementById('bookCopies').value = b.copies;
    document.getElementById('bookIsbn').value = b.isbn || '';
    document.getElementById('bookCover').value = b.cover || '';
  } else {
    document.getElementById('bookModalTitle').textContent = 'Thêm sách mới';
    document.getElementById('bookTitle').value = '';
    document.getElementById('bookAuthor').value = '';
    document.getElementById('bookCategory').value = '';
    document.getElementById('bookCopies').value = 1;
    document.getElementById('bookIsbn').value = '';
    document.getElementById('bookCover').value = '';
  }
  openModal('bookOverlay');
}

function saveBook(){
  const title = document.getElementById('bookTitle').value.trim();
  const author = document.getElementById('bookAuthor').value.trim();
  const category = document.getElementById('bookCategory').value.trim() || 'Chưa phân loại';
  const copies = Math.max(1, parseInt(document.getElementById('bookCopies').value) || 1);
  const isbn = document.getElementById('bookIsbn').value.trim();
  const cover = document.getElementById('bookCover').value.trim();
  const editId = document.getElementById('bookEditId').value;

  if(!title || !author){ showToast('Vui lòng nhập tên sách và tác giả.'); return; }

  if(editId){
    const b = bookById(parseInt(editId));
    const borrowed = b.copies - b.available;
    b.title = title; b.author = author; b.category = category;
    b.copies = copies; b.isbn = isbn; b.cover = cover;
    b.available = Math.max(0, copies - borrowed);
    showToast('Đã lưu thay đổi.');
  } else {
    books.push(makeBook(title, author, category, copies, isbn, cover));
    showToast('Đã thêm sách mới.');
  }
  closeModal('bookOverlay');
  renderAll();
}

function deleteBook(id){
  const hasActiveLoan = loans.some(l => l.bookId === id && loanStatus(l) !== 'returned');
  if(hasActiveLoan){ showToast('Không thể xóa: sách đang được mượn.'); return; }
  if(!confirm('Xác nhận xóa sách này?')) return;
  books = books.filter(b => b.id !== id);
  showToast('Đã xóa sách.');
  renderAll();
}

function openMemberModal(id){
  document.getElementById('memberEditId').value = id || '';
  if(id){
    const m = memberById(id);
    document.getElementById('memberModalTitle').textContent = 'Sửa thành viên';
    document.getElementById('memberModalSub').textContent = 'Cập nhật thông tin thẻ thư viện.';
    document.getElementById('memberName').value = m.name;
    document.getElementById('memberEmail').value = m.email === '—' ? '' : m.email;
  } else {
    document.getElementById('memberModalTitle').textContent = 'Thêm thành viên';
    document.getElementById('memberModalSub').textContent = 'Tạo thẻ thư viện mới cho bạn đọc.';
    document.getElementById('memberName').value = '';
    document.getElementById('memberEmail').value = '';
  }
  openModal('memberOverlay');
}
function saveMember(){
  const name = document.getElementById('memberName').value.trim();
  const email = document.getElementById('memberEmail').value.trim();
  const editId = document.getElementById('memberEditId').value;
  if(!name){ showToast('Vui lòng nhập họ và tên.'); return; }

  if(editId){
    const m = memberById(parseInt(editId));
    m.name = name; m.email = email || '—';
    showToast('Đã lưu thay đổi.');
  } else {
    members.push({ id: nextMemberId++, name, email: email || '—' });
    showToast('Đã thêm thành viên.');
  }
  closeModal('memberOverlay');
  renderAll();
}
function deleteMember(id){
  const hasActiveLoan = loans.some(l => l.memberId === id && loanStatus(l) !== 'returned');
  if(hasActiveLoan){ showToast('Không thể xóa: thành viên đang mượn sách.'); return; }
  if(!confirm('Xác nhận xóa thành viên này?')) return;
  members = members.filter(m => m.id !== id);
  showToast('Đã xóa thành viên.');
  renderAll();
}

function openLoanModal(){
  const bookSel = document.getElementById('loanBookSelect');
  const memberSel = document.getElementById('loanMemberSelect');
  const availableBooks = books.filter(b => b.available > 0);

  if(!availableBooks.length){ showToast('Không có sách nào sẵn có để mượn.'); return; }
  if(!members.length){ showToast('Cần thêm thành viên trước khi ghi lượt mượn.'); return; }

  bookSel.innerHTML = availableBooks.map(b => `<option value="${b.id}">${escapeHTML(b.title)} (${b.available} sẵn có)</option>`).join('');
  memberSel.innerHTML = members.map(m => `<option value="${m.id}">${escapeHTML(m.name)}</option>`).join('');
  document.getElementById('loanBorrowDate').value = todayISO();
  document.getElementById('loanDueDate').value = addDays(todayISO(), 14);
  openModal('loanOverlay');
}

function saveLoan(){
  const bookId = parseInt(document.getElementById('loanBookSelect').value);
  const memberId = parseInt(document.getElementById('loanMemberSelect').value);
  const borrowDate = document.getElementById('loanBorrowDate').value;
  const dueDate = document.getElementById('loanDueDate').value;
  const book = bookById(bookId);

  if(!book || book.available <= 0){ showToast('Sách đã hết bản sẵn có.'); return; }
  if(!borrowDate || !dueDate){ showToast('Vui lòng chọn ngày mượn và hạn trả.'); return; }

  book.available -= 1;
  loans.push({ id: nextLoanId++, bookId, memberId, borrowDate, dueDate, returnDate: null });
  showToast('Đã ghi lượt mượn mới.');
  closeModal('loanOverlay');
  renderAll();
}

document.querySelectorAll('.overlay').forEach(ov => {
  ov.addEventListener('click', (e) => { if(e.target === ov) ov.classList.remove('show'); });
});

function csvEscape(val){
  const s = String(val ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
}
function toCSV(headers, rows){
  const lines = [headers.map(csvEscape).join(',')];
  rows.forEach(r => lines.push(r.map(csvEscape).join(',')));
  return '\uFEFF' + lines.join('\r\n');
}
function downloadCSV(filename, csvString){
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportBooksCSV(){
  const headers = ['Tên sách','Tác giả','Thể loại','ISBN','Số bản','Bản sẵn có'];
  const rows = books.map(b => [b.title, b.author, b.category, b.isbn, b.copies, b.available]);
  downloadCSV('danh-muc-sach.csv', toCSV(headers, rows));
  showToast('Đã xuất danh mục sách ra CSV.');
}
function exportLoansCSV(){
  const headers = ['Sách','Người mượn','Ngày mượn','Hạn trả','Ngày trả','Trạng thái','Phí trễ hạn (đ)'];
  const rows = loans.map(l => {
    const book = bookById(l.bookId), member = memberById(l.memberId);
    return [
      book ? book.title : '', member ? member.name : '',
      fmtDate(l.borrowDate), fmtDate(l.dueDate), l.returnDate ? fmtDate(l.returnDate) : '',
      ({borrowing:'Đang mượn', overdue:'Quá hạn', returned:'Đã trả'})[loanStatus(l)],
      feeFor(l)
    ];
  });
  downloadCSV('luot-muon-tra.csv', toCSV(headers, rows));
  showToast('Đã xuất lượt mượn/trả ra CSV.');
}
function exportMembersCSV(){
  const headers = ['Họ và tên','Email','Số sách đang mượn'];
  const rows = members.map(m => [m.name, m.email, loans.filter(l=>l.memberId===m.id && loanStatus(l)!=='returned').length]);
  downloadCSV('thanh-vien.csv', toCSV(headers, rows));
  showToast('Đã xuất danh sách thành viên ra CSV.');
}

function escapeHTML(str){
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
}
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove('show'), 2600);
}

function renderAll(){
  renderDashboard();
  renderBooks();
  renderLoans();
  renderMembers();
  saveState();
}

function initApp(){
  if(!loadState()){
    applyTheme(currentTheme);
    currentView = 'dashboard';
  }
  document.querySelectorAll('.nav-item').forEach(el => {
    if(el.dataset.view === currentView) el.classList.add('active');
  });
  showView(currentView);
  feeInput.value = feePerDay;
}

initApp();
