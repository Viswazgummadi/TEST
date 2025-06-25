import { FiHome, FiFolder, FiClock, FiCode, FiBox, FiSettings } from "react-icons/fi";
import { MdManageHistory, MdFolderSpecial, MdMarkChatUnread } from 'react-icons/md'; // <-- NEW ICON IMPORT

export const navItems = [
  { text: "Home", href: "/", defaultIcon: FiHome },
  { text: "Chat", href: "/chat", defaultIcon: MdMarkChatUnread },

  {
    text: "Repos",
    href: "/repos",
    defaultIcon: FiFolder,
    adminIcon: MdFolderSpecial,
  },
  {
    text: "History",
    href: "/history",
    defaultIcon: FiClock,
    adminIcon: MdManageHistory,
    adminHref: "/admin/history",
  },
  { text: "Implementation", href: "/implementation", defaultIcon: FiCode },
  { text: "Deployment", href: "/deployment", defaultIcon: FiBox },
  {
    name: "Admin Settings",
    href: "/admin/settings", // The new route
    defaultIcon: FiSettings, // Icon for regular users (might be hidden or disabled)
    adminIcon: FiSettings, // Icon for admin users (clearly visible and active)
    text: "Settings",
    isAdminOnly: true, // Custom flag to help Sidebar.jsx identify it
  },
];
