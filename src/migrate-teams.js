/**
 * Team Migration Script
 * 
 * Run this ONCE in the browser console after deploying updated Firestore rules.
 * This script:
 * 1. Creates a default team for the first admin
 * 2. Stamps all existing campaigns with teamId + createdByUid
 * 3. Stamps all existing image sets with teamId
 * 4. Stamps all existing hunters with teamIds + primaryTeamId
 * 5. Stamps all existing resources with teamIds
 * 6. Stamps all existing invitations with teamId
 * 
 * Usage: Copy-paste into browser console while logged in as admin on the portal.
 */

import { db, appId } from './firebase-config.js';
import { collection, getDocs, doc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

const BASE = `artifacts/${appId}/public/data`;

async function migrateToTeams() {
    console.log('🚀 Starting team migration...');
    
    // Step 1: Find the admin user
    const huntersSnap = await getDocs(collection(db, BASE, 'hunters'));
    const hunters = huntersSnap.docs.map(d => ({ id: d.id, uid: d.id, ...d.data() }));
    const admin = hunters.find(h => h.role === 'admin');
    
    if (!admin) {
        console.error('❌ No admin user found. Aborting.');
        return;
    }
    
    console.log(`✅ Found admin: ${admin.name} (${admin.uid})`);
    
    // Step 2: Create default team
    const defaultTeamId = 'team_' + admin.uid.substring(0, 8);
    const teamRef = doc(db, BASE, 'teams', defaultTeamId);
    
    await setDoc(teamRef, {
        name: 'Ethio-asteroid hunters (ESSS)',
        leaderId: admin.uid,
        leaderName: admin.name,
        createdAt: Date.now(),
        description: 'Primary research group of the ESSS Citizen Science Project',
        status: 'active',
        memberCount: hunters.length
    });
    
    console.log(`✅ Created default team: ${defaultTeamId}`);
    
    // Step 3: Batch update hunters
    let batch = writeBatch(db);
    let batchCount = 0;
    
    for (const hunter of hunters) {
        batch.update(doc(db, BASE, 'hunters', hunter.id), {
            teamIds: [defaultTeamId],
            primaryTeamId: defaultTeamId,
            teamRequests: []
        });
        batchCount++;
        
        if (batchCount >= 450) { // Firestore batch limit is 500
            await batch.commit();
            batch = writeBatch(db);
            batchCount = 0;
            console.log(`  ... committed batch of hunters`);
        }
    }
    if (batchCount > 0) await batch.commit();
    console.log(`✅ Updated ${hunters.length} hunters with teamIds`);
    
    // Step 4: Batch update campaigns
    const campsSnap = await getDocs(collection(db, BASE, 'campaigns'));
    batch = writeBatch(db);
    batchCount = 0;
    
    for (const camp of campsSnap.docs) {
        const data = camp.data();
        // Try to match createdBy name to a hunter UID
        const creator = hunters.find(h => h.name === data.createdBy);
        
        batch.update(doc(db, BASE, 'campaigns', camp.id), {
            teamId: defaultTeamId,
            createdByUid: creator?.id || creator?.uid || admin.uid
        });
        batchCount++;
        
        if (batchCount >= 450) {
            await batch.commit();
            batch = writeBatch(db);
            batchCount = 0;
        }
    }
    if (batchCount > 0) await batch.commit();
    console.log(`✅ Updated ${campsSnap.size} campaigns with teamId`);
    
    // Step 5: Batch update image sets
    const setsSnap = await getDocs(collection(db, BASE, 'image_sets'));
    batch = writeBatch(db);
    batchCount = 0;
    
    for (const set of setsSnap.docs) {
        batch.update(doc(db, BASE, 'image_sets', set.id), {
            teamId: defaultTeamId
        });
        batchCount++;
        
        if (batchCount >= 450) {
            await batch.commit();
            batch = writeBatch(db);
            batchCount = 0;
        }
    }
    if (batchCount > 0) await batch.commit();
    console.log(`✅ Updated ${setsSnap.size} image sets with teamId`);
    
    // Step 6: Batch update resources
    const resSnap = await getDocs(collection(db, BASE, 'resources'));
    batch = writeBatch(db);
    batchCount = 0;
    
    for (const res of resSnap.docs) {
        batch.update(doc(db, BASE, 'resources', res.id), {
            teamIds: [defaultTeamId]
        });
        batchCount++;
        
        if (batchCount >= 450) {
            await batch.commit();
            batch = writeBatch(db);
            batchCount = 0;
        }
    }
    if (batchCount > 0) await batch.commit();
    console.log(`✅ Updated ${resSnap.size} resources with teamIds`);
    
    // Step 7: Batch update invitations
    const invSnap = await getDocs(collection(db, BASE, 'invitations'));
    batch = writeBatch(db);
    batchCount = 0;
    
    for (const inv of invSnap.docs) {
        batch.update(doc(db, BASE, 'invitations', inv.id), {
            teamId: defaultTeamId,
            invitedByUid: admin.uid
        });
        batchCount++;
        
        if (batchCount >= 450) {
            await batch.commit();
            batch = writeBatch(db);
            batchCount = 0;
        }
    }
    if (batchCount > 0) await batch.commit();
    console.log(`✅ Updated ${invSnap.size} invitations with teamId`);
    
    console.log('');
    console.log('🎉 Migration complete!');
    console.log(`   Default Team ID: ${defaultTeamId}`);
    console.log(`   Team Leader: ${admin.name}`);
    console.log(`   Hunters: ${hunters.length}`);
    console.log(`   Campaigns: ${campsSnap.size}`);
    console.log(`   Image Sets: ${setsSnap.size}`);
    console.log(`   Resources: ${resSnap.size}`);
    console.log(`   Invitations: ${invSnap.size}`);
}

// Export for use
export { migrateToTeams };
