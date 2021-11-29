import { useRouter } from "next/router"

const Page = () => {
  const router = useRouter();
  const { tokenID } = router.query;

  return (
    <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, background: "#ccc" }}>
      <div style={{ maxWidth: "508px", margin: "20rem auto 0 auto", border: "1px solid rgb(229, 232, 235)", borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px", overflow: "hidden" }}>
        <iframe
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullscreen=""
          frameborder="0"
          width="100%"
          height="100%"
          sandbox="allow-scripts"
          src={`/card?tokenID=${tokenID}`}
          style={{ minHeight: "500px", display: "block" }}>
        </iframe>
      </div>
    </div>
  );
};

export default Page;
