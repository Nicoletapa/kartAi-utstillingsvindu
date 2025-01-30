import { GeistSans } from "geist/font/sans";

import EmbeddedFrame from "~/components/EmbeddedFrame";

export default async function Tiltaksvisning() {
  return (
    <div className={`flex min-h-screen pb-40 ${GeistSans.variable}`}>
      <div className="absolute top-14 ml-36 mr-20 flex min-w-full flex-col items-center px-52">
        <h1 data-cy="title" className="mb-2 mt-5 text-left text-3xl font-bold">
          3D tiltaksvisning
        </h1>
        <span className="mb-5 text-left text-xl">
          Se hvordan ditt tiltak vises i et 3D kart av området ditt
        </span>

        <EmbeddedFrame
          data-cy="tiltaksvisning"
          src="https://byggesak3d.norkart.no/view/bf204afe-e50e-4ac6-8839-ebd9406167ac"
          title="3D tiltaksvisning"
        />
      </div>
    </div>
  );
}
