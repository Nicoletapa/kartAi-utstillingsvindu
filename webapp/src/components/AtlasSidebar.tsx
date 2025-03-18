import Sidebar from "./Sidebar";


interface AtlasSidebarInterface {
  children: React.ReactNode;
}

const AtlasSidebar: React.FC<AtlasSidebarInterface> = ({ children }) => {
  return (
      <Sidebar>
      <div
        className={`flex w-full flex-col items-center`}
      >
        {children}
      </div>
      </Sidebar>
  );
};

export default AtlasSidebar;
