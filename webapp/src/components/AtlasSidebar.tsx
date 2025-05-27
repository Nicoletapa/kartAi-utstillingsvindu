/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * This component is the parent component for the sidebar in the Atlas application.
 * It wraps the sidebar with a flex container and allows for children to be passed in.
 * 
 * @features
 * - Sidebar navigation
 * - Flex container for children
 * 
 * @props
 * - `children` (ReactNode): The React tree that will be displayed inside the sidebar.
 * 
 * @usage
 * <AtlasSidebar>
 *   <YourComponent />
 * </AtlasSidebar>
 */

import Sidebar from "./Sidebar";

interface AtlasSidebarInterface {
  children: React.ReactNode;
}

const AtlasSidebar: React.FC<AtlasSidebarInterface> = ({ children }) => {
  return (
      <Sidebar>
      <div
        className={`w-full flex-col items-center`}
      >
        {children}
      </div>
      </Sidebar>
  );
};

export default AtlasSidebar;
