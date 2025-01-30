import { GeistSans } from "geist/font/sans";
import CadaidPage from "~/components/CADAiD";

export default async function PlantegningsAnalyse() {
  return (
    <div
      className={`flex min-h-screen pb-40 ${GeistSans.variable} absolute top-14 ml-36 mr-20 flex min-w-full flex-col items-center px-52`}
    >
      <CadaidPage></CadaidPage>
    </div>
  );
}
