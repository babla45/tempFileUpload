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



// -------popup message--------
// calert == custom calert using popup message
const calert = (message) => {
    const popup = document.getElementById('popup-message');
    const overlay = document.getElementById('popup-overlay');
    
    // Set message and show popup with overlay
    popup.textContent = message;
    popup.classList.remove('hidden');
    popup.classList.add('visible');
    overlay.classList.remove('hidden');
    overlay.classList.add('visible');
    
    // Hide popup and overlay after 2 seconds
    setTimeout(() => {
        popup.classList.remove('visible');
        popup.classList.add('hidden');
        overlay.classList.remove('visible');
        overlay.classList.add('hidden');
    }, 2000);
};
// Replace the alert with this function
// calert(`Error uploading file: ${error}`);
// -------popup message end--------





// Function to upload files
function uploadFiles() {
    const files = document.getElementById('file-upload').files;
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    if (!files.length) {
        calert('Please select files to upload.');
        return;
    }

    let totalSize = 0;
    for (let file of files) {
        if (file.size > 500 * 1024 * 1024) {
            calert('File size exceeds the limit of 500MB.');
            return;
        }
        totalSize += file.size;
    }

    let totalBytesTransferred = 0;

    for (let file of files) {
        const fileRef = ref(storage, file.name);
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const currentFileProgress = snapshot.bytesTransferred / file.size;
                const totalProgress = ((totalBytesTransferred + snapshot.bytesTransferred) / totalSize) * 100;

                progressBar.value = totalProgress;
                progressText.innerHTML = `Upload is ${totalProgress.toFixed(2)}% done`;
            },
            (error) => {
                calert(`Error uploading file: ${error}`);
            },
            () => {
                totalBytesTransferred += file.size;

                if (totalBytesTransferred === totalSize) {
                    calert('All files uploaded successfully.');
                    progressBar.value = 0;
                    progressText.innerHTML = '';
                    displayUploadedFiles();

                    // Clear file input after successful upload
                    document.getElementById('file-upload').value = '';
                }
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

    listAll(storageRef)
        .then((res) => {
            // Map metadata and download URL fetching into promises
            const filePromises = res.items.map((itemRef) =>
                getMetadata(itemRef)
                    .then((metadata) => ({
                        name: metadata.name,
                        size: metadata.size,
                        updated: metadata.updated,
                        ref: itemRef,
                    }))
                    .then((file) =>
                        getDownloadURL(file.ref).then((downloadURL) => ({
                            ...file,
                            downloadURL,
                        }))
                    )
            );

            // Resolve all promises and sort files by upload date
            return Promise.all(filePromises).then((files) =>
                files.sort((a, b) => new Date(b.updated) - new Date(a.updated))
            );
        })
        .then((sortedFiles) => {
            // Render files in sorted order
            sortedFiles.forEach((file, index) => {
                const fileSizeMB = file.size / (1024 * 1024);
                tot += fileSizeMB;

                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    (${index + 1}) ${file.name} (${fileSizeMB.toFixed(3)} MB) 
                    <div class="btn">
                        <button class="delete-btn">Delete</button>
                        <button class="view-btn">View File</button>
                    </div>
                `;

                // Append to list
                fileList.appendChild(listItem);

                // Add delete functionality
                listItem.querySelector('.delete-btn').addEventListener('click', () => deleteFile(file.name));

                // Add view functionality
                listItem.querySelector('.view-btn').addEventListener('click', () => {
                    window.open(file.downloadURL, '_blank'); // Open in a new tab
                });
            });

            // Update total size
            total_size.textContent = "Total storage used: " + tot.toFixed(4) + " MB";
        })
        .catch((error) => {
            console.error('Error listing files:', error);
        });
}


function encrypt(s, f) {
    var strArr = s.split(''); // Convert the string to an array of characters
    var sum;

    function process() {
        sum = strArr.length;

        for (var i = 0; i < strArr.length; i++) {
            sum += strArr[i].charCodeAt(0);
            sum %= 128;
            var c = Math.max(37, sum);
            var newChar = strArr[i].charCodeAt(0) ^ c;
            if (newChar <= 33) {
                newChar += 32;
            } else {
                newChar--;
            }
            strArr[i] = String.fromCharCode(newChar);
        }
    }

    while (f-- > 0) {
        process();
    }

    return strArr.join(''); // Convert the array back to a string
}



// Function to delete a file
function deleteFile(fileName) {
    // Create a modal dialog for password input
    const modal = document.createElement('div');
    modal.className = 'modal';

    modal.innerHTML = `
        <div class="modal-content">
            <h3>Enter password to delete the file:</h3>
            <input type="password" id="password-input" placeholder="Eg. 12345" />
            <button id="toggle-password">Show</button>
            <button id="confirm-delete">Confirm</button>
            <button id="cancel-delete">Cancel</button>
        </div>
    `;

    document.body.appendChild(modal);

    const passwordInput = document.getElementById('password-input');
    const togglePasswordButton = document.getElementById('toggle-password');
    const confirmDeleteButton = document.getElementById('confirm-delete');
    const cancelDeleteButton = document.getElementById('cancel-delete');

    // Toggle password visibility
    togglePasswordButton.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            togglePasswordButton.textContent = 'Hide';
        } else {
            passwordInput.type = 'password';
            togglePasswordButton.textContent = 'Show';
        }
    });

    // Confirm deletion
    confirmDeleteButton.addEventListener('click', () => {
        const userInput = passwordInput.value;

        if (encrypt(userInput, 5) !== "#!5") {
            calert('Incorrect Password. Delete Failed');
        } else {
            const fileRef = ref(storage, fileName);
            deleteObject(fileRef)
                .then(() => {
                    calert('File deleted successfully.');
                    displayUploadedFiles();
                })
                .catch((error) => {
                    calert(`Error deleting file: ${error}`);
                });
        }

        document.body.removeChild(modal); // Close the modal
    });

    // Cancel deletion
    cancelDeleteButton.addEventListener('click', () => {
        document.body.removeChild(modal); // Close the modal
    });
}


// Make functions accessible globally
window.uploadFiles = uploadFiles;
window.deleteFile = deleteFile;

// Initial call to display uploaded files
displayUploadedFiles();


function welcomeMessage(){
    calert("Hello !! Welcome to my Website");
}

welcomeMessage();