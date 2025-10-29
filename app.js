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
  photo: document.getElementById('photo'),
  photoPreview: document.getElementById('photoPreview'),
  changePhotoBtn: document.getElementById('changePhotoBtn'),
  removePhotoBtn: document.getElementById('removePhotoBtn'),
  nameError: document.getElementById('nameError'),
  phoneError: document.getElementById('phoneError'),
  emailError: document.getElementById('emailError'),
  photoError: document.getElementById('photoError'),
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
  if(c.photo){
    avatar.innerHTML = `<img src="${c.photo}" alt="${c.name}" />`;
    avatar.style.background = 'transparent';
    avatar.style.border = 'none';
  } else {
    avatar.textContent = initials(c.name);
    avatar.style.background = '';
    avatar.style.border = '';
  }
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

/** Photo handling */
let currentPhotoFile = null;
let photoRemoved = false;

function updatePhotoPreview(file, isBase64 = false){
  if(!file){
    currentPhotoFile = null;
    el.photoPreview.innerHTML = `
      <div class="photo-preview-content">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true" class="photo-icon">
          <path d="M12 6a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V9a3 3 0 0 0-3-3Zm0 8a5 5 0 0 1-5-5V9a5 5 0 0 1 10 0v1a5 5 0 0 1-5 5Z" fill="currentColor" opacity="0.3"/>
          <circle cx="12" cy="9" r="2.5" fill="currentColor" opacity="0.3"/>
          <path d="M12 13c-2.5 0-4.5 1.5-4.5 3v1h9v-1c0-1.5-2-3-4.5-3z" fill="currentColor" opacity="0.3"/>
        </svg>
        <span class="photo-placeholder">No photo</span>
        <span class="photo-drop-hint">Choose file or drop here</span>
      </div>
      <div class="photo-actions hidden">
        <button type="button" class="icon-btn photo-action-btn" id="changePhotoBtn" aria-label="Change photo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 17.25V20h2.75l8.1-8.1-2.75-2.75L4 17.25Zm15.71-9.96a1 1 0 0 0 0-1.41l-1.59-1.59a1 1 0 0 0-1.41 0l-1.34 1.34 2.75 2.75 1.59-1.59Z" fill="currentColor"/></svg>
        </button>
        <button type="button" class="icon-btn photo-action-btn danger" id="removePhotoBtn" aria-label="Remove photo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12l-5.775 5.775a1 1 0 1 0 1.414 1.414L12 13.414l5.775 5.775a1 1 0 0 0 1.414-1.414L13.414 12l5.775-5.775a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" fill="currentColor"/></svg>
        </button>
      </div>
    `;
    // Re-attach event listeners
    attachPhotoListeners();
    return;
  }
  
  // Handle base64 string (existing photo)
  if(isBase64 && typeof file === 'string'){
    el.photoPreview.innerHTML = `
      <div class="photo-preview-content hidden">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true" class="photo-icon">
          <path d="M12 6a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V9a3 3 0 0 0-3-3Zm0 8a5 5 0 0 1-5-5V9a5 5 0 0 1 10 0v1a5 5 0 0 1-5 5Z" fill="currentColor" opacity="0.3"/>
          <circle cx="12" cy="9" r="2.5" fill="currentColor" opacity="0.3"/>
          <path d="M12 13c-2.5 0-4.5 1.5-4.5 3v1h9v-1c0-1.5-2-3-4.5-3z" fill="currentColor" opacity="0.3"/>
        </svg>
        <span class="photo-placeholder">No photo</span>
        <span class="photo-drop-hint">Choose file or drop here</span>
      </div>
      <img src="${file}" alt="Preview" />
      <div class="photo-actions">
        <button type="button" class="icon-btn photo-action-btn" id="changePhotoBtn" aria-label="Change photo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 17.25V20h2.75l8.1-8.1-2.75-2.75L4 17.25Zm15.71-9.96a1 1 0 0 0 0-1.41l-1.59-1.59a1 1 0 0 0-1.41 0l-1.34 1.34 2.75 2.75 1.59-1.59Z" fill="currentColor"/></svg>
        </button>
        <button type="button" class="icon-btn photo-action-btn danger" id="removePhotoBtn" aria-label="Remove photo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12l-5.775 5.775a1 1 0 1 0 1.414 1.414L12 13.414l5.775 5.775a1 1 0 0 0 1.414-1.414L13.414 12l5.775-5.775a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" fill="currentColor"/></svg>
        </button>
      </div>
    `;
    attachPhotoListeners();
    return;
  }
  
  // Handle File object
  const reader = new FileReader();
  reader.onload = (e) => {
    el.photoPreview.innerHTML = `
      <div class="photo-preview-content hidden">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true" class="photo-icon">
          <path d="M12 6a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V9a3 3 0 0 0-3-3Zm0 8a5 5 0 0 1-5-5V9a5 5 0 0 1 10 0v1a5 5 0 0 1-5 5Z" fill="currentColor" opacity="0.3"/>
          <circle cx="12" cy="9" r="2.5" fill="currentColor" opacity="0.3"/>
          <path d="M12 13c-2.5 0-4.5 1.5-4.5 3v1h9v-1c0-1.5-2-3-4.5-3z" fill="currentColor" opacity="0.3"/>
        </svg>
        <span class="photo-placeholder">No photo</span>
        <span class="photo-drop-hint">Choose file or drop here</span>
      </div>
      <img src="${e.target.result}" alt="Preview" />
      <div class="photo-actions">
        <button type="button" class="icon-btn photo-action-btn" id="changePhotoBtn" aria-label="Change photo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 17.25V20h2.75l8.1-8.1-2.75-2.75L4 17.25Zm15.71-9.96a1 1 0 0 0 0-1.41l-1.59-1.59a1 1 0 0 0-1.41 0l-1.34 1.34 2.75 2.75 1.59-1.59Z" fill="currentColor"/></svg>
        </button>
        <button type="button" class="icon-btn photo-action-btn danger" id="removePhotoBtn" aria-label="Remove photo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12l-5.775 5.775a1 1 0 1 0 1.414 1.414L12 13.414l5.775 5.775a1 1 0 0 0 1.414-1.414L13.414 12l5.775-5.775a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" fill="currentColor"/></svg>
        </button>
      </div>
    `;
    attachPhotoListeners();
  };
  
  if(file instanceof File){
    currentPhotoFile = file;
    reader.readAsDataURL(file);
  }
}

