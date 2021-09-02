import admin from 'firebase-admin';
import serviceAccount from '../../../../keys/metal-slug-maker-firebase-adminsdk-dlyl0-cf40e5f52d.json';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://metal-slug-maker-default-rtdb.firebaseio.com',
});
export const db = admin.firestore();
