// src/navigation.js
import {
  FiHome,
  FiFolder,
  FiClock,
  FiCode,
  FiBox,
  FiSettings,
} from "react-icons/fi";
import {
  MdManageHistory,
  MdFolderSpecial,
  MdMarkChatUnread,
} from "react-icons/md";

export const navItems = [
  { text: "Home", href: "/", defaultIcon: FiHome },
  { text: "Chat", href: "/chat", defaultIcon: MdMarkChatUnread },
  {
    // This is now the link ALL users will see.
    text: "Repos",
    href: "/repos", // Public, read-only view
    defaultIcon: FiFolder,
    adminIcon: MdFolderSpecial, // Admins see a special icon...
    adminHref: "/admin/repos", // ...which links to the admin management page.
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
    href: "/admin/settings",
    defaultIcon: FiSettings,
    adminIcon: FiSettings,
    text: "Settings",
    isAdminOnly: true,
  },
];
