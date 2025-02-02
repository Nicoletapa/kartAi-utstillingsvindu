import { ChevronFirst, ChevronLast, Boxes, ArrowRight } from "lucide-react";
import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SidebarContext = createContext();

export default function Sidebar() {
    const [expanded, setExpanded] = useState(true);
    const pathname = usePathname();

    // Define Sidebar Items
    const sidebarItems = [
        { text: "Før du søker", href: "/atlas-app", icon: <Boxes size={20} /> },
        { text: "Sjekkliste", href: "/atlas-app#sjekkliste-oversikt", icon: <Boxes size={20} /> },
        { text: "CADAiD", href: "/atlas-app/sidebar/cadaid", icon: <Boxes size={20} /> },
        { text: "3D-Modellering", href: "/atlas-app/sidebar/3d-situasjon", icon: <Boxes size={20} /> },
        { text: "TiltaksAID", href: "/atlas-app/sidebar/tiltaksaid", icon: <Boxes size={20} /> },
        { text: "Min Eiendom", href: "/atlas-app/sidebar/arkivgpt", icon: <Boxes size={20} /> },
        { text: "Saksbehandler", href: "/atlas-app/saksbehandler/mottak/mine-saker", icon: <Boxes size={20} /> },
    ];

    return (

        <aside className={`fixed left-0 top-1/4 z-50 flex items-center
                ${expanded ? "w-48" : "w-16"}`}>
            <nav className="h-full flex flex-col bg-white ml-4">
                <div className="p-4 pb-2 flex justify-end">
                    <span className={`overflow-hidden transition-all font-bold text-gray-600 ${expanded ? "w-32" : "w-0"}`}>Innhold</span>
                    <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100">
                        {expanded ? <ChevronFirst /> : <ChevronLast />}
                    </button>
                </div>

                <SidebarContext.Provider value={{ expanded }}>
                    <ul className="flex-1 px-3">
                        {sidebarItems.map((item, index) => (
                            <SidebarItem key={index} icon={item.icon} text={item.text} href={item.href} active={pathname === item.href} />
                        ))}
                    </ul>
                </SidebarContext.Provider>
            </nav>
        </aside>
    );
}

// SidebarItem Component with Link
export function SidebarItem({ icon, text, href, active }) {
    const { expanded } = useContext( SidebarContext );

    return (
        <li className={`relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors group ${active ? "bg-indigo-200 text-indigo-800" : "hover:bg-gray-100 text-gray-600"}`}>
            <Link href={href} className="flex items-center w-full">
                <div className="flex-shrink-0">{icon}</div>
                <span className={`ml-3 transition-all overflow-hidden whitespace-nowrap text-ellipsis font-normal ${expanded ? "w-40 ml-3" : "w-0"}`}>{text}</span>
                

                {expanded && (
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                )}
            </Link>

            {!expanded && (
                <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-indigo-100 text-indigo-800 text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
                    {text}
                </div>
            )}
        </li>
    );
}
