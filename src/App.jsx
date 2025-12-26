import React, { useState, useEffect, useMemo } from 'react';
import {
    Telescope, Users, CheckCircle, Plus, ExternalLink, Menu, X,
    ChevronRight, Save, User, Download, Shield, Lock, Bell, LogOut,
    MessageSquare, UserPlus, ThumbsUp, XCircle, Trash2, Mail,
    LayoutGrid, Rocket, Microscope, ArrowRight
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    addDoc,
    getDoc,
    onSnapshot,
    updateDoc,
    arrayUnion,
    arrayRemove,
    query,
    where,
    deleteDoc,
    writeBatch
} from "firebase/firestore";

/* --- FIREBASE CONFIGURATION ---
   Paste your config object here from the Firebase Console.
*/
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'esss-csp-portal';

/* --- HELPER FUNCTIONS --- */
const createNotification = async (recipientUid, message, type = 'info') => {
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), {
            recipientId: recipientUid, message, read: false, type, createdAt: Date.now()
        });
    } catch (e) { console.error(e); }
};

// import emailjs from '@emailjs/browser'; // Removed

// Email Template
const getHtmlEmail = (toName, title, bodyText) => {
    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 4px solid #2563eb;">
            <img src="https://i.ibb.co/fYR7CZBP/CSP-Logo-CSP-White-En.png" alt="ESSS CSP Logo" style="height: 40px;" />
        </div>
        <div style="padding: 40px; background-color: #ffffff;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 24px; margin-bottom: 20px;">${title}</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #475569;">Hello <strong>${toName}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 30px;">${bodyText.replace(/\n/g, '<br/>')}</p>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="https://csp-asteroid-hunters.web.app/" style="background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.2s;">Open CSP Portal</a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                © ${new Date().getFullYear()} ESSS Citizen Science Portal.<br/>
                Ethiopian Space Science Society<br/>
                <span style="opacity: 0.7;">Automated Notification System</span>
            </p>
        </div>
    </div>
    `;
};

const sendAutoEmail = (toName, toEmail, subject, messageBody, title) => {
    if (!toEmail) return;

    // Fallback if URL is not set
    if (!import.meta.env.VITE_GOOGLE_SCRIPT_URL) {
        console.warn("Google Script URL missing. Skipping email to:", toEmail);
        return;
    }

    const htmlContent = getHtmlEmail(toName, title || subject, messageBody);

    fetch(import.meta.env.VITE_GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: toEmail,
            subject: subject,
            message: htmlContent // Sending HTML string
        })
    }).then(() => console.log("Email request sent"))
        .catch(err => console.error("Email request failed", err));
};

const downloadReport = (filename, content) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};
const validateMPCReport = (text) => {
    if (!text) return { valid: false, message: "Report is empty." };

    // 1. Filter out known footer/headers that are not part of logic
    const lines = text.split('\n').map(l => l.trimEnd()); // Standardize
    const contentLines = lines.filter(l => l.trim() !== '----- end -----' && l.trim() !== '');

    // 2. Header Check
    const requiredHeaders = ['COD', 'OBS', 'MEA', 'TEL', 'ACK', 'NET'];
    const missing = requiredHeaders.filter(h => !contentLines.some(l => l.startsWith(h)));
    if (missing.length > 0) return { valid: false, message: `Missing headers: ${missing.join(', ')}` };

    // 3. Object Line Checks
    const headerParams = ['COD', 'CON', 'OBS', 'MEA', 'TEL', 'ACK', 'NET', 'COM', 'NUM'];
    const objectLines = contentLines.filter(l => !headerParams.some(h => l.startsWith(h)));

    if (objectLines.length === 0) return { valid: false, message: "No object lines found." };

    const seenObjects = new Set();

    for (const line of objectLines) {
        // A. Length Check (Permissive but typical MPC is 80)
        if (line.length < 15) continue; // Skip noise

        // B. Column C check (Pos 14, 0-indexed)
        if (line[14] !== 'C' && line[14] !== 'P') { // C for Century, P sometimes used
            // Using logic from request: "Check that the character at position 14 is C"
            if (line[14] !== 'C') return { valid: false, message: "Column alignment error: Expected 'C' at position 15." };
        }

        // C. Duplicate Check
        // Name is approx chars 0-12, Timestamp is chars 15-32 (Date columns)
        // Standard fixed format: K23A01  C2023 01 01.12345
        // Designation: 0-12. Date: 15-31.
        const designation = line.substring(0, 12).trim();
        const dateStr = line.substring(15, 32).trim();
        const key = `${designation}_${dateStr}`;

        if (seenObjects.has(key)) {
            return { valid: false, message: `CRITICAL: Duplicate entry for ${designation} at ${dateStr}` };
        }
        seenObjects.add(key);
    }

    return { valid: true, message: "Valid MPC Format" };
};

const RoleBadge = ({ role }) => {
    const styles = { admin: "bg-red-900/50 text-red-200 border-red-700", moderator: "bg-purple-900/50 text-purple-200 border-purple-700", volunteer: "bg-blue-900/50 text-blue-200 border-blue-700" };
    return <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${styles[role] || styles.volunteer}`}>{role || 'volunteer'}</span>;
};

