// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getStorage, ref, uploadBytesResumable, listAll, getMetadata, deleteObject, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgprCRDnemmSeoOUUtn1-r3VFrHPLfPKw",
  authDomain: "temp-upload-file-web-app.firebaseapp.com",
  projectId: "temp-upload-file-web-app",
  storageBucket: "temp-upload-file-web-app.appspot.com",
  messagingSenderId: "378953854703",
  appId: "1:378953854703:web:a4272d0eb8758a1d76751a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const storageRef = ref(storage);

// Function to upload files
function uploadFiles() {
    const files = document.getElementById('file-upload').files;
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    if (!files.length) {
        alert('Please select files to upload.');
        return;
    }

    let totalSize = 0;
    for (let file of files) {
        if (file.size > 500 * 1024 * 1024) {
            alert('File size exceeds the limit of 500MB.');
            return;
        }
        totalSize += file.size;
    }

    let totalBytesTransferred = 0;

    for (let file of files) {
        const fileRef = ref(storage, file.name);
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                totalBytesTransferred += snapshot.bytesTransferred;
                const progress = (totalBytesTransferred / totalSize) * 100;
                progressBar.value = progress;
                progressText.innerHTML = `Upload is ${progress.toFixed(2)}% done`;
            }, 
            (error) => {
                alert('Error uploading file:', error);
            }, 
            () => {
                alert('Files uploaded successfully.');
                progressBar.value = 0;
                progressText.innerHTML = '';
                displayUploadedFiles();

                // Clear file input after successful upload
                document.getElementById('file-upload').value = '';
            }
        );
    }
}

// Function to display uploaded files
function displayUploadedFiles() {
    const fileList = document.getElementById('file-list');
    const total_size = document.getElementById('total-size');
    fileList.innerHTML = ''; // Clear existing list
    let tot = 0; // Total size in MB
    let filesProcessed = 0; // Track processed files

    listAll(storageRef).then(res => {
        const totalFiles = res.items.length; // Get total number of files

        res.items.forEach(itemRef => {
            getMetadata(itemRef).then(metadata => {
                const fileSizeMB = (metadata.size / (1024 * 1024)); // Size in MB (unrounded)
                tot += fileSizeMB; // Accumulate file size
                
                // Get the download URL for each file
                getDownloadURL(itemRef).then(downloadURL => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        
                        (${filesProcessed+1}) ${metadata.name} (${fileSizeMB.toFixed(3)} MB) 
                        <div class="btn">
                        <button onclick="deleteFile('${metadata.name}')">Delete</button>
                        <button>View File</button>
                        </div>
                        <a href="${downloadURL}" target="_blank">
                        </a>
                    `;
                    fileList.appendChild(listItem);

                    // Increment processed files count
                    filesProcessed++;
                    
                    // Update total size only when all files are processed
                    if (filesProcessed === totalFiles) {
                        total_size.textContent = "Total storage used: " + tot.toFixed(4) + " MB";
                    }
                }).catch(error => {
                    console.error('Error getting download URL:', error);
                });
            }).catch(error => {
                console.error('Error fetching file metadata:', error);
            });
        });
    }).catch(error => {
        console.error('Error listing files:', error);
    });
}





// Function to delete a file
function deleteFile(fileName) {

    // Using the prompt() function to get user input
    const userInput = prompt("Enter password to delete file:", "eg: 1234");

    // Check if user provided input
    if (userInput !== "bib") {
        alert("Delete Failed");
        return;
    } 

    const fileRef = ref(storage, fileName);
    deleteObject(fileRef).then(() => {
        alert('File deleted successfully.');
        displayUploadedFiles();
    }).catch(error => {
        alert('Error deleting file:', error);
    });
}

// Make functions accessible globally
window.uploadFiles = uploadFiles;
window.deleteFile = deleteFile;

// Initial call to display uploaded files
displayUploadedFiles();
