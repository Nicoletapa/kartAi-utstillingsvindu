import { GeistSans } from "geist/font/sans";
import CadaidPage from "~/components/CADAiD";
import AtlasSidebar from "~/components/AtlasSidebar";

export default async function PlantegningsAnalyse() {
  return (
        <AtlasSidebar>

        <div
          className={`flex min-h-screen pb-40 w-full flex-col items-center`}
        >
          <CadaidPage></CadaidPage>
        </div>
      </AtlasSidebar>
  );
}
