import AtlasSidebar from "~/components/AtlasSidebar"
import MyApplications from "~/components/MyApplications"


export default function ApplicationsPage() {
    return (
      <AtlasSidebar>
      <div>
        <MyApplications />
      </div>
      </AtlasSidebar>
    );
  }