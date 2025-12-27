import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, CheckCircle, Plus, ExternalLink, X,
    ChevronRight, Save, User, Download, Shield, Lock,
    MessageSquare, UserPlus, XCircle, Trash2, Mail,
    LayoutGrid, Rocket, Microscope, Terminal, Radio, Search, Image, Target,
    Telescope, ArrowRight, Bell, LogOut
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
    writeBatch,
    getDocs
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



// Email Template
const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Email Template
const getHtmlEmail = (toName, title, bodyText) => {
    const safeName = escapeHtml(toName);
    const safeTitle = escapeHtml(title);
    const safeBody = escapeHtml(bodyText).replace(/\n/g, '<br/>');

    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 4px solid #2563eb;">
            <img src="https://i.ibb.co/fYR7CZBP/CSP-Logo-CSP-White-En.png" alt="ESSS CSP Logo" style="height: 40px;" />
        </div>
        <div style="padding: 40px; background-color: #ffffff;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 24px; margin-bottom: 20px;">${safeTitle}</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #475569;">Hello <strong>${safeName}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 30px;">${safeBody}</p>
            
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
    const styles = {
        admin: "bg-red-900/50 text-red-200 border-red-700",
        manager: "bg-cyan-900/50 text-cyan-200 border-cyan-700",
        moderator: "bg-purple-900/50 text-purple-200 border-purple-700",
        volunteer: "bg-blue-900/50 text-blue-200 border-blue-700"
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${styles[role] || styles.volunteer}`}>{role || 'volunteer'}</span>;
};

/* --- SUB-APP: ASTEROID CAMPAIGN TOOL --- */
function AsteroidTool({ user, userProfile }) {
    const [view, setView] = useState(() => new URLSearchParams(window.location.search).get('view') || 'dashboard');
    const [showLog, setShowLog] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [imageSets, setImageSets] = useState([]);
    const [users, setUsers] = useState([]);
    const [resources, setResources] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [selectedSetForAction, setSelectedSetForAction] = useState(null);

    // UI State
    const [showAddCampaign, setShowAddCampaign] = useState(false);
    const [showAddSet, setShowAddSet] = useState(false);
    const [showSubmitReport, setShowSubmitReport] = useState(false);
    const [showManageAccess, setShowManageAccess] = useState(false);
    const [showAddParticipantMod, setShowAddParticipantMod] = useState(false);
    const [validationStatus, setValidationStatus] = useState(null); // { valid: bool, message: str }
    const [rejectingSetId, setRejectingSetId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [toast, setToast] = useState(null); // { message, type }
    const [confirmation, setConfirmation] = useState(null); // { message, onConfirm }
    const [showAddResource, setShowAddResource] = useState(false);

    // Forms
    const [newCampaignName, setNewCampaignName] = useState('');
    const [newResource, setNewResource] = useState({ title: '', link: '', type: 'software' });
    const [newSetName, setNewSetName] = useState('');
    const [newSetLink, setNewSetLink] = useState('');
    const [reportText, setReportText] = useState('');
    const [objectsFound, setObjectsFound] = useState('');
    const [newComment, setNewComment] = useState('');

    const isAdmin = userProfile?.role === 'admin';
    const isManager = userProfile?.role === 'manager' || isAdmin;
    const isModerator = userProfile?.role === 'moderator' || isManager;

    // Email Batching Refs
    const emailBatches = React.useRef({});
    const emailTimers = React.useRef({});

    // Invitation State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitations, setInvitations] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [memberSearch, setMemberSearch] = useState('');
    const [selectedSetIds, setSelectedSetIds] = useState([]);

    // Derived State for Real-time Updates
    const activeCampaignData = useMemo(() =>
        selectedCampaign ? campaigns.find(c => c.id === selectedCampaign.id) || selectedCampaign : null
        , [selectedCampaign, campaigns]);

    // URL Synchronization
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const currentView = params.get('view');
        const currentCamp = params.get('campaign');
        const targetCamp = selectedCampaign ? selectedCampaign.id : null;

        if (currentView !== view || currentCamp !== targetCamp) {
            params.set('view', view);
            if (targetCamp) params.set('campaign', targetCamp);
            else params.delete('campaign');
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.pushState(null, '', newUrl);
        }
    }, [view, selectedCampaign]);

    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            setView(params.get('view') || 'dashboard');
            const campId = params.get('campaign');
            if (campId && campaigns.length > 0) {
                const camp = campaigns.find(c => c.id === campId);
                if (camp) setSelectedCampaign(camp);
            } else {
                setSelectedCampaign(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [campaigns]);

    // Deep Link Sync
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const campId = params.get('campaign');
        if (campId && campaigns.length > 0 && !selectedCampaign) {
            const camp = campaigns.find(c => c.id === campId);
            if (camp) setSelectedCampaign(camp);
        }
    }, [campaigns]);

    // Listeners
    useEffect(() => {
        const unsubCamps = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'campaigns'), (snap) => setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)));
        const unsubSets = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'image_sets'), (snap) => setImageSets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'hunters'), (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubResources = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'resources'), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setResources(data);
            // Auto-seed resources if empty and admin
            if (data.length === 0 && isAdmin) seedResources();
        });
        const unsubInvites = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'invitations'), (snap) => setInvitations(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)));
        return () => { unsubCamps(); unsubSets(); unsubUsers(); unsubResources(); unsubInvites(); };
    }, []);

    useEffect(() => {
        if (selectedSetForAction) {
            setObjectsFound(selectedSetForAction.objectsFound || '');
            setReportText(selectedSetForAction.reportContent || '');
            setValidationStatus(null);
        }
    }, [selectedSetForAction]);

    // Actions
    const showToast = (msg, type = 'info') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const confirmAction = (message, action) => {
        setConfirmation({ message, onConfirm: () => { action(); setConfirmation(null); } });
    };

    const runAsync = async (fn) => {
        setProcessing(true);
        try { await fn(); }
        catch (e) { console.error(e); showToast('Error: ' + e.message, 'error'); }
        finally { setProcessing(false); }
    };

    const updateProfileName = async () => {
        if (!newName.trim()) return;
        runAsync(async () => {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hunters', user.uid), { name: newName });
            setEditingName(false);
            showToast('Name updated successfully!', 'success');
        });
    };

    const seedResources = async () => {
        const defaults = [
            { title: 'Astrometrica Setup (Windows)', link: 'http://iasc.cosmosearch.org/Home/Astrometrica', type: 'software' },
            { title: 'MPC Report Format Guide', link: 'https://www.minorplanetcenter.net/iau/info/MPCBearings.html', type: 'guide' },
            { title: 'IASC Data Reduction Guide', link: '#', type: 'guide' }
        ];
        const batch = writeBatch(db);
        defaults.forEach(r => {
            const ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'resources'));
            batch.set(ref, { ...r, createdAt: Date.now() });
        });
        await batch.commit();
    };

    const createCampaign = () => runAsync(async () => {
        if (!newCampaignName.trim() || !isManager) return;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'campaigns'), { name: newCampaignName, createdAt: Date.now(), status: 'Active', createdBy: userProfile.name, participants: [user.uid], requests: [] });
        setNewCampaignName(''); setShowAddCampaign(false);
        showToast('Campaign created successfully!', 'success');
    });

    const requestAccess = (campId) => runAsync(async () => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'campaigns', campId), { requests: arrayUnion(user.uid) });
        users.filter(u => u.role === 'admin').forEach(a => createNotification(a.uid, `${userProfile.name} requested access.`, 'alert'));
        showToast('Access request sent!', 'info');
    });

    const manageRequest = (campId, reqId, action) => runAsync(async () => {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'campaigns', campId);
        if (action === 'accept') {
            await updateDoc(ref, { participants: arrayUnion(reqId), requests: arrayRemove(reqId) });
            createNotification(reqId, `Access granted to ${campaigns.find(c => c.id === campId)?.name}`, 'success');
            const h = users.find(u => u.uid === reqId);
            if (h?.email) sendAutoEmail(h.name, h.email, "Access Granted - CSP Portal", `You have been granted access to the campaign: <strong>${campaigns.find(c => c.id === campId)?.name}</strong>.\n\nYou can now log in to the portal and claim image sets.`, "Welcome to the Team!");
            showToast('Request accepted!', 'success');
        } else {
            await updateDoc(ref, { requests: arrayRemove(reqId) });
            showToast('Request rejected!', 'info');
        }
    });

    const createImageSets = () => runAsync(async () => {
        if (!newSetName.trim() || !activeCampaignData || !isManager) return;
        const lines = newSetName.split('\n').filter(l => l.trim().length > 0);
        const batch = writeBatch(db);
        for (const line of lines) {
            const ref = doc(collection(db, 'artifacts', appId, 'public', 'data', 'image_sets'));
            batch.set(ref, { campaignId: activeCampaignData.id, name: line.trim(), downloadLink: newSetLink || '#', status: 'Unassigned', assigneeName: null, assigneeId: null, comments: [], createdAt: Date.now() });
        }
        await batch.commit();
        setNewSetName(''); setShowAddSet(false);
        showToast('Image sets added successfully!', 'success');
    });

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

    const assignSet = (setId, hunterId, hunterName) => runAsync(async () => {
        const setName = imageSets.find(s => s.id === setId)?.name;
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'image_sets', setId), { assigneeId: hunterId, assigneeName: hunterName, status: 'Assigned', assignedAt: Date.now() });
        createNotification(hunterId, `Assignment received: ${setName}`, 'action');
        showToast(`Set "${setName}" assigned to ${hunterName}.`, 'success');

        // Batch Email Logic
        if (!emailBatches.current[hunterId]) emailBatches.current[hunterId] = [];
        emailBatches.current[hunterId].push(setName);

        if (emailTimers.current[hunterId]) clearTimeout(emailTimers.current[hunterId]);
        emailTimers.current[hunterId] = setTimeout(() => flushEmailQueue(hunterId), 15000); // 15 second debounce
    });

    const sendInvite = () => runAsync(async () => {
        if (!inviteEmail.trim()) return;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'invitations'), {
            email: inviteEmail.trim().toLowerCase(),
            invitedBy: userProfile.name,
            createdAt: Date.now(),
            status: 'pending' // pending signup
        });

        // 2. Send Email
        const link = window.location.origin; // Current URL
        await sendAutoEmail("Future Hunter", inviteEmail, "You have been invited to the CSP Portal",
            `You have been invited by ${userProfile.name} to join the Citizen Science Project Portal.<br/><br/>
            Please click the link below to sign in with your Google account:<br/>
            <a href="${link}" style="display:inline-block;background:#3b82f6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:10px;">Join Portal</a><br/><br/>
            Welcome aboard!`,
            "Invitation"
        );

        setInviteEmail('');
        setShowInviteModal(false);
        showToast('Invitation sent successfully!', 'success');
    });

    const addResource = () => runAsync(async () => {
        if (!newResource.title || !newResource.link) return;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'resources'), { ...newResource, createdAt: Date.now() });
        setNewResource({ title: '', link: '', type: 'software' });
        setShowAddResource(false);
        showToast('Resource added!', 'success');
    });

    const checkReport = (text) => {
        setReportText(text);
        setValidationStatus(validateMPCReport(text));
    };

    const submitReport = () => runAsync(async () => {
        if (!selectedSetForAction) return;
        const validation = validateMPCReport(reportText);
        if (!validation.valid) {
            showToast("Please fix report format errors before submitting.", 'error');
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
        showToast('Report submitted for review!', 'success');
    });

    const reviewReport = (setId, action, hunterId) => runAsync(async () => {
        if (action === 'approve') {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'image_sets', setId), { status: 'Verified', verifiedAt: Date.now() });
            createNotification(hunterId, `Your report for set ${imageSets.find(s => s.id === setId)?.name} was Verified!`, 'success');
            showToast('Report verified!', 'success');
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
            showToast('Changes requested for report.', 'info');
        }
    });

    const postComment = () => runAsync(async () => {
        if (!newComment.trim() || !selectedSetForAction) return;
        const comment = { text: newComment, author: userProfile.name, role: userProfile.role, timestamp: Date.now() };
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'image_sets', selectedSetForAction.id), { comments: arrayUnion(comment) });
        setNewComment('');
        showToast('Comment added!', 'info');
    });

    const updateCampaignStatus = (campId, status) => runAsync(async () => {
        if (!isManager) return;
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'campaigns', campId), { status });
        if (status === 'Archived') setSelectedCampaign(null);
        showToast(`Campaign status updated to "${status}".`, 'success');
    });

    const deleteCampaign = (campId) => runAsync(async () => {
        if (!isAdmin) return;

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
        showToast('Campaign and all associated sets deleted permanently.', 'success');
    });

    const requestCampaignAccess = (camp) => runAsync(async () => {
        if (camp.requests?.includes(user.uid)) { showToast("Access request already pending.", "info"); return; }
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'campaigns', camp.id), { requests: arrayUnion(user.uid) });
        showToast("Access requested sent to managers.", "success");
    });

    const addParticipant = (userId, campId) => runAsync(async () => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'campaigns', campId), { participants: arrayUnion(userId) });
        showToast("Member added to campaign.", "success");
    });

    const downloadBatchReports = async () => {
        const selectedSets = campaignSets.filter(s => selectedSetIds.includes(s.id));
        if (selectedSets.length === 0) return;

        showToast(`Starting download of ${selectedSets.length} reports...`, 'info');

        for (const set of selectedSets) {
            const content = set.reportContent || "";
            // Use the existing downloadReport helper
            downloadReport(`${set.name}.txt`, content);
            // Small delay to prevent browser blocking multiple downloads
            await new Promise(resolve => setTimeout(resolve, 500));
        }
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
                {isManager && <button onClick={() => setView('team')} className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${view === 'team' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-white'}`}><Shield size={16} /> Manage Team</button>}
                {isAdmin && <button onClick={() => setView('archive')} className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${view === 'archive' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}><Save size={16} /> Archive</button>}
            </div>

            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                {/* DASHBOARD */}
                {view === 'dashboard' && !activeCampaignData && (
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <p className="text-slate-400 text-sm mt-1">Manage campaigns and monitor portal activity.</p>
                            </div>
                            {isManager && <button onClick={() => setShowAddCampaign(true)} className="btn-primary px-4 py-2 rounded-lg text-sm flex gap-2 items-center font-semibold text-white"><Plus size={16} /> New Campaign</button>}
                        </div>

                        {/* Dashboard Grid */}
                        <div className="flex gap-6 relative items-start">
                            {/* Left: Campaigns (Flexible Width) */}
                            <div className="flex-1 min-w-0 space-y-6 transition-all duration-300">
                                <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-white/5 backdrop-blur-sm sticky top-0 z-20">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-white/80"><LayoutGrid size={18} className="text-blue-400" /> Active Missions</h3>
                                    <button onClick={() => setShowLog(!showLog)} className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${showLog ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}>
                                        <Terminal size={14} /> Mission Log {showLog ? <ChevronRight size={14} /> : <Terminal size={14} />}
                                    </button>
                                </div>
                                <div className={`grid gap-4 ${showLog ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
                                    {campaigns.filter(c => c.status !== 'Archived').map(c => {
                                        const hasAccess = isManager || c.participants?.includes(user.uid);
                                        const isPending = c.requests?.includes(user.uid);
                                        return (
                                            <div key={c.id} onClick={() => { if (hasAccess) setSelectedCampaign(c); else if (!isPending) confirmAction(`Request access to ${c.name}?`, () => requestCampaignAccess(c)); }} className={`glass-panel p-6 rounded-2xl transition-all relative overflow-hidden shadow-lg shadow-black/20 ${hasAccess ? 'hover:border-blue-500/50 cursor-pointer hover:scale-[1.01] group' : 'opacity-75 border-slate-800 cursor-not-allowed grayscale-[0.3]'}`}>
                                                <div className="absolute top-0 right-0 p-4 opacity-50">
                                                    {hasAccess ? <Target size={64} className="text-slate-800 group-hover:text-blue-900/40 transition-colors" /> : <Lock size={64} className="text-slate-800" />}
                                                </div>
                                                <div className="flex justify-between mb-4 relative z-10">
                                                    <div className={`p-2 rounded-lg bg-slate-950/50 backdrop-blur-md border border-white/5 shadow-inner`}>
                                                        {c.status === 'Active' ? <Radio size={20} className="text-green-400 animate-pulse" /> : <XCircle size={20} className="text-red-400" />}
                                                    </div>
                                                    <span className={`text-[10px] px-2 py-1.5 rounded-full uppercase font-bold tracking-wider border shadow-sm ${c.status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{c.status}</span>
                                                </div>
                                                <h3 className="font-bold text-xl mb-2 text-white relative z-10 line-clamp-1 flex items-center gap-2">
                                                    {c.name}
                                                    {!hasAccess && <Lock size={16} className="text-slate-500" />}
                                                </h3>
                                                <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-700/50 pt-4 relative z-10">
                                                    <div className="flex gap-2 items-center"><User size={12} /> {c.createdBy || 'Admin'}</div>
                                                    {hasAccess
                                                        ? <div className="flex gap-2 items-center"><Users size={12} /> {c.participants?.length || 0} Hunters</div>
                                                        : <div className={`font-bold ${isPending ? 'text-yellow-500' : 'text-blue-400'}`}>{isPending ? 'Request Pending' : 'Click to Request'}</div>
                                                    }
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {campaigns.filter(c => c.status !== 'Archived').length === 0 && <div className="p-12 text-center border border-dashed border-slate-700 rounded-xl text-slate-500 bg-slate-900/20">No active campaigns. Start one!</div>}
                            </div>

                            {/* Right: Mission Log (Slide-out) */}
                            <div className={`${showLog ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-10 p-0 overflow-hidden'} transition-all duration-300 ease-in-out flex flex-col h-[calc(100vh-200px)] sticky top-6`}>
                                <div className="glass-panel rounded-2xl p-0 flex flex-col h-full border-l-4 border-blue-500/50 shadow-2xl shadow-blue-900/20">
                                    <div className="p-4 border-b border-white/5 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-between items-center rounded-t-2xl">
                                        <h3 className="font-sans text-xs font-bold text-blue-300 uppercase tracking-widest flex items-center gap-2"><Rocket size={14} /> Live Feed</h3>
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                    </div>
                                    <div className="p-2 space-y-2 overflow-y-auto flex-1 font-sans text-xs custom-scrollbar bg-slate-950/30">
                                        {[
                                            ...campaigns.map(c => ({ bg: 'bg-blue-500/5 border-blue-500/20', icon: <Radio size={14} className="text-blue-400" />, date: c.createdAt, title: 'Mission Launched', text: c.name })),
                                            ...users.map(u => ({ bg: 'bg-green-500/5 border-green-500/20', icon: <UserPlus size={14} className="text-green-400" />, date: u.createdAt, title: 'New Hunter', text: u.name })),
                                            ...imageSets.filter(s => s.status === 'Verified').map(s => ({ bg: 'bg-purple-500/5 border-purple-500/20', icon: <CheckCircle size={14} className="text-purple-400" />, date: s.verifiedAt, title: 'Discovery Verified', text: `${s.name} by ${s.assigneeName}` }))
                                        ].sort((a, b) => b.date - a.date).slice(0, 30).map((log, i) => (
                                            <div key={i} className={`p-3 rounded-xl border ${log.bg} backdrop-blur-sm hover:bg-white/5 transition-colors group animate-slide-up`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-[10px] uppercase tracking-wider opacity-50">{new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                    <span className="text-[10px] opacity-40">{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 p-1 rounded-full bg-white/5 shadow-inner">{log.icon}</div>
                                                    <div>
                                                        <div className="font-bold text-slate-200">{log.title}</div>
                                                        <div className="text-slate-400 leading-relaxed">{log.text}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CAMPAIGN DETAIL */}
                {view === 'dashboard' && activeCampaignData && (
                    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setSelectedCampaign(null)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"><ChevronRight className="rotate-180" size={24} /></button>
                            {isManager && activeCampaignData.status === 'Active' && <button onClick={() => setShowAddSet(true)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors" title="Add Image Sets"><Plus size={20} /></button>}

                            <div>
                                <h2 className="text-3xl font-bold text-white">{activeCampaignData.name}</h2>
                                <p className="text-slate-400 text-sm">Campaign Dashboard</p>
                            </div>
                            <div className="flex-1" />
                            {isModerator && (activeCampaignData.requests?.length > 0) && <button onClick={() => setShowManageAccess(true)} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm flex gap-2 items-center font-bold shadow-lg shadow-red-900/20 transition-all"><UserPlus size={18} /> Review Requests ({activeCampaignData.requests.length})</button>}
                            {isManager && <button onClick={() => setShowAddParticipantMod(true)} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm flex gap-2 items-center font-bold transition-all"><Users size={18} /> Add Member</button>}

                            {/* Campaign Controls */}
                            <div className="flex gap-2">
                                {/* Manager Actions: End/Reactivate */}
                                {isManager && (
                                    <>
                                        {activeCampaignData.status === 'Active' && <button onClick={() => updateCampaignStatus(activeCampaignData.id, 'Ended')} className="bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-600/50 px-3 py-2 rounded-lg text-sm font-bold transition-all">End Campaign</button>}
                                        {activeCampaignData.status === 'Ended' && <button onClick={() => updateCampaignStatus(activeCampaignData.id, 'Active')} className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border border-green-600/50 px-3 py-2 rounded-lg text-sm font-bold transition-all">Reactivate</button>}
                                    </>
                                )}
                                {/* Admin Actions: Archive/Delete */}
                                {isAdmin && (
                                    <>
                                        {(activeCampaignData.status === 'Ended' || activeCampaignData.status === 'Active') && <button onClick={() => updateCampaignStatus(activeCampaignData.id, 'Archived')} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg text-sm font-bold transition-all" title="Archive"><Save size={16} /></button>}
                                        <button onClick={() => confirmAction('Are you sure? This will delete the campaign and ALL associated image sets. This cannot be undone.', () => deleteCampaign(activeCampaignData.id))} className="bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-900/50 px-3 py-2 rounded-lg text-sm font-bold transition-all" title="Delete"><Trash2 size={16} /></button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                            {/* SEARCH BAR */}
                            <div className="p-4 border-b border-white/5 bg-slate-900/50 flex items-center gap-4">
                                {isManager && selectedSetIds.length > 0 &&
                                    <button onClick={downloadBatchReports} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 animate-fade-in shadow-lg shadow-blue-900/20 whitespace-nowrap">
                                        <Download size={14} /> Download ({selectedSetIds.length})
                                    </button>
                                }
                                <div className="relative flex-1 max-w-md">
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                                        placeholder="Search sets, hunters, or status..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                </div>
                                <div className="text-xs text-slate-500 font-mono">
                                    Showing {campaignSets.filter(s =>
                                        (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                                        (s.assigneeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                                        (s.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                                    ).length} image sets
                                </div>
                            </div>

                            {/* TABLE */}
                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-slate-900/50 text-slate-400 font-bold sticky top-0 backdrop-blur-md z-10">
                                        <tr>
                                            {isManager && <th className="px-6 py-4 w-10"><input type="checkbox" onChange={(e) => setSelectedSetIds(e.target.checked ? campaignSets.map(s => s.id) : [])} checked={selectedSetIds.length > 0 && selectedSetIds.length === campaignSets.length} /></th>}
                                            <th className="px-6 py-4">Image Set</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Hunter</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {campaignSets
                                            .filter(s =>
                                                (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                                                (s.assigneeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                                                (s.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                                            )
                                            .map(set => (
                                                <tr key={set.id} onClick={() => { if (set.assigneeId === user.uid || isManager) { setSelectedSetForAction(set); setShowSubmitReport(true); } }} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                                    {isManager && <td className="px-6 py-4"><input type="checkbox" checked={selectedSetIds.includes(set.id)} onChange={(e) => { e.stopPropagation(); setSelectedSetIds(prev => prev.includes(set.id) ? prev.filter(id => id !== set.id) : [...prev, set.id]); }} onClick={(e) => e.stopPropagation()} /></td>}
                                                    <td className="px-6 py-4 font-mono text-white flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors"><Image size={16} /></div>
                                                        <div>
                                                            <div>{set.name}</div>
                                                            {set.downloadLink !== '#' && <a href={set.downloadLink} className="text-[10px] text-blue-500 hover:text-blue-400 flex gap-1 items-center" target="_blank" onClick={(e) => e.stopPropagation()}>Download <ExternalLink size={8} /></a>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${set.status === 'Verified' ? 'bg-green-500/10 text-green-400 border-green-500/20' : set.status === 'Pending Review' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : set.status === 'Changes Requested' ? 'bg-red-500/10 text-red-400 border-red-500/20' : set.status === 'Assigned' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{set.status}</span></td>
                                                    <td className="px-6 py-4 text-slate-400">{set.assigneeName || <span className="text-slate-600 italic">Unassigned</span>}</td>
                                                    <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); setSelectedSetForAction(set); setShowSubmitReport(true); }} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"><MessageSquare size={16} /></button>
                                                        {set.status === 'Unassigned' && <button onClick={(e) => { e.stopPropagation(); assignSet(set.id, user.uid, userProfile.name); }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-md text-xs font-bold transition-all shadow-lg shadow-blue-900/20">Claim</button>}
                                                        {isManager && set.status !== 'Verified' && (
                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                <select className="bg-slate-900 border border-slate-700 rounded-md text-xs py-1.5 px-2 w-32 focus:border-blue-500 outline-none transition-colors" onChange={(e) => assignSet(set.id, e.target.value, users.find(u => u.uid === e.target.value).name)}>
                                                                    <option value="">{set.assigneeId ? 'Re-assign...' : 'Assign to...'}</option>{users.filter(u => activeCampaignData.participants?.includes(u.uid) || u.role === 'admin').map(u => <option key={u.uid} value={u.uid}>{u.name}</option>)}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                                {campaignSets.filter(s => (s.name || '').includes(searchTerm)).length === 0 && campaignSets.length > 0 && <div className="p-12 text-center text-slate-500">No sets match your search.</div>}
                                {campaignSets.length === 0 && <div className="p-12 text-center text-slate-500">No image sets available yet.</div>}

                                {/* Bottom Add Bar */}
                                {isManager && activeCampaignData.status === 'Active' && (
                                    <button onClick={() => setShowAddSet(true)} className="w-full bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-blue-400 py-3 uppercase text-xs font-bold tracking-widest border-t border-slate-700/50 transition-colors flex justify-center items-center gap-2">
                                        <Plus size={14} /> Add Image Sets
                                    </button>
                                )}
                            </div>
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
                                        <button onClick={() => reviewReport(set.id, 'approve', set.assigneeId)} className="bg-green-600 px-3 py-1 rounded hover:bg-green-500 font-bold">Verify</button>
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
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Astrometrica Resources</h2>
                            {isAdmin && <button onClick={() => setShowAddResource(true)} className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-xs font-bold flex gap-2 items-center text-white"><Plus size={14} /> Add Resource</button>}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Software & Configs */}
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Download className="text-blue-500" /> Software & Config</h3>
                                {resources.filter(r => r.type === 'software').length === 0 && <p className="text-slate-500 text-sm">No resources yet.</p>}
                                <ul className="space-y-3 text-sm">
                                    {resources.filter(r => r.type === 'software').map(r => (
                                        <li key={r.id} className="flex justify-between items-center group">
                                            <a href={r.link} target="_blank" className="flex items-center hover:text-blue-400 gap-2">
                                                {r.title} <ExternalLink size={12} />
                                            </a>
                                            {isAdmin && <button onClick={() => confirmAction('Are you sure you want to delete this resource?', () => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'resources', r.id)))} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Guides */}
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                                <h3 className="font-bold text-lg mb-4">Guides & Instructions</h3>
                                {resources.filter(r => r.type === 'guide').length === 0 && <p className="text-slate-500 text-sm">No guides available.</p>}
                                <ul className="space-y-3 text-sm text-slate-300">
                                    {resources.filter(r => r.type === 'guide').map(r => (
                                        <li key={r.id} className="flex justify-between items-center group">
                                            <a href={r.link} target="_blank" className="flex items-center hover:text-blue-400 gap-2">
                                                {r.title} <ExternalLink size={12} />
                                            </a>
                                            {isAdmin && <button onClick={() => confirmAction('Are you sure you want to delete this resource?', () => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'resources', r.id)))} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>}
                                        </li>
                                    ))}
                                </ul>
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
                                    <p className="text-xs text-slate-500 mb-6 font-mono">Ended: {new Date(c.createdAt).toLocaleDateString()}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => updateCampaignStatus(c.id, 'Active')} className="flex-1 bg-slate-700 hover:bg-blue-600 text-white py-2 rounded text-sm font-medium transition-colors">Restore</button>
                                        <button onClick={() => confirmAction('Are you sure? This will delete the campaign and ALL associated image sets. This cannot be undone.', () => deleteCampaign(c.id))} className="px-3 bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-900/50 rounded transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                            {campaigns.filter(c => c.status === 'Archived').length === 0 && <p className="text-slate-500">No archived campaigns.</p>}
                        </div>
                    </div>
                )}

                {/* TEAM */}
                {/* TEAM */}
                {view === 'team' && isManager && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Team Management</h2>
                            {isManager && <button onClick={() => setShowInviteModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center"><Mail size={16} /> Invite User</button>}
                        </div>

                        {/* Pending Invites */}
                        {invitations.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2"><Mail size={20} /> Pending Invitations</h2>
                                <div className="bg-blue-900/10 border border-blue-900/50 rounded-xl overflow-hidden">
                                    {invitations.filter(i => i.status === 'pending').map(i => (
                                        <div key={i.id} className="flex justify-between items-center p-4 border-b border-blue-900/20 last:border-0 hover:bg-blue-900/20 transition-colors">
                                            <div><div className="font-bold text-white">{i.email}</div><div className="text-xs text-blue-300/70">Invited by {i.invitedBy} on {new Date(i.createdAt).toLocaleDateString()}</div></div>
                                            <div className="flex gap-2">
                                                <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'invitations', i.id))} className="text-xs text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {invitations.filter(i => i.status === 'pending').length === 0 && <div className="p-4 text-slate-500 text-sm italic">No active pending invitations.</div>}
                                </div>
                            </div>
                        )}

                        {/* Pending Requests */}
                        {users.filter(u => u.status === 'pending').length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold mb-4 text-orange-400 flex items-center gap-2"><UserPlus size={20} /> Pending Requests</h2>
                                <div className="bg-orange-900/10 border border-orange-900/50 rounded-xl overflow-hidden">
                                    {users.filter(u => u.status === 'pending').map(u => (
                                        <div key={u.uid} className="flex justify-between items-center p-4 border-b border-orange-900/20 last:border-0 hover:bg-orange-900/20 transition-colors">
                                            <div><div className="font-bold text-white">{u.name}</div><div className="text-xs text-orange-300/70">{u.email}</div></div>
                                            <div className="flex gap-2">
                                                <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hunters', u.uid), { status: 'active' })} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-bold shadow-lg shadow-green-900/20 transition-all">Approve</button>
                                                <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hunters', u.uid))} className="bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white px-3 py-1 rounded text-xs font-bold border border-red-900 transition-all">Reject</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users size={20} /> Active Team</h2>
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                                {users.filter(u => (u.status || 'active') !== 'pending').map(u => (
                                    <div key={u.uid} className="flex justify-between items-center p-4 border-b border-slate-700 hover:bg-slate-800 transition-colors">
                                        <div><div className="font-bold text-slate-200">{u.name}</div><div className="text-xs text-slate-500">{u.email}</div></div>
                                        <div className="flex items-center gap-4">
                                            <RoleBadge role={u.role} />
                                            {u.uid !== user.uid ? (
                                                <div className="flex gap-2 items-center">
                                                    {isAdmin && (
                                                        <select className="bg-slate-900 border border-slate-700 rounded text-xs py-1 px-2 outline-none" value={u.role} onChange={(e) => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hunters', u.uid), { role: e.target.value })}>
                                                            <option value="volunteer">Volunteer</option>
                                                            <option value="moderator">Moderator</option>
                                                            <option value="manager">Manager</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    )}
                                                    {isAdmin && (
                                                        <>
                                                            <div className="w-px h-4 bg-slate-700 mx-1"></div>
                                                            <button onClick={() => confirmAction('Are you sure you want to remove this user permanently?', () => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hunters', u.uid)))} className="text-xs text-red-400 border border-red-900/50 px-2 py-1 rounded hover:bg-red-900/20 transition-colors" title="Remove User"><Trash2 size={14} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            ) : <span className="text-xs text-slate-600 italic px-2">You</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                        <div className="glass-panel p-6 rounded-2xl w-full max-w-md">
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
                        </div>
                    </div>
                )
            }
            {/* 3.1 Add Participant */}
            {
                showAddParticipantMod && activeCampaignData && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                        <div className="glass-panel p-6 rounded-2xl w-full max-w-md">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
                                <h3 className="font-bold text-xl text-white">Add Member to Campaign</h3>
                                <button onClick={() => setShowAddParticipantMod(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                            </div>

                            <div className="relative mb-4">
                                <input
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-3 pr-10 text-sm focus:border-blue-500 outline-none"
                                    placeholder="Search users..."
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    autoFocus
                                />
                                <Search className="absolute right-3 top-2.5 text-slate-500" size={16} />
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {users.filter(u => (!activeCampaignData.participants?.includes(u.uid)) && u.status === 'active' && (u.name.toLowerCase().includes(memberSearch.toLowerCase()) || u.email.toLowerCase().includes(memberSearch.toLowerCase()))).map(u => (
                                    <div key={u.uid} className="flex justify-between bg-white/5 p-4 rounded-xl items-center border border-white/5 hover:border-white/10 transition-colors">
                                        <div>
                                            <div className="font-medium text-slate-200">{u.name}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                        </div>
                                        <button onClick={() => addParticipant(u.uid, activeCampaignData.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/20">Add</button>
                                    </div>
                                ))}
                                {users.filter(u => (!activeCampaignData.participants?.includes(u.uid)) && u.status === 'active' && (u.name.toLowerCase().includes(memberSearch.toLowerCase()) || u.email.toLowerCase().includes(memberSearch.toLowerCase()))).length === 0 && <div className="p-8 text-center text-slate-500 italic">No matching users found.</div>}
                            </div>
                            <button onClick={() => setShowAddParticipantMod(false)} className="w-full mt-6 bg-slate-700/50 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-all">Close</button>
                        </div>
                    </div>
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
            {/* 5. Invite User */}
            {
                showInviteModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="bg-slate-900 p-6 rounded-xl border border-slate-700 w-full max-w-sm">
                        <h3 className="font-bold text-xl mb-4">Invite New User</h3>
                        <p className="text-slate-400 text-sm mb-4">Enter the email address of the person you wish to invite. They will be automatically approved upon signing up.</p>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded p-3 mb-4 text-white" type="email" placeholder="user@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                        <div className="flex justify-end gap-2"><button onClick={() => setShowInviteModal(false)} className="text-slate-400">Cancel</button><button onClick={sendInvite} disabled={!inviteEmail || processing} className="bg-blue-600 disabled:opacity-50 px-4 py-2 rounded text-white font-bold flex items-center gap-2">{processing && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>} Send Invite</button></div>
                    </div></div>
                )
            }
            {/* 6. Add Resource Modal */}
            {
                showAddResource && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="bg-slate-900 p-6 rounded-xl border border-slate-700 w-full max-w-sm">
                        <h3 className="font-bold text-xl mb-4">Add Resource</h3>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 mb-2 text-sm" placeholder="Title" value={newResource.title} onChange={e => setNewResource({ ...newResource, title: e.target.value })} />
                        <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 mb-2 text-sm" placeholder="URL Link" value={newResource.link} onChange={e => setNewResource({ ...newResource, link: e.target.value })} />
                        <select className="w-full bg-slate-950 border border-slate-800 rounded p-2 mb-4 text-sm" value={newResource.type} onChange={e => setNewResource({ ...newResource, type: e.target.value })}>
                            <option value="software">Software / Config</option>
                            <option value="guide">Guide / Instruction</option>
                        </select>
                        <div className="flex justify-end gap-2"><button onClick={() => setShowAddResource(false)} className="text-slate-400">Cancel</button><button onClick={addResource} className="bg-blue-600 px-4 py-2 rounded">Add</button></div>
                    </div></div>
                )
            }

            {/* CONFIRMATION & TOAST */}
            {
                confirmation && (
                    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center animate-fade-in">
                        <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl max-w-sm w-full shadow-2xl scale-100">
                            <h3 className="font-bold text-lg mb-2 text-white">Confirm Action</h3>
                            <p className="text-slate-400 mb-6 text-sm">{confirmation.message}</p>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setConfirmation(null)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancel</button>
                                <button onClick={confirmation.onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-900/20">Confirm</button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                toast && (
                    <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-up z-[70] ${toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-100' : 'bg-slate-800/90 border-slate-600 text-white'}`}>
                        {toast.type === 'success' ? <CheckCircle size={20} /> : <Bell size={20} />}
                        <span className="font-medium text-sm">{toast.message}</span>
                    </div>
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

    // User Rename State
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState('');

    const updateProfileName = async () => {
        if (!newName.trim() || !user) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hunters', user.uid), { name: newName });
            setEditingName(false);
            // Optionally update local state instantly if not relying solely on onSnapshot (but we are)
        } catch (e) {
            console.error(e);
            alert("Failed to update name");
        }
    };

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
                        // Check if this is the first user (Bootstrap Admin)
                        const huntersSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'hunters'));
                        const isFirst = huntersSnap.empty;

                        // Check for invitation whitelist
                        let isInvited = false;
                        if (!isFirst && currentUser.email) {
                            const qInvite = query(collection(db, 'artifacts', appId, 'public', 'data', 'invitations'),
                                where('email', '==', currentUser.email.toLowerCase()),
                                where('status', '==', 'pending')
                            );
                            const inviteSnap = await getDocs(qInvite);
                            isInvited = !inviteSnap.empty;

                            if (isInvited) {
                                // Mark invitations as accepted to remove from pending list
                                inviteSnap.docs.forEach(d => {
                                    updateDoc(d.ref, {
                                        status: 'accepted',
                                        acceptedAt: Date.now(),
                                        acceptedByUid: currentUser.uid
                                    });
                                });
                            }
                        }

                        const newProfile = {
                            name: currentUser.displayName || 'Volunteer',
                            email: currentUser.email,
                            role: isFirst ? 'admin' : 'volunteer',
                            status: (isFirst || isInvited) ? 'active' : 'pending',
                            uid: currentUser.uid,
                            createdAt: Date.now()
                        };
                        await setDoc(userRef, newProfile);
                        setUserProfile(newProfile);
                    }

                    // Listen to notifications
                    const qNotifs = query(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), where('recipientId', '==', currentUser.uid));
                    onSnapshot(qNotifs, (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)));


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



    // Access Pending Guard
    if (userProfile && (userProfile.status === 'pending' || userProfile.status === 'suspended')) {
        return (
            <div className="h-screen bg-slate-950 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl max-w-md w-full text-center shadow-2xl shadow-black">
                    <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                        {userProfile.status === 'pending' ? <Shield size={32} /> : <XCircle size={32} />}
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-white">{userProfile.status === 'pending' ? 'Access Request Submitted' : 'Access Denied'}</h1>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        {userProfile.status === 'pending'
                            ? "Your request to join the CSP Portal has been submitted securely. An administrator will review your credentials and approve your access shortly."
                            : "Your account does not have permission to access the portal at this time."}
                    </p>
                    <button onClick={handleLogout} className="text-slate-500 hover:text-white text-sm font-medium transition-colors border-b border-transparent hover:border-slate-500 pb-0.5">Sign Out</button>
                    {userProfile.status === 'pending' && <p className="text-[10px] text-slate-600 mt-8 uppercase tracking-widest">ID: {user.uid.substring(0, 8)}</p>}
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="h-screen bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
                <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl text-center">
                    <div className="mb-6 flex justify-center">
                        {/* Logo Replacement */}
                        <img src="/csp-logo-white.png" alt="CSP Logo" className="h-28 object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2 text-white font-exo">Asteroid Search</h1>
                    <p className="text-slate-400 mb-8">Join the hunt for Near-Earth Objects.</p>
                    <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors text-lg">
                        <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-6 h-6" /> Sign in with Google
                    </button>
                    <p className="mt-6 text-xs text-slate-500">Authorized Personnel Only</p>
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
                    <div className="flex items-center gap-2 mb-8">
                        {/* Sidebar Logo */}
                        <img src="/csp-logo-white.png" alt="CSP Logo" className="h-16 object-contain" />
                    </div>
                    {/* User Profile Summary */}
                    <div className="mb-6 pb-6 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl ${userProfile?.role === 'admin' ? 'bg-red-900/20 text-red-500' : 'bg-blue-900/20 text-blue-500'}`}>
                                {userProfile?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                {editingName ? (
                                    <input autoFocus className="w-full bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-xs text-white" value={newName} onChange={e => setNewName(e.target.value)} onBlur={updateProfileName} onKeyDown={e => e.key === 'Enter' && updateProfileName()} />
                                ) : (
                                    <div className="font-bold truncate text-white cursor-pointer hover:text-blue-400 flex items-center gap-1 group" onClick={() => { setEditingName(true); setNewName(userProfile.name); }} title="Click to rename">
                                        {userProfile?.name}
                                        {/* <Edit size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" /> */}
                                    </div>
                                )}
                                <div className="text-xs text-slate-500 capitalize">{userProfile?.role}</div>
                            </div>
                        </div>
                    </div>
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