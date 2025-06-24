import { FiHome, FiFolder, FiClock, FiCode, FiBox } from "react-icons/fi";
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
];
