import EmbeddedFrame from "~/components/EmbeddedFrame";
import AtlasSidebar from "~/components/AtlasSidebar";

export default async function Tiltaksvisning() {
  return (
    <AtlasSidebar>
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
    </AtlasSidebar>
  );
}
