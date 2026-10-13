import React, { memo, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    PlusCircle,
    Car,
    CalendarCheck,
    Menu,
    X,
    UserRound,
} from "lucide-react";
import { FaSignOutAlt } from "react-icons/fa";
import logo from "../assets/logocar.png";

const LOGIN_URL = "https://kar-rental.vercel.app/login";

const navLinks = [
    { path: "/", label: "Add Car", icon: PlusCircle },
    { path: "/manage-cars", label: "Manage Cars", icon: Car },
    { path: "/bookings", label: "Bookings", icon: CalendarCheck },
];

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const location = useLocation();
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);


    }, []);

    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                isOpen &&
                menuRef.current &&
                buttonRef.current &&
                !menuRef.current.contains(event.target) &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") setIsOpen(false);
        };

        document.addEventListener("mousedown", handleOutsideClick);
        window.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            window.removeEventListener("keydown", handleEscape);
        };

    }, [isOpen]);

    const isActive = (path) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setIsOpen(false);

        // Frontend ke Login page par bhejo
        window.location.replace('https://kar-rental.vercel.app/login?logout=1');
    };


    const navLinkClass = (path) =>
        `rounded-md px-3 py-2 text-sm font-medium transition-colors duration-300 ${isActive(path)
            ? "text-orange-600 underline underline-offset-4"
            : "text-gray-700 hover:text-orange-500"
        }`;

    const authButtonClass =
        "flex items-center gap-2 rounded-md px-3 py-2 text-gray-700 transition-colors duration-300 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-300";

    return (
        <nav
            className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? "py-2" : "py-4"
                }`}
            aria-label="Admin navigation"
        > <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"> <div className="flex justify-center">
            <div
                className={`w-full rounded-full border border-gray-200 bg-white/95 shadow-lg backdrop-blur-md transition-all duration-300 ${scrolled
                    ? "px-4 py-2 md:px-6"
                    : "px-5 py-3 md:px-8"
                    }`}
            > <div className="flex items-center justify-between gap-4">
                    {/* Logo — same layout as frontend */} <Link to="/" className="flex shrink-0 items-center"> <div className="flex flex-col items-center text-xl leading-none md:text-2xl"> <img
                        src={logo}
                        alt="Karzone logo"
                        className="block h-[1em] w-auto object-contain"
                    /> <span className="font-bold tracking-wider text-gray-900">
                            KARZONE </span> </div> </Link>

                    {/* Desktop navigation */}
                    <div className="hidden flex-1 items-center justify-center md:flex">
                        <div className="flex items-center space-x-2 md:space-x-4 lg:space-x-6">
                            {navLinks.map((link, index) => {
                                const Icon = link.icon;

                                return (
                                    <React.Fragment key={link.path}>
                                        <Link
                                            to={link.path}
                                            aria-current={
                                                isActive(link.path) ? "page" : undefined
                                            }
                                            className={`flex items-center gap-2 ${navLinkClass(
                                                link.path
                                            )}`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span>{link.label}</span>
                                        </Link>

                                        {index < navLinks.length - 1 && (
                                            <div
                                                className="hidden h-6 w-px bg-gray-300 md:block"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Logout button */}
                    <div className="hidden shrink-0 items-center justify-end md:flex">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className={authButtonClass}
                            aria-label="Logout"
                            title="Logout"
                        >
                            <FaSignOutAlt className="text-base" />
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>

                    {/* Mobile menu toggle */}
                    <div className="flex items-center md:hidden">
                        <button
                            ref={buttonRef}
                            type="button"
                            onClick={() => setIsOpen((previous) => !previous)}
                            className="rounded-md p-2 text-gray-700 transition-colors hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                            aria-expanded={isOpen}
                            aria-controls="admin-mobile-menu"
                            aria-label={isOpen ? "Close menu" : "Open menu"}
                        >
                            {isOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
            </div>

            {/* Responsive mobile dropdown */}
            <div
                id="admin-mobile-menu"
                ref={menuRef}
                aria-hidden={!isOpen}
                className={`overflow-hidden transition-all duration-300 md:hidden ${isOpen
                    ? "max-h-[400px] opacity-100"
                    : "pointer-events-none max-h-0 opacity-0"
                    }`}
            >
                <div className="mx-3 mt-2 rounded-b-lg border-t border-gray-200 bg-white shadow-lg">
                    <div className="space-y-2 px-4 pb-4 pt-3">
                        {navLinks.map((link) => {
                            const Icon = link.icon;

                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    tabIndex={isOpen ? 0 : -1}
                                    onClick={() => setIsOpen(false)}
                                    aria-current={
                                        isActive(link.path) ? "page" : undefined
                                    }
                                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive(link.path)
                                        ? "bg-gray-50 text-orange-600"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-orange-500"
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}

                        <div className="my-1 border-t border-gray-100" />

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-50 hover:text-orange-500"
                        >
                            <FaSignOutAlt className="mr-3 text-base" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>

    );
};

export default memo(Navbar);