/* --- SUB-APP: ASTEROID CAMPAIGN TOOL --- */
function AsteroidTool({ user, userProfile }) {
    const [view, setView] = useState('dashboard');
    const [campaigns, setCampaigns] = useState([]);
    const [imageSets, setImageSets] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [selectedSetForAction, setSelectedSetForAction] = useState(null);

    // UI State
    const [showAddCampaign, setShowAddCampaign] = useState(false);
    const [showAddSet, setShowAddSet] = useState(false);
    const [showSubmitReport, setShowSubmitReport] = useState(false);
    const [showManageAccess, setShowManageAccess] = useState(false);
    const [validationStatus, setValidationStatus] = useState(null); // { valid: bool, message: str }
    const [rejectingSetId, setRejectingSetId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Forms
    const [newCampaignName, setNewCampaignName] = useState('');
    const [newSetName, setNewSetName] = useState('');
    const [newSetLink, setNewSetLink] = useState('');
    const [reportText, setReportText] = useState('');
    const [objectsFound, setObjectsFound] = useState('');
    const [newComment, setNewComment] = useState('');

    const isAdmin = userProfile?.role === 'admin';
    const isModerator = userProfile?.role === 'moderator' || isAdmin;

    // Email Batching Refs
    const emailBatches = React.useRef({});
    const emailTimers = React.useRef({});

    // Derived State for Real-time Updates
    const activeCampaignData = useMemo(() =>
        selectedCampaign ? campaigns.find(c => c.id === selectedCampaign.id) || selectedCampaign : null
        , [selectedCampaign, campaigns]);

    // Listeners
    useEffect(() => {
        const unsubCamps = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'campaigns'), (snap) => setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)));
        const unsubSets = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'image_sets'), (snap) => setImageSets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'hunters'), (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { unsubCamps(); unsubSets(); unsubUsers(); };
    }, []);

    useEffect(() => {
        if (selectedSetForAction) {
            setObjectsFound(selectedSetForAction.objectsFound || '');
            setReportText(selectedSetForAction.reportContent || '');
            setValidationStatus(null);
        }
    }, [selectedSetForAction]);

    // Actions
    const createCampaign = async () => {
        if (!newCampaignName.trim() || !isAdmin) return;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'campaigns'), { name: newCampaignName, createdAt: Date.now(), status: 'Active', createdBy: userProfile.name, participants: [user.uid], requests: [] });
        setNewCampaignName(''); setShowAddCampaign(false);
    };

    const requestAccess = async (campId) => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'campaigns', campId), { requests: arrayUnion(user.uid) });
        users.filter(u => u.role === 'admin').forEach(a => createNotification(a.uid, `${userProfile.name} requested access.`, 'alert'));
    };

    const manageRequest = async (campId, reqId, action) => {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'campaigns', campId);
        if (action === 'accept') {
            await updateDoc(ref, { participants: arrayUnion(reqId), requests: arrayRemove(reqId) });
            createNotification(reqId, `Access granted to ${campaigns.find(c => c.id === campId)?.name}`, 'success');
            const h = users.find(u => u.uid === reqId);
            if (h?.email) sendAutoEmail(h.name, h.email, "Access Granted - CSP Portal", `You have been granted access to the campaign: <strong>${campaigns.find(c => c.id === campId)?.name}</strong>.\n\nYou can now log in to the portal and claim image sets.`, "Welcome to the Team!");
        } else await updateDoc(ref, { requests: arrayRemove(reqId) });
    };

    const createImageSets = async () => {
        if (!newSetName.trim() || !activeCampaignData || !isModerator) return;
        const lines = newSetName.split('\n').filter(l => l.trim().length > 0);
        for (const line of lines) {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'image_sets'), { campaignId: activeCampaignData.id, name: line.trim(), downloadLink: newSetLink || '#', status: 'Unassigned', assigneeName: null, assigneeId: null, comments: [], createdAt: Date.now() });
        }
        setNewSetName(''); setShowAddSet(false);
    };

    const flushEmailQueue = (hunterId) => {
        const batch = emailBatches.current[hunterId];
        if (!batch || batch.length === 0) return;

        const h = users.find(u => u.uid === hunterId);
        if (h?.email) {
            const setList = batch.map(name => `<li><strong>${name}</strong></li>`).join('');
            const message = `You have been assigned ${batch.length} new image set(s):
            <ul style="margin: 20px 0; padding-left: 20px;">${setList}</ul>
            Please download the data and begin your analysis.`;

            sendAutoEmail(h.name, h.email, "New Missions Assigned - CSP Portal", message, "New Assignments");
        }

        // Clear
        delete emailBatches.current[hunterId];
        delete emailTimers.current[hunterId];
    };

    const assignSet = async (setId, hunterId, hunterName) => {
        const setName = imageSets.find(s => s.id === setId)?.name;
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'image_sets', setId), { assigneeId: hunterId, assigneeName: hunterName, status: 'Assigned', assignedAt: Date.now() });
        createNotification(hunterId, `Assignment received: ${setName}`, 'action');

        // Batch Email Logic
        if (!emailBatches.current[hunterId]) emailBatches.current[hunterId] = [];
        emailBatches.current[hunterId].push(setName);

        if (emailTimers.current[hunterId]) clearTimeout(emailTimers.current[hunterId]);
        emailTimers.current[hunterId] = setTimeout(() => flushEmailQueue(hunterId), 15000); // 15 second debounce
    };

    const checkReport = (text) => {
        setReportText(text);
        setValidationStatus(validateMPCReport(text));
    };

    const submitReport = async () => {
        if (!selectedSetForAction) return;
        const validation = validateMPCReport(reportText);
        if (!validation.valid) {
            alert("Please fix report format errors before submitting.");
            return;
        }

        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'image_sets', selectedSetForAction.id), {
            reportContent: reportText,
            objectsFound: objectsFound,
            status: 'Pending Review', // Changed from Completed
            submittedAt: Date.now()
        });
        setShowSubmitReport(false);
        setValidationStatus(null);
        users.filter(u => u.role === 'admin' || u.role === 'moderator').forEach(a => createNotification(a.uid, `Report submitted by ${userProfile.name} for review.`, 'action'));
    };

    const reviewReport = async (setId, action, hunterId) => {
        if (action === 'approve') {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'image_sets', setId), { status: 'Verified', verifiedAt: Date.now() });
            createNotification(hunterId, `Your report for set ${imageSets.find(s => s.id === setId)?.name} was Verified!`, 'success');
        } else {
            // Reject with comment
            const setRef = doc(db, 'artifacts', appId, 'public', 'data', 'image_sets', setId);
            const comment = { text: `[CHANGES REQUESTED] ${rejectionReason}`, author: userProfile.name, role: userProfile.role, timestamp: Date.now() };

            await updateDoc(setRef, {
                status: 'Changes Requested', // Explicit status for UI
                comments: arrayUnion(comment)
            });
            createNotification(hunterId, `Action Required: Changes requested for set ${imageSets.find(s => s.id === setId)?.name}`, 'alert');

            const h = users.find(u => u.uid === hunterId);
            if (h?.email) sendAutoEmail(h.name, h.email, "Action Required - MPC Report", `Your report for <strong>${imageSets.find(s => s.id === setId)?.name}</strong> requires attention.\n\n<strong>Moderator Comment:</strong>\n"${rejectionReason}"\n\nPlease log in to correct and resubmit your report.`, "Changes Requested");

            setRejectingSetId(null);
            setRejectionReason('');
        }
    };

    const postComment = async () => {
        if (!newComment.trim() || !selectedSetForAction) return;
        const comment = { text: newComment, author: userProfile.name, role: userProfile.role, timestamp: Date.now() };
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'image_sets', selectedSetForAction.id), { comments: arrayUnion(comment) });
        setNewComment('');
    };

    const updateCampaignStatus = async (campId, status) => {
        if (!isAdmin) return;
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'campaigns', campId), { status });
        if (status === 'Archived') setSelectedCampaign(null);
    };

    const deleteCampaign = async (campId) => {
        if (!isAdmin || !window.confirm("Are you sure? This will delete the campaign and ALL associated image sets. This cannot be undone.")) return;

        const batch = writeBatch(db);
        const campRef = doc(db, 'artifacts', appId, 'public', 'data', 'campaigns', campId);
        batch.delete(campRef);

        // Delete all image sets for this campaign
        const setsToDelete = imageSets.filter(s => s.campaignId === campId);
        setsToDelete.forEach(s => {
            batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'image_sets', s.id));
        });

        await batch.commit();
        setSelectedCampaign(null);
        setView('dashboard');
    };

    // Filtered Views
    const campaignSets = useMemo(() => activeCampaignData ? imageSets.filter(s => s.campaignId === activeCampaignData.id) : [], [imageSets, activeCampaignData]);
    const myMissions = useMemo(() => imageSets.filter(s => s.assigneeId === user.uid && s.status !== 'Verified'), [imageSets, user]);
    const reviewQueue = useMemo(() => imageSets.filter(s => s.status === 'Pending Review'), [imageSets]);

    return (
        <div className="flex flex-col h-full">
            {/* Sub-Nav */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 flex gap-4 overflow-x-auto">
                <button onClick={() => setView('dashboard')} className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${view === 'dashboard' ? 'bg-blue-600/20 text-blue-400 border border-blue-900' : 'text-slate-400 hover:text-white'}`}><Users size={16} /> Campaigns</button>
                <button onClick={() => setView('my-missions')} className={`flex items-center gap-2 px-3 py-1 rounded text-sm relative ${view === 'my-missions' ? 'bg-blue-600/20 text-blue-400 border border-blue-900' : 'text-slate-400 hover:text-white'}`}>
                    <CheckCircle size={16} /> My Missions
                    {/* Notification Badge */}
                    {(myMissions.some(s => s.status === 'Assigned' || s.status === 'Changes Requested')) &&
                        <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                    }
                </button>
                <button onClick={() => setView('resources')} className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${view === 'resources' ? 'bg-blue-600/20 text-blue-400 border border-blue-900' : 'text-slate-400 hover:text-white'}`}><Download size={16} /> Resources</button>
                {isModerator && <button onClick={() => setView('review')} className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${view === 'review' ? 'bg-orange-900/20 text-orange-400 border border-orange-900' : 'text-slate-400 hover:text-white'}`}>
                    <Microscope size={16} /> Review {reviewQueue.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-1.5 rounded-full">{reviewQueue.length}</span>}
                </button>}
                {isAdmin && <button onClick={() => setView('team')} className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${view === 'team' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-white'}`}><Shield size={16} /> Manage Team</button>}
                {isAdmin && <button onClick={() => setView('archive')} className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${view === 'archive' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}><Save size={16} /> Archive</button>}
            </div>

            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                {/* DASHBOARD */}
                {view === 'dashboard' && !activeCampaignData && (
                    <div className="max-w-6xl mx-auto animate-fade-in">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Active Campaigns</h2>
                                <p className="text-slate-400 text-sm mt-1">Join a mission to discover asteroids.</p>
                            </div>
                            {isAdmin && <button onClick={() => setShowAddCampaign(true)} className="btn-primary px-4 py-2 rounded-lg text-sm flex gap-2 items-center font-semibold text-white"><Plus size={16} /> New Campaign</button>}
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {campaigns.filter(c => c.status !== 'Archived').map(c => (
                                <div key={c.id} className="glass-panel glass-panel-hover p-6 rounded-2xl relative group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-blue-500/10 p-3 rounded-lg"><Telescope className="text-blue-400" size={24} /></div>
                                        {c.status === 'Active' && <span className="bg-green-500/20 text-green-300 text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wide border border-green-500/30">Active</span>}
                                        {c.status === 'Ended' && <span className="bg-slate-500/20 text-slate-300 text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wide border border-slate-500/30">Ended</span>}
                                    </div>
                                    <h3 className="font-bold text-xl mb-2 text-white group-hover:text-blue-300 transition-colors">{c.name}</h3>
                                    <div className="flex justify-between items-end mt-6">
                                        <div className="text-xs text-slate-500">
                                            <div className="mb-1">Created {new Date(c.createdAt).toLocaleDateString()}</div>
                                            <div>{c.participants?.length || 0} Hunters</div>
                                        </div>
                                        {(c.participants?.includes(user.uid) || isAdmin) ?
                                            <button onClick={() => setSelectedCampaign(c)} className="bg-slate-700/50 hover:bg-blue-600 hover:text-white text-slate-300 px-4 py-2 rounded-lg text-sm transition-all font-medium">Enter Mission</button> :
                                            <button onClick={() => requestAccess(c.id)} disabled={c.requests?.includes(user.uid) || c.status === 'Ended'} className={`px-4 py-2 rounded-lg text-sm transition-all font-medium border ${c.requests?.includes(user.uid) || c.status === 'Ended' ? 'border-slate-700 text-slate-500 cursor-not-allowed' : 'border-blue-500/50 text-blue-400 hover:bg-blue-500/10'}`}>{c.status === 'Ended' ? 'Closed' : c.requests?.includes(user.uid) ? 'Pending' : 'Request Access'}</button>
                                        }
                                    </div>
                                    {c.requests?.length > 0 && isModerator && c.status !== 'Ended' && <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-lg pulse-animation">{c.requests.length}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CAMPAIGN DETAIL */}
                {view === 'dashboard' && activeCampaignData && (
                    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setSelectedCampaign(null)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"><ChevronRight className="rotate-180" size={24} /></button>
                            {isModerator && activeCampaignData.status === 'Active' && <button onClick={() => setShowAddSet(true)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors" title="Add Image Sets"><Plus size={20} /></button>}

                            <div>
                                <h2 className="text-3xl font-bold text-white">{activeCampaignData.name}</h2>
                                <p className="text-slate-400 text-sm">Campaign Dashboard</p>
                            </div>
                            <div className="flex-1" />
                            {isModerator && (activeCampaignData.requests?.length > 0) && <button onClick={() => setShowManageAccess(true)} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm flex gap-2 items-center font-bold shadow-lg shadow-red-900/20 transition-all"><UserPlus size={18} /> Review Requests ({activeCampaignData.requests.length})</button>}

                            {/* Admin Controls */}
                            {isAdmin && (
                                <div className="flex gap-2">
                                    {activeCampaignData.status === 'Active' && <button onClick={() => updateCampaignStatus(activeCampaignData.id, 'Ended')} className="bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-600/50 px-3 py-2 rounded-lg text-sm font-bold transition-all">End Campaign</button>}
                                    {activeCampaignData.status === 'Ended' && <button onClick={() => updateCampaignStatus(activeCampaignData.id, 'Active')} className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border border-green-600/50 px-3 py-2 rounded-lg text-sm font-bold transition-all">Reactivate</button>}
                                    {(activeCampaignData.status === 'Ended' || activeCampaignData.status === 'Active') && <button onClick={() => updateCampaignStatus(activeCampaignData.id, 'Archived')} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg text-sm font-bold transition-all"><Save size={16} /></button>}
                                    <button onClick={() => deleteCampaign(activeCampaignData.id)} className="bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-900/50 px-3 py-2 rounded-lg text-sm font-bold transition-all"><Trash2 size={16} /></button>
                                </div>
                            )}
                        </div>

                        <div className="glass-panel rounded-2xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-700/50"><tr><th className="px-6 py-4">Image Set</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Assigned To</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {campaignSets.map(set => (
                                        <tr key={set.id} className={`hover:bg-white/5 transition-colors cursor-pointer ${(set.assigneeId === user.uid || isModerator) ? 'hover:bg-blue-500/10' : ''}`} onClick={(e) => {
                                            // Only open if clicking the row background (not buttons) AND (user is assigned/claimed OR is moderator)
                                            if (!['BUTTON', 'SELECT', 'OPTION'].includes(e.target.tagName) && (set.assigneeId === user.uid || isModerator)) {
                                                setSelectedSetForAction(set); setShowSubmitReport(true);
                                            }
                                        }}>
                                            <td className="px-6 py-4 font-mono text-slate-300 font-medium">{set.name}</td>
                                            <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${set.status === 'Verified' ? 'bg-green-500/10 text-green-400 border-green-500/20' : set.status === 'Pending Review' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : set.status === 'Changes Requested' ? 'bg-red-500/10 text-red-400 border-red-500/20' : set.status === 'Assigned' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{set.status}</span></td>
                                            <td className="px-6 py-4 text-slate-400">{set.assigneeName || <span className="text-slate-600 italic">Unassigned</span>}</td>
                                            <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                                                <button onClick={() => { setSelectedSetForAction(set); setShowSubmitReport(true); }} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"><MessageSquare size={16} /></button>
                                                {set.status === 'Unassigned' && <button onClick={() => assignSet(set.id, user.uid, userProfile.name)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-md text-xs font-bold transition-all shadow-lg shadow-blue-900/20">Claim</button>}
                                                {isModerator && set.status !== 'Verified' && (
                                                    <select className="bg-slate-900 border border-slate-700 rounded-md text-xs py-1.5 px-2 w-32 focus:border-blue-500 outline-none transition-colors" onChange={(e) => assignSet(set.id, e.target.value, users.find(u => u.uid === e.target.value).name)}>
                                                        <option value="">{set.assigneeId ? 'Re-assign...' : 'Assign to...'}</option>{users.map(u => <option key={u.uid} value={u.uid}>{u.name}</option>)}
                                                    </select>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {campaignSets.length === 0 && <div className="p-12 text-center text-slate-500">No image sets available yet.</div>}

                            {/* Bottom Add Bar */}
                            {isModerator && activeCampaignData.status === 'Active' && (
                                <button onClick={() => setShowAddSet(true)} className="w-full bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-blue-400 py-3 uppercase text-xs font-bold tracking-widest border-t border-slate-700/50 transition-colors flex justify-center items-center gap-2">
                                    <Plus size={14} /> Add Image Sets
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* MY MISSIONS */}
                {view === 'my-missions' && (
                    <div className="max-w-4xl mx-auto space-y-4">
                        <h2 className="text-xl font-bold mb-6">My Missions</h2>
                        {myMissions.map(set => (
                            <div key={set.id} className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl flex justify-between items-center">
                                <div>
                                    <h3 className="font-mono font-bold text-lg text-white">{set.name}</h3>
                                    {set.downloadLink !== '#' && <a href={set.downloadLink} target="_blank" className="text-blue-400 text-sm flex items-center mt-1"><ExternalLink size={12} className="mr-1" /> Download</a>}
                                    <div className={`mt-2 text-xs w-fit px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${set.status === 'Assigned' ? 'bg-red-500/10 text-red-500 border-red-500/20' : set.status === 'Pending Review' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : set.status === 'Changes Requested' ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-700'}`}>
                                        {set.status === 'Assigned' ? 'New Assignment' : set.status}
                                    </div>
                                    {set.status === 'Changes Requested' && set.comments?.length > 0 && <div className="text-xs text-red-400 mt-2 font-bold flex items-center gap-1"><Shield size={10} /> Admin: {set.comments[set.comments.length - 1].text}</div>}
                                </div>
                                <button onClick={() => { setSelectedSetForAction(set); setShowSubmitReport(true); }} className={`${set.status === 'Changes Requested' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} px-5 py-2 rounded font-bold`}>{set.status === 'Changes Requested' ? 'Fix Report' : 'Report'}</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* REVIEW QUEUE */}
                {view === 'review' && isModerator && (
                    <div className="max-w-4xl mx-auto space-y-4">
                        <h2 className="text-xl font-bold mb-6">Review Queue</h2>
                        {reviewQueue.length === 0 && <p className="text-slate-500">No pending reports.</p>}
                        {reviewQueue.map(set => (
                            <div key={set.id} className="bg-slate-800/50 border border-orange-900/50 p-6 rounded-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-mono font-bold text-lg">{set.name}</h3>
                                        <p className="text-sm text-slate-400">Hunter: {set.assigneeName}</p>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <button onClick={() => downloadReport(`${set.name}.txt`, set.reportContent)} className="text-slate-400 hover:text-white p-1" title="Download Report"><Download size={16} /></button>
                                        <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'image_sets', set.id), { status: 'Verified', verifiedAt: Date.now() })} className="bg-green-600 px-3 py-1 rounded hover:bg-green-500 font-bold">Verify</button>
                                        <button onClick={() => setRejectingSetId(set.id)} className="border border-red-900 text-red-400 px-3 py-1 rounded hover:bg-red-900/20">Request Changes</button>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="text-xs text-slate-400 mb-1">Moving Objects Found:</div>
                                    <div className="bg-black/30 p-2 rounded text-sm text-white mb-3">{set.objectsFound || 'None listed'}</div>
                                    <div className="text-xs text-slate-400 mb-1">MPC Report:</div>
                                    <div className="bg-black/50 p-4 rounded font-mono text-xs text-green-400 whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">{set.reportContent || 'No content submitted'}</div>
                                </div>

                                {rejectingSetId === set.id && (
                                    <div className="mt-3 bg-red-900/10 p-3 rounded border border-red-900/50 animate-fade-in">
                                        <label className="text-xs font-bold text-red-400 mb-1 block">Reason for Rejection:</label>
                                        <textarea className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm mb-2 h-20" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Explain what needs to be fixed..." />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setRejectingSetId(null); setRejectionReason(''); }} className="text-slate-400 text-xs hover:text-white">Cancel</button>
                                            <button onClick={() => reviewReport(set.id, 'reject', set.assigneeId)} disabled={!rejectionReason.trim()} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold disabled:opacity-50">Confirm Rejection</button>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 flex justify-end">
                                    <button onClick={() => { setSelectedSetForAction(set); setShowSubmitReport(true); }} className="text-sm text-blue-400 flex items-center gap-2"><MessageSquare size={14} /> Open Comments</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* RESOURCES */}
                {view === 'resources' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-xl font-bold mb-6">Astrometrica Resources</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Download className="text-blue-500" /> Software & Config</h3>
                                <ul className="space-y-3 text-sm">
                                    <li><a href="#" className="flex justify-between items-center hover:text-blue-400">Astrometrica Setup.zip <ExternalLink size={12} /></a></li>
                                    <li><a href="#" className="flex justify-between items-center hover:text-blue-400 text-slate-300">PanSTARRS.cfg <Download size={12} /></a></li>
                                    <li><a href="#" className="flex justify-between items-center hover:text-blue-400 text-slate-300">Catalina.cfg <Download size={12} /></a></li>
                                </ul>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                                <h3 className="font-bold text-lg mb-4">Quick Guide: Blinking</h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                                    <li>Load images (Ctrl+L).</li>
                                    <li>Data Reduction (Ctrl+A).</li>
                                    <li>Blink Images (Ctrl+B).</li>
                                    <li>Look for moving objects against static stars.</li>
                                    <li>Click object to measure. Verify SNR &gt; 5.</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                )}

                {/* ARCHIVE */}
                {view === 'archive' && isAdmin && (
                    <div className="max-w-6xl mx-auto animate-fade-in">
                        <h2 className="text-3xl font-bold mb-8 text-white">Archived Campaigns</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {campaigns.filter(c => c.status === 'Archived').map(c => (
                                <div key={c.id} className="glass-panel p-6 rounded-2xl opacity-75 hover:opacity-100 transition-opacity">
                                    <div className="flex justify-between mb-4">
                                        <div className="bg-slate-700/50 p-2 rounded-lg"><Save className="text-slate-400" size={20} /></div>
                                        <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-1 rounded-full uppercase font-bold border border-slate-700">Archived</span>
                                    </div>
                                    <h3 className="font-bold text-xl mb-2 text-slate-300">{c.name}</h3>
                                    <p className="text-xs text-slate-500 mb-6">Ended: {new Date(c.createdAt).toLocaleDateString()}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => updateCampaignStatus(c.id, 'Active')} className="flex-1 bg-slate-700 hover:bg-blue-600 text-white py-2 rounded text-sm font-medium transition-colors">Restore</button>
                                        <button onClick={() => deleteCampaign(c.id)} className="px-3 bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-900/50 rounded transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                            {campaigns.filter(c => c.status === 'Archived').length === 0 && <p className="text-slate-500">No archived campaigns.</p>}
                        </div>
                    </div>
                )}

                {/* TEAM */}
                {view === 'team' && isAdmin && (
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <h2 className="text-xl font-bold mb-6">Team Roles</h2>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                            {users.map(u => (
                                <div key={u.uid} className="flex justify-between items-center p-4 border-b border-slate-700 hover:bg-slate-800">
                                    <div><div className="font-bold">{u.name}</div><div className="text-xs text-slate-500">{u.email}</div></div>
                                    <div className="flex items-center gap-4"><RoleBadge role={u.role} />
                                        {u.uid !== user.uid && (u.role === 'volunteer' ? <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hunters', u.uid), { role: 'moderator' })} className="text-xs text-purple-400 border border-purple-900 px-2 py-1 rounded">Promote</button> : <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hunters', u.uid), { role: 'volunteer' })} className="text-xs text-slate-400 border border-slate-700 px-2 py-1 rounded">Demote</button>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS (Included in wrapper) */}
            {/* 1. Create Campaign */}
            {
                showAddCampaign && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="bg-slate-900 p-6 rounded-xl border border-slate-700 w-full max-w-md">
                        <h3 className="font-bold text-xl mb-4">New Campaign</h3>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 mb-4" placeholder="Name" value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} />
                        <div className="flex justify-end gap-2"><button onClick={() => setShowAddCampaign(false)} className="text-slate-400">Cancel</button><button onClick={createCampaign} className="bg-blue-600 px-4 py-2 rounded">Create</button></div>
                    </div></div>
                )
            }
            {/* 2. Add Sets */}
            {
                showAddSet && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="bg-slate-900 p-6 rounded-xl border border-slate-700 w-full max-w-lg">
                        <h3 className="font-bold text-xl mb-2">Add Image Sets</h3>
                        <div className="flex gap-2 mb-2">
                            <input className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-sm" placeholder="Download Link (Optional)" value={newSetLink} onChange={e => setNewSetLink(e.target.value)} />
                        </div>
                        <textarea className="w-full bg-slate-950 border border-slate-800 rounded p-2 h-32 mb-4 font-mono text-sm" placeholder="Paste names (one per line)" value={newSetName} onChange={e => setNewSetName(e.target.value)} />
                        <div className="flex justify-end gap-2"><button onClick={() => setShowAddSet(false)} className="text-slate-400">Cancel</button><button onClick={createImageSets} className="bg-blue-600 px-4 py-2 rounded">Add</button></div>
                    </div></div>
                )
            }
            {/* 3. Requests */}
            {
                showManageAccess && activeCampaignData && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"><div className="glass-panel p-6 rounded-2xl w-full max-w-md">
                        <h3 className="font-bold text-xl mb-6 text-white border-b border-white/10 pb-2">Access Requests</h3>
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {activeCampaignData.requests?.length === 0 && <p className="text-slate-400 text-center py-4">No pending requests.</p>}
                            {(activeCampaignData.requests || []).map(reqId => (
                                <div key={reqId} className="flex justify-between bg-white/5 p-4 rounded-xl items-center border border-white/5 hover:border-white/10 transition-colors">
                                    <span className="font-medium text-slate-200">{users.find(u => u.uid === reqId)?.name || 'Unknown'}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => manageRequest(activeCampaignData.id, reqId, 'accept')} className="bg-green-500/20 hover:bg-green-500/40 text-green-400 p-2 rounded-lg transition-colors"><ThumbsUp size={18} /></button>
                                        <button onClick={() => manageRequest(activeCampaignData.id, reqId, 'reject')} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-2 rounded-lg transition-colors"><XCircle size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowManageAccess(false)} className="w-full mt-6 bg-slate-700/50 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-all">Close</button>
                    </div></div>
                )
            }
            {/* 4. Report */}
            {
                showSubmitReport && selectedSetForAction && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-slate-900 p-6 rounded-xl border border-slate-700 w-full max-w-3xl flex flex-col max-h-[90vh]">
                        <div className="flex justify-between mb-4"><h3 className="font-bold text-xl">Details</h3><button onClick={() => setShowSubmitReport(false)}><X /></button></div>
                        <div className="grid md:grid-cols-2 gap-6 flex-1 overflow-y-auto">
                            <div className="space-y-4">
                                {(selectedSetForAction.assigneeId === user.uid || isModerator) ? (
                                    <>
                                        <div><label className="text-xs font-bold text-slate-400">Objects</label><input className="w-full bg-slate-950 border border-slate-800 rounded p-2" value={objectsFound} onChange={e => setObjectsFound(e.target.value)} /></div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400">Report (MPC Format)</label>
                                            <textarea className="w-full bg-slate-950 border border-slate-800 rounded p-2 h-32 font-mono text-xs" value={reportText} onChange={e => checkReport(e.target.value)} />
                                            {validationStatus && (
                                                <div className={`text-[10px] mt-1 flex items-center gap-1 ${validationStatus.valid ? 'text-green-500' : 'text-red-500'}`}>
                                                    {validationStatus.valid ? <CheckCircle size={10} /> : <XCircle size={10} />} {validationStatus.message}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={submitReport} disabled={validationStatus && !validationStatus.valid} className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-500 py-2 rounded font-bold transition-colors">
                                                {selectedSetForAction.status === 'Verified' ? 'Update Report' : 'Submit Report'}
                                            </button>
                                            {reportText && <button onClick={() => downloadReport(`${selectedSetForAction.name}_report.txt`, reportText)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded transition-colors" title="Download Report"><Download /></button>}
                                        </div>
                                    </>
                                ) : <div className="p-4 bg-slate-950 rounded text-center text-slate-500">Read Only</div>}
                            </div>
                            <div className="flex flex-col">
                                <div className="flex-1 bg-slate-950 rounded p-2 mb-2 overflow-y-auto min-h-[150px]">
                                    {selectedSetForAction.comments?.map((c, i) => <div key={i} className="mb-2 text-sm"><span className="font-bold text-blue-400">{c.author}</span>: {c.text}</div>)}
                                </div>
                                <div className="flex gap-2"><input className="flex-1 bg-slate-800 rounded px-2" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Comment..." /><button onClick={postComment}><MessageSquare /></button></div>
                            </div>
                        </div>
                    </div></div>
                )
            }
        </div >
    );
}

/* --- SUB-APP: GALAXY ZOO --- */
function GalaxyZoo({ userProfile }) {
    const [classification, setClassification] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const handleClassify = (type) => {
        setClassification(type);
        setSubmitted(false);
    };

    const handleSubmit = () => {
        setSubmitted(true);
        // In real app, save to Firebase
        setTimeout(() => {
            setClassification(null);
            setSubmitted(false);
        }, 2000);
    };

    return (
        <div className="h-full overflow-y-auto p-6 flex flex-col items-center">
            <div className="max-w-4xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Rocket className="text-purple-500" /> Galaxy Zoo
                    </h2>
                    <div className="text-slate-400 text-sm">Citizen Science Project #2</div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-black rounded-xl overflow-hidden aspect-video relative border border-slate-800 flex items-center justify-center">
                        {/* Placeholder for galaxy image */}
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-80"></div>
                        <div className="z-10 bg-black/50 p-4 rounded backdrop-blur-sm text-center">
                            <h3 className="text-xl font-bold mb-1">Subject #84920</h3>
                            <p className="text-xs text-slate-300">Hubble Deep Field Survey</p>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col">
                        <h3 className="font-bold mb-4">Classify this Object</h3>

                        {!submitted ? (
                            <div className="space-y-3 flex-1">
                                <p className="text-sm text-slate-400 mb-4">What shape is the galaxy in the center?</p>
                                {[
                                    { id: 'smooth', label: 'Smooth', desc: 'No disk or spiral arms' },
                                    { id: 'features', label: 'Features', desc: 'Disk or spiral arms visible' },
                                    { id: 'star', label: 'Star / Artifact', desc: 'Not a galaxy' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleClassify(opt.id)}
                                        className={`w-full text-left p-3 rounded border transition-all ${classification === opt.id ? 'bg-purple-900/50 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-300'}`}
                                    >
                                        <div className="font-bold text-sm">{opt.label}</div>
                                        <div className="text-xs opacity-70">{opt.desc}</div>
                                    </button>
                                ))}

                                <button
                                    disabled={!classification}
                                    onClick={handleSubmit}
                                    className={`w-full mt-6 py-3 rounded font-bold ${classification ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                >
                                    Submit Classification
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
                                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="font-bold text-lg text-white mb-2">Thank you!</h3>
                                <p className="text-slate-400 text-sm">Your classification helps astronomers understand galaxy evolution.</p>
                                <p className="text-xs text-slate-600 mt-8">Loading next subject...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* --- MAIN PORTAL APP --- */
export default function CSPPortal() {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initError, setInitError] = useState(null);
    const [activeModule, setActiveModule] = useState('home'); // home, asteroid, galaxy
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                setUser(currentUser);
                if (currentUser) {
                    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'hunters', currentUser.uid);
                    const snapshot = await getDoc(userRef);
                    if (snapshot.exists()) {
                        setUserProfile(snapshot.data());
                    } else {
                        const newProfile = { name: currentUser.displayName || 'Volunteer', email: currentUser.email, role: 'volunteer', uid: currentUser.uid, createdAt: Date.now() };
                        await setDoc(userRef, newProfile);
                        setUserProfile(newProfile);
                    }

                    // Listen to notifications
                    const qNotifs = query(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), where('recipientId', '==', currentUser.uid));
                    onSnapshot(qNotifs, (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)));

                    // Auto-promote first user
                    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'hunters'), (snap) => {
                        const all = snap.docs.map(d => d.data());
                        if (all.length === 1 && all[0].uid === currentUser.uid && all[0].role !== 'admin') {
                            updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hunters', currentUser.uid), { role: 'admin' });
                        }
                    });

                } else {
                    setUserProfile(null);
                }
            } catch (err) {
                console.error("Initialization error:", err);
                setInitError("Failed to initialize portal: " + err.message);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => { await signOut(auth); setUser(null); };

    if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Loading CSP Portal...</div>;

    if (initError) return (
        <div className="h-screen bg-slate-950 flex items-center justify-center text-red-400 p-8 text-center">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl max-w-md w-full">
                <h1 className="text-2xl font-bold mb-4">Initialization Error</h1>
                <p className="mb-4">{initError}</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white">Retry Connection</button>
            </div>
        </div>
    );

    if (!user) {
        return (
            <div className="h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl max-w-md w-full text-center">
                    <div className="flex justify-center mb-8 animate-fade-in"><img src="https://i.ibb.co/fYR7CZBP/CSP-Logo-CSP-White-En.png" alt="ESSS CSP" className="h-16 object-contain" /></div>
                    <h1 className="text-3xl font-bold mb-2">Citizen Science Portal</h1>
                    <p className="text-slate-400 mb-8">Access all Citizen Science Projects</p>
                    <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} className="w-full bg-white text-slate-900 font-bold py-3 rounded hover:bg-slate-200">Sign in with Google</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-deep-space text-slate-100 overflow-hidden relative">
            <div className="bg-space-animation"></div>
            <div className="stars"></div>

            {/* PORTAL SIDEBAR */}
            <div className="w-64 glass-panel border-r-0 border-r-white/5 flex flex-col z-20 relative">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8"><img src="https://i.ibb.co/fYR7CZBP/CSP-Logo-CSP-White-En.png" alt="ESSS CSP" className="h-8 object-contain" /></div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Projects</div>
                    <nav className="space-y-1">
                        <button onClick={() => setActiveModule('home')} className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left ${activeModule === 'home' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>
                            <LayoutGrid size={18} /> Home
                        </button>
                        <button onClick={() => setActiveModule('asteroid')} className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left ${activeModule === 'asteroid' ? 'bg-blue-600/20 text-blue-400 border border-blue-900' : 'text-slate-400 hover:text-white'}`}>
                            <Telescope size={18} /> Asteroid Search
                        </button>
                        {/* Future Modules */}
                        <button onClick={() => setActiveModule('galaxy')} className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left ${activeModule === 'galaxy' ? 'bg-purple-600/20 text-purple-400 border border-purple-900' : 'text-slate-400 hover:text-white'}`}>
                            <Rocket size={18} /> Galaxy Zoo <span className="text-[9px] border border-green-900 text-green-400 bg-green-900/20 px-1 rounded ml-auto">NEW</span>
                        </button>
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-slate-800">
                    <button onClick={() => setShowNotifications(true)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 relative w-full">
                        <Bell size={16} /> Notifications
                        {notifications.filter(n => !n.read).length > 0 && <span className="bg-red-500 w-2 h-2 rounded-full absolute top-0 left-3"></span>}
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">{userProfile?.name?.[0]}</div>
                        <div className="flex-1 overflow-hidden">
                            <div className="truncate text-sm font-bold">{userProfile?.name}</div>
                            <RoleBadge role={userProfile?.role} />
                        </div>
                        <button onClick={handleLogout}><LogOut size={16} className="text-slate-500 hover:text-white" /></button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {activeModule === 'home' && (
                    <div className="p-8 max-w-4xl mx-auto w-full animate-fade-in">
                        <h1 className="text-3xl font-bold mb-2">Welcome, {userProfile?.name}</h1>
                        <p className="text-slate-400 mb-8">Select a Citizen Science Project to begin your contribution.</p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div onClick={() => setActiveModule('asteroid')} className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-blue-500 cursor-pointer group transition-all">
                                <div className="bg-blue-900/20 w-fit p-3 rounded-lg text-blue-400 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Telescope size={32} /></div>
                                <h3 className="text-xl font-bold mb-2">Asteroid Search Campaign</h3>
                                <p className="text-slate-400 text-sm mb-4">Analyze telescope data to discover new Main Belt asteroids. Collaborate with IASC.</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center text-blue-400 font-bold text-sm">Launch Tool <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" /></div>
                                    <div className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">Leaderboard: Loading...</div>
                                </div>
                            </div>

                            <div onClick={() => setActiveModule('galaxy')} className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-purple-500 cursor-pointer group transition-all">
                                <div className="bg-purple-900/20 w-fit p-3 rounded-lg text-purple-400 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors"><Rocket size={32} /></div>
                                <h3 className="text-xl font-bold mb-2">Galaxy Zoo</h3>
                                <p className="text-slate-400 text-sm mb-4">Classify galaxy shapes to help understand how the universe evolved.</p>
                                <div className="flex items-center text-purple-400 font-bold text-sm">Launch Tool <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" /></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeModule === 'asteroid' && <AsteroidTool user={user} userProfile={userProfile} />}
                {activeModule === 'galaxy' && <GalaxyZoo userProfile={userProfile} />}
            </div>

            {/* NOTIFICATIONS DRAWER */}
            {showNotifications && (
                <div className="absolute inset-0 bg-black/50 z-50 flex justify-end backdrop-blur-sm" onClick={() => setShowNotifications(false)}>
                    <div className="w-80 bg-slate-900 h-full border-l border-slate-800 p-4 overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold">Notifications</h3><button onClick={() => setShowNotifications(false)}><X /></button></div>
                        {notifications.length === 0 && <p className="text-slate-500 text-sm text-center mt-10">No notifications.</p>}
                        {notifications.map(n => (
                            <div key={n.id} className="bg-slate-800 p-3 rounded mb-2 text-sm relative group">
                                <p>{n.message}</p>
                                <div className="flex justify-between mt-2 text-slate-500 text-[10px]">
                                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notifications', n.id))} className="hover:text-red-400"><Trash2 size={12} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}