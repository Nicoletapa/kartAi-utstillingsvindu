import CadaidPage from "~/components/CadaidAtlas";
import AtlasSidebar from "~/components/AtlasSidebar";

export default async function PlantegningsAnalyse() {
  return (
    <AtlasSidebar>
      <div className="flex px-6">
      <CadaidPage />
      </div>
    </AtlasSidebar>
  );
}
