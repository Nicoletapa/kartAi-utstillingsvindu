import { GeistSans } from "geist/font/sans";
import ArkivGPTPage from "~/components/ArkivGPT";

export default async function ArkivGPT() {
  return (
    <div
      className={`flex min-h-screen pb-40 ${GeistSans.variable} absolute top-14 ml-36 mr-20 flex min-w-full flex-col items-center px-52`}
    >
      <ArkivGPTPage />
    </div>
  );
}
