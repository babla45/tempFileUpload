// Import Firebase modules and configuration
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

// Alert function
const calert = (message) => {
    const popup = document.getElementById('popup-message');
    const overlay = document.getElementById('popup-overlay');
    
    // Set message and show popup with overlay
    if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
        popup.className = `bg-gradient-to-r from-red-500 to-rose-600
                          text-white text-lg font-bold px-8 py-4 rounded-lg
                          shadow-2xl border-2 border-white/20 transform scale-110`;
    } else if (message.toLowerCase().includes('success')) {
        popup.className = `bg-gradient-to-r from-green-500 to-emerald-600
                          text-white text-lg font-bold px-8 py-4 rounded-lg
                          shadow-2xl border-2 border-white/20 transform scale-110`;
    } else {
        popup.className = `bg-gradient-to-r from-blue-500 to-purple-600
                          text-white text-lg font-bold px-8 py-4 rounded-lg
                          shadow-2xl border-2 border-white/20 transform scale-110`;
    }
    
    popup.textContent = message;
    popup.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    setTimeout(() => {
        popup.classList.add('hidden');
        overlay.classList.add('hidden');
    }, 2000);
};

// Main functions
function uploadFiles() {
    const files = document.getElementById('file-upload').files;
    const progressSection = document.getElementById('progress-section');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    if (!files.length) {
        calert('Please select files to upload.');
        return;
    }

    // Show progress section
    progressSection.classList.remove('hidden');

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
                progressSection.classList.add('hidden');
                calert(`Error uploading file: ${error}`);
            },
            () => {
                totalBytesTransferred += file.size;

                if (totalBytesTransferred === totalSize) {
                    calert('All files uploaded successfully.');
                    progressBar.value = 0;
                    progressText.innerHTML = '';
                    progressSection.classList.add('hidden');
                    displayUploadedFiles();

                    // Clear file input after successful upload
                    document.getElementById('file-upload').value = '';
                }
            }
        );
    }
}

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
                listItem.className = 'p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex justify-between items-center';
                listItem.innerHTML = `
                    <div class="flex-1">
                        <span class="font-medium text-gray-700 dark:text-gray-200">${index + 1}. ${file.name}</span>
                        <span class="text-sm text-bold dark:text-gray-400 ml-2">(${fileSizeMB.toFixed(3)} MB)</span>
                    </div>
                    <div class="flex gap-2">
                        <button class="view-btn px-4 py-1.5 bg-gray-800 dark:bg-black text-emerald-400 
                                     dark:text-emerald-300 rounded-lg shadow-lg shadow-black/20 
                                     hover:bg-gray-800 dark:hover:bg-gray-900 
                                     transition-all duration-200">Download</button>
                        <button class="delete-btn px-4 py-1.5 bg-gray-800 dark:bg-black text-emerald-400 
                                     dark:text-emerald-300 rounded-lg shadow-lg shadow-black/20 
                                     hover:bg-gray-800 dark:hover:bg-gray-900 
                                     transition-all duration-200">Delete</button>
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

            // Update total size with colorful formatting
            total_size.innerHTML = `
            <span class="inline-flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
                </svg>
                Total Storage Used: ${tot.toFixed(2)} MB
            </span>`;
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

function deleteFile(fileName) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm';

    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl max-w-md w-full mx-4 animate-fadeIn">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Enter password to delete the file:</h3>
            <input type="password" id="password-input" 
                   class="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 
                          bg-white dark:bg-gray-700 text-gray-800 dark:text-white mb-4" 
                   placeholder="Enter password" />
            <div class="flex gap-3 justify-end">
                <button id="toggle-password"
                        class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors">
                    Show
                </button>
                <button id="confirm-delete"
                        class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors">
                    Delete
                </button>
                <button id="cancel-delete"
                        class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors">
                    Cancel
                </button>
            </div>
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

export function goToTempFile() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm';

    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl max-w-md w-full mx-4 animate-fadeIn">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Enter password to access second website:</h3>
            <input type="password" id="password-input" 
                   class="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 
                          bg-white dark:bg-gray-700 text-gray-800 dark:text-white mb-4" 
                   placeholder="Enter password" />
            <div class="flex gap-3 justify-end">
                <button id="toggle-password"
                        class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors">
                    Show
                </button>
                <button id="confirm-delete"
                        class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors">
                    Access
                </button>
                <button id="cancel-delete"
                        class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors">
                    Cancel
                </button>
            </div>
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
            calert('Incorrect Password. Website load failed');
        } else {
            window.location.href = "https://babla45.github.io/beautiful-images/uploadFile/index.html";
        
        }
    
        document.body.removeChild(modal); // Close the modal
    });

    // Cancel deletion
    cancelDeleteButton.addEventListener('click', () => {
        document.body.removeChild(modal); // Close the modal
    });
}

// Make functions accessible globally and initialize
window.uploadFiles = uploadFiles;
window.deleteFile = deleteFile;
displayUploadedFiles();

// Dark mode setup
function setupDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'true' || 
        (!localStorage.getItem('darkMode') && 
         window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    darkModeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', 
            document.documentElement.classList.contains('dark'));
    });
}

setupDarkMode();