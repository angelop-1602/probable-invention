import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, writeBatch, deleteDoc } from 'firebase/firestore';

export async function POST() {
  try {
    // Fetch all reviewers and build a map of id -> code
    const reviewersSnapshot = await getDocs(collection(db, 'reviewers'));
    const reviewerIdToCode: Record<string, string> = {};
    reviewersSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.code) {
        reviewerIdToCode[docSnap.id] = data.code;
      }
    });

    // Fetch all applications
    const applicationsSnapshot = await getDocs(collection(db, 'protocolReviewApplications'));
    let migratedCount = 0;
    let errorCount = 0;
    let errors: any[] = [];

    for (const appDoc of applicationsSnapshot.docs) {
      const appId = appDoc.id;
      const primaryReviewersRef = collection(db, 'protocolReviewApplications', appId, 'primaryReviewers');
      const primaryReviewersSnapshot = await getDocs(primaryReviewersRef);

      for (const reviewerDoc of primaryReviewersSnapshot.docs) {
        const reviewerData = reviewerDoc.data();
        const reviewerId = reviewerData.id;
        const reviewerCode = reviewerIdToCode[reviewerId];

        if (!reviewerCode) {
          errorCount++;
          errors.push({ appId, reviewerId, error: 'Reviewer code not found' });
          continue;
        }

        if (reviewerDoc.id !== reviewerCode) {
          try {
            const batch = writeBatch(db);
            // Copy to new doc with code as ID and add code as a field
            const newDocRef = doc(primaryReviewersRef, reviewerCode);
            batch.set(newDocRef, { ...reviewerData, code: reviewerCode }, { merge: true });
            // Delete the old doc
            batch.delete(reviewerDoc.ref);
            await batch.commit();
            migratedCount++;
          } catch (err) {
            errorCount++;
            errors.push({ appId, reviewerId, error: String(err) });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      migratedCount,
      errorCount,
      errors
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
} 