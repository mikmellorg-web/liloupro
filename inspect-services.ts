import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function main() {
  console.log("Fetching services...");
  const querySnapshot = await getDocs(collection(db, 'services'));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`Service ID: ${doc.id}, Title: ${data.title}`);
    if (data.liturgy) {
      data.liturgy.forEach((item: any, idx: number) => {
        if (item.content && (item.content.includes("Marcos") || item.content.includes("Mc") || item.title?.includes("Marcos") || item.title?.includes("Mc") || item.content.includes("divorciar"))) {
          console.log(`  Liturgy item index: ${idx}`);
          console.log(`  Type: ${item.type}`);
          console.log(`  Title: ${item.title}`);
          console.log(`  Content snippet: ${item.content.substring(0, 300)}`);
          console.log(`  Details snippet: ${item.details ? item.details.substring(0, 300) : 'none'}`);
        }
      });
    }
  });
}

main().catch(console.error);
