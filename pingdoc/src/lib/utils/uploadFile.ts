import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function uploadFile(file: File, userId: string): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized');
  }

  try {
    // Create a unique filename using timestamp
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const path = `pending/${userId}/${filename}`;

    // Create a reference to the file location
    const storageRef = ref(storage, path);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Upload successful:', snapshot);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL:', downloadURL);

    // Save document reference to Firestore
    await addDoc(collection(db, 'requests'), {
      senderUid: userId,
      originalPath: path,
      status: 'DRAFT',
      sentAt: null,
      signedAt: null,
      recipientEmail: null,
      recipientName: null,
      createdAt: new Date(),
    });

    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload file');
  }
}
