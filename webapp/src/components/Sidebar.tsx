"use client";

import { ChevronFirst, ChevronLast, Info, Boxes, ListChecks, FileCheck, House, MousePointerClick, FileStack, ArrowRight, ChevronDown, Bot } from "lucide-react";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarContextType {
    expanded: boolean;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

import { ReactNode } from "react";

export default function Sidebar({ children }: { children: ReactNode }) {
    const [expanded, setExpanded] = useState(true);
    const [subExpanded, setSubExpanded] = useState(false);
    const pathname = usePathname();
    const sidebarRef = useRef(null);
    const contentRef = useRef(null);

    const isMainPage = () => {
        return pathname === "/atlas-app" || pathname === "/atlas-app/";
    }

    const sidebarItems = [
        { text: "Før du søker", href: "/atlas-app", icon: <Info size={20} /> },
        { text: "Sjekkliste", href: "/atlas-app#sjekkliste-oversikt", icon: <ListChecks size={20} /> },
        { text: "Min Eiendom", href: "/atlas-app/sidebar/arkivgpt", icon: <House size={20} /> },
        { text: "Søknader", href: "/atlas-app/sidebar/soknader", icon: <FileStack size={20} /> },
        { text: "Saksbehandler", href: "/atlas-app/saksbehandler/mottak/mine-saker", icon: <FileStack size={20} /> },
    ];

    const subMenuItems = [
        { text: "CADAiD", href: "/atlas-app/sidebar/cadaid", icon: <FileCheck size={20} /> },
        
        { text: "TiltaksAID", href: "/atlas-app/sidebar/tiltaksaid", icon: <MousePointerClick size={20} /> },

    ];

    useEffect(() => {
        const isSubMenuItemActive = subMenuItems.some((item) => pathname.startsWith(item.href));
        setSubExpanded(isSubMenuItemActive);
    }, [pathname]);

    useEffect(() => {
        const handleResize = () => {
            const breakpoint = 1350;
             if (window.innerWidth < breakpoint) {
                 setExpanded(false);
             } else {
                 setExpanded(true);
             }
        };

        handleResize();

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);
    
    useEffect(() => {
        console.log('Current pathname:', pathname);
        console.log('Is main page:', isMainPage());
    }, [pathname]);

    return (
        <div className="flex">
        <aside ref={sidebarRef} className={`fixed left-0 top-1/4 z-50 flex items-center
                ${expanded ? "w-48" : "w-16"}`}>
            <nav className="max-h-100 flex flex-col bg-white border-2 rounded-r-lg">
                <div className="p-4 pb-2 flex justify-end group">
                    <span className={`overflow-hidden transition-all mt-1 font-bold text-gray-600 ${expanded ? "w-32 pl-8" : "w-0"}`}>Meny</span>
                    <button onClick={() => setExpanded(!expanded)} className="flex items-center py-2 px-3 font-medium
                             rounded-md cursor-pointer transition-colors group bg-gray-100 hover:bg-gray-200">
                        {expanded ? <ChevronFirst /> : <ChevronLast />}

                        {!expanded && (
                            <div className="absolute whitespace-nowrap left-full rounded-md px-2 py-1 ml-8 bg-indigo-100 text-indigo-800 text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
                                Meny
                            </div>
                        )}
                    </button>
                </div>

                <SidebarContext.Provider value={{ expanded }}>
                    <ul className="flex-1 px-2">
                        {sidebarItems.map((item, index) => (
                            <SidebarItem key={index} icon={item.icon} text={item.text} href={item.href} active={pathname === item.href} />
                        ))}

                        <li className="relative">
                            <button onClick={() => setSubExpanded(!subExpanded)} className={`flex items-center py-2 px-3 my-1 font-medium
                             rounded-md w-full cursor-pointer transition-colors group ${subExpanded || subMenuItems.some((item) => pathname.startsWith(item.href)) ? "bg-indigo-200 text-indigo-800" : "hover:bg-gray-100 text-gray-600"}`}
                             >
                                <Bot className={`w-5 h-5 transition-transform duration-300 ${subExpanded ? "" : ""}`} />
                                <span className={`ml-3 transition-all ${expanded ? "block" : "hidden"}`}>Bruk KI</span>
                                <ChevronDown className={`ml-auto w-5 h-5 transition-transform duration-300 ${subExpanded ? "rotate-180" : ""}`} />
                             
                                {!expanded && (
                                    <div className="absolute whitespace-nowrap left-full rounded-md px-2 py-1 ml-5 bg-indigo-100 text-indigo-800 text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
                                        Bruk KI
                                    </div>
                                )}
                            </button>

                             {subExpanded && (
                                <ul className="border-l border-gray-300">
                                    {subMenuItems.map((subItem, subIndex) => (
                                        <SidebarItem key={subIndex} icon={subItem.icon} text={subItem.text} href={subItem.href} active={pathname.startsWith(subItem.href)} isSubItem />
                                    ))}
                                </ul>
                             )}
                        </li>
                    </ul>
                </SidebarContext.Provider>
            </nav>

            
        </aside>

        <div ref={contentRef} className= {`transition-all duration-300 flex-1 p-6 ${expanded ? "ml-48" : "ml-16"}`}>
            {children}
        </div>
        </div>
    );
}

interface SidebarItemProps {
    icon: React.ReactNode;
    text: string;
    href: string;
    active: boolean;
    isSubItem?: boolean;
}

export function SidebarItem({ icon, text, href, active, isSubItem = false }: SidebarItemProps) {

    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("SidebarItem must be used within a SidebarContext.Provider");
    }
    const { expanded } = context;

    return (
        <li className={`relative flex items-center py-2 px-2 my-1 font-medium rounded-md cursor-pointer transition-colors group ${active ? "bg-indigo-200 text-indigo-800" : "hover:bg-gray-100 text-gray-600"} ${isSubItem ? "ml-4" : ""}`}>
            <Link href={href} className="flex items-center w-full">
                <div className="flex-shrink-0">{icon}</div>
                <span className={`transition-all overflow-hidden whitespace-nowrap text-ellipsis font-normal ${expanded ? "w-36 ml-3" : "w-0"}`}>{text}</span>
                

                {expanded && !isSubItem && (
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                )}
            </Link>

            {!expanded && (
                <div className="absolute whitespace-nowrap left-full rounded-md px-2 py-1 ml-5 bg-indigo-100 text-indigo-800 text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
                    {text}
                </div>
            )}
        </li>
    );
}

