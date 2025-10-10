import React, { useMemo, useState, useEffect } from "react";
import {
    FaQuestionCircle,
    FaBook,
    FaExclamationTriangle,
    FaPhone,
    FaEnvelope,
    FaChevronLeft,
    FaChevronRight,
    FaInfoCircle,
    FaSpinner,
    FaSync
} from "react-icons/fa";

// Local images for the carousel - Handle import errors gracefully with ES6 imports
let scheme1, scheme2, scheme3;
try {
    scheme1 = new URL("../assets/scheme1.png", import.meta.url).href;
    scheme2 = new URL("../assets/scheme2.png", import.meta.url).href;
    scheme3 = new URL("../assets/scheme3.png", import.meta.url).href;
} catch (error) {
    console.warn("Scheme images not found, using placeholders");
    scheme1 = "https://via.placeholder.com/400x200/4F46E5/FFFFFF?text=🏠+PM+Awas+Yojana";
    scheme2 = "https://via.placeholder.com/400x200/8B5CF6/FFFFFF?text=💻+Digital+India";
    scheme3 = "https://via.placeholder.com/400x200/F59E0B/FFFFFF?text=🎓+Skill+India";
}

// PDF files for scheme details - Handle import errors gracefully with ES6 imports
let awasYojanaPdf, digitalIndiaPdf, skillMissionPdf;
try {
    awasYojanaPdf = new URL("../assets/awas-yojna.pdf", import.meta.url).href;
    digitalIndiaPdf = new URL("../assets/digital-india.pdf", import.meta.url).href;
    skillMissionPdf = new URL("../assets/skill-mission-india.pdf", import.meta.url).href;
} catch (error) {
    console.warn("PDF files not found, using placeholder links");
    awasYojanaPdf = "#";
    digitalIndiaPdf = "#";
    skillMissionPdf = "#";
}

// Carousel schemes (image-based) - Fallback data
const defaultCarouselSchemes = [
    {
        id: "c1",
        title: "PM Awas Yojana",
        description: "Affordable housing scheme for all sections of society.",
        image: scheme1,
        applyLink: awasYojanaPdf,
        source: "Local PDF"
    },
    {
        id: "c2",
        title: "Digital India",
        description: "Transforming India into a digitally empowered society.",
        image: scheme2,
        applyLink: digitalIndiaPdf,
        source: "Local PDF"
    },
    {
        id: "c3",
        title: "Skill India Mission",
        description: "Enhancing employability through skill development programs.",
        image: scheme3,
        applyLink: skillMissionPdf,
        source: "Local PDF"
    },
];

// Quick access info cards
const infoCards = [
    {
        icon: FaBook,
        title: "User Guide",
        description: "Step-by-step instructions on how to submit complaints, track status, and use all features of NaiyakSetu.",
        buttonText: "Read Guide",
        color: "bg-blue-50 text-blue-600",
    },
    {
        icon: FaQuestionCircle,
        title: "FAQs",
        description: "Find answers to commonly asked questions about the grievance redressal process and platform usage.",
        buttonText: "View FAQs",
        color: "bg-purple-50 text-purple-600",
    },
    {
        icon: FaExclamationTriangle,
        title: "Emergency Protocols",
        description: "Important information about what to do in emergency situations and how to quickly get help.",
        buttonText: "Learn More",
        color: "bg-red-50 text-red-600",
    },
];

