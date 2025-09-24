import { motion } from "framer-motion";
import { Link, NavLink } from "react-router-dom";

export default function Layout({ children }) {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-gray-50">
            {/* Navbar */}
            <nav className="w-full bg-white shadow-sm py-4 px-6 md:px-12 lg:px-24">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center space-x-2">
                        <img src="/logo.png" alt="" />
                        <span className="text-xl text-[#006674] font-bold font-serif">Wevioo Quiz</span>
                    </div>

                    <div className="flex items-center space-x-6">
                        {/* Bouton centré "Entrer code" */}
                        <div className="mx-2 md:mx-4">
                            <Link
                                to="/join"
                                className="px-4 py-2 bg-gradient-to-r from-[#85a831] to-[#c2d654] text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center"
                            >
                                Entrer code
                            </Link>
                        </div>

                        {/* Partie gauche des liens */}
                        <div className="flex space-x-6">
                            <NavLink
                                to="/"
                                className={({ isActive }) =>
                                    isActive
                                        ? "text-[#85a831] font-medium transition-colors"
                                        : "text-gray-600 hover:text-[#85a831] font-medium transition-colors"
                                }
                            >
                                Home
                            </NavLink>
                        </div>

                        {/* Partie droite des liens */}
                        <div className="flex space-x-6">
                            <NavLink
                                to="/login"
                                className={({ isActive }) =>
                                    isActive
                                        ? "text-[#85a831] font-medium transition-colors"
                                        : "text-gray-600 hover:text-[#85a831] font-medium transition-colors"
                                }
                            >
                                Login
                            </NavLink>

                            <NavLink
                                to="/register"
                                className={({ isActive }) =>
                                    isActive
                                        ? "text-[#85a831] font-medium transition-colors"
                                        : "text-gray-600 hover:text-[#85a831] font-medium transition-colors"
                                }
                            >
                                Register
                            </NavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow">
                {children}
            </main>

            {/* Footer */}
            <footer className="w-full bg-gray-900 text-white py-12 px-6 md:px-12 lg:px-24">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#85a831] to-[#c2d654] flex items-center justify-center text-white font-bold text-xl">
                                Q
                            </div>
                            <span className="text-xl font-bold">Wevioo Quiz</span>
                        </div>
                        <p className="text-gray-400 mb-4">
                            The ultimate quiz platform for knowledge seekers and competitive players.
                        </p>
                        <div className="flex space-x-4">
                            {["twitter", "facebook", "instagram", "linkedin"].map((social, index) => (
                                <motion.a
                                    key={index}
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#85a831] transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                >
                                    <span className="sr-only">{social}</span>
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                    {[
                        { title: "Company", links: ["About", "Careers", "Blog", "Press"] },
                        { title: "Resources", links: ["Help Center", "Community", "Tutorials", "Webinars"] },
                        { title: "Legal", links: ["Privacy", "Terms", "Cookie Policy", "Licenses"] }
                    ].map((section, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            viewport={{ once: true }}
                        >
                            <h3 className="text-lg font-bold mb-4">{section.title}</h3>
                            <ul className="space-y-2">
                                {section.links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        <Link to="#" className="text-gray-400 hover:text-[#85a831] transition-colors">
                                            {link}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    className="max-w-7xl mx-auto border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                >
                    <p className="text-gray-500 mb-4 md:mb-0">
                        © {new Date().getFullYear()} Wevioo Quiz. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <Link to="#" className="text-gray-500 hover:text-[#85a831] transition-colors">
                            Privacy Policy
                        </Link>
                        <Link to="#" className="text-gray-500 hover:text-[#85a831] transition-colors">
                            Terms of Service
                        </Link>
                        <Link to="#" className="text-gray-500 hover:text-[#85a831] transition-colors">
                            Cookies
                        </Link>
                    </div>
                </motion.div>
            </footer>
        </div>
    );
}
