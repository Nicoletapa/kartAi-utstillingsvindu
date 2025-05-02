import AtlasSidebar from "~/components/AtlasSidebar"
import MyApplications from "~/components/MyApplications"
import SmallChatbot from "~/components/SmallChatbot"


export default function ApplicationsPage() {
    return (
      <AtlasSidebar>
      <div>
        <MyApplications />
      </div>
      <SmallChatbot />
      </AtlasSidebar>
    );
  }