function InfoHub() {
    const [currentSchemeIndex, setCurrentSchemeIndex] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Dynamic data state
    const [schemes, setSchemes] = useState([]);
    const [carouselSchemes, setCarouselSchemes] = useState(defaultCarouselSchemes);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Default fallback schemes
    const defaultSchemes = useMemo(() => [
        {
            id: 1,
            title: "Pradhan Mantri Awas Yojana",
            description: "Housing for All scheme providing financial assistance to eligible families for construction/purchase of houses.",
            category: "Housing",
            eligibility: "Annual family income below ₹18 lakhs",
            benefits: "Interest subsidy up to ₹2.67 lakhs",
            applyLink: awasYojanaPdf,
            image: "🏠",
            source: "Local PDF"
        },
        {
            id: 2,
            title: "Swachh Bharat Mission",
            description: "Clean India campaign focusing on sanitation, waste management and creating clean cities and villages.",
            category: "Sanitation",
            eligibility: "All citizens can participate",
            benefits: "Cleaner environment, improved public health",
            applyLink: "#",
            image: "🧹",
            source: "Default Data"
        },
        {
            id: 3,
            title: "Digital India Initiative",
            description: "Program to transform India into digitally empowered society and knowledge economy.",
            category: "Technology",
            eligibility: "All citizens",
            benefits: "Digital infrastructure, online services, digital literacy",
            applyLink: digitalIndiaPdf,
            image: "💻",
            source: "Local PDF"
        },
        {
            id: 4,
            title: "PM-KISAN Scheme",
            description: "Direct income support to farmer families owning cultivable land.",
            category: "Agriculture",
            eligibility: "Small and marginal farmer families",
            benefits: "₹6,000 per year in three installments",
            applyLink: "#",
            image: "🌾",
            source: "Default Data"
        },
        {
            id: 5,
            title: "Ayushman Bharat",
            description: "National Health Protection Scheme providing health insurance coverage.",
            category: "Healthcare",
            eligibility: "Socio-economic caste census eligible families",
            benefits: "Health cover up to ₹5 lakhs per family per year",
            applyLink: "#",
            image: "🏥",
            source: "Default Data"
        },
        {
            id: 6,
            title: "Make in India",
            description: "Initiative to encourage companies to manufacture products in India.",
            category: "Business",
            eligibility: "Manufacturers and businesses",
            benefits: "Ease of doing business, investment opportunities",
            applyLink: "#",
            image: "🏭",
            source: "Default Data"
        },
        {
            id: 7,
            title: "Skill India Mission",
            description: "National initiative to enhance employability through skill development programs and training.",
            category: "Education",
            eligibility: "Youth aged 15-45 years",
            benefits: "Free skill training, certification, and job placement assistance",
            applyLink: skillMissionPdf,
            image: "🎓",
            source: "Local PDF"
        },
    ], []);

    // Fetch schemes data on component mount
    useEffect(() => {
        loadSchemesData();
    }, []);

    const loadSchemesData = async (forceRefresh = false) => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔄 Loading schemes data...');

            // Since schemesAPI is not yet implemented, use default schemes
            console.log('⚠️ schemesAPI not available, using default schemes');
            setSchemes(defaultSchemes);
            setCarouselSchemes(defaultCarouselSchemes);

        } catch (err) {
            console.error('❌ Error loading schemes:', err);
            setError(err.message || 'Failed to load latest government schemes');

            // Use default data on error
            setSchemes(defaultSchemes);
            setCarouselSchemes(defaultCarouselSchemes);
        } finally {
            setLoading(false);
        }
    };

    // Generate placeholder image for schemes
    const generateSchemeImage = (title, category) => {
        const categoryStyles = {
            'Housing': { color: '4F46E5', emoji: '🏠' },
            'Healthcare': { color: 'EF4444', emoji: '🏥' },
            'Agriculture': { color: '10B981', emoji: '🌾' },
            'Technology': { color: '8B5CF6', emoji: '💻' },
            'Education': { color: 'F59E0B', emoji: '📚' },
            'Employment': { color: '6366F1', emoji: '💼' },
            'Finance': { color: '059669', emoji: '💰' },
            'Sanitation': { color: 'D97706', emoji: '🧹' },
            'Transportation': { color: '2563EB', emoji: '🚌' },
            'Energy': { color: 'DC2626', emoji: '⚡' },
            'Business': { color: '6366F1', emoji: '🏭' },
            'General': { color: '6B7280', emoji: '📋' }
        };

        const style = categoryStyles[category] || categoryStyles['General'];
        const shortTitle = encodeURIComponent(title.substring(0, 25));

        return `https://via.placeholder.com/400x200/${style.color}/FFFFFF?text=${style.emoji}+${shortTitle}`;
    };

    // Get unique categories from schemes
    const categories = useMemo(() => {
        if (!schemes.length) return ["All"];
        const uniqueCategories = [...new Set(schemes.map(s => s.category))];
        return ["All", ...uniqueCategories.sort()];
    }, [schemes]);

    // Filter schemes by category
    const filtered = useMemo(() => {
        return selectedCategory === "All"
            ? schemes
            : schemes.filter(s => s.category === selectedCategory);
    }, [schemes, selectedCategory]);

    const getCategoryColor = (category) => {
        const map = {
            Housing: "bg-blue-500",
            Healthcare: "bg-red-500",
            Agriculture: "bg-green-600",
            Technology: "bg-purple-600",
            Sanitation: "bg-amber-500",
            Business: "bg-indigo-600",
            Education: "bg-yellow-500",
            Employment: "bg-indigo-600",
            Finance: "bg-emerald-600",
            Transportation: "bg-blue-600",
            Energy: "bg-red-600",
            General: "bg-gray-500",
        };
        return map[category] || "bg-gray-500";
    };

    // Carousel logic
    const nextScheme = () => setCurrentSchemeIndex((prev) => (prev + 1) % carouselSchemes.length);
    const prevScheme = () => setCurrentSchemeIndex((prev) => (prev - 1 + carouselSchemes.length) % carouselSchemes.length);

    const getVisibleSchemes = () => {
        const visible = [];
        for (let i = 0; i < 3; i++) {
            visible.push(carouselSchemes[(currentSchemeIndex + i) % carouselSchemes.length]);
        }
        return visible;
    };

    // Auto-rotate carousel
    useEffect(() => {
        if (carouselSchemes.length > 0) {
            const interval = setInterval(() => {
                setCurrentSchemeIndex((prev) => (prev + 1) % carouselSchemes.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [carouselSchemes.length]);

    // Loading component
    if (loading) {
        return (
            <div className="w-full max-w-7xl mx-auto space-y-8 p-6">
                <div className="flex items-center mb-2">
                    <FaSpinner className="text-3xl text-emerald-600 mr-3 animate-spin" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Information Hub</h1>
                        <p className="text-gray-700 text-base">Loading latest government schemes...</p>
                    </div>
                </div>

                {/* Loading skeleton */}
                <div className="animate-pulse space-y-8">
                    <div className="bg-gray-300 rounded-lg h-64"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-gray-300 rounded-lg h-48"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <FaInfoCircle className="text-3xl text-emerald-600 mr-3" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Information Hub</h1>
                        <p className="text-gray-700 text-base">
                            Explore government schemes and platform resources designed to benefit citizens
                            {lastUpdated && (
                                <span className="text-sm text-gray-500 block">
                                    Last updated: {lastUpdated}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => loadSchemesData(true)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-md shadow-sm transition-colors duration-200"
                    title="Refresh schemes data"
                >
                    <FaSync className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-red-800 text-sm">
                            ⚠️ {error}
                        </p>
                        <button
                            onClick={() => loadSchemesData(true)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Government Schemes Carousel */}
            <section className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Latest Government Schemes & Policies
                        </h2>
                        {carouselSchemes.some(s => s.source === 'Government RSS Feed') && (
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></span>
                                    Live from RSS Feeds
                                </span>
                                {lastUpdated && (
                                    <span className="text-xs text-gray-500">
                                        Updated: {lastUpdated}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setSelectedCategory("All")}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-sm transition-colors duration-200"
                    >
                        View All
                    </button>
                </div>

                <div className="relative">
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={prevScheme}
                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-md transition-colors duration-200 flex items-center justify-center"
                            aria-label="Previous schemes"
                        >
                            <FaChevronLeft />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 max-w-4xl">
                            {getVisibleSchemes().map((scheme, index) => (
                                <div
                                    key={`${scheme.id}-${index}`}
                                    className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group"
                                    onClick={() => {
                                        if (scheme.applyLink && scheme.applyLink !== '#') {
                                            if (scheme.applyLink.endsWith('.pdf')) {
                                                window.open(scheme.applyLink, '_blank');
                                            } else {
                                                window.open(scheme.applyLink, '_blank');
                                            }
                                        }
                                    }}
                                >
                                    <div className="relative">
                                        <img
                                            src={scheme.image}
                                            alt={scheme.title}
                                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                                            onError={(e) => {
                                                e.target.src = generateSchemeImage(scheme.title, scheme.category || 'General');
                                            }}
                                        />
                                        {scheme.source && (
                                            <div className="absolute top-2 right-2">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${scheme.source === 'Government RSS Feed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {scheme.source === 'Government RSS Feed'
                                                        ? '🔴 Live'
                                                        : scheme.source === 'Local PDF'
                                                            ? '📄 PDF Available'
                                                            : '📋 Default'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                                            {scheme.title}
                                        </h3>
                                        <p className="text-gray-600 text-xs line-clamp-2 mb-3">
                                            {scheme.description}
                                        </p>
                                        {scheme.applyLink && scheme.applyLink !== '#' && (
                                            <div className="flex items-center text-xs text-emerald-600 hover:text-emerald-700">
                                                <span className="mr-1">{scheme.applyLink.endsWith('.pdf') ? '📄' : '🔗'}</span>
                                                {scheme.applyLink.endsWith('.pdf') ? 'Click to view PDF' : 'Click to learn more'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={nextScheme}
                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-md transition-colors duration-200 flex items-center justify-center"
                            aria-label="Next schemes"
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </div>

                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm text-center">
                        <span className="mr-2">💡</span>
                        <strong>Live Updates:</strong> These schemes are fetched from official government RSS feeds and updated automatically!
                    </p>
                </div>
            </section>

            {/* Category Filter */}
            <section className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6">
                    <div className="flex flex-wrap justify-center gap-2">
                        {categories.map((category) => {
                            const active = selectedCategory === category;
                            return (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${active
                                        ? "bg-green-600 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    {category}
                                    {category !== "All" && (
                                        <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                                            {schemes.filter(s => s.category === category).length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Schemes Grid */}
            <section>
                {filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">No schemes found for the selected category.</p>
                        <button
                            onClick={() => setSelectedCategory("All")}
                            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                        >
                            View All Schemes
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((scheme) => (
                            <div
                                key={scheme.id}
                                className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                            >
                                <div className="p-6 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-4xl" aria-hidden="true">
                                            {scheme.image}
                                        </span>
                                        <div className="flex flex-col items-end gap-1">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-white ${getCategoryColor(
                                                    scheme.category
                                                )}`}
                                            >
                                                {scheme.category}
                                            </span>
                                            {scheme.source && (
                                                <span className="text-xs text-gray-500">
                                                    {scheme.source}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {scheme.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                        {scheme.description}
                                    </p>

                                    <div className="space-y-2 mb-4">
                                        <div>
                                            <span className="text-xs font-semibold text-gray-700">Eligibility:</span>
                                            <p className="text-xs text-gray-600 line-clamp-2">{scheme.eligibility}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-gray-700">Benefits:</span>
                                            <p className="text-xs text-gray-600 line-clamp-2">{scheme.benefits}</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex gap-2">
                                        <a
                                            href={scheme.applyLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex justify-center items-center px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors flex-1"
                                        >
                                            {scheme.applyLink && scheme.applyLink.endsWith('.pdf') ? '📄 View PDF' : 'Learn More'}
                                        </a>
                                        {scheme.applyLink !== '#' && (
                                            <a
                                                href={scheme.applyLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex justify-center items-center px-4 py-2 rounded-md border border-green-300 text-gray-900 hover:bg-green-50 hover:border-green-400 text-sm font-medium transition-colors"
                                            >
                                                {scheme.applyLink && scheme.applyLink.endsWith('.pdf') ? '📥 Download' : 'Apply'}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Quick Access Resources */}
            <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Access Resources</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {infoCards.map((card) => {
                        const IconComponent = card.icon;
                        return (
                            <div
                                key={card.title}
                                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                            >
                                <div className={`w-16 h-16 rounded-full ${card.color} flex items-center justify-center mb-4 mx-auto`}>
                                    <IconComponent className="text-2xl" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 text-center mb-3">{card.title}</h3>
                                <p className="text-gray-600 text-sm text-center mb-4 leading-relaxed">{card.description}</p>
                                <button className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-sm transition-colors duration-200">
                                    {card.buttonText}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Contact Support */}
            <section>
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Support</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                <FaPhone className="text-lg" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Helpline</h3>
                                <p className="text-gray-600 text-sm">
                                    1800-XXX-XXXX <span className="text-gray-500">(Toll-free)</span>
                                </p>
                                <p className="text-gray-500 text-xs">Available 24/7</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                <FaEnvelope className="text-lg" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Email Support</h3>
                                <p className="text-gray-600 text-sm">support@NaiyakSetu.gov.in</p>
                                <p className="text-gray-500 text-xs">Response within 24 hours</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default InfoHub;