function attachPhotoListeners(){
  const changeBtn = document.getElementById('changePhotoBtn');
  const removeBtn = document.getElementById('removePhotoBtn');
  const photoInput = document.getElementById('photo');
  
  if(changeBtn){
    changeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      photoInput?.click();
    });
  }
  
  if(removeBtn){
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentPhotoFile = null;
      photoRemoved = true;
      if(photoInput) photoInput.value = '';
      updatePhotoPreview(null);
    });
  }
}

function handleFileSelect(file){
  if(!file) return;
  
  if(!file.type.startsWith('image/')){
    el.photoError.textContent = 'Please select a valid image file.';
    return;
  }
  
  if(file.size > 5 * 1024 * 1024){
    el.photoError.textContent = 'Image size should be less than 5MB.';
    return;
  }
  
  el.photoError.textContent = '';
  photoRemoved = false;
  updatePhotoPreview(file);
}
function fileToBase64(file){
  return new Promise((resolve, reject) => {
    if(!file){
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Modal */
function openModal(mode, data){
  el.modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  photoRemoved = false;
  if(mode === 'edit' && data){
    el.modalTitle.textContent = 'Edit Contact';
    el.id.value = data.id;
    el.name.value = data.name;
    el.phone.value = data.phone;
    el.email.value = data.email;
    if(data.photo){
      updatePhotoPreview(data.photo, true);
    } else {
      updatePhotoPreview(null);
    }
    el.photo.value = '';
    currentPhotoFile = null;
  } else {
    el.modalTitle.textContent = 'New Contact';
    el.id.value = '';
    el.form.reset();
    updatePhotoPreview(null);
    clearErrors();
  }
  el.name.focus();
  // Attach drag and drop listeners
  attachDragAndDropListeners();
}
function closeModal(){
  el.modal.classList.add('hidden');
  document.body.style.overflow = '';
  el.form.reset();
  updatePhotoPreview(null);
  currentPhotoFile = null;
  photoRemoved = false;
  // Reset drag-drop listeners flag so they can be re-attached next time
  dragDropListenersAttached = false;
}

/** CRUD */
async function onCreate({name, phone, email, photo}){
  const contact = { id: uid(), name: name.trim(), phone: phone.trim(), email: email.trim(), photo, createdAt: Date.now() };
  contacts.push(contact);
  saveContacts();
  render();
}
async function onUpdate(id, {name, phone, email, photo}){
  const i = contacts.findIndex(c=>c.id===id);
  if(i>-1){
    const updated = { ...contacts[i], name: name.trim(), phone: phone.trim(), email: email.trim() };
    if(photo !== undefined){
      updated.photo = photo;
    }
    contacts[i] = updated;
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
  el.photoError.textContent = '';
}
function validateForm(){
  clearErrors();
  let valid = true;
  const name = el.name.value.trim();
  const phone = el.phone.value.trim();
  const email = el.email.value.trim();
  
  if(!isValidName(name)){
    el.nameError.textContent = 'Enter at least 2 characters.';
    valid = false;
  }
  if(!phone || !isValidPhone(phone)){
    el.phoneError.textContent = 'Enter a valid phone (7-15 digits, optional +).';
    valid = false;
  }
  if(!email || !isValidEmail(email)){
    el.emailError.textContent = 'Enter a valid email address.';
    valid = false;
  }
  return valid;
}

/** Events */
if(el.addBtn){
  el.addBtn.addEventListener('click', ()=> openModal('new'));
}
if(el.emptyAddBtn){
  el.emptyAddBtn.addEventListener('click', ()=> openModal('new'));
}
// Event delegation as backup for empty state button (works even if element is hidden initially)
document.addEventListener('click', (e) => {
  if(e.target.closest('#emptyAddBtn')){
    openModal('new');
  }
});
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

el.form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(!validateForm()) return;
  const id = el.id.value;
  const photoFile = currentPhotoFile || el.photo.files[0];
  let photo;
  if(photoFile){
    photo = await fileToBase64(photoFile);
    photoRemoved = false;
  } else if(photoRemoved){
    photo = null;
  } else if(id){
    // When editing, keep existing photo if not changed
    const existingContact = contacts.find(c => c.id === id);
    photo = existingContact?.photo || null;
  } else {
    photo = null;
  }
  const payload = { name: el.name.value, phone: el.phone.value, email: el.email.value, photo };
  if(id){ await onUpdate(id, payload); } else { await onCreate(payload); }
  closeModal();
});

let dragDropListenersAttached = false;

function attachDragAndDropListeners(){
  const photoPreview = document.getElementById('photoPreview');
  if(!photoPreview || dragDropListenersAttached) return;
  
  dragDropListenersAttached = true;
  
  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    photoPreview.addEventListener(eventName, preventDefaults, false);
  });
  
  // Highlight drop zone when item is dragged over it
  ['dragenter', 'dragover'].forEach(eventName => {
    photoPreview.addEventListener(eventName, () => {
      photoPreview.classList.add('drag-over');
      photoPreview.setAttribute('data-dragover', 'true');
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    photoPreview.addEventListener(eventName, () => {
      photoPreview.classList.remove('drag-over');
      photoPreview.setAttribute('data-dragover', 'false');
    }, false);
  });
  
  // Handle dropped files
  photoPreview.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if(files.length > 0){
      handleFileSelect(files[0]);
    }
  }, false);
  
  // Click handler - get fresh reference to file input each time
  photoPreview.addEventListener('click', (e) => {
    // Don't trigger if clicking on action buttons
    if(e.target.closest('.photo-action-btn')){
      return;
    }
    // Don't trigger if clicking on the image itself (when photo is shown)
    if(e.target.tagName === 'IMG'){
      return;
    }
    // Get fresh reference to the file input
    const photoInput = document.getElementById('photo');
    if(photoInput){
      photoInput.click();
    }
  });
}

function preventDefaults(e){
  e.preventDefault();
  e.stopPropagation();
}

// Prevent body drag events globally
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  document.body.addEventListener(eventName, preventDefaults, false);
});

el.photo.addEventListener('change', (e)=>{
  handleFileSelect(e.target.files[0]);
});

// Use event delegation on the form to handle file input changes
// This ensures it works even if the input reference changes
el.form.addEventListener('change', (e) => {
  if(e.target && e.target.id === 'photo' && e.target.type === 'file'){
    handleFileSelect(e.target.files[0]);
  }
});

// Initialize photo listeners on page load
(function initPhotoListeners(){
  // Wait for DOM to be ready, then attach listeners when modal opens
  // The listeners will be attached when modal opens via openModal function
})();

// Initial UI
(function init(){
  render();
})();
