;(function(){
  // LocalStorage keys
  const LS = { students:'hms_students', rooms:'hms_rooms', allocations:'hms_allocs', users:'hms_users', current:'hms_current_user', notices:'hms_notices', tickets:'hms_tickets', payments:'hms_payments' }
  // Helpers
  const qs=(s,el=document)=>el.querySelector(s), qsa=(s,el=document)=>Array.from(el.querySelectorAll(s))
  const uid=()=>Math.random().toString(36).slice(2,10)
  const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}}
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v))
  const escapeHtml = str=>String(str).replace(/[&<>"']/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]))

  // Seed default rooms
  function seed(){
    const rooms = load(LS.rooms, [])
    if (rooms.length===0){
      save(LS.rooms, [
        { id: uid(), number:'A101', capacity:2 },
        { id: uid(), number:'A102', capacity:3 },
        { id: uid(), number:'B201', capacity:1 },
      ])
    }
  }

  // Auth
  function guard(){
    const page = document.body.getAttribute('data-page')
    const publicPages = new Set(['login','signup'])
    if (!publicPages.has(page) && !load(LS.current,null)) window.location.href='login.html'
  }
  function setupLogout(){
    const btn = qs('#logoutBtn'); if (!btn) return
    if (!load(LS.current,null)){ btn.style.display='none'; return }
    btn.addEventListener('click', ()=>{ localStorage.removeItem(LS.current); window.location.href='login.html' })
  }

  // Dashboard
  function initDashboard(){
    const form = qs('#quickAddForm'), tbody = qs('#latestStudentsTbody'); if (!form||!tbody) return
    renderLatest()
    form.addEventListener('submit', e=>{
      e.preventDefault()
      const fd = new FormData(form)
      const student = { id: uid(), name: (fd.get('name')||'').toString().trim(), room:(fd.get('room')||'').toString().trim(), phone:(fd.get('phone')||'').toString().trim(), year:(fd.get('year')||'').toString() }
      const err = qs('#quickAddError')
      if (!student.name || student.name.length<2){ err.textContent='Please enter a valid name'; return }
      err.textContent=''
      const list = load(LS.students, []); list.push(student); save(LS.students, list)
      prependRow(student)
      form.reset()
    })
    tbody.addEventListener('click', e=>{
      const btn=e.target.closest('button[data-id]'); if(!btn) return
      const id=btn.getAttribute('data-id'), row=btn.closest('tr')
      row.classList.add('fade-out'); setTimeout(()=>{ save(LS.students, load(LS.students,[]).filter(s=>s.id!==id)); row.remove() }, 220)
    })
    function renderLatest(){
      const list = load(LS.students, []).slice(-25).reverse()
      tbody.innerHTML = list.map(s=>`
        <tr class="fade-in"><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.room||'')}</td><td>${escapeHtml(s.phone||'')}</td><td>${escapeHtml(s.year||'')}</td><td style="text-align:right"><button class="btn btn-danger btn-small" data-id="${s.id}">Delete</button></td></tr>
      `).join('') || '<tr><td colspan="5">No students yet.</td></tr>'
    }
    function prependRow(s){
      const tr=document.createElement('tr'); tr.className='fade-in'
      tr.innerHTML=`<td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.room||'')}</td><td>${escapeHtml(s.phone||'')}</td><td>${escapeHtml(s.year||'')}</td><td style="text-align:right"><button class="btn btn-danger btn-small" data-id="${s.id}">Delete</button></td>`
      tbody.prepend(tr)
    }
  }

  // Students page
  function initStudents(){
    const tbody=qs('#studentsTbody'), search=qs('#studentSearch'), modalRoot=qs('#modal-root'); if(!tbody||!search) return
    render()
    search.addEventListener('input', e=>render(e.target.value))
    tbody.addEventListener('click', e=>{
      const btn=e.target.closest('button'); if(!btn) return
      const id=btn.getAttribute('data-id')
      if (btn.dataset.action==='edit') openEditModal(id)
      if (btn.dataset.action==='delete') removeRow(id, btn.closest('tr'))
    })

    function render(filter=''){
      const t=filter.trim().toLowerCase()
      const list=load(LS.students, []).filter(s=>`${s.name} ${s.room}`.toLowerCase().includes(t))
      tbody.innerHTML=list.map(s=>`
        <tr class="fade-in">
          <td>${escapeHtml(s.name)}</td>
          <td>${escapeHtml(s.room||'')}</td>
          <td>${escapeHtml(s.phone||'')}</td>
          <td>${escapeHtml(s.year||'')}</td>
          <td style="text-align:right">
            <button class="btn btn-small" data-action="edit" data-id="${s.id}">Edit</button>
            <button class="btn btn-danger btn-small" data-action="delete" data-id="${s.id}">Delete</button>
          </td>
        </tr>`).join('') || '<tr><td colspan="5">No students.</td></tr>'
    }
    function removeRow(id,row){ row.classList.add('fade-out'); setTimeout(()=>{ save(LS.students, load(LS.students,[]).filter(s=>s.id!==id)); row.remove() }, 220) }
    function openEditModal(id){
      const list=load(LS.students,[]); const s=list.find(x=>x.id===id); if(!s) return
      const m=qs('#modal-root'); m.classList.add('open');
      m.innerHTML=`<div class="modal card"><div class="panel"><div class="toolbar"><h3>Edit Student</h3><button class="btn" data-close>Close</button></div>
        <form id="editForm" class="grid">
          <label class="field"><span>Name</span><input class="input" name="name" value="${escapeHtml(s.name)}" required></label>
          <label class="field"><span>Room</span><input class="input" name="room" value="${escapeHtml(s.room||'')}"></label>
          <label class="field"><span>Contact</span><input class="input" name="phone" value="${escapeHtml(s.phone||'')}"></label>
          <label class="field"><span>Year</span><select name="year" class="input">${['1','2','3','4'].map(y=>`<option ${s.year==y?'selected':''}>${y}</option>`).join('')}</select></label>
          <div class="actions"><button class="btn btn-primary" type="submit">Save</button></div>
        </form></div></div>`
      m.addEventListener('click', e=>{ if(e.target===m||e.target.closest('[data-close]')) close() }, { once:true })
      qs('#editForm').addEventListener('submit', e=>{ e.preventDefault(); const fd=new FormData(e.target); const updated={...s, ...Object.fromEntries(fd.entries())}; const idx=list.findIndex(x=>x.id===id); list[idx]=updated; save(LS.students, list); close(); render(search.value) })
      function close(){ m.classList.remove('open'); m.innerHTML='' }
    }
  }

  // Rooms page (rooms + allocations)
  function initRooms(){
    const roomsTbody=qs('#roomsTbody'), assignTbody=qs('#assignTbody'); if(!roomsTbody||!assignTbody) return
    const addBtn=qs('#addRoomBtn'), assignBtn=qs('#assignBtn')
    renderRooms(); renderAssignments()
    addBtn.addEventListener('click', openRoomModal)
    roomsTbody.addEventListener('click', e=>{
      const btn=e.target.closest('button'); if(!btn) return
      const id=btn.getAttribute('data-id')
      if (btn.dataset.action==='edit') openRoomModal(id)
      if (btn.dataset.action==='delete') deleteRoom(id)
    })
    assignBtn.addEventListener('click', openAssignModal)
    assignTbody.addEventListener('click', e=>{
      const btn=e.target.closest('button[data-id]'); if(!btn) return
      const id=btn.getAttribute('data-id'); const allocs=load(LS.allocations,[]).filter(a=>a.id!==id); save(LS.allocations, allocs); renderAssignments(); renderRooms()
    })

    function renderRooms(){
      const rooms=load(LS.rooms,[]), allocs=load(LS.allocations,[])
      roomsTbody.innerHTML = rooms.map(r=>{
        const occ=allocs.filter(a=>a.roomId===r.id).length
        return `<tr class="fade-in"><td>${escapeHtml(r.number)}</td><td>${r.capacity}</td><td>${occ}/${r.capacity}</td><td style="text-align:right"><button class="btn btn-small" data-action="edit" data-id="${r.id}">Edit</button><button class="btn btn-danger btn-small" data-action="delete" data-id="${r.id}">Delete</button></td></tr>`
      }).join('') || '<tr><td colspan="4">No rooms yet.</td></tr>'
    }
    function renderAssignments(){
      const allocs=load(LS.allocations,[]), rooms=load(LS.rooms,[]), students=load(LS.students,[])
      assignTbody.innerHTML = allocs.map(a=>{
        const s=students.find(x=>x.id===a.studentId), r=rooms.find(x=>x.id===a.roomId)
        return `<tr class="fade-in"><td>${escapeHtml(s?s.name:'-')}</td><td>${escapeHtml(r?r.number:'-')}</td><td>${new Date(a.date).toLocaleDateString()}</td><td style="text-align:right"><button class="btn btn-danger btn-small" data-id="${a.id}">Unassign</button></td></tr>`
      }).join('') || '<tr><td colspan="4">No assignments.</td></tr>'
    }
    function openRoomModal(id){
      const list=load(LS.rooms,[]); const room=list.find(r=>r.id===id)||{ id:uid(), number:'', capacity:1 }
      const m=qs('#modal-root'); m.classList.add('open')
      m.innerHTML=`<div class="modal card"><div class="panel"><div class="toolbar"><h3>${id?'Edit':'Add'} Room</h3><button class="btn" data-close>Close</button></div><form id="roomForm" class="grid"><label class="field"><span>Room</span><input class="input" name="number" value="${escapeHtml(room.number)}" required></label><label class="field"><span>Capacity</span><input class="input" type="number" name="capacity" min="1" value="${room.capacity}" required></label><div class="actions"><button class="btn btn-primary" type="submit">Save</button></div></form></div></div>`
      m.addEventListener('click', e=>{ if(e.target===m||e.target.closest('[data-close]')) close() }, { once:true })
      qs('#roomForm').addEventListener('submit', e=>{ e.preventDefault(); const fd=new FormData(e.target); room.number=fd.get('number'); room.capacity=Math.max(1, Number(fd.get('capacity')||1)); if(!id) list.push(room); save(LS.rooms, list); close(); renderRooms() })
      function close(){ m.classList.remove('open'); m.innerHTML='' }
    }
    function deleteRoom(id){
      const allocs=load(LS.allocations,[]); if (allocs.some(a=>a.roomId===id)){ alert('Cannot delete a room with allocations'); return }
      save(LS.rooms, load(LS.rooms,[]).filter(r=>r.id!==id)); renderRooms()
    }
    function openAssignModal(){
      const students=load(LS.students,[]).filter(s=>!load(LS.allocations,[]).some(a=>a.studentId===s.id))
      const rooms=load(LS.rooms,[]).filter(r=>load(LS.allocations,[]).filter(a=>a.roomId===r.id).length < Number(r.capacity))
      if (students.length===0 || rooms.length===0){ alert('Need at least one free student and room'); return }
      const m=qs('#modal-root'); m.classList.add('open')
      m.innerHTML=`<div class="modal card"><div class="panel"><div class="toolbar"><h3>Assign Student</h3><button class="btn" data-close>Close</button></div><form id="assignForm" class="grid" style="grid-template-columns:1fr 1fr"><label class="field"><span>Student</span><select name="studentId" class="input">${students.map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}</select></label><label class="field"><span>Room</span><select name="roomId" class="input">${rooms.map(r=>`<option value="${r.id}">${escapeHtml(r.number)} (cap ${r.capacity})</option>`).join('')}</select></label><div class="actions" style="grid-column:1/-1"><button class="btn btn-primary" type="submit">Assign</button></div></form></div></div>`
      m.addEventListener('click', e=>{ if(e.target===m||e.target.closest('[data-close]')) close() }, { once:true })
      qs('#assignForm').addEventListener('submit', e=>{ e.preventDefault(); const fd=new FormData(e.target); const allocs=load(LS.allocations,[]); allocs.push({ id:uid(), studentId:fd.get('studentId'), roomId:fd.get('roomId'), date:new Date().toISOString() }); save(LS.allocations, allocs); close(); renderAssignments(); renderRooms() })
      function close(){ m.classList.remove('open'); m.innerHTML='' }
    }
  }

  // Notices page
  function initNotices(){
    const tbody=qs('#noticesTbody'); if(!tbody) return
    const addBtn=qs('#addNoticeBtn')
    render()
    addBtn.addEventListener('click', openModal)
    tbody.addEventListener('click', e=>{
      const btn=e.target.closest('button[data-id]'); if(!btn) return
      const id=btn.getAttribute('data-id')
      save(LS.notices, load(LS.notices,[]).filter(n=>n.id!==id)); render()
    })
    function render(){
      const list=load(LS.notices,[]).slice().reverse()
      tbody.innerHTML=list.map(n=>`<tr class="fade-in"><td>${escapeHtml(n.title)}</td><td>${escapeHtml(n.message)}</td><td>${new Date(n.date).toLocaleDateString()}</td><td style="text-align:right"><button class="btn btn-danger btn-small" data-id="${n.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="4">No notices.</td></tr>'
    }
    function openModal(){
      const m=qs('#modal-root'); m.classList.add('open')
      m.innerHTML=`<div class="modal card"><div class="panel"><div class="toolbar"><h3>New Notice</h3><button class="btn" data-close>Close</button></div><form id="noticeForm" class="grid" style="grid-template-columns:1fr 1fr"><label class="field"><span>Title</span><input class="input" name="title" required></label><label class="field" style="grid-column:1/-1"><span>Message</span><input class="input" name="message" required></label><div class="actions" style="grid-column:1/-1"><button class="btn btn-primary" type="submit">Add</button></div></form></div></div>`
      m.addEventListener('click', e=>{ if(e.target===m||e.target.closest('[data-close]')) close() }, { once:true })
      qs('#noticeForm').addEventListener('submit', e=>{ e.preventDefault(); const fd=new FormData(e.target); const list=load(LS.notices,[]); list.push({ id:uid(), title:fd.get('title'), message:fd.get('message'), date:new Date().toISOString() }); save(LS.notices, list); close(); render() })
      function close(){ m.classList.remove('open'); m.innerHTML='' }
    }
  }

  // Maintenance page
  function initMaintenance(){
    const tbody=qs('#ticketsTbody'); if(!tbody) return
    const addBtn=qs('#addTicketBtn')
    render()
    addBtn.addEventListener('click', openModal)
    tbody.addEventListener('click', e=>{
      const btn=e.target.closest('button'); if(!btn) return
      const id=btn.getAttribute('data-id')
      const action=btn.dataset.action
      const list=load(LS.tickets,[])
      const t=list.find(x=>x.id===id)
      if (!t) return
      if (action==='toggle'){ t.status = t.status==='Open' ? 'Resolved' : 'Open'; save(LS.tickets, list); render() }
      if (action==='delete'){ save(LS.tickets, list.filter(x=>x.id!==id)); render() }
    })
    function render(){
      const list=load(LS.tickets,[]).slice().reverse()
      tbody.innerHTML=list.map(t=>`<tr class="fade-in"><td>${escapeHtml(t.room)}</td><td>${escapeHtml(t.issue)}</td><td><span class="chip ${t.status==='Resolved'?'success':'warn'}">${t.status}</span></td><td>${new Date(t.date).toLocaleDateString()}</td><td style="text-align:right"><button class="btn btn-small" data-action="toggle" data-id="${t.id}">${t.status==='Resolved'?'Reopen':'Resolve'}</button><button class="btn btn-danger btn-small" data-action="delete" data-id="${t.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="5">No requests.</td></tr>'
    }
    function openModal(){
      const m=qs('#modal-root'); m.classList.add('open')
      m.innerHTML=`<div class="modal card"><div class="panel"><div class="toolbar"><h3>New Request</h3><button class="btn" data-close>Close</button></div><form id="ticketForm" class="grid" style="grid-template-columns:1fr 1fr"><label class="field"><span>Room</span><input class="input" name="room" required></label><label class="field" style="grid-column:1/-1"><span>Issue</span><input class="input" name="issue" required></label><div class="actions" style="grid-column:1/-1"><button class="btn btn-primary" type="submit">Add</button></div></form></div></div>`
      m.addEventListener('click', e=>{ if(e.target===m||e.target.closest('[data-close]')) close() }, { once:true })
      qs('#ticketForm').addEventListener('submit', e=>{ e.preventDefault(); const fd=new FormData(e.target); const list=load(LS.tickets,[]); list.push({ id:uid(), room:fd.get('room'), issue:fd.get('issue'), status:'Open', date:new Date().toISOString() }); save(LS.tickets, list); close(); render() })
      function close(){ m.classList.remove('open'); m.innerHTML='' }
    }
  }

  // Payments page
  function initPayments(){
    const tbody=qs('#paymentsTbody'); if(!tbody) return
    const addBtn=qs('#addPaymentBtn')
    render()
    addBtn.addEventListener('click', openModal)
    tbody.addEventListener('click', e=>{
      const btn=e.target.closest('button'); if(!btn) return
      const id=btn.getAttribute('data-id'); const action=btn.dataset.action
      const list=load(LS.payments,[]); const p=list.find(x=>x.id===id); if(!p) return
      if (action==='toggle'){ p.status = p.status==='Paid' ? 'Pending' : 'Paid'; save(LS.payments, list); render() }
      if (action==='delete'){ save(LS.payments, list.filter(x=>x.id!==id)); render() }
    })
    function render(){
      const list=load(LS.payments,[]).slice().reverse(), students=load(LS.students,[])
      tbody.innerHTML=list.map(p=>{ const s=students.find(x=>x.id===p.studentId); return `<tr class=\"fade-in\"><td>${escapeHtml(s?s.name:'-')}</td><td>₹${Number(p.amount||0).toFixed(2)}</td><td><span class=\"chip ${p.status==='Paid'?'success':'warn'}\">${p.status}</span></td><td>${new Date(p.date).toLocaleDateString()}</td><td style=\"text-align:right\"><button class=\"btn btn-small\" data-action=\"toggle\" data-id=\"${p.id}\">Mark ${p.status==='Paid'?'Pending':'Paid'}</button><button class=\"btn btn-danger btn-small\" data-action=\"delete\" data-id=\"${p.id}\">Delete</button></td></tr>` }).join('') || '<tr><td colspan="5">No payments.</td></tr>'
    }
    function openModal(){
      const students=load(LS.students,[])
      if (students.length===0){ alert('No students found. Add a student first.'); return }
      const m=qs('#modal-root'); m.classList.add('open')
      m.innerHTML=`<div class=\"modal card\"><div class=\"panel\"><div class=\"toolbar\"><h3>Record Payment</h3><button class=\"btn\" data-close>Close</button></div><form id=\"paymentForm\" class=\"grid\" style=\"grid-template-columns:1fr 1fr\"><label class=\"field\"><span>Student</span><select name=\"studentId\" class=\"input\">${students.map(s=>`<option value=\"${s.id}\">${escapeHtml(s.name)}</option>`).join('')}</select></label><label class=\"field\"><span>Amount</span><input class=\"input\" type=\"number\" name=\"amount\" min=\"0\" step=\"0.01\" required></label><div class=\"actions\" style=\"grid-column:1/-1\"><button class=\"btn btn-primary\" type=\"submit\">Save</button></div></form></div></div>`
      m.addEventListener('click', e=>{ if(e.target===m||e.target.closest('[data-close]')) close() }, { once:true })
      qs('#paymentForm').addEventListener('submit', e=>{ e.preventDefault(); const fd=new FormData(e.target); const list=load(LS.payments,[]); list.push({ id:uid(), studentId:fd.get('studentId'), amount:Number(fd.get('amount')||0), status:'Paid', date:new Date().toISOString() }); save(LS.payments, list); close(); render() })
      function close(){ m.classList.remove('open'); m.innerHTML='' }
    }
  }

  // Auth pages
  function initLogin(){ const form=qs('#loginForm'); if(!form) return; const err=qs('#loginError'); form.addEventListener('submit', e=>{ e.preventDefault(); const fd=new FormData(form); const email=(fd.get('email')||'').toString().trim(); const password=(fd.get('password')||'').toString(); const u=load(LS.users,[]).find(x=>x.email===email && x.password===password); if(!u){ err.textContent='Invalid credentials'; return } save(LS.current,{ email:u.email, name:u.name }); window.location.href='index.html' }) }
  function initSignup(){ const form=qs('#signupForm'); if(!form) return; const err=qs('#signupError'); form.addEventListener('submit', e=>{ e.preventDefault(); const fd=new FormData(form); const name=(fd.get('name')||'').toString().trim(); const email=(fd.get('email')||'').toString().trim(); const password=(fd.get('password')||'').toString(); if(!/^\S+@\S+\.\S+$/.test(email)){ err.textContent='Invalid email'; return } if(password.length<6){ err.textContent='Password must be at least 6 characters'; return } const users=load(LS.users,[]); if(users.some(u=>u.email===email)){ err.textContent='User already exists'; return } users.push({ id:uid(), name, email, password }); save(LS.users, users); save(LS.current,{ email, name }); window.location.href='index.html' }) }

  // Boot
  document.addEventListener('DOMContentLoaded', ()=>{
    seed(); guard(); setupLogout()
    const page=document.body.getAttribute('data-page')
    if (page==='dashboard') initDashboard()
    if (page==='students') initStudents()
    if (page==='rooms') initRooms()
    if (page==='notices') initNotices()
    if (page==='maintenance') initMaintenance()
    if (page==='payments') initPayments()
    if (page==='login') initLogin()
    if (page==='signup') initSignup()
  })
})()

;(function(){
  // App state kept in localStorage (students and auth)
  const LS_KEYS = { students:'hms_students', users:'hms_users', current:'hms_current_user' }

  // Utilities
  const qs = (s,el=document)=>el.querySelector(s)
  const qsa = (s,el=document)=>Array.from(el.querySelectorAll(s))
  const uid = ()=>Math.random().toString(36).slice(2,10)
  const getStudents = ()=>JSON.parse(localStorage.getItem(LS_KEYS.students)||'[]')
  const setStudents = (arr)=>localStorage.setItem(LS_KEYS.students, JSON.stringify(arr))
  const getUsers = ()=>JSON.parse(localStorage.getItem(LS_KEYS.users)||'[]')
  const setUsers = (arr)=>localStorage.setItem(LS_KEYS.users, JSON.stringify(arr))
  const getCurrent = ()=>JSON.parse(localStorage.getItem(LS_KEYS.current)||'null')
  const setCurrent = (obj)=>localStorage.setItem(LS_KEYS.current, JSON.stringify(obj))

  // Auth guard for protected pages
  function guard(){
    const page = document.body.getAttribute('data-page')
    const publicPages = new Set(['login','signup'])
    if (!publicPages.has(page) && !getCurrent()) {
      window.location.href = 'login.html'
    }
  }

  // Update header logout button visibility and behavior
  function setupHeader(){
    const logout = qs('#logoutBtn')
    if (!logout) return
    if (!getCurrent()) { logout.style.display = 'none'; return }
    logout.addEventListener('click', ()=>{ localStorage.removeItem(LS_KEYS.current); window.location.href = 'login.html' })
  }

  // Dashboard page logic: render list, quick add, animations
  function initDashboard(){
    const tbody = qs('#latestStudentsTbody')
    const form = qs('#quickAddForm')
    if (!tbody || !form) return

    renderLatest()

    form.addEventListener('submit', e=>{
      e.preventDefault()
      const fd = new FormData(form)
      const name = (fd.get('name')||'').toString().trim()
      const room = (fd.get('room')||'').toString().trim()
      const phone = (fd.get('phone')||'').toString().trim()
      const year = (fd.get('year')||'').toString().trim()
      const error = qs('#quickAddError')
      if (!name || name.length<2){ error.textContent = 'Please enter a valid name'; return }
      error.textContent = ''
      const list = getStudents()
      const student = { id: uid(), name, room, phone, year }
      list.push(student)
      setStudents(list)
      prependRow(student)
      form.reset()
    })

    tbody.addEventListener('click', e=>{
      const btn = e.target.closest('button[data-id]')
      if (!btn) return
      const id = btn.getAttribute('data-id')
      const row = btn.closest('tr')
      row.classList.add('fade-out')
      setTimeout(()=>{
        const list = getStudents().filter(s=>s.id!==id)
        setStudents(list)
        row.remove()
      }, 220)
    })

    function renderLatest(){
      const list = getStudents().slice(-25).reverse()
      tbody.innerHTML = list.map(s=>rowHtml(s)).join('') || '<tr><td colspan="5">No students yet.</td></tr>'
    }

    function rowHtml(s){
      return `<tr class="fade-in"><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.room||'')}</td><td>${escapeHtml(s.phone||'')}</td><td>${escapeHtml(s.year||'')}</td><td style="text-align:right"><button class="btn btn-danger btn-small" data-id="${s.id}">Delete</button></td></tr>`
    }

    function prependRow(s){
      const tr = document.createElement('tr')
      tr.className = 'fade-in'
      tr.innerHTML = rowHtml(s).replace('<tr class="fade-in">','').replace('</tr>','')
      tbody.prepend(tr)
    }
  }

  // Students page logic: list + search + delete with animations
  function initStudents(){
    const tbody = qs('#studentsTbody')
    const search = qs('#studentSearch')
    if (!tbody || !search) return

    function render(filter=''){
      const t = filter.trim().toLowerCase()
      const list = getStudents().filter(s => `${s.name} ${s.room}`.toLowerCase().includes(t))
      tbody.innerHTML = list.map(s=>`
        <tr class="fade-in">
          <td>${escapeHtml(s.name)}</td>
          <td>${escapeHtml(s.room||'')}</td>
          <td>${escapeHtml(s.phone||'')}</td>
          <td>${escapeHtml(s.year||'')}</td>
          <td style="text-align:right"><button class="btn btn-danger btn-small" data-id="${s.id}">Delete</button></td>
        </tr>
      `).join('') || '<tr><td colspan="5">No students found.</td></tr>'
    }

    render()
    search.addEventListener('input', e=>render(e.target.value))
    tbody.addEventListener('click', e=>{
      const btn = e.target.closest('button[data-id]')
      if (!btn) return
      const id = btn.getAttribute('data-id')
      const row = btn.closest('tr')
      row.classList.add('fade-out')
      setTimeout(()=>{
        setStudents(getStudents().filter(s=>s.id!==id))
        row.remove()
      }, 220)
    })
  }

  // Auth pages logic
  function initLogin(){
    const form = qs('#loginForm'); if (!form) return
    const error = qs('#loginError')
    form.addEventListener('submit', e=>{
      e.preventDefault()
      const fd = new FormData(form)
      const email = (fd.get('email')||'').toString().trim()
      const password = (fd.get('password')||'').toString()
      const user = getUsers().find(u=>u.email===email && u.password===password)
      if (!user){ error.textContent='Invalid credentials'; return }
      setCurrent({ email: user.email, name: user.name })
      window.location.href = 'index.html'
    })
  }

  function initSignup(){
    const form = qs('#signupForm'); if (!form) return
    const error = qs('#signupError')
    form.addEventListener('submit', e=>{
      e.preventDefault()
      const fd = new FormData(form)
      const name = (fd.get('name')||'').toString().trim()
      const email = (fd.get('email')||'').toString().trim()
      const password = (fd.get('password')||'').toString()
      if (!/^\S+@\S+\.\S+$/.test(email)){ error.textContent='Invalid email'; return }
      if ((password||'').length<6){ error.textContent='Password must be at least 6 characters'; return }
      const users = getUsers()
      if (users.some(u=>u.email===email)){ error.textContent='User already exists'; return }
      users.push({ id: uid(), name, email, password })
      setUsers(users)
      setCurrent({ email, name })
      window.location.href = 'index.html'
    })
  }

  function escapeHtml(str){ return String(str).replace(/[&<>"']/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s])) }

  // Initialize per page
  document.addEventListener('DOMContentLoaded', ()=>{
    guard(); setupHeader()
    const page = document.body.getAttribute('data-page')
    if (page==='dashboard') initDashboard()
    if (page==='students') initStudents()
    if (page==='login') initLogin()
    if (page==='signup') initSignup()
  })
})()


