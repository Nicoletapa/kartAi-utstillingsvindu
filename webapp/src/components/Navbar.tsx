"use client";

import shortcuts from "../app/data/shortcuts";
import { useEffect, useRef, useState } from "react";

import ReactDOM from "react-dom";
import Dropdown from "./Dropdown";
import BreakLine from "./Breakline";
import Icons from "./Icons";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import NavbarAtlas from "~/components/NavbarAtlas";

const Navbar = () => {
  const pathname = usePathname();
  const isAtlasApp = pathname?.includes("atlas-app");
  const [openedNavbarSection, setOpenedNavbarSection] = useState<number>(-1);
  const navbarRef = useRef<HTMLDivElement>(null); // Ref for the entire navbar

  const handleClick = (index: number) => {
    if (openedNavbarSection === index) {
      setOpenedNavbarSection(-1); // Close if the same section is clicked again
    } else {
      setOpenedNavbarSection(index); // Open the clicked section
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the navbar
      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target as Node)
      ) {
        setOpenedNavbarSection(-1); // Close the opened section
      }
    };

    document.addEventListener("click", handleClickOutside);

    // Lock scrolling if a dropdown is open
    if (openedNavbarSection !== -1) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.body.style.overflow = ""; // Ensure overflow is reset on cleanup
    };
  }, [openedNavbarSection]); // Add openedNavbarSection as a dependency

  return (
    <>
      {!isAtlasApp && (
        <>
          <nav
            ref={navbarRef}
            className="sticky bottom-auto top-0 z-50 w-full bg-white py-2 font-semibold shadow-xl"
          >
            {/* Backdrop when a dropdown is open */}
            {openedNavbarSection !== -1 &&
              ReactDOM.createPortal(
                <div className="fixed inset-0 z-10 bg-black bg-opacity-25" />,
                document.body,
              )}
            <div className="flex w-full items-center justify-between">
              <div className="mb-1 flex items-center pl-4 lg:pl-10">
                <Link href={"/"}>
                  <Image
                    src="/Kartai-logo_white.jpg" // Path to your image in the public folder
                    alt="KartAI Logo"
                    width={130}
                    height={40}
                    className="h-10 pr-2"
                  />
                </Link>
              </div>
              <div>
                <Link
                  href="../atlas-app"
                  className="text-md cursor-pointer text-kartAI-blue"
                >
                  Atlas-løsning for byggesak
                </Link>
              </div>

              <div className="hidden items-center justify-end pr-4 sm:flex lg:pr-10">
                {shortcuts.map((shortcut, index) => {
                  const isActive = index === openedNavbarSection;
                  return (
                    <div key={index} className="relative">
                      <button
                        data-cy={`dropdown-button-${index}`} // Added data-cy for testing
                        onClick={() => handleClick(index)}
                        className={`text-md cursor-hover group relative flex flex-row items-center gap-2 px-2 py-2 md:px-8 lg:px-5 ${isActive ? "text-kartAI-blue" : "text-secondary-black"}`}
                        style={
                          isActive
                            ? {
                                textDecoration: "underline",
                                textUnderlineOffset: "6px",
                                textDecorationThickness: "2px",
                              }
                            : {}
                        }
                      >
                        <p className="mt-1 hidden whitespace-pre-wrap text-xs tracking-[0.15em] sm:block xl:text-sm">
                          {shortcut.header.toUpperCase()}
                        </p>
                      </button>
                      {isActive && (
                        <div
                          data-cy="dropdown-content"
                          className="fixed left-0 right-0 z-40 w-screen bg-white pt-4 shadow-lg"
                        >
                          <BreakLine />
                          {/* Dynamically rendering subgroups and links for this section */}
                          <div className="w-screen-lg mt-4 flex flex-col">
                            <div className="flex flex-wrap px-10 pb-10 md:px-20">
                              {shortcut.subgroups.map(
                                (subgroup, subgroupIndex) => (
                                  <div
                                    key={subgroupIndex}
                                    className="w-full p-2 md:w-1/2 xl:w-1/3"
                                  >
                                    <h3 className="mb-2 text-xl font-bold">
                                      {subgroup.title}
                                    </h3>
                                    <div
                                      className={`flex flex-wrap ${subgroup.links.length > 3 ? "" : "flex-col"}`}
                                    >
                                      {" "}
                                      {/* Adjust flex direction based on number of links */}
                                      {subgroup.links.map((link, linkIndex) => (
                                        <div
                                          key={linkIndex}
                                          className={`${subgroup.links.length > 3 ? "w-1/2" : "w-full"} py-2 pr-4`}
                                        >
                                          <a
                                            data-cy={`link-${subgroupIndex}-${linkIndex}`} // Added data-cy for each link
                                            href={link.url}
                                            className="flex flex-row gap-4 py-1 text-sm text-black hover:text-gray-600"
                                          >
                                            {link.label}
                                            {subgroup.arrow && (
                                              <Icons name="ArrowRight_sm" />
                                            )}
                                          </a>
                                          {link.text && (
                                            <a className="flex flex-row gap-4 py-1 text-xs font-light">
                                              {link.text}
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="sm:hidden">
                <Dropdown />
              </div>
            </div>
          </nav>
          {/* <NextBreadcrumb
            homeElement={"Hjem"}
            separator={">"}
            activeClasses=""
            listClasses="hover:underline mx-2 font-light"
          /> */}
        </>
      )}

      {isAtlasApp && (
        <>
          <NavbarAtlas />
          {/* <NextBreadcrumb
            homeElement={"Hjem"}
            separator={">"}
            activeClasses=""
            listClasses="hover:underline mx-2 font-light"
          /> */}
        </>
      )}
    </>
  );
};

export default Navbar;
