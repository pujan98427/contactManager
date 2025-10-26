/* Contacts Manager - Vanilla JS (ES Module) - v2.0 */
const STORAGE_KEY = 'contacts_v1';

const el = {
  search: document.getElementById('searchInput'),
  addBtn: document.getElementById('addBtn'),
  emptyAddBtn: document.getElementById('emptyAddBtn'),
  emptyState: document.getElementById('emptyState'),
  list: document.getElementById('contactList'),
  listSection: document.getElementById('listSection'),
  tpl: document.getElementById('contactItemTemplate'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modalTitle'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  form: document.getElementById('contactForm'),
  id: document.getElementById('contactId'),
  name: document.getElementById('fullName'),
  phone: document.getElementById('phone'),
  email: document.getElementById('email'),
  nameError: document.getElementById('nameError'),
  phoneError: document.getElementById('phoneError'),
  emailError: document.getElementById('emailError'),
  // Delete modal elements
  deleteModal: document.getElementById('deleteModal'),
  deleteModalBackdrop: document.getElementById('deleteModalBackdrop'),
  closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
  deleteMessage: document.getElementById('deleteMessage'),
};

/** State */
let contacts = loadContacts();
let query = '';
let contactToDelete = null;

/** Utils */
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const saveContacts = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
function loadContacts(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function normalizePhone(str){
  return (str || '').replace(/[^+\d]/g, '').replace(/^(00)/,'+');
}
function isValidName(v){ return typeof v === 'string' && v.trim().length >= 2; }
function isValidEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }
function isValidPhone(v){ return /^\+?[0-9]{7,15}$/.test(normalizePhone(v)); }
function sortByName(arr){ return [...arr].sort((a,b)=>a.name.localeCompare(b.name)); }
function initials(name){
  const parts = (name||'').trim().split(/\s+/).slice(0,2);
  return parts.map(p=>p[0]?.toUpperCase()||'').join('');
}

/** Rendering */
function render(){
  const filtered = filterContacts(contacts, query);
  el.list.innerHTML = '';
  if(filtered.length === 0){
    el.emptyState.classList.remove('hidden');
    return;
  }
  el.emptyState.classList.add('hidden');
  const frag = document.createDocumentFragment();
  for(const c of filtered){
    const node = renderItem(c);
    frag.appendChild(node);
  }
  el.list.appendChild(frag);
}
function filterContacts(arr, q){
  if(!q) return sortByName(arr);
  const s = q.toLowerCase();
  return sortByName(arr).filter(c=>
    c.name.toLowerCase().includes(s) ||
    c.email.toLowerCase().includes(s) ||
    c.phone.toLowerCase().includes(s)
  );
}
function renderItem(c){
  const node = el.tpl.content.firstElementChild.cloneNode(true);
  node.dataset.id = c.id;
  const avatar = node.querySelector('.avatar');
  avatar.textContent = initials(c.name);
  const name = node.querySelector('.name');
  name.textContent = c.name;
  const phone = node.querySelector('.phone');
  phone.textContent = c.phone;
  phone.href = `tel:${normalizePhone(c.phone)}`;
  const email = node.querySelector('.email');
  email.textContent = c.email;
  email.href = `mailto:${c.email}`;
  node.querySelector('.edit').addEventListener('click', ()=> openModal('edit', c));
  node.querySelector('.delete').addEventListener('click', ()=> onDelete(c.id));
  return node;
}

/** Modal */
function openModal(mode, data){
  el.modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  if(mode === 'edit' && data){
    el.modalTitle.textContent = 'Edit Contact';
    el.id.value = data.id;
    el.name.value = data.name;
    el.phone.value = data.phone;
    el.email.value = data.email;
  } else {
    el.modalTitle.textContent = 'New Contact';
    el.id.value = '';
    el.form.reset();
    clearErrors();
  }
  el.name.focus();
}
function closeModal(){
  el.modal.classList.add('hidden');
  document.body.style.overflow = '';
}

/** CRUD */
function onCreate({name, phone, email}){
  const contact = { id: uid(), name: name.trim(), phone: phone.trim(), email: email.trim(), createdAt: Date.now() };
  contacts.push(contact);
  saveContacts();
  render();
}
function onUpdate(id, {name, phone, email}){
  const i = contacts.findIndex(c=>c.id===id);
  if(i>-1){
    contacts[i] = { ...contacts[i], name: name.trim(), phone: phone.trim(), email: email.trim() };
    saveContacts();
    render();
  }
}
function onDelete(id){
  const c = contacts.find(x=>x.id===id);
  if(!c) return;
  contactToDelete = c;
  el.deleteMessage.textContent = `Are you sure you want to delete "${c.name}"? This action cannot be undone.`;
  openDeleteModal();
}

function openDeleteModal(){
  console.log('Opening delete modal, element:', el.deleteModal);
  el.deleteModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDeleteModal(){
  el.deleteModal.classList.add('hidden');
  document.body.style.overflow = '';
  contactToDelete = null;
}

function confirmDelete(){
  if(!contactToDelete) return;
  contacts = contacts.filter(x=>x.id!==contactToDelete.id);
  saveContacts();
  render();
  closeDeleteModal();
}

/** Validation */
function clearErrors(){
  el.nameError.textContent = '';
  el.phoneError.textContent = '';
  el.emailError.textContent = '';
}
function validateForm(){
  clearErrors();
  let valid = true;
  const name = el.name.value;
  const phone = el.phone.value;
  const email = el.email.value;
  if(!isValidName(name)){
    el.nameError.textContent = 'Enter at least 2 characters.';
    valid = false;
  }
  if(!isValidPhone(phone)){
    el.phoneError.textContent = 'Enter a valid phone (7-15 digits, optional +).';
    valid = false;
  }
  if(!isValidEmail(email)){
    el.emailError.textContent = 'Enter a valid email address.';
    valid = false;
  }
  return valid;
}

/** Events */
el.addBtn.addEventListener('click', ()=> openModal('new'));
el.emptyAddBtn.addEventListener('click', ()=> openModal('new'));
el.closeModalBtn.addEventListener('click', closeModal);
el.modalBackdrop.addEventListener('click', closeModal);
window.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && !el.modal.classList.contains('hidden')) closeModal(); });

// Delete modal events
el.closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
el.deleteModalBackdrop.addEventListener('click', closeDeleteModal);
el.confirmDeleteBtn.addEventListener('click', confirmDelete);
window.addEventListener('keydown', (e)=>{ 
  if(e.key==='Escape' && !el.deleteModal.classList.contains('hidden')) closeDeleteModal(); 
});

el.search.addEventListener('input', (e)=>{
  query = e.target.value.trim();
  render();
});

el.form.addEventListener('submit', (e)=>{
  e.preventDefault();
  if(!validateForm()) return;
  const id = el.id.value;
  const payload = { name: el.name.value, phone: el.phone.value, email: el.email.value };
  if(id){ onUpdate(id, payload); } else { onCreate(payload); }
  closeModal();
});

// Initial UI
(function init(){
  // Debug: Check if delete modal elements exist
  console.log('Delete modal elements:', {
    deleteModal: el.deleteModal,
    deleteModalBackdrop: el.deleteModalBackdrop,
    closeDeleteModalBtn: el.closeDeleteModalBtn,
    confirmDeleteBtn: el.confirmDeleteBtn,
    deleteMessage: el.deleteMessage
  });
  render();
})();
