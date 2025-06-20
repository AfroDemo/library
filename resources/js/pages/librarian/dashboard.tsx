'use client';

import { Head, usePage } from '@inertiajs/react';
import { BrowserMultiFormatReader, DecodeHintType } from '@zxing/library';
import axios from 'axios';
import { AlertCircle, BookOpen, CheckCircle, Clock, RefreshCw, Scan, TrendingUp, User } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { Book, BreadcrumbItem, DashboardStats, PageProps, Student, ToastMessage } from '../../types';

type ScanStep = 'student' | 'book';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Librarian', href: '/librarian' },
    { title: 'Dashboard', href: '/librarian/dashboard' },
];

export default function LibrarianDashboard() {
    const { auth } = usePage<PageProps>().props;

    // Scanning state
    const [scanStep, setScanStep] = useState<ScanStep>('student');
    const [scanInput, setScanInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [student, setStudent] = useState<Student | null>(null);
    const [book, setBook] = useState<Book | null>(null);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
    const [isSecureContext, setIsSecureContext] = useState<boolean>(window.isSecureContext);

    // Dashboard stats
    const [stats, setStats] = useState<DashboardStats>({});
    const [isStatsLoading, setIsStatsLoading] = useState(true);

    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReader = useRef<BrowserMultiFormatReader | null>(null);

    useEffect(() => {
        fetchDashboardStats();
        if (inputRef.current) {
            inputRef.current.focus();
        }

        // Initialize ZXing code reader with QR code optimization
        const hints = new Map();
        hints.set(DecodeHintType.TRY_HARDER, true); // Improve QR code detection
        hints.set(DecodeHintType.POSSIBLE_FORMATS, ['qr_code']); // Focus on QR codes for student IDs

        codeReader.current = new BrowserMultiFormatReader(hints, {
            formats: ['qr_code', 'ean_13'], // QR for student IDs, EAN-13 for books
        });

        // Check camera access and load cameras
        checkCameraAccess().then((hasAccess) => {
            if (hasAccess) {
                loadCameras();
            }
        });

        return () => {
            stopScanning();
        };
    }, []);

    const checkCameraAccess = async (): Promise<boolean> => {
        if (!isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            setCameraError('Camera access requires HTTPS. Please use https://localhost or configure HTTPS.');
            showToast('error', 'Camera access requires HTTPS. Please use https://localhost.');
            return false;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach((track) => track.stop());
            return true;
        } catch (error: any) {
            let errorMessage = 'Failed to access camera. Please allow camera permissions or use manual input.';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings.';
                showPermissionInstructions();
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera found. Please connect a camera or use manual input.';
            }
            setCameraError(errorMessage);
            showToast('error', errorMessage);
            return false;
        }
    };

    const loadCameras = async () => {
        if (!codeReader.current) return;

        try {
            const devices = await codeReader.current.listVideoInputDevices();
            setCameraDevices(devices);
            if (devices.length > 0) {
                setSelectedCamera(devices[0].deviceId); // Set default camera
            } else {
                setCameraError('No camera found. Please connect a camera or use manual input.');
                showToast('error', 'No camera found. Please connect a camera or use manual input.');
            }
        } catch (err) {
            console.error('Failed to list camera devices:', err);
            setCameraError('Failed to access camera devices. Please use manual input.');
            showToast('error', 'Failed to access camera devices.');
        }
    };

    const parseStudentId = (scannedText: string): string | null => {
        // Expected format: "202405016|22100533590050|2024/2025"
        const parts = scannedText.split('|');
        if (parts.length === 3) {
            return parts[1]; // Return the second part (e.g., 22100533590050)
        }
        // If input doesn't match expected format, assume it's already the student_id
        return scannedText;
    };

    const startScanning = async () => {
        if (!codeReader.current || !videoRef.current || !selectedCamera) {
            setCameraError('No camera selected. Please select a camera or use manual input.');
            showToast('error', 'No camera selected. Please select a camera or use manual input.');
            return;
        }

        try {
            setIsScanning(true);
            setCameraError(null);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: selectedCamera,
                    width: { ideal: 1280 }, // Higher resolution for better QR detection
                    height: { ideal: 720 },
                    facingMode: 'environment', // Prefer rear camera on mobile
                },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const SCAN_TIMEOUT = 30000;
            const timeoutId = setTimeout(() => {
                stopScanning();
                showToast('info', 'Scanning timed out. Please try again or use manual input.');
            }, SCAN_TIMEOUT);

            codeReader.current.decodeFromVideoDevice(selectedCamera, videoRef.current, (result, error) => {
                if (result) {
                    const scannedText = result.getText();
                    console.log('Scanned QR code:', scannedText); // Debug log
                    if (scanStep === 'student') {
                        const studentId = parseStudentId(scannedText);
                        setScanInput(studentId);
                    } else {
                        setScanInput(scannedText); // For book ISBNs, use raw scan
                    }
                    handleScanSubmit({ preventDefault: () => {} } as React.FormEvent);
                    clearTimeout(timeoutId);
                    stopScanning();
                }
                if (error && !error.message.includes('No MultiFormat Readers were able to detect the code')) {
                    console.error('Scanning error:', error);
                    showToast('error', 'Failed to detect QR code. Please try again or use manual input.');
                }
            });
        } catch (error: any) {
            let errorMessage = 'Failed to access camera. Please allow camera permissions or use manual input.';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings.';
                showPermissionInstructions();
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera found. Please connect a camera or use manual input.';
            }
            setCameraError(errorMessage);
            showToast('error', errorMessage);
            setIsScanning(false);
        }
    };

    const stopScanning = () => {
        if (codeReader.current) {
            codeReader.current.reset();
        }
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsScanning(false);
    };

    useEffect(() => {
        if (cameraError && inputRef.current) {
            inputRef.current.focus();
        } else if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [scanStep, cameraError]);

    const showPermissionInstructions = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        let instructions = 'Please enable camera permissions in your browser settings.';
        if (userAgent.includes('chrome')) {
            instructions += ' Go to Settings > Privacy and security > Site settings > Camera.';
        } else if (userAgent.includes('firefox')) {
            instructions += ' Go to Preferences > Privacy & Security > Permissions > Camera.';
        } else if (userAgent.includes('safari')) {
            instructions += ' Go to Preferences > Websites > Camera.';
        }
        showToast('info', instructions);
    };

    const fetchDashboardStats = async () => {
        try {
            const response = await axios.get('/api/librarian/dashboard-stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
            showToast('error', 'Failed to load dashboard stats');
        } finally {
            setIsStatsLoading(false);
        }
    };

    const showToast = (type: ToastMessage['type'], message: string) => {
        const id = Date.now().toString();
        const toast: ToastMessage = { type, message, id };
        setToasts((prev) => [...prev, toast]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const handleScanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scanInput.trim() || isLoading) return;

        setIsLoading(true);

        try {
            if (scanStep === 'student') {
                // Parse input in case user manually enters full QR code
                const studentId = parseStudentId(scanInput.trim());
                const response = await axios.get(`/api/students/${studentId}`);
                setStudent(response.data);
                setScanStep('book');
                setScanInput('');
                showToast('success', `Student ${response.data.name} loaded successfully`);
            } else {
                const bookResponse = await axios.get(`/api/books/${scanInput.trim()}`);
                const bookData: Book = bookResponse.data;

                if (!bookData.available) {
                    showToast('error', 'This book is currently unavailable');
                    setScanInput('');
                    return;
                }

                setBook(bookData);

                await axios.post('/api/transactions', {
                    student_id: student?.student_id,
                    isbn: bookData.isbn,
                });

                showToast('success', `Book "${bookData.title}" borrowed successfully`);
                handleReset();
                fetchDashboardStats();
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || (scanStep === 'student' ? 'Student not found' : 'Book not found');
            showToast('error', errorMessage);
            setScanInput('');
        } finally {
            setIsLoading(false);
            stopScanning();
        }
    };

    const handleReset = () => {
        setScanStep('student');
        setScanInput('');
        setStudent(null);
        setBook(null);
        stopScanning();
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Librarian Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Welcome & Quick Stats */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <h1 className="mb-2 text-xl font-bold text-gray-900">Welcome, {auth.user.name}</h1>
                        <p className="text-gray-600">Manage book transactions and assist library users with their borrowing needs.</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Today's Transactions</p>
                                <p className="text-2xl font-bold text-gray-900">{isStatsLoading ? '...' : stats.totalTransactions || 0}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Overdue Books</p>
                                <p className="text-2xl font-bold text-gray-900">{isStatsLoading ? '...' : stats.overdueBooks || 0}</p>
                            </div>
                            <Clock className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                </div>

                {/* Scanning Interface */}
                <div className="rounded-lg bg-gradient-to-br from-gray-50 to-blue-50 p-6">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Scanner Section */}
                        <div className="space-y-6">
                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
                                <div className="mb-6 flex items-center space-x-3">
                                    <Scan className="h-6 w-6 text-blue-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {scanStep === 'student' ? 'Scan Student ID QR Code' : 'Scan Book ISBN'}
                                    </h2>
                                </div>

                                {cameraDevices.length > 0 && (
                                    <div className="mb-4">
                                        <label htmlFor="cameraSelect" className="block text-sm font-medium text-gray-700">
                                            Select Camera
                                        </label>
                                        <select
                                            id="cameraSelect"
                                            value={selectedCamera || ''}
                                            onChange={(e) => setSelectedCamera(e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2"
                                        >
                                            <option value="" disabled>
                                                Select a camera
                                            </option>
                                            {cameraDevices.map((device) => (
                                                <option key={device.deviceId} value={device.deviceId}>
                                                    {device.label || `Camera ${device.deviceId}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="relative mb-4">
                                    <video
                                        ref={videoRef}
                                        className={`w-full rounded-lg ${isScanning ? 'block' : 'hidden'}`}
                                        style={{ maxHeight: '300px' }}
                                        autoPlay
                                    />
                                    {isScanning && (
                                        <div className="pointer-events-none absolute top-1/4 left-1/4 h-1/2 w-1/2 rounded-lg border-2 border-green-500 opacity-50"></div>
                                    )}
                                    {!isScanning && (
                                        <div className="flex h-[300px] w-full items-center justify-center rounded-lg bg-gray-100">
                                            {cameraError ? (
                                                <p className="px-4 text-center text-red-600" id="camera-error">
                                                    {cameraError}
                                                </p>
                                            ) : (
                                                <p className="text-gray-500">Camera feed will appear here when scanning</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleScanSubmit} className="space-y-4">
                                    <div className="relative">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={scanInput}
                                            onChange={(e) => setScanInput(e.target.value)}
                                            placeholder={
                                                cameraError
                                                    ? 'Enter student ID or full QR code manually...'
                                                    : scanStep === 'student'
                                                      ? 'Scan or enter student ID...'
                                                      : 'Scan or enter book ISBN...'
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            disabled={isLoading}
                                            aria-describedby={cameraError ? 'camera-error' : undefined}
                                        />
                                        {isLoading && (
                                            <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
                                                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={isScanning ? stopScanning : startScanning}
                                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={isLoading || !selectedCamera}
                                            aria-label={isScanning ? 'Stop scanning' : 'Start scanning'}
                                        >
                                            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!scanInput.trim() || isLoading}
                                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            aria-label="Submit manual scan"
                                        >
                                            {isLoading ? 'Processing...' : 'Manual Scan'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                                            aria-label="Reset scanning"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </button>
                                    </div>
                                </form>

                                {/* Step Indicator */}
                                <div className="mt-6 flex items-center justify-center space-x-4">
                                    <div
                                        className={`flex items-center space-x-2 rounded-full px-3 py-1 text-sm ${
                                            scanStep === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                        }`}
                                    >
                                        <span className={`h-2 w-2 rounded-full ${scanStep === 'student' ? 'bg-blue-600' : 'bg-green-600'}`}></span>
                                        <span>Step 1: Student ID</span>
                                    </div>
                                    <div
                                        className={`flex items-center space-x-2 rounded-full px-3 py-1 text-sm ${
                                            scanStep === 'book' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        <span className={`h-2 w-2 rounded-full ${scanStep === 'book' ? 'bg-blue-600' : 'bg-gray-400'}`}></span>
                                        <span>Step 2: Book ISBN</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Information Cards Section */}
                        <div className="space-y-6">
                            {/* Student Information Card */}
                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
                                <div className="mb-4 flex items-center space-x-3">
                                    <User className="h-6 w-6 text-green-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
                                </div>

                                {student ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Student ID:</span>
                                            <span className="font-medium">{student.student_id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Name:</span>
                                            <span className="font-medium">{student.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Email:</span>
                                            <span className="font-medium">{student.email}</span>
                                        </div>
                                        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span className="text-sm text-green-800">Student verified</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <User className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                        <p>Scan a student ID QR code to view information</p>
                                    </div>
                                )}
                            </div>

                            {/* Book Information Card */}
                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
                                <div className="mb-4 flex items-center space-x-3">
                                    <BookOpen className="h-6 w-6 text-blue-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">Book Information</h3>
                                </div>

                                {book ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">ISBN:</span>
                                            <span className="font-medium">{book.isbn}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Title:</span>
                                            <span className="font-medium">{book.title}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Author:</span>
                                            <span className="font-medium">{book.author}</span>
                                        </div>
                                        <div className="mt-4">
                                            <div
                                                className={`rounded-lg border p-3 ${
                                                    book.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    {book.available ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                                    )}
                                                    <span className={`text-sm ${book.available ? 'text-green-800' : 'text-red-800'}`}>
                                                        {book.available ? 'Available for borrowing' : 'Currently unavailable'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                        <p>Scan a book ISBN to view information</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <a
                        href="/librarian/transactions"
                        className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <div className="flex items-center space-x-3">
                            <BookOpen className="h-8 w-8 text-blue-600" />
                            <div>
                                <h3 className="font-semibold text-gray-900">View Transactions</h3>
                                <p className="text-sm text-gray-600">Browse all borrowing records</p>
                            </div>
                        </div>
                    </a>

                    <a
                        href="/librarian/returns"
                        className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <div className="flex items-center space-x-3">
                            <RefreshCw className="h-8 w-8 text-green-600" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Process Returns</h3>
                                <p className="text-sm text-gray-600">Handle book returns</p>
                            </div>
                        </div>
                    </a>

                    <a
                        href="/librarian/overdue"
                        className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <div className="flex items-center space-x-3">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Overdue Books</h3>
                                <p className="text-sm text-gray-600">Manage overdue items</p>
                            </div>
                        </div>
                    </a>
                </div>
            </div>

            {/* Toast Notifications */}
            <div className="fixed right-4 bottom-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex max-w-sm items-center space-x-3 rounded-lg border px-4 py-3 shadow-lg ${
                            toast.type === 'success'
                                ? 'border-green-200 bg-green-50 text-green-800'
                                : toast.type === 'error'
                                  ? 'border-red-200 bg-red-50 text-red-800'
                                  : 'border-blue-200 bg-blue-50 text-blue-800'
                        }`}
                    >
                        {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                        {toast.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-600" />}
                        <span className="text-sm font-medium">{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
