import { MdManageHistory, MdFolderSpecial } from "react-icons/md";
import { FiHome, FiFolder, FiClock, FiCode, FiBox } from "react-icons/fi";

export const navItems = [
  { text: "Home", href: "/", defaultIcon: FiHome },
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
