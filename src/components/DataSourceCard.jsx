// src/components/DataSourceCard.jsx

import { motion, AnimatePresence } from "framer-motion"; // ✅ IMPORT AnimatePresence
import { Link } from "react-router-dom";
import { FiGithub, FiFolder, FiTrash2 } from "react-icons/fi";
import { MdChat, MdCloudUpload, MdSync } from "react-icons/md";

// --- Helper Components (moved here for encapsulation) ---

const StatusIndicator = ({ status }) => {
    const config = {
        indexed: { text: "Indexed", color: "bg-green-500" },
        outdated: { text: "Outdated", color: "bg-yellow-500" },
        not_indexed: { text: "Not Indexed", color: "bg-gray-500" },
        pending_indexing: { text: "Pending Index", color: "bg-purple-500" },
        processing: { text: "Processing", color: "bg-blue-500" },
    }[status] || { text: "Unknown", color: "bg-gray-600" };

    return (
        <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
            <span>{config.text}</span>
        </div>
    );
};

const ActionButton = ({ icon: Icon, hoverColor, title, onClick }) => (
    <button
        className={`p-1.5 rounded-full transition-colors ${hoverColor}`}
        title={title}
        onClick={onClick}
    >
        <Icon style={{ fontSize: "22px" }} />
    </button>
);

// --- Main DataSourceCard Component ---
const DataSourceCard = ({ source, isAdmin, onDeleteSource, onReindexSource, onSyncSource, onDeleteEmbeddings, index }) => {
    let cardIcon, cardTitle, cardUrl;

    if (source.source_type === 'github') {
        cardIcon = <FiGithub className="text-gray-500" size={24} />;
        cardTitle = source.connection_details.repo_full_name;
        cardUrl = source.connection_details.html_url;
    } else if (source.source_type === 'google_drive') {
        cardIcon = <FiFolder className="text-blue-500" size={24} />;
        cardTitle = source.name;
        cardUrl = source.connection_details.webViewLink;
    } else {
        cardIcon = <div className="w-6 h-6 bg-gray-600 rounded" />;
        cardTitle = source.name;
        cardUrl = '#';
    }

    const itemVariants = {
        initial: { opacity: 0, x: 10 },
        animate: { opacity: 1, x: 0 },
    };

    const viewContainerVariants = {
        initial: { opacity: 0, scale: 0.95, x: 20 },
        animate: {
            opacity: 1,
            scale: 1,
            x: 0,
            transition: { duration: 0.25, ease: "easeOut", staggerChildren: 0.07 },
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            x: -20,
            transition: { duration: 0.2, ease: "easeIn" },
        },
    };

    return (
        <motion.div
            layout
            variants={{
                initial: { opacity: 0, y: 20 },
                animate: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } }),
                exit: { opacity: 0, y: -20 },
            }}
            initial="initial"
            animate="animate"
            exit="exit"
            custom={index}
        >
            <div className="group relative flex items-center justify-between p-4 h-20 bg-black/20 rounded-lg border border-white/[.07] hover:border-white/10 transition-colors">
                {!isAdmin && (
                    <Link
                        to={`/chat?source=${source.id}`}
                        className="absolute inset-0 z-10"
                        aria-label={`Open chat for ${cardTitle}`}
                    />
                )}
                <div className="relative z-20 flex items-center gap-4 pointer-events-none">
                    {cardIcon}
                    <a
                        href={cardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-200 hover:underline z-20 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {cardTitle}
                    </a>
                </div>
                <div className="relative z-20 flex items-center">
                    <AnimatePresence mode="wait" initial={false}>
                        {isAdmin ? (
                            <motion.div
                                key="admin"
                                variants={viewContainerVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="flex items-center gap-6"
                            >
                                <motion.div variants={itemVariants}>
                                    <StatusIndicator status={source.status} />
                                </motion.div>

                                <motion.div
                                    variants={itemVariants}
                                    className="flex items-center gap-2 text-gray-400"
                                >
                                    <ActionButton
                                        icon={MdCloudUpload}
                                        hoverColor="hover:text-cyan-400"
                                        title="Re-index from scratch"
                                        onClick={() => onReindexSource(source.id)}
                                    />
                                    <ActionButton
                                        icon={MdSync}
                                        hoverColor="hover:text-green-400"
                                        title="Sync changes"
                                        onClick={() => onSyncSource(source.id)}
                                    />
                                    <ActionButton
                                        icon={FiTrash2}
                                        hoverColor="hover:text-red-500"
                                        title="Delete embeddings"
                                        onClick={() => onDeleteEmbeddings(source.id)}
                                    />
                                </motion.div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="user"
                                variants={viewContainerVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="pointer-events-none"
                            >
                                <div className="flex items-center gap-2 text-gray-400 transition-all duration-200 transform group-hover:scale-110 group-hover:text-cyan-400">
                                    <MdChat size={24} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default DataSourceCard;