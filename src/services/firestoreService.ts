import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth, sanitizeData } from '../lib/firebase';
import { 
  Project, 
  Task, 
  Note, 
  Decision, 
  Experiment, 
  Conversation, 
  ChatMessage
} from '../types';

// ==========================================
// LOCAL STORAGE REACTIVE FALLBACK STORE
// ==========================================

interface LocalDataStore {
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  decisions: Decision[];
  experiments: Experiment[];
  conversations: Conversation[];
  messages: ChatMessage[];
}

function getLocalStore(uid: string): LocalDataStore {
  try {
    const raw = localStorage.getItem(`projectpilot_store_${uid}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse local store:', e);
  }
  return {
    projects: [],
    tasks: [],
    notes: [],
    decisions: [],
    experiments: [],
    conversations: [],
    messages: []
  };
}

function saveLocalStore(uid: string, store: LocalDataStore): void {
  try {
    localStorage.setItem(`projectpilot_store_${uid}`, JSON.stringify(store));
    // Emit reactive event
    window.dispatchEvent(new CustomEvent(`projectpilot_sync_${uid}`));
  } catch (e) {
    console.warn('Failed to save to local store:', e);
  }
}

function isLocalMode(uid: string): boolean {
  return !auth.currentUser || uid.startsWith('guest-') || auth.currentUser.uid !== uid;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ==========================================
// PROJECTS
// ==========================================

export async function createProject(uid: string, projectData: Omit<Project, 'id' | 'uid' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = Date.now();

  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    const id = generateId();
    const newProject: Project = {
      ...projectData,
      id,
      uid,
      createdAt: now,
      updatedAt: now
    };
    store.projects.unshift(newProject);
    saveLocalStore(uid, store);
    return id;
  }

  try {
    const projectsRef = collection(db, `users/${uid}/projects`);
    const newProjectDoc = doc(projectsRef);

    const newProject: Project = {
      ...projectData,
      id: newProjectDoc.id,
      uid,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(newProjectDoc, sanitizeData(newProject));
    return newProjectDoc.id;
  } catch (err) {
    console.warn('Firestore createProject failed, saving locally:', err);
    const store = getLocalStore(uid);
    const id = generateId();
    const newProject: Project = {
      ...projectData,
      id,
      uid,
      createdAt: now,
      updatedAt: now
    };
    store.projects.unshift(newProject);
    saveLocalStore(uid, store);
    return id;
  }
}

export async function updateProject(uid: string, projectId: string, updates: Partial<Project>): Promise<void> {
  const now = Date.now();

  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    const idx = store.projects.findIndex(p => p.id === projectId);
    if (idx !== -1) {
      store.projects[idx] = {
        ...store.projects[idx],
        ...updates,
        updatedAt: now
      };
      saveLocalStore(uid, store);
    }
    return;
  }

  try {
    const projectDocRef = doc(db, `users/${uid}/projects/${projectId}`);
    const payload = {
      ...updates,
      updatedAt: now
    };
    await updateDoc(projectDocRef, sanitizeData(payload));
  } catch (err) {
    console.warn('Firestore updateProject failed, updating locally:', err);
    const store = getLocalStore(uid);
    const idx = store.projects.findIndex(p => p.id === projectId);
    if (idx !== -1) {
      store.projects[idx] = {
        ...store.projects[idx],
        ...updates,
        updatedAt: now
      };
      saveLocalStore(uid, store);
    }
  }
}

export async function deleteProject(uid: string, projectId: string): Promise<void> {
  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    store.projects = store.projects.filter(p => p.id !== projectId);
    store.tasks = store.tasks.filter(t => t.projectId !== projectId);
    store.notes = store.notes.filter(n => n.projectId !== projectId);
    store.decisions = store.decisions.filter(d => d.projectId !== projectId);
    store.experiments = store.experiments.filter(e => e.projectId !== projectId);
    store.conversations = store.conversations.filter(c => c.projectId !== projectId);
    store.messages = store.messages.filter(m => m.projectId !== projectId);
    saveLocalStore(uid, store);
    return;
  }

  try {
    const projectDocRef = doc(db, `users/${uid}/projects/${projectId}`);
    await deleteDoc(projectDocRef);
  } catch (err) {
    console.warn('Firestore deleteProject failed, deleting locally:', err);
    const store = getLocalStore(uid);
    store.projects = store.projects.filter(p => p.id !== projectId);
    saveLocalStore(uid, store);
  }
}

export function subscribeToProjects(uid: string, callback: (projects: Project[]) => void): Unsubscribe {
  if (isLocalMode(uid)) {
    const handleSync = () => {
      const store = getLocalStore(uid);
      const sorted = [...store.projects].sort((a, b) => b.updatedAt - a.updatedAt);
      callback(sorted);
    };

    handleSync();
    window.addEventListener(`projectpilot_sync_${uid}`, handleSync);
    return () => window.removeEventListener(`projectpilot_sync_${uid}`, handleSync);
  }

  try {
    const projectsRef = collection(db, `users/${uid}/projects`);
    const q = query(projectsRef, orderBy('updatedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const projects: Project[] = [];
      snapshot.forEach((docSnap) => {
        projects.push(docSnap.data() as Project);
      });
      callback(projects);
    }, (error) => {
      console.warn('Firestore subscribeToProjects error, falling back to local:', error);
      const store = getLocalStore(uid);
      callback(store.projects);
    });
  } catch (err) {
    console.warn('subscribeToProjects init error:', err);
    const store = getLocalStore(uid);
    callback(store.projects);
    return () => {};
  }
}

export async function getProject(uid: string, projectId: string): Promise<Project | null> {
  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    return store.projects.find(p => p.id === projectId) || null;
  }

  try {
    const projectDocRef = doc(db, `users/${uid}/projects/${projectId}`);
    const snap = await getDoc(projectDocRef);
    if (snap.exists()) {
      return snap.data() as Project;
    }
  } catch (err) {
    console.warn('Firestore getProject failed, checking local:', err);
  }
  const store = getLocalStore(uid);
  return store.projects.find(p => p.id === projectId) || null;
}

// ==========================================
// TASKS
// ==========================================

export async function createTask(uid: string, projectId: string, taskData: Omit<Task, 'id' | 'uid' | 'projectId' | 'createdAt'>): Promise<string> {
  const now = Date.now();

  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    const id = generateId();
    const newTask: Task = {
      ...taskData,
      id,
      projectId,
      uid,
      createdAt: now,
      completedAt: taskData.status === 'COMPLETED' ? now : null
    };
    store.tasks.unshift(newTask);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
    return id;
  }

  try {
    const tasksRef = collection(db, `users/${uid}/projects/${projectId}/tasks`);
    const newTaskDoc = doc(tasksRef);

    const newTask: Task = {
      ...taskData,
      id: newTaskDoc.id,
      projectId,
      uid,
      createdAt: now,
      completedAt: taskData.status === 'COMPLETED' ? now : null
    };

    await setDoc(newTaskDoc, sanitizeData(newTask));
    await updateProject(uid, projectId, {});
    return newTaskDoc.id;
  } catch (err) {
    console.warn('Firestore createTask failed, storing locally:', err);
    const store = getLocalStore(uid);
    const id = generateId();
    const newTask: Task = {
      ...taskData,
      id,
      projectId,
      uid,
      createdAt: now,
      completedAt: taskData.status === 'COMPLETED' ? now : null
    };
    store.tasks.unshift(newTask);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
    return id;
  }
}

export async function createBatchTasks(uid: string, projectId: string, tasksData: Array<Omit<Task, 'id' | 'uid' | 'projectId' | 'createdAt'>>): Promise<void> {
  for (const task of tasksData) {
    await createTask(uid, projectId, task);
  }
}

export async function updateTask(uid: string, projectId: string, taskId: string, updates: Partial<Task>): Promise<void> {
  const payload: any = { ...updates };
  if (updates.status === 'COMPLETED' && !updates.completedAt) {
    payload.completedAt = Date.now();
  } else if (updates.status && updates.status !== 'COMPLETED') {
    payload.completedAt = null;
  }

  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    const idx = store.tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      store.tasks[idx] = {
        ...store.tasks[idx],
        ...payload
      };
      saveLocalStore(uid, store);
      await updateProject(uid, projectId, {});
    }
    return;
  }

  try {
    const taskDocRef = doc(db, `users/${uid}/projects/${projectId}/tasks/${taskId}`);
    await updateDoc(taskDocRef, sanitizeData(payload));
    await updateProject(uid, projectId, {});
  } catch (err) {
    console.warn('Firestore updateTask failed, updating locally:', err);
    const store = getLocalStore(uid);
    const idx = store.tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      store.tasks[idx] = {
        ...store.tasks[idx],
        ...payload
      };
      saveLocalStore(uid, store);
      await updateProject(uid, projectId, {});
    }
  }
}

export async function deleteTask(uid: string, projectId: string, taskId: string): Promise<void> {
  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    store.tasks = store.tasks.filter(t => t.id !== taskId);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
    return;
  }

  try {
    const taskDocRef = doc(db, `users/${uid}/projects/${projectId}/tasks/${taskId}`);
    await deleteDoc(taskDocRef);
    await updateProject(uid, projectId, {});
  } catch (err) {
    console.warn('Firestore deleteTask failed, deleting locally:', err);
    const store = getLocalStore(uid);
    store.tasks = store.tasks.filter(t => t.id !== taskId);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
  }
}

export function subscribeToTasks(uid: string, projectId: string, callback: (tasks: Task[]) => void): Unsubscribe {
  if (isLocalMode(uid)) {
    const handleSync = () => {
      const store = getLocalStore(uid);
      const projectTasks = store.tasks
        .filter(t => t.projectId === projectId)
        .sort((a, b) => b.createdAt - a.createdAt);
      callback(projectTasks);
    };

    handleSync();
    window.addEventListener(`projectpilot_sync_${uid}`, handleSync);
    return () => window.removeEventListener(`projectpilot_sync_${uid}`, handleSync);
  }

  try {
    const tasksRef = collection(db, `users/${uid}/projects/${projectId}/tasks`);
    const q = query(tasksRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        tasks.push(docSnap.data() as Task);
      });
      callback(tasks);
    }, (error) => {
      console.warn('Firestore subscribeToTasks error, falling back to local:', error);
      const store = getLocalStore(uid);
      callback(store.tasks.filter(t => t.projectId === projectId));
    });
  } catch (err) {
    console.warn('subscribeToTasks init error:', err);
    const store = getLocalStore(uid);
    callback(store.tasks.filter(t => t.projectId === projectId));
    return () => {};
  }
}

// ==========================================
// NOTES
// ==========================================

export async function createNote(uid: string, projectId: string, noteData: Omit<Note, 'id' | 'uid' | 'projectId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = Date.now();

  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    const id = generateId();
    const newNote: Note = {
      ...noteData,
      id,
      projectId,
      uid,
      createdAt: now,
      updatedAt: now
    };
    store.notes.unshift(newNote);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
    return id;
  }

  try {
    const notesRef = collection(db, `users/${uid}/projects/${projectId}/notes`);
    const newNoteDoc = doc(notesRef);

    const newNote: Note = {
      ...noteData,
      id: newNoteDoc.id,
      projectId,
      uid,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(newNoteDoc, sanitizeData(newNote));
    await updateProject(uid, projectId, {});
    return newNoteDoc.id;
  } catch (err) {
    console.warn('Firestore createNote failed, storing locally:', err);
    const store = getLocalStore(uid);
    const id = generateId();
    const newNote: Note = {
      ...noteData,
      id,
      projectId,
      uid,
      createdAt: now,
      updatedAt: now
    };
    store.notes.unshift(newNote);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
    return id;
  }
}

export async function updateNote(uid: string, projectId: string, noteId: string, updates: Partial<Note>): Promise<void> {
  const now = Date.now();

  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    const idx = store.notes.findIndex(n => n.id === noteId);
    if (idx !== -1) {
      store.notes[idx] = {
        ...store.notes[idx],
        ...updates,
        updatedAt: now
      };
      saveLocalStore(uid, store);
      await updateProject(uid, projectId, {});
    }
    return;
  }

  try {
    const noteDocRef = doc(db, `users/${uid}/projects/${projectId}/notes/${noteId}`);
    const payload = {
      ...updates,
      updatedAt: now
    };
    await updateDoc(noteDocRef, sanitizeData(payload));
    await updateProject(uid, projectId, {});
  } catch (err) {
    console.warn('Firestore updateNote failed, updating locally:', err);
    const store = getLocalStore(uid);
    const idx = store.notes.findIndex(n => n.id === noteId);
    if (idx !== -1) {
      store.notes[idx] = {
        ...store.notes[idx],
        ...updates,
        updatedAt: now
      };
      saveLocalStore(uid, store);
      await updateProject(uid, projectId, {});
    }
  }
}

export async function deleteNote(uid: string, projectId: string, noteId: string): Promise<void> {
  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    store.notes = store.notes.filter(n => n.id !== noteId);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
    return;
  }

  try {
    const noteDocRef = doc(db, `users/${uid}/projects/${projectId}/notes/${noteId}`);
    await deleteDoc(noteDocRef);
    await updateProject(uid, projectId, {});
  } catch (err) {
    console.warn('Firestore deleteNote failed, deleting locally:', err);
    const store = getLocalStore(uid);
    store.notes = store.notes.filter(n => n.id !== noteId);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
  }
}

export function subscribeToNotes(uid: string, projectId: string, callback: (notes: Note[]) => void): Unsubscribe {
  if (isLocalMode(uid)) {
    const handleSync = () => {
      const store = getLocalStore(uid);
      const projectNotes = store.notes
        .filter(n => n.projectId === projectId)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      callback(projectNotes);
    };

    handleSync();
    window.addEventListener(`projectpilot_sync_${uid}`, handleSync);
    return () => window.removeEventListener(`projectpilot_sync_${uid}`, handleSync);
  }

  try {
    const notesRef = collection(db, `users/${uid}/projects/${projectId}/notes`);
    const q = query(notesRef, orderBy('updatedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const notes: Note[] = [];
      snapshot.forEach((docSnap) => {
        notes.push(docSnap.data() as Note);
      });
      callback(notes);
    }, (error) => {
      console.warn('Firestore subscribeToNotes error, falling back to local:', error);
      const store = getLocalStore(uid);
      callback(store.notes.filter(n => n.projectId === projectId));
    });
  } catch (err) {
    console.warn('subscribeToNotes init error:', err);
    const store = getLocalStore(uid);
    callback(store.notes.filter(n => n.projectId === projectId));
    return () => {};
  }
}

// ==========================================
// DECISIONS (ADRs)
// ==========================================

export async function createDecision(uid: string, projectId: string, decisionData: Omit<Decision, 'id' | 'uid' | 'projectId' | 'createdAt'>): Promise<string> {
  const now = Date.now();

  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    const id = generateId();
    const newDecision: Decision = {
      ...decisionData,
      id,
      projectId,
      uid,
      createdAt: now
    };
    store.decisions.unshift(newDecision);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
    return id;
  }

  try {
    const decisionsRef = collection(db, `users/${uid}/projects/${projectId}/decisions`);
    const newDoc = doc(decisionsRef);

    const newDecision: Decision = {
      ...decisionData,
      id: newDoc.id,
      projectId,
      uid,
      createdAt: now
    };

    await setDoc(newDoc, sanitizeData(newDecision));
    await updateProject(uid, projectId, {});
    return newDoc.id;
  } catch (err) {
    console.warn('Firestore createDecision failed, saving locally:', err);
    const store = getLocalStore(uid);
    const id = generateId();
    const newDecision: Decision = {
      ...decisionData,
      id,
      projectId,
      uid,
      createdAt: now
    };
    store.decisions.unshift(newDecision);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
    return id;
  }
}

export async function deleteDecision(uid: string, projectId: string, decisionId: string): Promise<void> {
  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    store.decisions = store.decisions.filter(d => d.id !== decisionId);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
    return;
  }

  try {
    const docRef = doc(db, `users/${uid}/projects/${projectId}/decisions/${decisionId}`);
    await deleteDoc(docRef);
    await updateProject(uid, projectId, {});
  } catch (err) {
    console.warn('Firestore deleteDecision failed, deleting locally:', err);
    const store = getLocalStore(uid);
    store.decisions = store.decisions.filter(d => d.id !== decisionId);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
  }
}

export function subscribeToDecisions(uid: string, projectId: string, callback: (decisions: Decision[]) => void): Unsubscribe {
  if (isLocalMode(uid)) {
    const handleSync = () => {
      const store = getLocalStore(uid);
      const projectDecisions = store.decisions
        .filter(d => d.projectId === projectId)
        .sort((a, b) => b.createdAt - a.createdAt);
      callback(projectDecisions);
    };

    handleSync();
    window.addEventListener(`projectpilot_sync_${uid}`, handleSync);
    return () => window.removeEventListener(`projectpilot_sync_${uid}`, handleSync);
  }

  try {
    const decisionsRef = collection(db, `users/${uid}/projects/${projectId}/decisions`);
    const q = query(decisionsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const decisions: Decision[] = [];
      snapshot.forEach((docSnap) => {
        decisions.push(docSnap.data() as Decision);
      });
      callback(decisions);
    }, (error) => {
      console.warn('Firestore subscribeToDecisions error, falling back to local:', error);
      const store = getLocalStore(uid);
      callback(store.decisions.filter(d => d.projectId === projectId));
    });
  } catch (err) {
    console.warn('subscribeToDecisions init error:', err);
    const store = getLocalStore(uid);
    callback(store.decisions.filter(d => d.projectId === projectId));
    return () => {};
  }
}

// ==========================================
// EXPERIMENTS
// ==========================================

export async function createExperiment(uid: string, projectId: string, expData: Omit<Experiment, 'id' | 'uid' | 'projectId' | 'createdAt'>): Promise<string> {
  const now = Date.now();

  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    const id = generateId();
    const newExperiment: Experiment = {
      ...expData,
      id,
      projectId,
      uid,
      createdAt: now
    };
    store.experiments.unshift(newExperiment);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
    return id;
  }

  try {
    const expRef = collection(db, `users/${uid}/projects/${projectId}/experiments`);
    const newDoc = doc(expRef);

    const newExperiment: Experiment = {
      ...expData,
      id: newDoc.id,
      projectId,
      uid,
      createdAt: now
    };

    await setDoc(newDoc, sanitizeData(newExperiment));
    await updateProject(uid, projectId, {});
    return newDoc.id;
  } catch (err) {
    console.warn('Firestore createExperiment failed, storing locally:', err);
    const store = getLocalStore(uid);
    const id = generateId();
    const newExperiment: Experiment = {
      ...expData,
      id,
      projectId,
      uid,
      createdAt: now
    };
    store.experiments.unshift(newExperiment);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
    return id;
  }
}

export async function updateExperiment(uid: string, projectId: string, expId: string, updates: Partial<Experiment>): Promise<void> {
  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    const idx = store.experiments.findIndex(e => e.id === expId);
    if (idx !== -1) {
      store.experiments[idx] = {
        ...store.experiments[idx],
        ...updates
      };
      saveLocalStore(uid, store);
      await updateProject(uid, projectId, {});
    }
    return;
  }

  try {
    const docRef = doc(db, `users/${uid}/projects/${projectId}/experiments/${expId}`);
    await updateDoc(docRef, sanitizeData(updates));
    await updateProject(uid, projectId, {});
  } catch (err) {
    console.warn('Firestore updateExperiment failed, updating locally:', err);
    const store = getLocalStore(uid);
    const idx = store.experiments.findIndex(e => e.id === expId);
    if (idx !== -1) {
      store.experiments[idx] = {
        ...store.experiments[idx],
        ...updates
      };
      saveLocalStore(uid, store);
      await updateProject(uid, projectId, {});
    }
  }
}

export async function deleteExperiment(uid: string, projectId: string, expId: string): Promise<void> {
  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    store.experiments = store.experiments.filter(e => e.id !== expId);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
    return;
  }

  try {
    const docRef = doc(db, `users/${uid}/projects/${projectId}/experiments/${expId}`);
    await deleteDoc(docRef);
    await updateProject(uid, projectId, {});
  } catch (err) {
    console.warn('Firestore deleteExperiment failed, deleting locally:', err);
    const store = getLocalStore(uid);
    store.experiments = store.experiments.filter(e => e.id !== expId);
    saveLocalStore(uid, store);
    await updateProject(uid, projectId, {});
  }
}

export function subscribeToExperiments(uid: string, projectId: string, callback: (exps: Experiment[]) => void): Unsubscribe {
  if (isLocalMode(uid)) {
    const handleSync = () => {
      const store = getLocalStore(uid);
      const projectExps = store.experiments
        .filter(e => e.projectId === projectId)
        .sort((a, b) => b.createdAt - a.createdAt);
      callback(projectExps);
    };

    handleSync();
    window.addEventListener(`projectpilot_sync_${uid}`, handleSync);
    return () => window.removeEventListener(`projectpilot_sync_${uid}`, handleSync);
  }

  try {
    const expRef = collection(db, `users/${uid}/projects/${projectId}/experiments`);
    const q = query(expRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const exps: Experiment[] = [];
      snapshot.forEach((docSnap) => {
        exps.push(docSnap.data() as Experiment);
      });
      callback(exps);
    }, (error) => {
      console.warn('Firestore subscribeToExperiments error, falling back to local:', error);
      const store = getLocalStore(uid);
      callback(store.experiments.filter(e => e.projectId === projectId));
    });
  } catch (err) {
    console.warn('subscribeToExperiments init error:', err);
    const store = getLocalStore(uid);
    callback(store.experiments.filter(e => e.projectId === projectId));
    return () => {};
  }
}

// ==========================================
// CONVERSATIONS & CHAT MESSAGES
// ==========================================

export async function createConversation(uid: string, projectId: string, title: string, role?: string): Promise<string> {
  const now = Date.now();

  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    const id = generateId();
    const newConv: Conversation = {
      id,
      projectId,
      uid,
      title,
      role: role as any,
      createdAt: now,
      updatedAt: now
    };
    store.conversations.unshift(newConv);
    saveLocalStore(uid, store);
    return id;
  }

  try {
    const convsRef = collection(db, `users/${uid}/projects/${projectId}/conversations`);
    const newDoc = doc(convsRef);

    const newConv: Conversation = {
      id: newDoc.id,
      projectId,
      uid,
      title,
      role: role as any,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(newDoc, sanitizeData(newConv));
    return newDoc.id;
  } catch (err) {
    console.warn('Firestore createConversation failed, saving locally:', err);
    const store = getLocalStore(uid);
    const id = generateId();
    const newConv: Conversation = {
      id,
      projectId,
      uid,
      title,
      role: role as any,
      createdAt: now,
      updatedAt: now
    };
    store.conversations.unshift(newConv);
    saveLocalStore(uid, store);
    return id;
  }
}


export async function deleteConversation(uid: string, projectId: string, conversationId: string): Promise<void> {
  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    store.conversations = store.conversations.filter(c => c.id !== conversationId);
    store.messages = store.messages.filter(m => m.conversationId !== conversationId);
    saveLocalStore(uid, store);
    return;
  }

  try {
    const docRef = doc(db, `users/${uid}/projects/${projectId}/conversations/${conversationId}`);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteConversation failed, deleting locally:', err);
    const store = getLocalStore(uid);
    store.conversations = store.conversations.filter(c => c.id !== conversationId);
    store.messages = store.messages.filter(m => m.conversationId !== conversationId);
    saveLocalStore(uid, store);
  }
}

export function subscribeToConversations(uid: string, projectId: string, callback: (convs: Conversation[]) => void): Unsubscribe {
  if (isLocalMode(uid)) {
    const handleSync = () => {
      const store = getLocalStore(uid);
      const projectConvs = store.conversations
        .filter(c => c.projectId === projectId)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      callback(projectConvs);
    };

    handleSync();
    window.addEventListener(`projectpilot_sync_${uid}`, handleSync);
    return () => window.removeEventListener(`projectpilot_sync_${uid}`, handleSync);
  }

  try {
    const convsRef = collection(db, `users/${uid}/projects/${projectId}/conversations`);
    const q = query(convsRef, orderBy('updatedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const convs: Conversation[] = [];
      snapshot.forEach((docSnap) => {
        convs.push(docSnap.data() as Conversation);
      });
      callback(convs);
    }, (error) => {
      console.warn('Firestore subscribeToConversations error, falling back to local:', error);
      const store = getLocalStore(uid);
      callback(store.conversations.filter(c => c.projectId === projectId));
    });
  } catch (err) {
    console.warn('subscribeToConversations init error:', err);
    const store = getLocalStore(uid);
    callback(store.conversations.filter(c => c.projectId === projectId));
    return () => {};
  }
}

export async function addChatMessage(
  uid: string, 
  projectId: string, 
  conversationId: string, 
  role: 'user' | 'assistant', 
  content: string,
  extra?: {
    modelUsed?: string;
    groundingSources?: any[];
    webSearchQueries?: string[];
  }
): Promise<string> {
  const now = Date.now();

  if (isLocalMode(uid)) {
    const store = getLocalStore(uid);
    const id = generateId();
    const message: ChatMessage = {
      id,
      conversationId,
      projectId,
      uid,
      role,
      content,
      modelUsed: extra?.modelUsed,
      groundingSources: extra?.groundingSources,
      webSearchQueries: extra?.webSearchQueries,
      timestamp: now
    };
    store.messages.push(message);

    const convIdx = store.conversations.findIndex(c => c.id === conversationId);
    if (convIdx !== -1) {
      store.conversations[convIdx].updatedAt = now;
    }

    saveLocalStore(uid, store);
    return id;
  }

  try {
    const messagesRef = collection(db, `users/${uid}/projects/${projectId}/conversations/${conversationId}/messages`);
    const newDoc = doc(messagesRef);

    const message: ChatMessage = {
      id: newDoc.id,
      conversationId,
      projectId,
      uid,
      role,
      content,
      modelUsed: extra?.modelUsed,
      groundingSources: extra?.groundingSources,
      webSearchQueries: extra?.webSearchQueries,
      timestamp: now
    };

    await setDoc(newDoc, sanitizeData(message));

    // Update conversation updatedAt
    const convDocRef = doc(db, `users/${uid}/projects/${projectId}/conversations/${conversationId}`);
    await updateDoc(convDocRef, { updatedAt: now });

    return newDoc.id;
  } catch (err) {
    console.warn('Firestore addChatMessage failed, saving locally:', err);
    const store = getLocalStore(uid);
    const id = generateId();
    const message: ChatMessage = {
      id,
      conversationId,
      projectId,
      uid,
      role,
      content,
      modelUsed: extra?.modelUsed,
      groundingSources: extra?.groundingSources,
      webSearchQueries: extra?.webSearchQueries,
      timestamp: now
    };
    store.messages.push(message);

    const convIdx = store.conversations.findIndex(c => c.id === conversationId);
    if (convIdx !== -1) {
      store.conversations[convIdx].updatedAt = now;
    }

    saveLocalStore(uid, store);
    return id;
  }
}

export function subscribeToMessages(uid: string, projectId: string, conversationId: string, callback: (messages: ChatMessage[]) => void): Unsubscribe {
  if (isLocalMode(uid)) {
    const handleSync = () => {
      const store = getLocalStore(uid);
      const convMsgs = store.messages
        .filter(m => m.conversationId === conversationId)
        .sort((a, b) => a.timestamp - b.timestamp);
      callback(convMsgs);
    };

    handleSync();
    window.addEventListener(`projectpilot_sync_${uid}`, handleSync);
    return () => window.removeEventListener(`projectpilot_sync_${uid}`, handleSync);
  }

  try {
    const messagesRef = collection(db, `users/${uid}/projects/${projectId}/conversations/${conversationId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        msgs.push(docSnap.data() as ChatMessage);
      });
      callback(msgs);
    }, (error) => {
      console.warn('Firestore subscribeToMessages error, falling back to local:', error);
      const store = getLocalStore(uid);
      callback(store.messages.filter(m => m.conversationId === conversationId));
    });
  } catch (err) {
    console.warn('subscribeToMessages init error:', err);
    const store = getLocalStore(uid);
    callback(store.messages.filter(m => m.conversationId === conversationId));
    return () => {};
  }
}
