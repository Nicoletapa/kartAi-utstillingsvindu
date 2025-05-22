/**
 * This file is Used in utstillingsvindu 2.0
 * 
 * @description
 * This component is the child of the AtlasSidebar.tsx component.
 * It contains the sidebar navigation and the main content area.
 * The sidebar is collapsible and contains links to different sections of the application.
 * The main content area is where the children components are rendered.
 * Sidebar items are defined in the sidebarItems array.
 * If the sidebar is collapsed, text of the items are displayed as tooltips.
 * 
 * @features
 * - Collapsible sidebar
 * - Sidebar items with icons
 * - Sidebar items with tooltips
 * - Sidebar items with links
 * - Sidebar items with active state
 * 
 * @props
 * - `children` (ReactNode): The React tree that will have access to the form context.
 * 
 * @note
 * - This component is designed to be used in a client-side context.
 * - It uses the `usePathname` hook from Next.js to get the current pathname.
 * - It uses the `useEffect` hook to handle window resize events and update the sidebar state.
 * - It uses the `useRef` hook to reference the sidebar and content elements.
 * 
 * @usage
 * <Sidebar>
 *   <YourComponent />
 * </Sidebar>
 */

"use client";

import { ChevronFirst, ChevronLast, Info, ListChecks, House, FileStack, ArrowRight, Folder, Bell, LayoutGrid } from "lucide-react";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface SidebarContextType {
    expanded: boolean;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export default function Sidebar({ children }: { children: ReactNode }) {
    const [expanded, setExpanded] = useState(true);
    const pathname = usePathname();
    const sidebarRef = useRef(null);
    const contentRef = useRef(null);

    const sidebarItems = [
        { text: "Min Oversikt", href: "/atlas-app/sidebar/min-oversikt", icon: <LayoutGrid size={20} /> },
        { text: "Før du søker", href: "/atlas-app/sidebar/for-du-soker", icon: <Info size={20} /> },
        { text: "Sjekkliste", href: "/atlas-app/sidebar/sjekkliste", icon: <ListChecks size={20} /> },
        { text: "Min Eiendom", href: "/atlas-app/sidebar/min-eiendom", icon: <House size={20} /> },
        { text: "Mine Søknader", href: "/atlas-app/sidebar/soknader", icon: <FileStack size={20} /> },
        { text: "Mine Dokumenter", href: "/atlas-app/sidebar/dokumenter", icon: <Folder size={20} /> },
        { text: "Meldinger", href: "/atlas-app/sidebar/meldinger", icon: <Bell size={20} /> },

    ];

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

    return (
        <div className="flex">
        <aside ref={sidebarRef} className={`fixed left-0 top-1/4 z-50 flex items-center transition-all duration-300
                ${expanded ? "w-48" : "w-16"}`}>
            <nav className="max-h-100 flex flex-col bg-kartAI-blue rounded-r-lg">
                <div className="p-2 pb-2 pt-2 flex justify-end group">
                    <span className={`overflow-hidden transition-all duration-300 mt-1 font-bold text-white ${expanded ? "w-32 pl-8" : "w-0"}`}>Meny</span>
                    <button onClick={() => setExpanded(!expanded)} aria-label="openCloseMenu" className="flex items-center py-2 px-2 font-medium
                             rounded-md cursor-pointer transition-colors group text-gray-400 hover:text-white hover:bg-kartAI-lightblue">
                        {expanded ? <ChevronFirst /> : <ChevronLast />}

                        {!expanded && (
                            <div className="absolute whitespace-nowrap left-full rounded-md px-2 py-1 ml-1 bg-blue-100 text-kartAI-blue text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
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
        <li className={`relative flex items-center py-2 px-2 my-1 font-medium rounded-md cursor-pointer transition-colors group ${active ? "text-white hover:bg-kartAI-lightblue bg-kartAI-lightblue" : "hover:bg-kartAI-lightblue hover:text-white text-gray-400"}`}>
            <Link href={href} className="flex items-center w-full">
                <div className={`flex items-center justify-center w-6 h-6 transition-colors ${active ? "text-white" : "group-hover:text-white"}`}>{icon}</div>
                <span className={` overflow-hidden whitespace-nowrap text-ellipsis font-normal transition-all duration-300 ${expanded ? "w-36 ml-3" : "w-0"}`}>{text}</span>

                {expanded && !isSubItem && (
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                )}
            </Link>

            {!expanded && (
                <div className="absolute whitespace-nowrap left-full rounded-md px-2 py-1 ml-5 bg-blue-100 text-kartAI-blue text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
                    {text}
                </div>
            )}
        </li>
    );
}

