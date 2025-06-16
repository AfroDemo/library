'use client';

import { Head } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    ChevronRight,
    Clock,
    Download,
    GraduationCap,
    Heart,
    Search,
    Shield,
    Sparkles,
    Star,
    Users,
    Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function EnhancedUniversityLibrary() {
    const [isVisible, setIsVisible] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        setIsVisible(true);
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            icon: BookOpen,
            title: 'Smart Catalog System',
            description: 'AI-powered search across millions of academic resources',
            color: 'from-blue-500 to-purple-600',
        },
        {
            icon: Users,
            title: 'Collaborative Spaces',
            description: 'Connect with study groups and research communities',
            color: 'from-green-500 to-teal-600',
        },
        {
            icon: BarChart3,
            title: 'Learning Analytics',
            description: 'Track your academic progress and reading habits',
            color: 'from-orange-500 to-red-600',
        },
        {
            icon: Shield,
            title: 'Secure Access',
            description: 'Enterprise-grade security for all your academic data',
            color: 'from-indigo-500 to-blue-600',
        },
    ];

    const stats = [
        { number: '2.5M+', label: 'Digital Resources' },
        { number: '50K+', label: 'Active Students' },
        { number: '99.9%', label: 'Uptime' },
        { number: '24/7', label: 'Support' },
    ];

    return (
        <>
            <Head title="Home" />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
                {/* Floating Navigation */}
                <nav className="fixed top-4 left-1/2 z-50 -translate-x-1/2 transform">
                    <div className="flex items-center gap-4 rounded-full bg-white/80 px-6 py-3 shadow-xl backdrop-blur-lg dark:bg-gray-800/80">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <GraduationCap className="h-6 w-6 text-blue-600" />
                                <div className="absolute -top-1 -right-1 h-3 w-3 animate-ping rounded-full bg-green-400"></div>
                            </div>
                            <span className="font-bold text-gray-800 dark:text-white">UniLib</span>
                        </div>
                        <div className="hidden items-center gap-4 text-sm md:flex">
                            <a href="#features" className="text-gray-600 hover:text-blue-600 dark:text-gray-300">
                                Features
                            </a>
                            <a href="#stats" className="text-gray-600 hover:text-blue-600 dark:text-gray-300">
                                Stats
                            </a>
                            <a href="#testimonials" className="text-gray-600 hover:text-blue-600 dark:text-gray-300">
                                Reviews
                            </a>
                        </div>
                        <button
                            onClick={() => (window.location.href = '/dashboard')}
                            className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
                        >
                            Get Started
                        </button>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="relative overflow-hidden px-4 pt-24 pb-16">
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute opacity-10"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 3}s`,
                                    transform: `translateY(${scrollY * 0.1}px)`,
                                }}
                            >
                                <BookOpen className="h-8 w-8 animate-pulse text-blue-400" />
                            </div>
                        ))}
                    </div>

                    <div className="relative z-10 mx-auto max-w-7xl">
                        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
                            {/* Left Content */}
                            <div
                                className={`transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}
                            >
                                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 text-sm font-medium text-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-200">
                                    <Sparkles className="h-4 w-4 animate-spin" />
                                    Next-Gen Academic Platform
                                </div>

                                <h1 className="mb-6 text-5xl leading-tight font-extrabold lg:text-7xl">
                                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                                        Unlock
                                    </span>
                                    <br />
                                    <span className="text-gray-900 dark:text-white">Knowledge</span>
                                    <br />
                                    <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Beyond Limits</span>
                                </h1>

                                <p className="mb-8 text-lg text-gray-600 lg:text-xl dark:text-gray-300">
                                    Experience the future of academic research with our AI-powered digital library. Connect, discover, and excel in
                                    your educational journey like never before.
                                </p>

                                <div className="mb-8 flex flex-col gap-4 sm:flex-row">
                                    <button className="group relative overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-blue-500/25">
                                        <span className="relative z-10 flex items-center gap-2">
                                            Start Exploring
                                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                    </button>

                                    <button className="flex items-center gap-2 rounded-full border-2 border-gray-300 px-8 py-4 font-bold text-gray-700 transition-all duration-300 hover:border-blue-500 hover:text-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400">
                                        <Search className="h-5 w-5" />
                                        Browse Catalog
                                    </button>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    {stats.map((stat, index) => (
                                        <div key={index} className="text-center">
                                            <div className="text-2xl font-bold text-blue-600 lg:text-3xl">{stat.number}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Visual */}
                            <div
                                className={`transform transition-all delay-300 duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}
                            >
                                <div className="relative">
                                    {/* Main Card */}
                                    <div className="relative overflow-hidden rounded-3xl bg-white/80 p-8 shadow-2xl backdrop-blur-lg dark:bg-gray-800/80">
                                        {/* Floating Elements */}
                                        <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-20 blur-xl"></div>
                                        <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-gradient-to-br from-teal-400 to-green-500 opacity-20 blur-xl"></div>

                                        {/* 3D Book Stack */}
                                        <div className="relative mb-6 flex justify-center">
                                            <div className="relative">
                                                {/* Animated Books */}
                                                {[...Array(5)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`absolute h-12 w-32 rounded-lg shadow-lg transition-all duration-1000`}
                                                        style={{
                                                            backgroundColor: `hsl(${200 + i * 40}, 70%, 60%)`,
                                                            transform: `translateY(${-i * 8}px) rotate(${-2 + i * 1}deg)`,
                                                            zIndex: 5 - i,
                                                            animationDelay: `${i * 200}ms`,
                                                        }}
                                                    >
                                                        <div className="absolute inset-2 rounded border border-white/30"></div>
                                                    </div>
                                                ))}

                                                {/* Floating Book */}
                                                <div className="absolute -top-8 left-8 animate-bounce">
                                                    <div className="relative h-10 w-24 rotate-12 transform rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 shadow-xl">
                                                        <BookOpen className="absolute top-2 left-2 h-4 w-4 text-yellow-800" />
                                                        <div className="absolute inset-2 rounded border border-yellow-600/30"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Digital Interface */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-3 w-3 animate-pulse rounded-full bg-green-400"></div>
                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Search Active</div>
                                            </div>

                                            <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-700">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <Search className="h-4 w-4" />
                                                    "Quantum Computing Research Papers"
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-600">
                                                    <div className="h-2 w-3/4 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                                                </div>
                                                <div className="text-xs text-gray-500">Searching 2.5M+ resources...</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Floating Action Cards */}
                                    <div className="absolute -top-6 -left-6 rounded-xl bg-white p-3 shadow-lg dark:bg-gray-800">
                                        <Download className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div className="absolute -right-6 -bottom-6 rounded-xl bg-white p-3 shadow-lg dark:bg-gray-800">
                                        <Clock className="h-6 w-6 text-green-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Interactive Features Section */}
                <section id="features" className="px-4 py-20">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-4xl font-bold text-gray-900 lg:text-5xl dark:text-white">
                                Powerful Features for Modern Learning
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300">Discover tools designed to enhance your academic experience</p>
                        </div>

                        <div className="grid gap-8 lg:grid-cols-2">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <div
                                        key={index}
                                        className={`group cursor-pointer rounded-2xl p-6 transition-all duration-500 hover:scale-105 ${
                                            activeFeature === index
                                                ? 'bg-white shadow-2xl dark:bg-gray-800'
                                                : 'bg-white/50 shadow-lg dark:bg-gray-800/50'
                                        }`}
                                        onMouseEnter={() => setActiveFeature(index)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`rounded-xl bg-gradient-to-r ${feature.color} p-3 shadow-lg`}>
                                                <Icon className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{feature.title}</h3>
                                                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                                                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 transition-all group-hover:gap-3">
                                                    Learn more
                                                    <ChevronRight className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 px-4 py-20">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-4xl font-bold text-white lg:text-5xl">Loved by Students & Faculty</h2>
                            <p className="text-lg text-blue-100">See what our community has to say</p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {[
                                {
                                    name: 'Dr. Sarah Chen',
                                    role: 'Computer Science Professor',
                                    content:
                                        'This platform has revolutionized how my students access research materials. The AI search is incredibly intuitive.',
                                    rating: 5,
                                },
                                {
                                    name: 'Marcus Johnson',
                                    role: 'Graduate Student',
                                    content:
                                        "I've saved countless hours with the smart catalog system. Finding relevant papers has never been easier!",
                                    rating: 5,
                                },
                                {
                                    name: 'Prof. Elena Rodriguez',
                                    role: 'Library Director',
                                    content: 'The analytics dashboard gives us unprecedented insights into how our resources are being utilized.',
                                    rating: 5,
                                },
                            ].map((testimonial, index) => (
                                <div key={index} className="rounded-2xl bg-white/10 p-6 backdrop-blur-lg">
                                    <div className="mb-4 flex gap-1">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="mb-6 text-white">{testimonial.content}</p>
                                    <div>
                                        <div className="font-bold text-white">{testimonial.name}</div>
                                        <div className="text-blue-200">{testimonial.role}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="px-4 py-20">
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 p-12 shadow-2xl">
                            <h2 className="mb-6 text-4xl font-bold text-white lg:text-5xl">Ready to Transform Your Academic Journey?</h2>
                            <p className="mb-8 text-lg text-blue-100">Join thousands of students and faculty already using our platform</p>
                            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                                <button className="group rounded-full bg-white px-8 py-4 font-bold text-blue-600 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                                    <span className="flex items-center gap-2">
                                        <Zap className="h-5 w-5" />
                                        Get Started Free
                                    </span>
                                </button>
                                <button className="rounded-full border-2 border-white px-8 py-4 font-bold text-white transition-all duration-300 hover:bg-white hover:text-blue-600">
                                    Schedule Demo
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 px-4 py-12 text-white">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid gap-8 md:grid-cols-4">
                            <div>
                                <div className="mb-4 flex items-center gap-2">
                                    <GraduationCap className="h-8 w-8 text-blue-400" />
                                    <span className="text-xl font-bold">UniLib</span>
                                </div>
                                <p className="text-gray-400">Empowering education through innovative technology and seamless access to knowledge.</p>
                            </div>
                            <div>
                                <h3 className="mb-4 font-bold">Features</h3>
                                <ul className="space-y-2 text-gray-400">
                                    <li>Smart Search</li>
                                    <li>Digital Catalog</li>
                                    <li>Analytics</li>
                                    <li>Collaboration</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="mb-4 font-bold">Support</h3>
                                <ul className="space-y-2 text-gray-400">
                                    <li>Documentation</li>
                                    <li>Help Center</li>
                                    <li>Contact Us</li>
                                    <li>Training</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="mb-4 font-bold">Connect</h3>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Heart className="h-4 w-4 text-red-400" />
                                    Made with passion for education
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400">
                            <p>&copy; 2025 AfroDemo University Library • Powered by innovation and community</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
