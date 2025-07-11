'use client';

import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { AlertCircle, BookOpen, CheckCircle, Clock, RefreshCw, Scan, Trash2, TrendingUp, User } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '../../layouts/app-layout';
import type { BreadcrumbItem, DashboardStats, PageProps, Student, ToastMessage } from '../../types';

type ScanStep = 'student' | 'book' | 'confirm';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Dashboard', href: '/librarian/dashboard' },
];

interface Props extends PageProps {
    stats: DashboardStats;
    student: Student | null;
    book: Book | null;
    scanStep: ScanStep;
    errors: Record<string, string>;
    success: string | null;
}

export default function LibrarianDashboard() {
    const { auth, stats, student: initialStudent, book: initialBook, scanStep: initialScanStep, errors, success } = usePage<Props>().props;
    console.log('Received props:', { scanStep: initialScanStep, student: initialStudent, book: initialBook, success, errors });

    const [scanInput, setScanInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraDevices, setCameraDevices] = useState<{ id: string; label: string }[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [clearanceStatus, setClearanceStatus] = useState<{
        isCleared: boolean;
        message: string;
        details?: { activeLoans: number; unpaidFines: number };
    } | null>(null);
    const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
    const [clearanceScanInput, setClearanceScanInput] = useState('');
    const [isClearanceScanning, setIsClearanceScanning] = useState(false);
    const [clearanceCameraError, setClearanceCameraError] = useState<string | null>(null);
    const lastToastTimeRef = useRef<number>(0);

    const { data, setData, post, processing, reset } = useForm({
        scan_input: '',
        scan_step: initialScanStep,
    });

    const {
        data: clearanceData,
        setData: setClearanceData,
        post: clearancePost,
        processing: clearanceProcessing,
        reset: clearanceReset,
    } = useForm({
        member_id: '',
    });

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const clearanceScannerRef = useRef<Html5Qrcode | null>(null);
    const scannerContainerRef = useRef<HTMLDivElement>(null);
    const clearanceScannerContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const clearanceInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        console.log('initialScanStep changed:', initialScanStep);
        setData('scan_step', initialScanStep);
    }, [initialScanStep, setData]);

    useEffect(() => {
        setIsMobile(/mobile|android|iphone|ipad|tablet/i.test(navigator.userAgent.toLowerCase()));
        if (initialScanStep !== 'confirm') {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode('scanner-container', { verbose: true });
            }
            loadCameras();
        }
        if (initialScanStep !== 'confirm' && inputRef.current) {
            inputRef.current.focus();
        }
        if (success) {
            showToast('success', success);
        }
        if (errors.scan_input) {
            showToast('error', errors.scan_input);
        }
        if (errors.student_id || errors.book_isbn) {
            showToast('error', errors.student_id?.[0] || errors.book_isbn?.[0] || 'Validation error occurred.');
        }
        return () => {
            stopScanning();
            stopClearanceScanning();
            if (initialScanStep === 'confirm' && scannerRef.current) {
                scannerRef.current = null;
            }
        };
    }, [success, errors, initialScanStep]);

    const loadCameras = async () => {
        if (!scannerRef.current || !clearanceScannerRef.current) {
            scannerRef.current = new Html5Qrcode('scanner-container', { verbose: true });
            clearanceScannerRef.current = new Html5Qrcode('clearance-scanner-container', { verbose: true });
        }
        try {
            const devices = await Html5Qrcode.getCameras();
            console.log('Available cameras:', devices);
            const formattedDevices = devices.map((device) => ({
                id: device.id,
                label: device.label || `Camera ${device.id}`,
            }));
            setCameraDevices(formattedDevices);
            if (devices.length > 0) {
                const rearCamera =
                    devices.find(
                        (device) =>
                            device.label?.toLowerCase().includes('back') ||
                            device.label?.toLowerCase().includes('rear') ||
                            device.label?.toLowerCase().includes('environment'),
                    ) || devices[0];
                setSelectedCamera(rearCamera.id);
                if (isMobile && devices.length === 1 && rearCamera.label?.toLowerCase().includes('front')) {
                    setCameraError('Only front camera detected. For best results, use the rear camera or manual input.');
                    setClearanceCameraError('Only front camera detected. For best results, use the rear camera or manual input.');
                    showToast('info', 'Only front camera detected. Rear camera is recommended for scanning.');
                }
            } else {
                setCameraError('No camera found. Please connect a camera or use manual input.');
                setClearanceCameraError('No camera found. Please connect a camera or use manual input.');
            }
        } catch (err: any) {
            console.error('Camera access error:', err.name, err.message);
            let errorMessage = 'Failed to access camera. Please allow camera permissions or use manual input.';
            if (err.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings.';
                showPermissionInstructions();
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'No camera found. Please connect a camera or use manual input.';
            }
            setCameraError(errorMessage);
            setClearanceCameraError(errorMessage);
            showToast('error', errorMessage);
        }
    };

    const parseStudentId = (scannedText: string): string => {
        console.log('Parsing QR code:', scannedText);
        const parts = scannedText.split('|');
        return parts.length === 3 ? parts[1] : scannedText;
    };

    const startScanning = async () => {
        if (!scannerRef.current || !scannerContainerRef.current || !selectedCamera) {
            setCameraError('No camera selected. Please select a camera or use manual input.');
            return;
        }
        try {
            setIsScanning(true);
            setCameraError(null);
            await scannerRef.current.start(
                selectedCamera,
                {
                    fps: 15,
                    qrbox: { width: 300, height: 300 },
                    aspectRatio: isMobile ? 1.777 : undefined,
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true,
                    },
                },
                (decodedText) => {
                    console.log('Scanned text:', decodedText);
                    const input = initialScanStep === 'student' ? parseStudentId(decodedText) : decodedText;
                    setScanInput(input);
                    setData({
                        scan_input: input,
                        scan_step: initialScanStep,
                    });
                    handleScanSubmit({ preventDefault: () => {} } as React.FormEvent);
                    stopScanning();
                },
                (errorMessage) => {
                    const now = Date.now();
                    if (now - lastToastTimeRef.current >= 5000 && !errorMessage.includes('No QR code found')) {
                        console.error('Scanning error:', errorMessage);
                        showToast('error', `Failed to detect code: ${errorMessage}. Please try again.`);
                        lastToastTimeRef.current = now;
                    }
                },
            );
            setTimeout(() => {
                if (isScanning) {
                    stopScanning();
                    showToast('info', 'Scanning timed out. Please try again or use manual input.');
                }
            }, 15000);
        } catch (error: any) {
            console.error('Start scanning error:', error.name, error.message);
            let errorMessage = 'Failed to access camera. Please allow camera permissions or use manual input.';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings.';
                showPermissionInstructions();
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera found. Please connect a camera or use manual input.';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = 'Camera constraints not supported. Please select a different camera or use manual input.';
            }
            setCameraError(errorMessage);
            showToast('error', errorMessage);
            setIsScanning(false);
        }
    };

    const startClearanceScanning = async () => {
        if (!clearanceScannerRef.current || !clearanceScannerContainerRef.current || !selectedCamera) {
            setClearanceCameraError('No camera selected. Please select a camera or use manual input.');
            return;
        }
        try {
            setIsClearanceScanning(true);
            setClearanceCameraError(null);
            await clearanceScannerRef.current.start(
                selectedCamera,
                {
                    fps: 15,
                    qrbox: { width: 300, height: 300 },
                    aspectRatio: isMobile ? 1.777 : undefined,
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true,
                    },
                },
                (decodedText) => {
                    console.log('Clearance scan text:', decodedText);
                    const studentId = parseStudentId(decodedText);
                    setClearanceScanInput(studentId);
                    setClearanceData('member_id', studentId);
                    handleClearanceSubmit({ preventDefault: () => {} } as React.FormEvent);
                    stopClearanceScanning();
                },
                (errorMessage) => {
                    const now = Date.now();
                    if (now - lastToastTimeRef.current >= 5000 && !errorMessage.includes('No QR code found')) {
                        console.error('Clearance scanning error:', errorMessage);
                        showToast('error', `Failed to detect code: ${errorMessage}. Please try again.`);
                        lastToastTimeRef.current = now;
                    }
                },
            );
            setTimeout(() => {
                if (isClearanceScanning) {
                    stopClearanceScanning();
                    showToast('info', 'Clearance scanning timed out. Please try again or use manual input.');
                }
            }, 15000);
        } catch (error: any) {
            console.error('Start clearance scanning error:', error.name, error.message);
            let errorMessage = 'Failed to access camera. Please allow camera permissions or use manual input.';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings.';
                showPermissionInstructions();
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera found. Please connect a camera or use manual input.';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = 'Camera constraints not supported. Please select a different camera or use manual input.';
            }
            setClearanceCameraError(errorMessage);
            showToast('error', errorMessage);
            setIsClearanceScanning(false);
        }
    };

    const stopScanning = () => {
        if (scannerRef.current && scannerRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
            scannerRef.current
                .stop()
                .then(() => {
                    setIsScanning(false);
                })
                .catch((err) => {
                    console.error('Stop scanning error:', err);
                });
        }
        setIsScanning(false);
    };

    const stopClearanceScanning = () => {
        if (clearanceScannerRef.current && clearanceScannerRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
            clearanceScannerRef.current
                .stop()
                .then(() => {
                    setIsClearanceScanning(false);
                })
                .catch((err) => {
                    console.error('Stop clearance scanning error:', err);
                });
        }
        setIsClearanceScanning(false);
    };

    useEffect(() => {
        if (cameraError && inputRef.current && initialScanStep !== 'confirm') {
            inputRef.current.focus();
        } else if (inputRef.current && initialScanStep !== 'confirm') {
            inputRef.current.focus();
        }
        if (isClearanceModalOpen && clearanceInputRef.current) {
            clearanceInputRef.current.focus();
        }
    }, [initialScanStep, cameraError, isClearanceModalOpen]);

    const showPermissionInstructions = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        let instructions = 'Please enable camera permissions in your browser settings.';
        if (userAgent.includes('chrome')) {
            instructions += ' Go to Settings > Privacy and security > Site settings > Camera.';
        } else if (userAgent.includes('firefox')) {
            instructions += ' Go to Preferences > Privacy & Security > Permissions > Camera.';
        } else if (userAgent.includes('safari')) {
            instructions += ' Go to Settings > Websites > Camera.';
        }
        showToast('info', instructions);
    };

    const showToast = (type: ToastMessage['type'], message: string) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { type, message, id }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const handleScanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.scan_input.trim() || processing) return;
        if (data.scan_step === 'book') {
            if (data.scan_input.length !== 10 && data.scan_input.length !== 13) {
                showToast('error', 'Invalid ISBN format. ISBN must be 10 or 13 digits.');
                return;
            }
            if (!/^\d+$/.test(data.scan_input)) {
                showToast('error', 'Invalid ISBN format. ISBN must contain only digits.');
                return;
            }
        }
        console.log('Submitting scan:', data);
        post(route('librarian.scan'), {
            preserveState: true,
            onSuccess: () => {
                reset();
                setScanInput('');
                setData('scan_step', initialScanStep);
            },
            onError: (errors) => {
                console.error('Scan errors:', errors);
                showToast('error', errors.scan_input || 'Failed to process scan.');
                setScanInput('');
                reset();
            },
        });
    };

    const handleClearanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clearanceData.member_id.trim() || clearanceProcessing) return;
        console.log('Submitting clearance check:', clearanceData);
        clearancePost(route('librarian.clearance'), {
            preserveState: true,
            onSuccess: (page) => {
                const { clearance } = page.props as {
                    clearance: { isCleared: boolean; message: string; details?: { activeLoans: number; unpaidFines: number } };
                };
                setClearanceStatus(clearance);
                showToast(clearance.isCleared ? 'success' : 'error', clearance.message);
            },
            onError: (errors) => {
                console.error('Clearance check errors:', errors);
                showToast('error', errors.member_id?.[0] || 'Failed to check clearance.');
                setClearanceScanInput('');
                clearanceReset();
            },
        });
    };

    const handleConfirmBorrow = () => {
        if (!initialStudent || !initialBook) {
            showToast('error', 'Missing student or book information');
            return;
        }
        const payload = {
            member_id: initialStudent.member_id,
            book_isbn: initialBook.isbn,
        };
        console.log('Confirm borrow payload:', payload);
        router.post(route('librarian.confirm-borrow'), payload, {
            preserveState: false,
            headers: {
                'X-Debug-Source': 'handleConfirmBorrow',
            },
            onSuccess: () => {
                console.log('Borrow confirmation successful');
                reset();
                setScanInput('');
                setClearanceStatus(null);
                showToast('success', 'Borrowing confirmed successfully.');
            },
            onError: (errors) => {
                console.error('Confirm borrow errors:', errors);
                showToast('error', errors.student_id?.[0] || errors.book_isbn?.[0] || 'Failed to confirm borrowing.');
            },
        });
    };

    const handleReset = () => {
        console.log('Resetting scan state');
        router.post(
            route('librarian.scan'),
            {
                scan_input: '',
                scan_step: 'student',
                reset: true,
            },
            {
                preserveState: false,
                headers: {
                    'X-Debug-Source': 'handleReset',
                },
                onSuccess: () => {
                    console.log('Reset successful');
                    reset();
                    setScanInput('');
                    setClearanceStatus(null);
                    showToast('success', 'Scan reset successfully.');
                },
                onError: (errors) => {
                    console.error('Reset errors:', errors);
                    showToast('error', errors.reset?.[0] || 'Failed to reset scan state.');
                },
            },
        );
    };

    const handleClearAll = () => {
        console.log('Clearing all scan state');
        router.post(
            route('librarian.scan'),
            {
                scan_input: '',
                scan_step: 'student',
                clear_all: true,
            },
            {
                preserveState: false,
                headers: {
                    'X-Debug-Source': 'handleClearAll',
                },
                onSuccess: () => {
                    console.log('Clear all successful');
                    reset();
                    setScanInput('');
                    setClearanceStatus(null);
                    showToast('success', 'All scan data cleared successfully.');
                },
                onError: (errors) => {
                    console.error('Clear all errors:', errors);
                    showToast('error', errors.clear_all?.[0] || 'Failed to clear scan data.');
                },
            },
        );
    };

    const openClearanceModal = () => {
        setIsClearanceModalOpen(true);
        setClearanceStatus(null);
        setClearanceScanInput('');
        clearanceReset();
        if (clearanceInputRef.current) {
            clearanceInputRef.current.focus();
        }
    };

    const closeClearanceModal = () => {
        setIsClearanceModalOpen(false);
        stopClearanceScanning();
        setClearanceStatus(null);
        setClearanceScanInput('');
        clearanceReset();
    };

    const resetClearanceScan = () => {
        setClearanceStatus(null);
        setClearanceScanInput('');
        clearanceReset();
        stopClearanceScanning();
        if (clearanceInputRef.current) {
            clearanceInputRef.current.focus();
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Librarian Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Welcome & Quick Stats */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <h1 className="mb-2 text-xl font-bold text-gray-900">Welcome, {auth.user.name}</h1>
                        <p className="text-gray-600">Manage book transactions and assist library users with their borrowing needs.</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Today's Transactions</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions || 0}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Overdue Books</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.overdueBooks || 0}</p>
                            </div>
                            <Clock className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <button onClick={openClearanceModal} className="w-full text-left">
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                                <div>
                                    <h3 className="font-semibold text-gray-900">Check Clearance</h3>
                                    <p className="text-sm text-gray-600">Check student clearance status</p>
                                </div>
                            </div>
                        </button>
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
                                        {initialScanStep === 'student'
                                            ? 'Scan Student ID QR Code'
                                            : initialScanStep === 'book'
                                              ? 'Scan Book ISBN'
                                              : 'Confirm Borrowing'}
                                    </h2>
                                </div>
                                {cameraDevices.length > 0 && initialScanStep !== 'confirm' && (
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
                                                <option key={device.id} value={device.id}>
                                                    {device.label.toLowerCase().includes('back') ||
                                                    device.label.toLowerCase().includes('rear') ||
                                                    device.label.toLowerCase().includes('environment')
                                                        ? 'Rear Camera'
                                                        : 'Front Camera'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {initialScanStep !== 'confirm' && (
                                    <div className="relative mb-4">
                                        <div
                                            id="scanner-container"
                                            ref={scannerContainerRef}
                                            className={`w-full rounded-lg ${isScanning ? 'block' : 'hidden'}`}
                                            style={{ maxHeight: isMobile ? '50vh' : '300px' }}
                                        />
                                        {!isScanning && (
                                            <div
                                                className={`flex h-[${isMobile ? '50vh' : '300px'}] w-full items-center justify-center rounded-lg bg-gray-100`}
                                            >
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
                                )}
                                {initialScanStep !== 'confirm' && (
                                    <form onSubmit={handleScanSubmit} className="space-y-4">
                                        <div className="relative">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={scanInput}
                                                onChange={(e) => {
                                                    setScanInput(e.target.value);
                                                    setData('scan_input', e.target.value);
                                                }}
                                                placeholder={
                                                    cameraError
                                                        ? 'Enter student ID or full QR code manually...'
                                                        : initialScanStep === 'student'
                                                          ? 'Scan or enter student ID...'
                                                          : 'Scan or enter book ISBN...'
                                                }
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                disabled={processing}
                                                aria-describedby={cameraError ? 'camera-error' : undefined}
                                            />
                                            {processing && (
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
                                                disabled={processing || !selectedCamera}
                                                aria-label={isScanning ? 'Stop scanning' : 'Start scanning'}
                                            >
                                                {isScanning ? 'Stop Scanning' : 'Start Scanning'}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!data.scan_input.trim() || processing}
                                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                aria-label="Submit manual scan"
                                            >
                                                {processing ? 'Processing...' : 'Manual Scan'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleReset}
                                                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                                                aria-label="Reset scanning"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleClearAll}
                                                className="rounded-lg border border-red-300 px-4 py-2 text-red-700 transition-colors hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                                aria-label="Clear all scans"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </form>
                                )}
                                {initialScanStep === 'confirm' && initialStudent && initialBook && (
                                    <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Confirm Borrowing</h3>
                                        <div className="mt-2 space-y-2">
                                            <p>
                                                <strong>Student:</strong> {initialStudent.name} ({initialStudent.member_id})
                                            </p>
                                            <p>
                                                <strong>Book ISBN:</strong> {initialBook.isbn}
                                            </p>
                                            <p>
                                                <strong>Book Title:</strong> {initialBook.title}
                                            </p>
                                            <p>
                                                <strong>Author:</strong> {initialBook.author}
                                            </p>
                                        </div>
                                        <div className="mt-4 flex space-x-3">
                                            <button
                                                type="button"
                                                onClick={handleConfirmBorrow}
                                                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                disabled={processing}
                                            >
                                                {processing ? 'Processing...' : 'Confirm Borrowing'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleReset}
                                                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                                                aria-label="Cancel borrowing"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="mt-6 flex items-center justify-center space-x-4">
                                    <div
                                        className={`flex items-center space-x-2 rounded-full px-3 py-1 text-sm ${
                                            initialScanStep === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                        }`}
                                    >
                                        <span
                                            className={`h-2 w-2 rounded-full ${initialScanStep === 'student' ? 'bg-blue-600' : 'bg-green-600'}`}
                                        ></span>
                                        <span>Step 1: Student ID</span>
                                    </div>
                                    <div
                                        className={`flex items-center space-x-2 rounded-full px-3 py-1 text-sm ${
                                            initialScanStep === 'book' || initialScanStep === 'confirm'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`h-2 w-2 rounded-full ${initialScanStep === 'book' || initialScanStep === 'confirm' ? 'bg-blue-600' : 'bg-gray-400'}`}
                                        ></span>
                                        <span>Step 2: Book ISBN</span>
                                    </div>
                                    <div
                                        className={`flex items-center space-x-2 rounded-full px-3 py-1 text-sm ${
                                            initialScanStep === 'confirm' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`h-2 w-2 rounded-full ${initialScanStep === 'confirm' ? 'bg-blue-600' : 'bg-gray-400'}`}
                                        ></span>
                                        <span>Step 3: Confirm</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Information Cards Section */}
                        <div className="space-y-6">
                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
                                <div className="mb-4 flex items-center space-x-3">
                                    <User className="h-6 w-6 text-green-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
                                </div>
                                {initialStudent ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Student ID:</span>
                                            <span className="font-medium">{initialStudent.member_id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Name:</span>
                                            <span className="font-medium">{initialStudent.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Email:</span>
                                            <span className="font-medium">{initialStudent.email}</span>
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
                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
                                <div className="mb-4 flex items-center space-x-3">
                                    <BookOpen className="h-6 w-6 text-blue-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">Book Information</h3>
                                </div>
                                {initialBook ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">ISBN:</span>
                                            <span className="font-medium">{initialBook.isbn}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Title:</span>
                                            <span className="font-medium">{initialBook.title}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Author:</span>
                                            <span className="font-medium">{initialBook.author}</span>
                                        </div>
                                        <div className="mt-4">
                                            <div
                                                className={`rounded-lg border p-3 ${
                                                    initialBook.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    {initialBook.available ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                                    )}
                                                    <span className={`text-sm ${initialBook.available ? 'text-green-800' : 'text-red-800'}`}>
                                                        {initialBook.available ? 'Available for borrowing' : 'Currently unavailable'}
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
                {/* Clearance Modal */}
                {isClearanceModalOpen && (
                    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                        <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="flex items-center text-xl font-semibold text-gray-900">
                                    <CheckCircle className="mr-2 h-6 w-6 text-green-600" />
                                    Check Student Clearance
                                </h2>
                                <button
                                    onClick={closeClearanceModal}
                                    className="text-gray-400 hover:text-gray-600"
                                    aria-label="Close clearance modal"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="space-y-4">
                                {cameraDevices.length > 0 && (
                                    <div className="mb-4">
                                        <label htmlFor="clearanceCameraSelect" className="block text-sm font-medium text-gray-700">
                                            Select Camera
                                        </label>
                                        <select
                                            id="clearanceCameraSelect"
                                            value={selectedCamera || ''}
                                            onChange={(e) => setSelectedCamera(e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2"
                                        >
                                            <option value="" disabled>
                                                Select a camera
                                            </option>
                                            {cameraDevices.map((device) => (
                                                <option key={device.id} value={device.id}>
                                                    {device.label.toLowerCase().includes('back') ||
                                                    device.label.toLowerCase().includes('rear') ||
                                                    device.label.toLowerCase().includes('environment')
                                                        ? 'Rear Camera'
                                                        : 'Front Camera'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="relative mb-4">
                                    <div
                                        id="clearance-scanner-container"
                                        ref={clearanceScannerContainerRef}
                                        className={`w-full rounded-lg ${isClearanceScanning ? 'block' : 'hidden'}`}
                                        style={{ maxHeight: isMobile ? '40vh' : '250px' }}
                                    />
                                    {!isClearanceScanning && (
                                        <div
                                            className={`flex h-[${isMobile ? '40vh' : '250px'}] w-full items-center justify-center rounded-lg bg-gray-100`}
                                        >
                                            {clearanceCameraError ? (
                                                <p className="px-4 text-center text-red-600" id="clearance-camera-error">
                                                    {clearanceCameraError}
                                                </p>
                                            ) : (
                                                <p className="text-gray-500">Camera feed will appear here when scanning</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={handleClearanceSubmit} className="space-y-4">
                                    <div className="relative">
                                        <input
                                            ref={clearanceInputRef}
                                            type="text"
                                            value={clearanceScanInput}
                                            onChange={(e) => {
                                                setClearanceScanInput(e.target.value);
                                                setClearanceData('member_id', e.target.value);
                                            }}
                                            placeholder={clearanceCameraError ? 'Enter student ID manually...' : 'Scan or enter student ID...'}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            disabled={clearanceProcessing}
                                            aria-describedby={clearanceCameraError ? 'clearance-camera-error' : undefined}
                                        />
                                        {clearanceProcessing && (
                                            <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
                                                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={isClearanceScanning ? stopClearanceScanning : startClearanceScanning}
                                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={clearanceProcessing || !selectedCamera}
                                            aria-label={isClearanceScanning ? 'Stop scanning' : 'Start scanning'}
                                        >
                                            {isClearanceScanning ? 'Stop Scanning' : 'Start Scanning'}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!clearanceData.member_id.trim() || clearanceProcessing}
                                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            aria-label="Submit clearance check"
                                        >
                                            {clearanceProcessing ? 'Checking...' : 'Check Clearance'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetClearanceScan}
                                            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                                            aria-label="Reset clearance scan"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </button>
                                    </div>
                                </form>
                                {clearanceStatus && (
                                    <div className="mt-4 rounded-lg border p-4">
                                        <div className="flex items-center space-x-2">
                                            {clearanceStatus.isCleared ? (
                                                <>
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                    <span className="text-sm font-medium text-green-800">{clearanceStatus.message}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                                    <span className="text-sm font-medium text-red-800">{clearanceStatus.message}</span>
                                                </>
                                            )}
                                        </div>
                                        {!clearanceStatus.isCleared && clearanceStatus.details && (
                                            <div className="mt-2 text-sm text-gray-600">
                                                <p>Active Loans: {clearanceStatus.details.activeLoans}</p>
                                                <p>Unpaid Fines: ${clearanceStatus.details.unpaidFines.toFixed(2)}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="mt-4 flex justify-end space-x-3">
                                    <button
                                        onClick={closeClearanceModal}
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                                        aria-label="Close clearance modal"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
            </div>
        </AppLayout>
    );
}
