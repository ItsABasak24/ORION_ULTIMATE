
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import { FiUploadCloud, FiFileText, FiTrash2, FiAlertCircle, FiLink, FiCpu, FiMessageSquare } from 'react-icons/fi';
import axios from 'axios';
import { getAccessToken } from '../services/UserService';
import { postUpload, checkUploadStatus } from '../services/uploadService';

const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL;
const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;

const PROCESSING_TEXTS = [
    "Initializing vector engines...",
    "Extracting text from PDF...",
    "Analyzing document structure...",
    "Chunking data for vectorization...",
    "Generating AI embeddings...",
    "Storing context to Vector Database...",
    "Finalizing smart context...",
    "Almost ready..."
];

const UploadPage = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState(PROCESSING_TEXTS[0]);

    useEffect(() => {
        const savedFile = localStorage.getItem('orion_pdf_meta');
        if (savedFile) {
            setFile(JSON.parse(savedFile));
        }
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        validateAndProcess(droppedFile);
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        validateAndProcess(selectedFile);
    };

    const validateAndProcess = (selectedFile) => {
        setError('');
        if (!selectedFile) return;

        if (selectedFile.type !== 'application/pdf') {
            setError('Only PDF files are allowed.');
            return;
        }

        if (selectedFile.size > 20 * 1024 * 1024) {
            setError('File is too large (Max 10MB).');
            return;
        }

        uploadToCloudinary(selectedFile);
    };

    const uploadToCloudinary = async (fileToUpload) => {
        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("upload_preset", UPLOAD_PRESET);

        try {
            const response = await axios.post(CLOUDINARY_URL, formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            const uploadedUrl = response.data.secure_url;

            const fileMeta = {
                name: fileToUpload.name,
                size: (fileToUpload.size / 1024 / 1024).toFixed(2) + ' MB',
                date: new Date().toLocaleDateString(),
                url: uploadedUrl
            };

            localStorage.setItem('orion_pdf_meta', JSON.stringify(fileMeta));

            setFile(fileMeta);
            setUploading(false);
        } catch (err) {
            console.error(err);
            setError('Upload failed. Please check your network or Cloudinary config.');
            setUploading(false);
        }
    };

    const removeFile = () => {
        localStorage.removeItem('orion_pdf_meta');
        setFile(null);
        setProgress(0);
    };

    const pollUploadStatus = async (sessionId, token, attempt = 0) => {
        try {
            setProcessingMessage(PROCESSING_TEXTS[attempt % PROCESSING_TEXTS.length]);
            const response = await checkUploadStatus(sessionId, token);

            if (response.data?.status === true) {
                navigate('/ask-orion');
            } else {
                setTimeout(
                    () => pollUploadStatus(sessionId, token, attempt + 1), 5000
                );
            }
        } catch (err) {
            console.error('Polling error:', err);
            setError('Failed to check processing status. Please try again.');
            setIsProcessing(false);
        }
    };

    const handleContinue = async () => {
        if (!file) {
            setError("Please upload a file first.");
            return;
        }

        setError('');
        setIsProcessing(true);
        setProcessingMessage(PROCESSING_TEXTS[0]);

        try {
            const authDataString = localStorage.getItem('orion_auth');
            if (!authDataString) throw new Error("User auth data not found");

            const authData = JSON.parse(authDataString);
            const userId = authData.id;
            const token = await Promise.resolve(getAccessToken());

            if (!token) throw new Error('Failed to retrieve auth token.');
            const uploadResponse = await postUpload(userId, file.url, token);

            if (uploadResponse.status === 201 || uploadResponse.status === 200) {
                const sessionId = uploadResponse.data.sessionid;
                localStorage.setItem('sessionId', sessionId);
                pollUploadStatus(sessionId, token);
            } else {
                throw new Error("Unexpected response from server.");
            }

        } catch (err) {
            if (err.status === 401) {
                setError(" Your token was expired please login again.")
                setIsProcessing(false);
            } else if (err.status === 429) {
                setError("Daily limit reached. You have exhausted your upload for this 12 hours.")
                setIsProcessing(false);
            } else {
                console.log(err);
                setError(err.response?.data?.massage || err.massage || "Failed to start document processing.");
                setIsProcessing(false);
            }
        }
    };

    return (
        <>
            <Navbar ButtonOneText={'Logout'} ButtonOneRoute={'/'} ButtonTwoText={'Home'} ButtonTwoRoute={'/'} />
            <div className="relative min-h-screen text-white font-sans selection:bg-lime-500/30 flex items-center justify-center pt-18 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size[24px_24px]"></div>
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-200 h-125 bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>

                <main className="relative z-10 w-full max-w-2xl px-4">

                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl">
                            <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse"></span>
                            <span className="text-xs font-semibold tracking-wide text-gray-300">CLOUD SYNC ACTIVE</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                            Smart Analysis
                        </h1>
                        <p className="text-gray-400">Upload your PDF to Cloud Storage.</p>
                    </div>

                    {/* Upload Card */}
                    <div className="relative group">
                        <div className={`absolute -inset-0.5 bg-linear-to-r from-lime-500 to-indigo-500 rounded-2xl opacity-20 blur transition duration-1000 group-hover:opacity-40 ${dragging ? 'opacity-60' : ''}`}></div>
                        <div className="relative bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">

                            {isProcessing ? (
                                /* Processing / Polling View */
                                <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-lime-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                        <div className="h-20 w-20 border-4 border-white/10 border-t-lime-500 rounded-full animate-spin flex items-center justify-center relative z-10 bg-black/50">
                                            <FiCpu size={32} className="text-lime-400 animate-pulse" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Processing Document</h3>
                                    <p className="text-lime-400 font-mono text-sm animate-pulse">
                                        {processingMessage}
                                    </p>
                                </div>
                            ) : !file && !uploading ? (
                                /* Standard Upload Area */
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`
                                        relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer
                                        ${dragging
                                            ? 'border-lime-400 bg-lime-400/5 scale-[1.02]'
                                            : 'border-gray-700 hover:border-gray-500 hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileSelect}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />

                                    <div className={`p-4 rounded-full bg-white/5 mb-4 ${dragging ? 'text-lime-400' : 'text-gray-400'}`}>
                                        <FiUploadCloud size={40} />
                                    </div>
                                    <p className="text-lg font-medium text-white mb-2">
                                        Click or drag PDF here
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Secure Cloud Upload (Max 10MB)
                                    </p>
                                </div>
                            ) : (
                                /* File Uploaded/Uploading State */
                                <div className="border border-white/10 rounded-xl p-6 bg-white/5 relative overflow-hidden">
                                    {uploading && (
                                        <div
                                            className="absolute bottom-0 left-0 h-1 bg-lime-500 transition-all duration-300 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    )}

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-red-500/20 text-red-400 rounded-lg">
                                                <FiFileText size={28} />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-medium text-white truncate max-w-50 md:max-w-75">
                                                    {file ? file.name : 'Uploading...'}
                                                </h3>
                                                <p className="text-xs text-gray-400 font-mono">
                                                    {file ? `${file.size} • ${file.date}` : `${progress}% Complete`}
                                                </p>
                                            </div>
                                        </div>

                                        {uploading ? (
                                            <div className="h-5 w-5 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <a
                                                    href={file?.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                                                    title="View Link"
                                                >
                                                    <FiLink size={18} />
                                                </a>
                                                <button
                                                    onClick={removeFile}
                                                    className="p-2 hover:bg-red-500/20 hover:text-red-400 text-gray-500 rounded-lg transition-colors"
                                                    title="Remove File"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm animate-fade-in">
                                    <FiAlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-400">
                            Files are securely stored and encrypted via cloudinary.
                        </p>
                        <p className="text-lg text-gray-400">
                            <b>Usage Policy:</b> You can upload up to 2 files every 12 hours.
                        </p>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">

                        <button
                            type="button"
                            onClick={handleContinue}
                            disabled={!file || isProcessing || uploading}
                            className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold tracking-wide transition-all duration-300
                                ${!file || isProcessing || uploading
                                    ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                                    : 'bg-lime-500 text-black hover:bg-lime-400 hover:shadow-[0_0_20px_rgba(132,204,22,0.3)] active:scale-95'
                                }`}
                            aria-label="Continue"
                            >
                            {isProcessing ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Upload To Continue"
                            )}
                        </button>

                        {/* Secondary Action: Chat (Conditional) */}
                        {localStorage.getItem('sessionId') && (
                            <button
                                type="button"
                                onClick={() => navigate('/ask-orion')}
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold tracking-wide text-lime-400 bg-transparent border border-lime-500/30 hover:bg-lime-500/10 hover:border-lime-500/60 transition-all duration-300 active:scale-95"
                            >
                                <FiMessageSquare size={18} />
                                Resume Chat
                            </button>
                        )}
                    </div>

                </main>
            </div>
        </>
    );
};

export default UploadPage;