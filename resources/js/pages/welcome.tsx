'use client';

import { Head, Link, usePage } from '@inertiajs/react';
import { BarChart3, BookOpen, GraduationCap, Shield, Sparkles, Users } from 'lucide-react';
import type { PageProps } from '../types';

export default function Welcome() {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href="/dashboard"
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC]"
                            >
                                Log in
                            </Link>
                        )}
                    </nav>
                </header>

                {/* University Welcome Message */}
                <div className="mb-6 flex flex-col items-center text-center">
                    <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                        <GraduationCap className="h-4 w-4" />
                        University Digital Library System
                    </span>
                    <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Empowering Academic Excellence</h1>
                    <p className="max-w-xl text-[#706f6c] dark:text-[#A1A09A]">
                        Welcome, students and faculty! Access resources, manage your research, and connect with your campus community—all in one
                        place. Our digital library is designed for the modern university experience.
                    </p>
                </div>

                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <main className="flex w-full max-w-[335px] flex-col-reverse lg:max-w-4xl lg:flex-row">
                        <div className="flex-1 rounded-br-lg rounded-bl-lg bg-white p-6 pb-12 text-[13px] leading-[20px] shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-tl-lg lg:rounded-br-none lg:rounded-bl-lg lg:p-12 dark:bg-[#161615]">
                            <h1 className="mb-1 text-2xl font-medium">University Library Management</h1>
                            <p className="mb-2 text-[#706f6c] dark:text-[#A1A09A]">
                                Simplify your academic resource management with our tailored digital solution. From textbooks to research journals, we
                                support academic success for every campus member.
                            </p>
                            <ul className="mb-4 flex flex-col lg:mb-6">
                                <li className="relative flex items-center gap-4 py-2 before:absolute before:top-1/2 before:bottom-0 before:left-[0.4rem] before:-translate-y-1/2 before:border-l before:border-[#e3e3e0] dark:before:border-[#22221D]">
                                    <span className="relative bg-white py-1 dark:bg-[#161615]">
                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#e3e3e0] bg-[#FDFDFC] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)] dark:border-[#22221D] dark:bg-[#0a0a0a]">
                                            <BookOpen className="h-2 w-2 text-[#dbdbd7] dark:text-[#3E3E3A]" />
                                        </span>
                                    </span>
                                    <span>
                                        <strong>Academic Resource Management:</strong> Organize textbooks, research journals, and digital media.
                                    </span>
                                </li>
                                <li className="relative flex items-center gap-4 py-2 before:absolute before:top-0 before:bottom-0 before:left-[0.4rem] before:border-l before:border-[#e3e3e0] dark:before:border-[#22221D]">
                                    <span className="relative bg-white py-1 dark:bg-[#161615]">
                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#e3e3e0] bg-[#FDFDFC] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)] dark:border-[#22221D] dark:bg-[#0a0a0a]">
                                            <Users className="h-2 w-2 text-[#dbdbd7] dark:text-[#3E3E3A]" />
                                        </span>
                                    </span>
                                    <span>
                                        <strong>Student & Faculty Tracking:</strong> Manage profiles, lending history, and research groups.
                                    </span>
                                </li>
                                <li className="relative flex items-center gap-4 py-2 before:absolute before:top-0 before:bottom-0 before:left-[0.4rem] before:border-l before:border-[#e3e3e0] dark:before:border-[#22221D]">
                                    <span className="relative bg-white py-1 dark:bg-[#161615]">
                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#e3e3e0] bg-[#FDFDFC] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)] dark:border-[#22221D] dark:bg-[#0a0a0a]">
                                            <BarChart3 className="h-2 w-2 text-[#dbdbd7] dark:text-[#3E3E3A]" />
                                        </span>
                                    </span>
                                    <span>
                                        <strong>Research Analytics:</strong> Get insights on resource usage, popular topics, and overdue items.
                                    </span>
                                </li>
                                <li className="relative flex items-center gap-4 py-2 before:absolute before:top-0 before:bottom-1/2 before:left-[0.4rem] before:border-l before:border-[#e3e3e0] dark:before:border-[#22221D]">
                                    <span className="relative bg-white py-1 dark:bg-[#161615]">
                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#e3e3e0] bg-[#FDFDFC] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)] dark:border-[#22221D] dark:bg-[#0a0a0a]">
                                            <Shield className="h-2 w-2 text-[#dbdbd7] dark:text-[#3E3E3A]" />
                                        </span>
                                    </span>
                                    <span>
                                        <strong>Secure Campus Access:</strong> Role-based authentication for students, professors, and staff.
                                    </span>
                                </li>
                            </ul>
                            <ul className="flex gap-3 text-sm leading-normal">
                                <li>
                                    <Link
                                        href="/login"
                                        className="inline-block rounded-sm border border-black bg-[#1b1b18] px-5 py-1.5 text-sm leading-normal text-white hover:border-black hover:bg-black dark:border-[#EDEDEC] dark:bg-[#22221D] dark:text-[#EDEDEC]"
                                    >
                                        Get Started
                                    </Link>
                                </li>
                            </ul>

                            {/* Why Choose Us Section */}
                            <div className="mt-8 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-blue-700 dark:text-blue-200">
                                    <Sparkles className="h-5 w-5 text-yellow-400" />
                                    Why Choose Our University Library System?
                                </h3>
                                <ul className="list-inside list-disc text-sm text-[#555] dark:text-[#bfc9d1]">
                                    <li>Designed for campus-wide collaboration and academic success.</li>
                                    <li>Integrates seamlessly with university portals and student systems.</li>
                                    <li>Supports research groups, reading lists, and digital archives.</li>
                                    <li>Accessible anywhere—on campus or remote.</li>
                                </ul>
                            </div>

                            {/* Testimonial */}
                            <div className="mt-8 border-l-4 border-blue-300 pl-4 text-sm text-[#888] italic dark:text-[#B5B5A4]">
                                “Our students and faculty have never had easier access to academic resources. This system truly elevates our campus
                                library experience!”
                                <div className="mt-1 font-semibold text-[#555] not-italic dark:text-[#D6F5F5]">— Dr. Okoro, University Librarian</div>
                            </div>
                        </div>
                        <div className="relative -mb-px aspect-[335/376] w-full shrink-0 overflow-hidden rounded-t-lg bg-[#f0f8ff] lg:mb-0 lg:-ml-px lg:aspect-auto lg:w-[438px] lg:rounded-t-none lg:rounded-r-lg dark:bg-[#22221D]">
                            {/* Library Management System Logo Animation */}
                            <div className="flex h-full items-center justify-center p-8">
                                <div className="relative">
                                    {/* Animated Book Stack */}
                                    <div className="translate-y-0 opacity-100 transition-all delay-300 duration-750 starting:translate-y-4 starting:opacity-0">
                                        <div className="relative">
                                            {/* Base Books */}
                                            <div className="space-y-2">
                                                <div className="h-8 w-32 rotate-1 transform rounded-sm bg-blue-600 shadow-lg"></div>
                                                <div className="h-8 w-28 -rotate-1 transform rounded-sm bg-green-600 shadow-lg"></div>
                                                <div className="rotate-0.5 h-8 w-30 transform rounded-sm bg-red-600 shadow-lg"></div>
                                                <div className="-rotate-0.5 h-8 w-26 transform rounded-sm bg-purple-600 shadow-lg"></div>
                                            </div>

                                            {/* Floating Book */}
                                            <div className="absolute -top-12 left-8 transform transition-transform duration-2000 hover:translate-y-2">
                                                <div className="relative h-10 w-24 rotate-12 transform rounded-sm bg-yellow-500 shadow-xl">
                                                    <div className="absolute inset-2 rounded-sm border border-yellow-600"></div>
                                                    <BookOpen className="absolute top-2 left-2 h-4 w-4 text-yellow-800" />
                                                </div>
                                            </div>

                                            {/* Scanning Lines */}
                                            <div className="absolute top-4 -right-8 space-y-1 opacity-60">
                                                <div className="h-0.5 w-16 animate-pulse bg-blue-400"></div>
                                                <div className="h-0.5 w-12 animate-pulse bg-blue-400 delay-100"></div>
                                                <div className="h-0.5 w-14 animate-pulse bg-blue-400 delay-200"></div>
                                            </div>
                                            {/* Digital Elements */}
                                            <div className="absolute -top-4 -left-6 space-y-2">
                                                <div className="flex space-x-1">
                                                    <div className="h-2 w-2 animate-ping rounded-full bg-green-400"></div>
                                                    <div className="h-2 w-2 animate-ping rounded-full bg-blue-400 delay-100"></div>
                                                    <div className="h-2 w-2 animate-ping rounded-full bg-purple-400 delay-200"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* System Title */}
                                    <div className="mt-8 translate-y-0 text-center opacity-100 transition-all delay-500 duration-750 starting:translate-y-4 starting:opacity-0">
                                        <h2 className="mb-2 text-2xl font-bold text-[#1b1b18] dark:text-[#EDEDEC]">University Digital Library</h2>
                                        <p className="text-sm text-[#706f6c] dark:text-[#A1A09A]">Empowering Education Through Technology</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 rounded-t-lg shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-t-none lg:rounded-r-lg dark:shadow-[inset_0px_0px_0px_1px_#f7f7f7]"></div>
                        </div>
                    </main>
                </div>
                <div className="hidden h-14.5 lg:block"></div>
                {/* Simple Footer */}
                <footer className="mt-8 text-center text-xs text-[#999] dark:text-[#777]">
                    &copy; {new Date().getFullYear()} AfroDemo University Library • Powered by innovation and community
                </footer>
            </div>
        </>
    );
}
